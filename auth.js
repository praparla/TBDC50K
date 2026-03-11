// ── Taco Bell DC 50K — Authentication Module ──
// Manages Supabase auth lifecycle, session, UI rendering.
// Exposes TB_AUTH global for use by other modules.

const TB_AUTH = (function () {
  let supabaseClient = null;
  let currentUser = null;
  let currentProfile = null;
  let authChangeListeners = [];

  // ── Initialize ──
  function init() {
    if (!TB_CONFIG.FEATURES.AUTH) {
      renderAuthBar();
      return;
    }

    // Check if Supabase SDK loaded
    if (typeof supabase === 'undefined' || !supabase.createClient) {
      console.warn('Supabase SDK not loaded. Backend features disabled.');
      renderAuthBar();
      notifyListeners();
      return;
    }

    // Skip init if placeholder credentials
    if (TB_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
      console.warn('Supabase not configured. Backend features disabled.');
      renderAuthBar();
      notifyListeners();
      return;
    }

    supabaseClient = supabase.createClient(TB_CONFIG.SUPABASE_URL, TB_CONFIG.SUPABASE_ANON_KEY);

    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        currentProfile = await ensureProfile(session.user);
        renderAuthBar();
        notifyListeners();

        // Show role picker if profile is brand new (no display name set)
        if (currentProfile && !currentProfile.display_name) {
          showRoleModal();
        }
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        renderAuthBar();
        notifyListeners();
      }
    });

    // Check existing session
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        currentUser = session.user;
        currentProfile = await ensureProfile(session.user);
      }
      renderAuthBar();
      notifyListeners();
    });
  }

  // ── Profile Management ──
  async function ensureProfile(user) {
    if (!supabaseClient || !user) return null;

    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) return data;

    // Create profile on first login
    const displayName = extractDisplayName(user);
    const { data: newProfile, error: insertError } = await supabaseClient
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
        role: 'runner',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create profile:', insertError);
      return null;
    }

    return newProfile;
  }

  function extractDisplayName(user) {
    // Try Google metadata first
    if (user.user_metadata && user.user_metadata.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.user_metadata && user.user_metadata.name) {
      return user.user_metadata.name;
    }
    // Fall back to email prefix
    if (user.email) {
      return user.email.split('@')[0];
    }
    return '';
  }

  // ── Auth Actions ──
  async function signInWithGoogle() {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      console.error('Google sign-in error:', error);
      showAuthStatus('Sign-in failed. Please try again.', true);
    }
    return { error };
  }

  async function signInWithEmail(email) {
    if (!supabaseClient) return { error: 'Supabase not initialized' };

    if (!email || !email.includes('@')) {
      showAuthStatus('Please enter a valid email address.', true);
      return { error: 'Invalid email' };
    }

    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) {
      console.error('Magic link error:', error);
      showAuthStatus('Failed to send link. Try again.', true);
    } else {
      showAuthStatus('Check your email for a magic link!', false);
    }
    return { error };
  }

  async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentProfile = null;
    renderAuthBar();
    notifyListeners();
  }

  async function setRole(role) {
    if (!supabaseClient || !currentUser) return;
    if (role !== 'runner' && role !== 'cheerer') return;

    const { error } = await supabaseClient
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);

    if (!error && currentProfile) {
      currentProfile.role = role;
      notifyListeners();
    }
    return { error };
  }

  async function updateDisplayName(name) {
    if (!supabaseClient || !currentUser) return;
    const trimmed = (name || '').trim();
    if (!trimmed) return;

    const { error } = await supabaseClient
      .from('profiles')
      .update({ display_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', currentUser.id);

    if (!error && currentProfile) {
      currentProfile.display_name = trimmed;
      renderAuthBar();
      notifyListeners();
    }
    return { error };
  }

  // ── Pub/Sub for auth changes ──
  function onAuthChange(callback) {
    authChangeListeners.push(callback);
    // Immediately invoke with current state
    callback({ user: currentUser, profile: currentProfile });
  }

  function notifyListeners() {
    const state = { user: currentUser, profile: currentProfile };
    authChangeListeners.forEach(cb => {
      try { cb(state); } catch (e) { console.error('Auth listener error:', e); }
    });
  }

  // ── UI Rendering ──
  function renderAuthBar() {
    const bar = document.getElementById('auth-bar');
    if (!bar) return;

    if (currentUser && currentProfile) {
      const initial = (currentProfile.display_name || currentUser.email || '?')[0].toUpperCase();
      const displayName = currentProfile.display_name || currentUser.email;
      const roleEmoji = currentProfile.role === 'runner' ? '🏃' : '📣';

      bar.innerHTML = `
        <div class="auth-user">
          <span class="auth-avatar">${initial}</span>
          <span class="auth-name">${displayName}</span>
          <span class="auth-role-badge" title="${currentProfile.role}">${roleEmoji}</span>
          <button class="auth-menu-btn" id="auth-menu-btn" title="Account menu">⋮</button>
        </div>
        <div class="auth-dropdown hidden" id="auth-dropdown">
          <button class="auth-dropdown-item" id="auth-switch-role">
            Switch to ${currentProfile.role === 'runner' ? 'Cheerer 📣' : 'Runner 🏃'}
          </button>
          <button class="auth-dropdown-item" id="auth-edit-name">Edit Display Name</button>
          <button class="auth-dropdown-item auth-sign-out" id="auth-sign-out-btn">Sign Out</button>
        </div>
      `;

      // Dropdown toggle
      bar.querySelector('#auth-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('auth-dropdown').classList.toggle('hidden');
      });

      // Close dropdown on outside click
      document.addEventListener('click', () => {
        const dd = document.getElementById('auth-dropdown');
        if (dd) dd.classList.add('hidden');
      });

      // Switch role
      bar.querySelector('#auth-switch-role').addEventListener('click', () => {
        const newRole = currentProfile.role === 'runner' ? 'cheerer' : 'runner';
        setRole(newRole);
        document.getElementById('auth-dropdown').classList.add('hidden');
      });

      // Edit name
      bar.querySelector('#auth-edit-name').addEventListener('click', () => {
        const newName = prompt('Enter your display name:', currentProfile.display_name);
        if (newName !== null) {
          updateDisplayName(newName);
        }
        document.getElementById('auth-dropdown').classList.add('hidden');
      });

      // Sign out
      bar.querySelector('#auth-sign-out-btn').addEventListener('click', () => {
        signOut();
        document.getElementById('auth-dropdown').classList.add('hidden');
      });
    } else {
      const isConfigured = supabaseClient !== null;
      if (isConfigured) {
        bar.innerHTML = `<button class="auth-sign-in-btn" id="auth-open-modal">Sign In</button>`;
        bar.querySelector('#auth-open-modal').addEventListener('click', showAuthModal);
      } else {
        bar.innerHTML = `<div class="auth-offline-note">Backend not configured</div>`;
      }
    }
  }

  function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
    clearAuthStatus();
  }

  function showRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function hideRoleModal() {
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.add('hidden');
  }

  function showAuthStatus(msg, isError) {
    const el = document.getElementById('auth-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'auth-status ' + (isError ? 'auth-error' : 'auth-success');
  }

  function clearAuthStatus() {
    const el = document.getElementById('auth-status');
    if (el) {
      el.textContent = '';
      el.className = 'auth-status';
    }
  }

  // ── Setup modal event listeners ──
  function setupModalListeners() {
    // Auth modal
    const googleBtn = document.getElementById('auth-google-btn');
    if (googleBtn) googleBtn.addEventListener('click', signInWithGoogle);

    const emailBtn = document.getElementById('auth-email-btn');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const input = document.getElementById('auth-email-input');
        if (input) signInWithEmail(input.value.trim());
      });
    }

    // Enter key on email input
    const emailInput = document.getElementById('auth-email-input');
    if (emailInput) {
      emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          signInWithEmail(emailInput.value.trim());
        }
      });
    }

    // Close buttons
    document.querySelectorAll('.auth-close').forEach(btn => {
      btn.addEventListener('click', hideAuthModal);
    });

    // Close on backdrop click
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal) hideAuthModal();
      });
    }

    // Role picker buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const role = btn.dataset.role;
        await setRole(role);
        // Also set display name if empty
        if (currentProfile && !currentProfile.display_name) {
          const name = extractDisplayName(currentUser);
          if (name) await updateDisplayName(name);
        }
        hideRoleModal();
        renderAuthBar();
      });
    });

    // Close role modal on backdrop
    const roleModal = document.getElementById('role-modal');
    if (roleModal) {
      roleModal.addEventListener('click', (e) => {
        if (e.target === roleModal) hideRoleModal();
      });
    }
  }

  // ── Public API ──
  return {
    init() {
      init();
      setupModalListeners();
    },
    get user() { return currentUser; },
    get profile() { return currentProfile; },
    isRunner() { return currentProfile ? currentProfile.role === 'runner' : true; },
    isCheerer() { return currentProfile ? currentProfile.role === 'cheerer' : false; },
    isLoggedIn() { return currentUser !== null && currentProfile !== null; },
    onAuthChange,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    setRole,
    updateDisplayName,
    getSupabase() { return supabaseClient; },
  };
})();
