// ── Taco Bell DC 50K — Preferences Cloud Sync ──
// Syncs localStorage preferences to Supabase profiles.preferences JSONB.
// On login: cloud → localStorage (cloud wins if present).
// On change: localStorage → cloud (debounced).

const TB_PREFS_SYNC = (function () {
  let syncEnabled = false;
  let syncTimer = null;
  const DEBOUNCE_MS = 30000; // 30 seconds

  function init() {
    // Restore sync preference
    syncEnabled = localStorage.getItem('tb50k_prefs_sync') === 'true';

    TB_AUTH.onAuthChange(async ({ user, profile }) => {
      if (user && profile && syncEnabled) {
        await syncFromCloud();
      }
      if (!user) {
        stopAutoSync();
      }
    });

    if (syncEnabled) {
      startAutoSync();
    }
  }

  // ── Read cloud prefs → write to localStorage ──
  async function syncFromCloud() {
    if (!TB_AUTH.isLoggedIn()) return;
    const { data, error } = await TB_DB.fetchPreferences();
    if (error || !data) {
      console.warn('prefs-sync: failed to fetch cloud prefs:', error);
      return;
    }

    // Only overwrite local keys that exist in cloud data
    if (typeof SYNC_KEYS !== 'undefined') {
      SYNC_KEYS.forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          localStorage.setItem(key, data[key]);
        }
      });
    }

    console.log('prefs-sync: restored from cloud');
  }

  // ── Read localStorage → write to cloud ──
  async function syncToCloud() {
    if (!TB_AUTH.isLoggedIn()) return;

    const prefs = {};
    if (typeof SYNC_KEYS !== 'undefined') {
      SYNC_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null) {
          prefs[key] = val;
        }
      });
    }

    const { error } = await TB_DB.updatePreferences(prefs);
    if (error) {
      console.warn('prefs-sync: failed to save to cloud:', error);
    } else {
      console.log('prefs-sync: saved to cloud');
    }
  }

  // ── Auto-sync on interval ──
  function startAutoSync() {
    stopAutoSync();
    syncTimer = setInterval(() => {
      if (syncEnabled && TB_AUTH.isLoggedIn()) {
        syncToCloud();
      }
    }, DEBOUNCE_MS);
  }

  function stopAutoSync() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  // ── Toggle sync on/off ──
  function setEnabled(enabled) {
    syncEnabled = !!enabled;
    localStorage.setItem('tb50k_prefs_sync', syncEnabled ? 'true' : 'false');

    if (syncEnabled) {
      startAutoSync();
      // Immediately sync both directions
      syncFromCloud().then(() => syncToCloud());
    } else {
      stopAutoSync();
    }
  }

  function isEnabled() {
    return syncEnabled;
  }

  return {
    init,
    syncFromCloud,
    syncToCloud,
    setEnabled,
    isEnabled,
  };
})();
