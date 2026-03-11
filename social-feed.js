// ── Taco Bell DC 50K — Social Feed ──
// Real-time feed showing what runners ate at each stop.
// "Stop 4 — Jake just ate a Chalupa Supreme at 10:42 AM"

const TB_SOCIAL_FEED = (function () {
  let feedEntries = [];
  let flagCounts = {};
  let realtimeChannel = null;
  let sortMode = 'recency'; // 'recency' | 'stop'

  function init() {
    TB_AUTH.onAuthChange(({ user, profile }) => {
      if (user && profile) {
        render();
        loadFeed();
        subscribeRealtime();
      } else {
        renderLockedState();
        unsubscribeRealtime();
      }
    });
  }

  async function loadFeed() {
    const { data, error } = await TB_DB.fetchAllFoodLogs({ limit: 50 });
    if (error) {
      console.error('Failed to load social feed:', error);
      showFeedError('Failed to load feed. ' + error);
      return;
    }
    feedEntries = data || [];

    // Fetch flag counts
    const logIds = feedEntries.map(e => e.id);
    const { data: counts } = await TB_DB.fetchFoodLogFlagCounts(logIds);
    flagCounts = counts || {};

    renderEntries();

    // Cache for offline
    try {
      localStorage.setItem('tb50k_cached_feed', JSON.stringify(feedEntries.slice(0, 20)));
    } catch (e) { /* localStorage full */ }
  }

  function subscribeRealtime() {
    unsubscribeRealtime();
    realtimeChannel = TB_DB.subscribeFoodLogs(async (newLog) => {
      // Fetch profile for the new log
      const { data } = await TB_DB.fetchAllFoodLogs({ limit: 1, offset: 0 });
      if (data && data.length > 0) {
        feedEntries.unshift(data[0]);
        renderEntries();
      }
    });
  }

  function unsubscribeRealtime() {
    if (realtimeChannel) {
      TB_DB.unsubscribeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  function render() {
    const container = document.getElementById('social-feed-content');
    if (!container) return;

    container.innerHTML = `
      <div class="feed-controls">
        <button class="feed-sort-btn active" data-sort="recency">Latest</button>
        <button class="feed-sort-btn" data-sort="stop">By Stop</button>
      </div>
      <div id="feed-entries" class="feed-entries">
        <p class="hint">Loading feed...</p>
      </div>
    `;

    // Sort buttons
    container.querySelectorAll('.feed-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sortMode = btn.dataset.sort;
        container.querySelectorAll('.feed-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEntries();
      });
    });
  }

  function renderLockedState() {
    const container = document.getElementById('social-feed-content');
    if (!container) return;
    container.innerHTML = '<p class="auth-locked-msg">Sign in to see the live food feed.</p>';
  }

  function renderEntries() {
    const container = document.getElementById('feed-entries');
    if (!container) return;

    if (feedEntries.length === 0) {
      container.innerHTML = '<p class="hint">No food logged yet. Be the first!</p>';
      return;
    }

    let sorted = [...feedEntries];
    if (sortMode === 'stop') {
      sorted.sort((a, b) => a.stop_number - b.stop_number || new Date(b.created_at) - new Date(a.created_at));
    }
    // recency is default order from DB

    container.innerHTML = sorted.map(entry => renderEntry(entry)).join('');

    // Wire up flag buttons
    container.querySelectorAll('.feed-flag-btn').forEach(btn => {
      btn.addEventListener('click', () => flagEntry(btn.dataset.logId));
    });
  }

  function renderEntry(entry) {
    const displayName = entry.profiles ? entry.profiles.display_name : 'Anonymous';
    const items = (entry.menu_items || []).map(m => m.item || m).join(', ');
    const time = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stopLabel = entry.stop_number === 0 ? 'Start/Finish' : 'Stop ' + entry.stop_number;
    const flags = flagCounts[entry.id] || 0;
    const isHidden = flags >= 3;
    const isOwnPost = TB_AUTH.user && entry.user_id === TB_AUTH.user.id;

    if (isHidden) {
      return `<div class="feed-entry feed-entry-hidden" data-log-id="${entry.id}">
        <span class="feed-hidden-label">Flagged by community</span>
      </div>`;
    }

    let html = `<div class="feed-entry" data-log-id="${entry.id}">
      <div class="feed-entry-header">
        <span class="feed-entry-stop">${stopLabel}</span>
        <span class="feed-entry-name">${displayName}</span>
        <span class="feed-entry-time">${time}</span>
      </div>
      <div class="feed-entry-body">
        <span class="feed-entry-items">${items}</span>
      </div>`;

    if (entry.hot_take) {
      html += `<div class="feed-entry-hottake">"${entry.hot_take}"</div>`;
    }

    if (!isOwnPost) {
      html += `<button class="feed-flag-btn" data-log-id="${entry.id}" title="Flag this post">🚩</button>`;
    }

    html += '</div>';
    return html;
  }

  async function flagEntry(logId) {
    const { error } = await TB_DB.flagFoodLog(logId, 'inappropriate');
    if (error) {
      console.error('Failed to flag:', error);
      return;
    }
    flagCounts[logId] = (flagCounts[logId] || 0) + 1;
    renderEntries();
  }

  function showFeedError(msg) {
    const container = document.getElementById('feed-entries');
    if (!container) return;

    // Try to show cached feed
    try {
      const cached = JSON.parse(localStorage.getItem('tb50k_cached_feed'));
      if (cached && cached.length > 0) {
        feedEntries = cached;
        renderEntries();
        const note = document.createElement('div');
        note.className = 'feed-offline-note';
        note.textContent = 'Showing cached feed (offline)';
        container.prepend(note);
        return;
      }
    } catch (e) { /* no cache */ }

    container.innerHTML = `<p class="feed-error">${msg}</p>`;
  }

  return { init, render, renderLockedState, loadFeed, sortBy: (mode) => { sortMode = mode; renderEntries(); } };
})();
