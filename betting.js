// ── Taco Bell DC 50K — Friend Betting System ──
// Pre-race wagers on finish time, food items, bathroom stops, DNF.
// No real money — bragging rights leaderboard only.

const TB_BETTING = (function () {
  let myBets = [];
  let betsOnMe = [];
  let leaderboard = [];
  let activeTab = 'place'; // 'place' | 'mybets' | 'leaderboard'
  let searchResults = [];
  let selectedRunner = null;

  function init() {
    TB_AUTH.onAuthChange(({ user, profile }) => {
      if (user && profile) {
        render();
        loadBets();
      } else {
        renderLockedState();
      }
    });
  }

  async function loadBets() {
    const [myResult, onMeResult, lbResult] = await Promise.all([
      TB_DB.fetchMyBets(),
      TB_DB.fetchBetsOnMe(),
      TB_DB.fetchLeaderboard(),
    ]);
    myBets = myResult.data || [];
    betsOnMe = onMeResult.data || [];
    leaderboard = lbResult.data || [];
    renderContent();
  }

  function render() {
    const container = document.getElementById('betting-content');
    if (!container) return;

    container.innerHTML = `
      <div class="betting-tabs">
        <button class="betting-tab active" data-tab="place">Place Bet</button>
        <button class="betting-tab" data-tab="mybets">My Bets</button>
        <button class="betting-tab" data-tab="leaderboard">Leaderboard</button>
      </div>
      <div id="betting-tab-content" class="betting-tab-content">
        <p class="hint">Loading...</p>
      </div>
    `;

    container.querySelectorAll('.betting-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        container.querySelectorAll('.betting-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderContent();
      });
    });
  }

  function renderLockedState() {
    const container = document.getElementById('betting-content');
    if (!container) return;
    container.innerHTML = '<p class="auth-locked-msg">Sign in to place bets on your friends.</p>';
  }

  function renderContent() {
    const container = document.getElementById('betting-tab-content');
    if (!container) return;

    if (activeTab === 'place') renderPlaceBet(container);
    else if (activeTab === 'mybets') renderMyBets(container);
    else if (activeTab === 'leaderboard') renderLeaderboard(container);
  }

  // ── Place Bet Form ──
  function renderPlaceBet(container) {
    container.innerHTML = `
      <div class="bet-form">
        <div class="bet-field">
          <label>Who are you betting on?</label>
          <input type="text" id="bet-runner-search" placeholder="Search runners..." />
          <div id="bet-runner-results" class="bet-runner-results"></div>
          <div id="bet-runner-selected" class="bet-runner-selected"></div>
        </div>
        <div class="bet-field">
          <label>Bet Type</label>
          <select id="bet-type">
            ${Object.entries(BET_TYPES).map(([key, val]) =>
              `<option value="${key}">${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="bet-field" id="bet-prediction-fields">
          <!-- Dynamic prediction inputs based on bet type -->
        </div>
        <button id="bet-submit" class="tool-btn" disabled>Place Bet 🎲</button>
        <div id="bet-status" class="food-log-status"></div>
      </div>
    `;

    // Runner search
    const searchInput = container.querySelector('#bet-runner-search');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        const query = searchInput.value.trim();
        if (query.length < 2) {
          searchResults = [];
          renderSearchResults();
          return;
        }
        const { data } = await TB_DB.searchRunners(query);
        searchResults = (data || []).filter(r => r.id !== TB_AUTH.user.id); // Exclude self
        renderSearchResults();
      }, 300);
    });

    // Bet type change
    const typeSelect = container.querySelector('#bet-type');
    typeSelect.addEventListener('change', () => renderPredictionFields());
    renderPredictionFields();

    // Submit
    container.querySelector('#bet-submit').addEventListener('click', submitBet);
  }

  function renderSearchResults() {
    const container = document.getElementById('bet-runner-results');
    if (!container) return;

    if (searchResults.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = searchResults.map(r =>
      `<div class="bet-runner-option" data-id="${r.id}" data-name="${r.display_name}">
        ${r.display_name}
      </div>`
    ).join('');

    container.querySelectorAll('.bet-runner-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedRunner = { id: opt.dataset.id, display_name: opt.dataset.name };
        renderSelectedRunner();
        container.innerHTML = '';
        document.getElementById('bet-runner-search').value = '';
        updateBetSubmitState();
      });
    });
  }

  function renderSelectedRunner() {
    const container = document.getElementById('bet-runner-selected');
    if (!container || !selectedRunner) {
      if (container) container.innerHTML = '';
      return;
    }
    container.innerHTML = `
      <span class="bet-selected-name">🏃 ${selectedRunner.display_name}</span>
      <button class="bet-clear-runner" title="Clear">×</button>
    `;
    container.querySelector('.bet-clear-runner').addEventListener('click', () => {
      selectedRunner = null;
      container.innerHTML = '';
      updateBetSubmitState();
    });
  }

  function renderPredictionFields() {
    const container = document.getElementById('bet-prediction-fields');
    const typeSelect = document.getElementById('bet-type');
    if (!container || !typeSelect) return;

    const betType = typeSelect.value;

    if (betType === 'finish_time') {
      container.innerHTML = `
        <label>Predicted finish time</label>
        <div class="bet-time-inputs">
          <input type="number" id="bet-pred-hours" min="0" max="11" placeholder="hrs" />
          <span>:</span>
          <input type="number" id="bet-pred-minutes" min="0" max="59" placeholder="min" />
        </div>
        <div class="bet-over-under">
          <label><input type="radio" name="bet-ou" value="under" checked /> Under</label>
          <label><input type="radio" name="bet-ou" value="over" /> Over</label>
        </div>
      `;
    } else if (betType === 'food_items') {
      container.innerHTML = `
        <label>Total menu items consumed</label>
        <input type="number" id="bet-pred-count" min="1" max="100" placeholder="count" />
        <div class="bet-over-under">
          <label><input type="radio" name="bet-ou" value="under" checked /> Under</label>
          <label><input type="radio" name="bet-ou" value="over" /> Over</label>
        </div>
      `;
    } else if (betType === 'bathroom_stops') {
      container.innerHTML = `
        <label>Number of bathroom stops</label>
        <input type="number" id="bet-pred-count" min="0" max="50" placeholder="count" />
        <div class="bet-over-under">
          <label><input type="radio" name="bet-ou" value="under" checked /> Under</label>
          <label><input type="radio" name="bet-ou" value="over" /> Over</label>
        </div>
      `;
    } else if (betType === 'dnf') {
      container.innerHTML = `
        <label>Will they finish?</label>
        <div class="bet-over-under">
          <label><input type="radio" name="bet-dnf" value="false" checked /> They'll finish 💪</label>
          <label><input type="radio" name="bet-dnf" value="true" /> DNF 💀</label>
        </div>
      `;
    }

    // Re-bind input listeners for submit state
    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', updateBetSubmitState);
      input.addEventListener('change', updateBetSubmitState);
    });

    updateBetSubmitState();
  }

  function updateBetSubmitState() {
    const submitBtn = document.getElementById('bet-submit');
    if (!submitBtn) return;

    const hasRunner = selectedRunner !== null;
    const prediction = buildPrediction();
    submitBtn.disabled = !(hasRunner && prediction !== null);
  }

  function buildPrediction() {
    const betType = document.getElementById('bet-type');
    if (!betType) return null;

    const type = betType.value;

    if (type === 'finish_time') {
      const hours = parseInt(document.getElementById('bet-pred-hours')?.value);
      const minutes = parseInt(document.getElementById('bet-pred-minutes')?.value);
      const ou = document.querySelector('input[name="bet-ou"]:checked')?.value;
      if (isNaN(hours) && isNaN(minutes)) return null;
      return { hours: hours || 0, minutes: minutes || 0, over_under: ou || 'under' };
    } else if (type === 'food_items' || type === 'bathroom_stops') {
      const count = parseInt(document.getElementById('bet-pred-count')?.value);
      const ou = document.querySelector('input[name="bet-ou"]:checked')?.value;
      if (isNaN(count)) return null;
      return { count, over_under: ou || 'under' };
    } else if (type === 'dnf') {
      const willDnf = document.querySelector('input[name="bet-dnf"]:checked')?.value;
      return { will_dnf: willDnf === 'true' };
    }

    return null;
  }

  async function submitBet() {
    if (!selectedRunner) return;

    const betType = document.getElementById('bet-type').value;
    const prediction = buildPrediction();
    if (!prediction) return;

    const submitBtn = document.getElementById('bet-submit');
    const statusEl = document.getElementById('bet-status');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing...';

    const { data, error } = await TB_DB.insertBet({
      target_runner_id: selectedRunner.id,
      bet_type: betType,
      prediction,
    });

    submitBtn.textContent = 'Place Bet 🎲';

    if (error) {
      if (statusEl) {
        statusEl.textContent = 'Failed: ' + error;
        statusEl.className = 'food-log-status error';
      }
      submitBtn.disabled = false;
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Bet placed! 🎲';
      statusEl.className = 'food-log-status success';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }

    // Reset
    selectedRunner = null;
    renderSelectedRunner();
    renderPredictionFields();

    if (data) {
      myBets.unshift(data);
    }
  }

  // ── My Bets List ──
  function renderMyBets(container) {
    const allBets = [
      ...myBets.map(b => ({ ...b, direction: 'outgoing' })),
      ...betsOnMe.map(b => ({ ...b, direction: 'incoming' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (allBets.length === 0) {
      container.innerHTML = '<p class="hint">No bets yet. Place one!</p>';
      return;
    }

    container.innerHTML = allBets.map(bet => {
      const typeDef = BET_TYPES[bet.bet_type] || { label: bet.bet_type };
      const predText = formatPrediction(bet.bet_type, bet.prediction);
      const isOutgoing = bet.direction === 'outgoing';
      const targetName = bet.profiles ? bet.profiles.display_name : 'Unknown';
      const statusClass = bet.is_correct === true ? 'bet-correct' : bet.is_correct === false ? 'bet-wrong' : 'bet-pending';
      const statusLabel = bet.is_correct === true ? '✅ Correct!' : bet.is_correct === false ? '❌ Wrong' : '⏳ Pending';

      let resolveHtml = '';
      if (bet.is_correct === null && !isOutgoing) {
        // Target runner can resolve bets on them
        resolveHtml = `<div class="bet-resolve">
          <button class="bet-resolve-btn" data-id="${bet.id}" data-correct="true">Mark Correct ✅</button>
          <button class="bet-resolve-btn" data-id="${bet.id}" data-correct="false">Mark Wrong ❌</button>
        </div>`;
      }

      return `<div class="bet-item ${statusClass}">
        <div class="bet-item-header">
          <span class="bet-item-type">${typeDef.label}</span>
          <span class="bet-item-status">${statusLabel}</span>
        </div>
        <div class="bet-item-detail">
          ${isOutgoing ? `On: ${targetName}` : `By: ${targetName}`} — ${predText}
        </div>
        ${resolveHtml}
      </div>`;
    }).join('');

    // Wire up resolve buttons
    container.querySelectorAll('.bet-resolve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const isCorrect = btn.dataset.correct === 'true';
        await TB_DB.resolveBet(id, {}, isCorrect);
        await loadBets();
      });
    });
  }

  function formatPrediction(type, pred) {
    if (!pred) return 'N/A';
    if (type === 'finish_time') {
      return `${pred.over_under || 'under'} ${pred.hours || 0}h ${pred.minutes || 0}m`;
    } else if (type === 'food_items') {
      return `${pred.over_under || 'under'} ${pred.count || 0} items`;
    } else if (type === 'bathroom_stops') {
      return `${pred.over_under || 'under'} ${pred.count || 0} stops`;
    } else if (type === 'dnf') {
      return pred.will_dnf ? 'Will DNF 💀' : 'Will finish 💪';
    }
    return JSON.stringify(pred);
  }

  // ── Leaderboard ──
  function renderLeaderboard(container) {
    if (leaderboard.length === 0) {
      container.innerHTML = '<p class="hint">No resolved bets yet. Leaderboard will populate after race day.</p>';
      return;
    }

    let html = '<div class="bet-leaderboard">';
    html += '<div class="bet-lb-header"><span>Rank</span><span>Name</span><span>Accuracy</span><span>Score</span></div>';

    leaderboard.forEach((entry, i) => {
      const pct = (entry.accuracy * 100).toFixed(0);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      html += `<div class="bet-lb-row">
        <span class="bet-lb-rank">${medal}</span>
        <span class="bet-lb-name">${entry.display_name}</span>
        <span class="bet-lb-accuracy">${pct}%</span>
        <span class="bet-lb-score">${entry.correct}/${entry.total}</span>
      </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  return { init, render, renderLockedState, loadBets };
})();
