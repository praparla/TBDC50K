// ── Taco Bell DC 50K — Authentication Module ──
// Manages Supabase auth lifecycle, session, UI rendering.
// Includes account settings panel, emoji avatar, cloud sync toggle, delete account.
// Exposes TB_AUTH global for use by other modules.

const TB_AUTH = (function () {
  let supabaseClient = null;
  let currentUser = null;
  let currentProfile = null;
  let authChangeListeners = [];
  let wasSignedIn = false; // Track for session expiry detection

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
        wasSignedIn = true;
        renderAuthBar();
        notifyListeners();

        // Show role picker if profile is brand new (no display name set)
        if (currentProfile && !currentProfile.display_name) {
          showRoleModal();
        }
      } else if (event === 'SIGNED_OUT') {
        // Detect unexpected session expiry vs intentional sign-out
        if (wasSignedIn && currentUser) {
          showToast('Session expired. Sign in again to continue.', 'warning');
        }
        currentUser = null;
        currentProfile = null;
        wasSignedIn = false;
        renderAuthBar();
        notifyListeners();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Auth token refreshed.');
      }
    });

    // Check existing session
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        currentUser = session.user;
        currentProfile = await ensureProfile(session.user);
        wasSignedIn = true;
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
    wasSignedIn = false; // Intentional sign-out — don't show expiry toast
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
      renderAuthBar();
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

  async function updateAvatarEmoji(emoji) {
    if (!supabaseClient || !currentUser) return;
    const { error } = await TB_DB.updateAvatarEmoji(emoji);
    if (!error && currentProfile) {
      currentProfile.avatar_emoji = emoji;
      renderAuthBar();
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

  // ── Toast Notification ──
  function showToast(msg, type) {
    // Remove any existing toast
    const old = document.getElementById('auth-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.className = 'auth-toast auth-toast-' + (type || 'info');
    toast.textContent = msg;
    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('auth-toast-fade');
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }

  // ── UI Rendering: Auth Bar ──
  function renderAuthBar() {
    const bar = document.getElementById('auth-bar');
    if (!bar) return;

    if (currentUser && currentProfile) {
      const avatarEmoji = currentProfile.avatar_emoji || '';
      const initial = avatarEmoji || (currentProfile.display_name || currentUser.email || '?')[0].toUpperCase();
      const displayName = currentProfile.display_name || currentUser.email;
      const roleEmoji = currentProfile.role === 'runner' ? '🏃' : '📣';

      bar.innerHTML = `
        <div class="auth-user">
          <span class="auth-avatar">${initial}</span>
          <span class="auth-name">${displayName}</span>
          <span class="auth-role-badge" title="${currentProfile.role}">${roleEmoji}</span>
          <button class="auth-menu-btn" id="auth-menu-btn" title="Account settings">⚙</button>
        </div>
      `;

      // Open account settings panel
      bar.querySelector('#auth-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showAccountPanel();
      });
    } else {
      const isConfigured = supabaseClient !== null;
      if (isConfigured) {
        bar.innerHTML = `<button class="auth-sign-in-btn" id="auth-open-modal">Sign In</button>`;
        bar.querySelector('#auth-open-modal').addEventListener('click', showAuthModal);
      } else {
        bar.innerHTML = '';
      }
    }
  }

  // ── Account Settings Panel ──
  async function showAccountPanel() {
    const panel = document.getElementById('account-settings-panel');
    if (!panel || !currentProfile) return;

    const avatarEmoji = currentProfile.avatar_emoji || '';
    const displayName = currentProfile.display_name || '';
    const role = currentProfile.role || 'runner';
    const memberSince = currentProfile.created_at
      ? new Date(currentProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'N/A';
    const syncOn = typeof TB_PREFS_SYNC !== 'undefined' && TB_PREFS_SYNC.isEnabled();

    panel.innerHTML = `
      <div class="acct-panel-header">
        <h3>Account Settings</h3>
        <button class="acct-panel-close" id="acct-panel-close" title="Close">&times;</button>
      </div>

      <div class="acct-section">
        <label class="acct-label">Avatar</label>
        <div class="acct-avatar-grid" id="acct-avatar-grid">
          ${AVATAR_EMOJIS.map(e =>
            `<button class="acct-avatar-btn${e === avatarEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</button>`
          ).join('')}
          <button class="acct-avatar-btn acct-avatar-clear${!avatarEmoji ? ' selected' : ''}" data-emoji="" title="Use initial">Aa</button>
        </div>
      </div>

      <div class="acct-section">
        <label class="acct-label" for="acct-display-name">Display Name</label>
        <div class="acct-name-row">
          <input type="text" id="acct-display-name" class="acct-input" value="${displayName}" maxlength="50" />
          <button class="acct-save-btn" id="acct-save-name">Save</button>
        </div>
      </div>

      <div class="acct-section">
        <label class="acct-label">Role</label>
        <div class="acct-role-toggle">
          <button class="acct-role-btn${role === 'runner' ? ' active' : ''}" data-role="runner">🏃 Runner</button>
          <button class="acct-role-btn${role === 'cheerer' ? ' active' : ''}" data-role="cheerer">📣 Cheerer</button>
        </div>
      </div>

      <div class="acct-section">
        <label class="acct-label">Cloud Sync</label>
        <div class="acct-sync-row">
          <label class="acct-toggle-label">
            <input type="checkbox" id="acct-sync-toggle" ${syncOn ? 'checked' : ''} />
            <span>Sync preferences across devices</span>
          </label>
          <p class="acct-hint">Theme, pace, food tracker, passport, and pins.</p>
        </div>
      </div>

      <div class="acct-section acct-stats">
        <label class="acct-label">Your Stats</label>
        <div id="acct-stats-content" class="acct-stats-grid">
          <div class="acct-stat"><span class="acct-stat-val">...</span><span class="acct-stat-lbl">Food Logs</span></div>
          <div class="acct-stat"><span class="acct-stat-val">...</span><span class="acct-stat-lbl">Bets Placed</span></div>
          <div class="acct-stat"><span class="acct-stat-val">...</span><span class="acct-stat-lbl">Parties Hosted</span></div>
          <div class="acct-stat"><span class="acct-stat-val">${memberSince}</span><span class="acct-stat-lbl">Member Since</span></div>
        </div>
      </div>

      <div class="acct-section acct-danger">
        <button class="acct-delete-btn" id="acct-delete-btn">Delete Account</button>
        <p class="acct-hint acct-danger-hint">Permanently deletes your profile, food logs, bets, and parties.</p>
      </div>

      <div id="acct-delete-confirm" class="acct-delete-confirm hidden">
        <p>Type <strong>DELETE</strong> to confirm:</p>
        <input type="text" id="acct-delete-input" class="acct-input" placeholder="DELETE" autocomplete="off" />
        <div class="acct-delete-actions">
          <button class="acct-cancel-btn" id="acct-delete-cancel">Cancel</button>
          <button class="acct-confirm-delete-btn" id="acct-confirm-delete" disabled>Delete Forever</button>
        </div>
      </div>
    `;

    panel.classList.remove('hidden');

    // ── Wire up event listeners ──

    // Close panel
    panel.querySelector('#acct-panel-close').addEventListener('click', hideAccountPanel);
    panel.addEventListener('click', (e) => {
      if (e.target === panel) hideAccountPanel();
    });

    // Avatar selection
    panel.querySelectorAll('.acct-avatar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const emoji = btn.dataset.emoji;
        panel.querySelectorAll('.acct-avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        await updateAvatarEmoji(emoji);
      });
    });

    // Display name save
    const nameInput = panel.querySelector('#acct-display-name');
    const saveBtn = panel.querySelector('#acct-save-name');
    saveBtn.addEventListener('click', async () => {
      const val = nameInput.value.trim();
      if (val && val !== currentProfile.display_name) {
        saveBtn.textContent = '...';
        await updateDisplayName(val);
        saveBtn.textContent = 'Saved!';
        setTimeout(() => { saveBtn.textContent = 'Save'; }, 1500);
      }
    });
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveBtn.click();
    });

    // Role toggle
    panel.querySelectorAll('.acct-role-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const newRole = btn.dataset.role;
        if (newRole !== currentProfile.role) {
          panel.querySelectorAll('.acct-role-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          await setRole(newRole);
        }
      });
    });

    // Cloud sync toggle
    panel.querySelector('#acct-sync-toggle').addEventListener('change', (e) => {
      if (typeof TB_PREFS_SYNC !== 'undefined') {
        TB_PREFS_SYNC.setEnabled(e.target.checked);
      }
    });

    // Delete account flow
    const deleteBtn = panel.querySelector('#acct-delete-btn');
    const deleteConfirm = panel.querySelector('#acct-delete-confirm');
    const deleteInput = panel.querySelector('#acct-delete-input');
    const confirmBtn = panel.querySelector('#acct-confirm-delete');
    const cancelBtn = panel.querySelector('#acct-delete-cancel');

    deleteBtn.addEventListener('click', () => {
      deleteConfirm.classList.remove('hidden');
      deleteBtn.classList.add('hidden');
      deleteInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
      deleteConfirm.classList.add('hidden');
      deleteBtn.classList.remove('hidden');
      deleteInput.value = '';
      confirmBtn.disabled = true;
    });

    deleteInput.addEventListener('input', () => {
      confirmBtn.disabled = deleteInput.value.trim() !== 'DELETE';
    });

    confirmBtn.addEventListener('click', async () => {
      if (deleteInput.value.trim() !== 'DELETE') return;
      confirmBtn.textContent = 'Deleting...';
      confirmBtn.disabled = true;

      const { error } = await TB_DB.deleteMyAccount();
      if (error) {
        showToast('Failed to delete account: ' + error, 'error');
        confirmBtn.textContent = 'Delete Forever';
        confirmBtn.disabled = false;
        return;
      }

      hideAccountPanel();
      await signOut();
      showToast('Account deleted successfully.', 'info');
    });

    // Load stats asynchronously
    loadAccountStats();
  }

  async function loadAccountStats() {
    const { data } = await TB_DB.fetchMyStats();
    if (!data) return;

    const container = document.getElementById('acct-stats-content');
    if (!container) return;

    const memberSince = currentProfile && currentProfile.created_at
      ? new Date(currentProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'N/A';

    // Count passport badges from localStorage
    let passportCount = 0;
    try {
      const passport = JSON.parse(localStorage.getItem('tb50k_passport') || '{}');
      passportCount = Object.values(passport).filter(Boolean).length;
    } catch (e) { /* ignore */ }

    container.innerHTML = `
      <div class="acct-stat"><span class="acct-stat-val">${data.food_logs}</span><span class="acct-stat-lbl">Food Logs</span></div>
      <div class="acct-stat"><span class="acct-stat-val">${data.bets_placed}</span><span class="acct-stat-lbl">Bets Placed</span></div>
      <div class="acct-stat"><span class="acct-stat-val">${data.parties_hosted}</span><span class="acct-stat-lbl">Parties Hosted</span></div>
      <div class="acct-stat"><span class="acct-stat-val">${passportCount}</span><span class="acct-stat-lbl">Badges Earned</span></div>
      <div class="acct-stat"><span class="acct-stat-val">${memberSince}</span><span class="acct-stat-lbl">Member Since</span></div>
    `;
  }

  function hideAccountPanel() {
    const panel = document.getElementById('account-settings-panel');
    if (panel) panel.classList.add('hidden');
  }

  // ── Auth Modal ──
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
    updateAvatarEmoji,
    showAccountPanel,
    hideAccountPanel,
    showToast,
    getSupabase() { return supabaseClient; },
  };
})();
