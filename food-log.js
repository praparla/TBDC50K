// ── Taco Bell DC 50K — Food Consumption Log ──
// Runners log what they ate at each of the 8 TB stops.
// Mandatory stops (3 & 7) auto-validate.

const TB_FOOD_LOG = (function () {
  let myLogs = [];
  let submitting = false;

  function init() {
    TB_AUTH.onAuthChange(({ user, profile }) => {
      if (user && profile) {
        render();
        loadMyLogs();
      } else {
        renderLockedState();
      }
    });
  }

  async function loadMyLogs() {
    const { data, error } = await TB_DB.fetchMyFoodLogs();
    if (error) {
      console.error('Failed to load food logs:', error);
      return;
    }
    myLogs = data || [];
    renderLogEntries();
    renderTally();
    checkMandatoryRules();
  }

  // ── Render the full food log UI ──
  function render() {
    const container = document.getElementById('food-log-content');
    if (!container) return;

    container.innerHTML = `
      <div class="food-log-form">
        <div class="food-log-field">
          <label>Stop</label>
          <select id="food-log-stop">
            <option value="">Select stop...</option>
            ${TACO_BELL_STOPS.map(s =>
              `<option value="${s.num}">
                ${s.num === 0 ? 'Start/Finish' : 'Stop ' + s.num} - ${s.label.split(' - ')[1] || s.label}
                ${s.mandatory ? ' 🌮' : ''}
              </option>`
            ).join('')}
          </select>
        </div>
        <div class="food-log-field">
          <label>What did you eat/drink?</label>
          <div class="food-log-items" id="food-log-items">
            ${TB_MENU_ITEMS.map(item =>
              `<label class="food-log-item-check">
                <input type="checkbox" value="${item}" />
                <span>${item}</span>
              </label>`
            ).join('')}
          </div>
        </div>
        <div class="food-log-field">
          <label>Hot take <span class="hint">(optional, 280 chars)</span></label>
          <input type="text" id="food-log-hottake" maxlength="280" placeholder="e.g. Ate here at mile 21. Still standing." />
        </div>
        <button id="food-log-submit" class="tool-btn food-log-submit-btn" disabled>Log It 🌮</button>
        <div id="food-log-status" class="food-log-status"></div>
      </div>
      <div id="food-log-tally" class="food-log-tally"></div>
      <div id="food-log-mandatory" class="food-log-mandatory"></div>
      <div id="food-log-entries" class="food-log-entries"></div>
    `;

    // Enable submit when stop + at least 1 item selected
    const stopSelect = container.querySelector('#food-log-stop');
    const checkboxes = container.querySelectorAll('#food-log-items input[type="checkbox"]');
    const submitBtn = container.querySelector('#food-log-submit');

    function updateSubmitState() {
      const hasStop = stopSelect.value !== '';
      const hasItem = Array.from(checkboxes).some(cb => cb.checked);
      submitBtn.disabled = !hasStop || !hasItem || submitting;
    }

    stopSelect.addEventListener('change', updateSubmitState);
    checkboxes.forEach(cb => cb.addEventListener('change', updateSubmitState));

    submitBtn.addEventListener('click', () => submitLog());
  }

  function renderLockedState() {
    const container = document.getElementById('food-log-content');
    if (!container) return;
    container.innerHTML = '<p class="auth-locked-msg">Sign in to log your food at each stop.</p>';
  }

  // ── Submit a food log entry ──
  async function submitLog() {
    if (submitting) return;

    const stopSelect = document.getElementById('food-log-stop');
    const checkboxes = document.querySelectorAll('#food-log-items input[type="checkbox"]:checked');
    const hotTakeInput = document.getElementById('food-log-hottake');
    const statusEl = document.getElementById('food-log-status');
    const submitBtn = document.getElementById('food-log-submit');

    const stop_number = parseInt(stopSelect.value);
    const menu_items = Array.from(checkboxes).map(cb => ({ item: cb.value, quantity: 1 }));
    const hot_take = hotTakeInput ? hotTakeInput.value.trim() : '';

    if (isNaN(stop_number) || menu_items.length === 0) return;

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging...';

    // Try to capture GPS
    let lat = null, lng = null;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch (e) {
      // GPS not available — that's fine
    }

    const { data, error } = await TB_DB.insertFoodLog({ stop_number, menu_items, hot_take, lat, lng });

    submitting = false;
    submitBtn.textContent = 'Log It 🌮';

    if (error) {
      if (statusEl) {
        statusEl.textContent = 'Failed to log. ' + error;
        statusEl.className = 'food-log-status error';
      }
      submitBtn.disabled = false;
      return;
    }

    // Success
    if (statusEl) {
      statusEl.textContent = 'Logged! 🌮';
      statusEl.className = 'food-log-status success';
      setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'food-log-status'; }, 3000);
    }

    // Reset form
    stopSelect.value = '';
    document.querySelectorAll('#food-log-items input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (hotTakeInput) hotTakeInput.value = '';

    // Refresh log entries
    if (data) {
      myLogs.push(data);
      renderLogEntries();
      renderTally();
      checkMandatoryRules();
    }

    // Debounce: disable submit for 3 seconds
    setTimeout(() => {
      const btn = document.getElementById('food-log-submit');
      if (btn) btn.disabled = true; // Stays disabled until valid selection
    }, 3000);
  }

  // ── Render logged entries ──
  function renderLogEntries() {
    const container = document.getElementById('food-log-entries');
    if (!container) return;

    if (myLogs.length === 0) {
      container.innerHTML = '<p class="hint">No food logged yet. Get eating!</p>';
      return;
    }

    // Group by stop
    const byStop = {};
    myLogs.forEach(log => {
      if (!byStop[log.stop_number]) byStop[log.stop_number] = [];
      byStop[log.stop_number].push(log);
    });

    let html = '<h4>Your Food Log</h4>';
    Object.keys(byStop).sort((a, b) => a - b).forEach(stopNum => {
      const logs = byStop[stopNum];
      const stopLabel = parseInt(stopNum) === 0 ? 'Start/Finish' : 'Stop ' + stopNum;
      html += `<div class="food-log-stop-group">`;
      html += `<div class="food-log-stop-header">${stopLabel}</div>`;
      const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => s;
      logs.forEach(log => {
        const items = esc((log.menu_items || []).map(m => m.item || m).join(', '));
        const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        html += `<div class="food-log-entry">
          <span class="food-log-entry-items">${items}</span>
          <span class="food-log-entry-time">${time}</span>
        </div>`;
        if (log.hot_take) {
          html += `<div class="food-log-entry-hottake">"${esc(log.hot_take)}"</div>`;
        }
      });
      html += `</div>`;
    });

    container.innerHTML = html;
  }

  // ── Running tally ──
  function renderTally() {
    const container = document.getElementById('food-log-tally');
    if (!container) return;

    const totalItems = myLogs.reduce((sum, log) => sum + (log.menu_items || []).length, 0);
    if (totalItems === 0) {
      container.innerHTML = '';
      return;
    }

    const tacos = '🌮'.repeat(Math.min(totalItems, 20));
    container.innerHTML = `
      <div class="food-log-tally-text">
        You've consumed <strong>${totalItems}</strong> menu item${totalItems !== 1 ? 's' : ''}. ${totalItems >= 8 ? 'Legend.' : 'Keep going!'} ${tacos}
      </div>
    `;
  }

  // ── Mandatory rule validation ──
  function checkMandatoryRules() {
    const container = document.getElementById('food-log-mandatory');
    if (!container) return;

    const stop3Logs = myLogs.filter(l => l.stop_number === 3);
    const stop7Logs = myLogs.filter(l => l.stop_number === 7);

    const stop3Items = stop3Logs.flatMap(l => (l.menu_items || []).map(m => m.item || m));
    const stop7Items = stop7Logs.flatMap(l => (l.menu_items || []).map(m => m.item || m));

    const rule1Satisfied = TB_MANDATORY_ITEMS.stop3.some(item => stop3Items.includes(item));
    const rule2Satisfied = TB_MANDATORY_ITEMS.stop7.some(item => stop7Items.includes(item));

    let html = '';
    if (rule1Satisfied || rule2Satisfied) {
      html += '<div class="food-log-rules">';
      if (rule1Satisfied) {
        html += '<div class="food-log-rule satisfied">✅ Stop 3 mandatory food — Rule satisfied!</div>';
      }
      if (rule2Satisfied) {
        html += '<div class="food-log-rule satisfied">✅ Stop 7 mandatory food — Rule satisfied!</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  return { init, render, renderLockedState, loadMyLogs, getMyLogs: () => myLogs };
})();
