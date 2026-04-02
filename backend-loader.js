// ── Backend Lazy Loader ──
// Defers loading of Supabase SDK + all auth-dependent modules (~200KB)
// until user clicks "Sign In" or an auth-locked feature.
// Anonymous visitors never download these scripts.

const TB_BACKEND = (function () {
  let loaded = false;
  let loading = false;
  let loadPromise = null;

  // Scripts to load in order (sequential — each may depend on the previous)
  const BACKEND_SCRIPTS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'config.js',
    'auth.js?v=2',
    'db.js',
    'prefs-sync.js',
    'food-log.js',
    'social-feed.js',
    'party.js',
    'betting.js',
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        console.warn('Failed to load backend script:', src);
        resolve(); // Don't block — graceful degradation
      };
      document.head.appendChild(s);
    });
  }

  async function loadAll() {
    if (loaded) return;
    if (loadPromise) return loadPromise;

    loading = true;
    loadPromise = (async function () {
      for (var i = 0; i < BACKEND_SCRIPTS.length; i++) {
        await loadScript(BACKEND_SCRIPTS[i]);
      }
      loaded = true;
      loading = false;

      // Initialize all backend modules (same order as app.js DOMContentLoaded)
      if (typeof TB_AUTH !== 'undefined') TB_AUTH.init();
      if (typeof TB_FOOD_LOG !== 'undefined') TB_FOOD_LOG.init();
      if (typeof TB_SOCIAL_FEED !== 'undefined') TB_SOCIAL_FEED.init();
      if (typeof TB_PARTIES !== 'undefined') TB_PARTIES.init();
      if (typeof TB_BETTING !== 'undefined') TB_BETTING.init();
      if (typeof TB_PREFS_SYNC !== 'undefined') TB_PREFS_SYNC.init();
    })();

    return loadPromise;
  }

  // ── Render initial auth bar with "Sign In" that triggers lazy load ──
  function renderPlaceholderAuthBar() {
    var bar = document.getElementById('auth-bar');
    if (!bar) return;

    bar.innerHTML = '<button class="auth-sign-in-btn" id="auth-open-modal-lazy">Sign In</button>';
    bar.querySelector('#auth-open-modal-lazy').addEventListener('click', async function () {
      this.textContent = 'Loading…';
      this.disabled = true;
      await loadAll();
      // Auth modal will be shown by TB_AUTH.init() → onAuthStateChange flow
      // If auth is configured, open the modal directly
      if (typeof TB_AUTH !== 'undefined' && TB_AUTH.showAuthModal) {
        TB_AUTH.showAuthModal();
      }
    });
  }

  // Also intercept clicks on auth-locked messages throughout the sidebar
  function interceptAuthLockedClicks() {
    document.addEventListener('click', function (e) {
      var msg = e.target.closest('.auth-locked-msg');
      if (msg && !loaded && !loading) {
        loadAll();
      }
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderPlaceholderAuthBar();
      interceptAuthLockedClicks();
    });
  } else {
    renderPlaceholderAuthBar();
    interceptAuthLockedClicks();
  }

  return { loadAll: loadAll, isLoaded: function () { return loaded; } };
})();
