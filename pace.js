// ── TB Pace — Pace calculator, food tracker, calorie tracker, time helpers ──
// Extracted from app.js. IIFE module, no build step.
// Depends on: TACO_BELL_STOPS, STOP_DISTANCES (globals)
//             TB_Events, TB_Elevation, TB_Stops (modules)
//             audioEnabled, playTacoBellBong (tools.js globals)

const TB_Pace = window.TB_Pace = (() => {

  // ── Mandatory Food Tracker ──
  const FOOD_RULES = [
    { id: 'food_rule_1', stop: 3, label: 'Chalupa Supreme OR Crunchwrap by Stop 3', key: 'tb50k_food_rule_1' },
    { id: 'food_rule_2', stop: 7, label: 'Burrito Supreme OR Nachos Bell Grande by Stop 7', key: 'tb50k_food_rule_2' },
  ];

  function buildFoodTracker() {
    const container = document.getElementById('food-tracker');
    if (!container) return;

    FOOD_RULES.forEach(rule => {
      const checked = localStorage.getItem(rule.key) === 'true';
      const row = document.createElement('label');
      row.className = 'food-rule-row' + (checked ? ' completed' : '');
      row.innerHTML = `
        <input type="checkbox" id="${rule.id}" ${checked ? 'checked' : ''} />
        <span class="food-rule-label">${rule.label}</span>
      `;
      row.querySelector('input').addEventListener('change', (e) => {
        localStorage.setItem(rule.key, e.target.checked);
        row.classList.toggle('completed', e.target.checked);
        if (e.target.checked && typeof audioEnabled !== 'undefined' && audioEnabled) playTacoBellBong();
        TB_Events.emit('foodRuleChanged');
      });
      container.appendChild(row);
    });
  }

  // ── Time-of-Day Helpers ──

  function formatClockTime(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function addMinutesToTime(baseH, baseM, addMins) {
    const totalMins = baseH * 60 + baseM + Math.round(addMins);
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return formatClockTime(h, m);
  }

  // ── Pace Calculator ──

  function calculatePace() {
    const hoursInput = document.getElementById('pace-hours');
    const minsInput = document.getElementById('pace-minutes');
    const resultsDiv = document.getElementById('pace-results');
    if (!hoursInput || !minsInput || !resultsDiv) return;

    const totalMinutes = (parseInt(hoursInput.value) || 0) * 60 + (parseInt(minsInput.value) || 0);
    if (totalMinutes <= 0) {
      resultsDiv.innerHTML = '<p class="hint">Enter a goal time above.</p>';
      return;
    }

    const totalDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
    const gapEnabled = document.getElementById('gap-toggle')?.checked && TB_Elevation.data;
    const gapFactors = gapEnabled ? TB_Elevation.getGAPFactors() : null;

    // Solve for base pace that hits goal time after fatigue + GAP (ISSUE-016)
    const fatigueThreshold = 20;
    let effectiveDist = totalDist;
    if (totalDist > fatigueThreshold) {
      effectiveDist = fatigueThreshold + (totalDist - fatigueThreshold) * 1.04;
    }
    if (gapFactors) {
      effectiveDist = 0;
      for (let i = 1; i < TACO_BELL_STOPS.length; i++) {
        const legDist = STOP_DISTANCES[i] - STOP_DISTANCES[i - 1];
        let factor = 1;
        if (STOP_DISTANCES[i - 1] >= fatigueThreshold) {
          factor = 1.04;
        } else if (STOP_DISTANCES[i] > fatigueThreshold) {
          const pre = fatigueThreshold - STOP_DISTANCES[i - 1];
          const post = STOP_DISTANCES[i] - fatigueThreshold;
          factor = (pre + post * 1.04) / legDist;
        }
        if (gapFactors[i - 1]) factor *= gapFactors[i - 1];
        effectiveDist += legDist * factor;
      }
      const lastLegDist = totalDist - STOP_DISTANCES[STOP_DISTANCES.length - 2];
      let lastFactor = 1.04;
      if (gapFactors[gapFactors.length - 1]) lastFactor *= gapFactors[gapFactors.length - 1];
      effectiveDist += lastLegDist * lastFactor;
    }
    const pacePerMile = totalMinutes / effectiveDist;

    // Start time for ETAs
    const startH = parseInt(localStorage.getItem('tb50k_race_start_h')) || 0;
    const startM = parseInt(localStorage.getItem('tb50k_race_start_m')) || 0;
    const hasStartTime = startH > 0 || startM > 0;

    let html = '<div class="pace-splits">';
    html += `<div class="pace-split-header">
      <span class="pace-split-label">Stop</span>
      <span class="pace-split-dist">Dist</span>
      <span class="pace-split-time">Elapsed</span>
      ${hasStartTime ? '<span class="pace-split-clock">ETA</span>' : ''}
    </div>`;

    let cumulativeMinutes = 0;

    TACO_BELL_STOPS.forEach((stop, i) => {
      const dist = STOP_DISTANCES[i];
      if (i === 0) {
        cumulativeMinutes = 0;
      } else {
        const legDist = STOP_DISTANCES[i] - STOP_DISTANCES[i - 1];
        let legPace = pacePerMile;

        if (STOP_DISTANCES[i - 1] >= 20) {
          legPace *= 1.04;
        } else if (dist > 20) {
          const preWallDist = 20 - STOP_DISTANCES[i - 1];
          const postWallDist = dist - 20;
          legPace = ((preWallDist * pacePerMile) + (postWallDist * pacePerMile * 1.04)) / legDist;
        }

        if (gapFactors && gapFactors[i - 1]) {
          legPace *= gapFactors[i - 1];
        }

        cumulativeMinutes += legDist * legPace;
      }

      let mins = Math.round(cumulativeMinutes % 60);
      let hrs = Math.floor(cumulativeMinutes / 60);
      if (mins === 60) { mins = 0; hrs++; }
      const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      const mandatory = stop.mandatory ? ' 🌮' : '';
      const clockStr = hasStartTime ? addMinutesToTime(startH, startM, cumulativeMinutes) : '';

      html += `<div class="pace-split-row">
        <span class="pace-split-label">${i === 0 ? 'Start' : 'Stop ' + stop.num}${mandatory}</span>
        <span class="pace-split-dist">${dist} mi</span>
        <span class="pace-split-time">${timeStr}</span>
        ${hasStartTime ? `<span class="pace-split-clock">${clockStr}</span>` : ''}
      </div>`;
    });

    // Finish line
    const finishDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
    const lastLegDist = finishDist - STOP_DISTANCES[STOP_DISTANCES.length - 2];
    let lastLegPace = pacePerMile * 1.04;
    if (gapFactors && gapFactors[gapFactors.length - 1]) {
      lastLegPace *= gapFactors[gapFactors.length - 1];
    }
    const finishMins = cumulativeMinutes + lastLegDist * lastLegPace;
    let fMins = Math.round(finishMins % 60);
    let fHrs = Math.floor(finishMins / 60);
    if (fMins === 60) { fMins = 0; fHrs++; }
    const finishClockStr = hasStartTime ? addMinutesToTime(startH, startM, finishMins) : '';
    html += `<div class="pace-split-row finish-row">
      <span class="pace-split-label">🏁 Finish</span>
      <span class="pace-split-dist">${finishDist} mi</span>
      <span class="pace-split-time">${fHrs}h ${fMins}m</span>
      ${hasStartTime ? `<span class="pace-split-clock">${finishClockStr}</span>` : ''}
    </div>`;

    let noteText = `Pace: ${pacePerMile.toFixed(1)} min/mi (with 4% fatigue after mi 20)`;
    if (gapEnabled) noteText += ' + grade-adjusted';
    html += `<p class="pace-note">${noteText}</p>`;
    if (gapEnabled && !TB_Elevation.data) {
      html += '<p class="pace-note">Waiting for elevation data to load...</p>';
    }
    if (!hasStartTime) {
      html += '<p class="pace-note">Set a start time in the Race Day Clock section to see arrival times.</p>';
    }
    html += '</div>';
    resultsDiv.innerHTML = html;

    localStorage.setItem('tb50k_pace_hours', hoursInput.value);
    localStorage.setItem('tb50k_pace_minutes', minsInput.value);
    TB_Events.emit('paceCalculated');
  }

  function restorePaceInputs() {
    const h = localStorage.getItem('tb50k_pace_hours');
    const m = localStorage.getItem('tb50k_pace_minutes');
    const hoursInput = document.getElementById('pace-hours');
    const minsInput = document.getElementById('pace-minutes');
    if (hoursInput && h) hoursInput.value = h;
    if (minsInput && m) minsInput.value = m;
    if (h || m) calculatePace();
  }

  function printPaceCard() {
    calculatePace();
    window.print();
  }

  // ── Calorie Tracker ──
  const CALORIES_PER_MILE = 100;

  function buildCalorieTracker() {
    const container = document.getElementById('calorie-tracker-content');
    if (!container) return;

    const consumed = getConsumedCalories();
    const burned = getBurnedCalories();
    const net = consumed - burned;

    let html = '<div class="calorie-summary">';
    html += `<div class="calorie-stat"><span class="calorie-label">🍔 Consumed</span><span class="calorie-value">${consumed} cal</span></div>`;
    html += `<div class="calorie-stat"><span class="calorie-label">🔥 Burned (est.)</span><span class="calorie-value">${burned} cal</span></div>`;
    html += `<div class="calorie-stat net ${net >= 0 ? 'positive' : 'negative'}"><span class="calorie-label">📊 Net</span><span class="calorie-value">${net >= 0 ? '+' : ''}${net} cal</span></div>`;
    html += '</div>';

    const checkedItems = getCheckedFoodItems();
    if (checkedItems.length > 0) {
      html += '<div class="calorie-breakdown"><h4>Food Log</h4>';
      checkedItems.forEach(item => {
        html += `<div class="calorie-item"><span>${item.name}</span><span>${item.cal} cal</span></div>`;
      });
      html += '</div>';
    } else {
      html += '<p class="hint">Check off food items in the Rules tab or use the Log tab to track calories.</p>';
    }

    html += `<p class="hint" style="margin-top:8px;font-size:0.65rem;">Burn estimate: ~${CALORIES_PER_MILE} cal/mile for 150lb runner at moderate pace. Distance: ${getEstimatedDistance().toFixed(1)} mi.</p>`;
    container.innerHTML = html;
  }

  function getConsumedCalories() {
    let total = 0;
    const rule1 = localStorage.getItem('tb50k_food_rule_1') === 'true';
    const rule2 = localStorage.getItem('tb50k_food_rule_2') === 'true';
    if (rule1) total += 440;
    if (rule2) total += 565;

    try {
      const logged = JSON.parse(localStorage.getItem('tb50k_calorie_log') || '[]');
      logged.forEach(item => {
        const menuItem = TB_Stops.TB_MENU_DATA.find(m => m.name === item);
        if (menuItem) total += menuItem.cal;
      });
    } catch (e) { /* ignore */ }

    return total;
  }

  function getCheckedFoodItems() {
    const items = [];
    const rule1 = localStorage.getItem('tb50k_food_rule_1') === 'true';
    const rule2 = localStorage.getItem('tb50k_food_rule_2') === 'true';
    if (rule1) items.push({ name: 'Mandatory Stop 3 (avg)', cal: 440 });
    if (rule2) items.push({ name: 'Mandatory Stop 7 (avg)', cal: 565 });

    try {
      const logged = JSON.parse(localStorage.getItem('tb50k_calorie_log') || '[]');
      logged.forEach(name => {
        const menuItem = TB_Stops.TB_MENU_DATA.find(m => m.name === name);
        if (menuItem) items.push({ name: menuItem.name, cal: menuItem.cal });
      });
    } catch (e) { /* ignore */ }

    return items;
  }

  function getBurnedCalories() {
    return Math.round(getEstimatedDistance() * CALORIES_PER_MILE);
  }

  function getEstimatedDistance() {
    try {
      const splits = JSON.parse(localStorage.getItem('tb50k_splits') || '[]');
      if (splits.length > 0) {
        const lastSplit = splits[splits.length - 1];
        if (lastSplit.distance) return parseFloat(lastSplit.distance);
      }
    } catch (e) { /* ignore */ }
    return STOP_DISTANCES[STOP_DISTANCES.length - 1];
  }

  function addCalorieLogItem(itemName) {
    try {
      const logged = JSON.parse(localStorage.getItem('tb50k_calorie_log') || '[]');
      logged.push(itemName);
      localStorage.setItem('tb50k_calorie_log', JSON.stringify(logged));
      buildCalorieTracker();
    } catch (e) { /* ignore */ }
  }

  function clearCalorieLog() {
    localStorage.removeItem('tb50k_calorie_log');
    buildCalorieTracker();
  }

  function buildCalorieLogForm() {
    const container = document.getElementById('calorie-log-form');
    if (!container) return;

    let html = '<select id="calorie-item-select">';
    TB_Stops.TB_MENU_DATA.forEach(item => {
      html += `<option value="${item.name}">${item.name} (${item.cal} cal)</option>`;
    });
    html += '</select>';
    html += '<button class="tool-btn" onclick="TB_Pace.addCalorieLogItem(document.getElementById(\'calorie-item-select\').value)">+ Add</button>';
    html += ' <button class="tool-btn" onclick="TB_Pace.clearCalorieLog()">Clear</button>';
    container.innerHTML = html;
  }

  // ── Leg-by-Leg Segments ──

  function buildSegments() {
    const container = document.getElementById('segments-list');
    if (!container) return;

    let html = '';
    for (let i = 0; i < STOP_DISTANCES.length - 1; i++) {
      const legDist = (STOP_DISTANCES[i + 1] - STOP_DISTANCES[i]).toFixed(1);
      const fromLabel = i === 0 ? 'Start' : `Stop ${i}`;
      const toLabel = i + 1 === STOP_DISTANCES.length - 1 ? 'Finish' : `Stop ${i + 1}`;
      const isLastLeg = i + 1 === STOP_DISTANCES.length - 1;
      const toStop = isLastLeg ? TACO_BELL_STOPS[0] : TACO_BELL_STOPS[i + 1];
      const areaName = isLastLeg ? 'Alexandria' : (toStop ? toStop.label.split(' - ')[1] || '' : '');

      html += `<div class="segment-row">
        <span class="segment-label">${fromLabel} → ${toLabel}</span>
        <span class="segment-area">${areaName}</span>
        <span class="segment-dist">${legDist} mi</span>
      </div>`;
    }
    container.innerHTML = html;
  }

  // ── Public API ──
  return {
    FOOD_RULES,
    calculatePace,
    restorePaceInputs,
    printPaceCard,
    buildFoodTracker,
    buildSegments,
    buildCalorieTracker,
    buildCalorieLogForm,
    addCalorieLogItem,
    clearCalorieLog,
    formatClockTime,
    addMinutesToTime,
  };
})();

// Backward-compat globals for inline onclick handlers
window.calculatePace = TB_Pace.calculatePace;
window.printPaceCard = TB_Pace.printPaceCard;
window.addCalorieLogItem = TB_Pace.addCalorieLogItem;
window.clearCalorieLog = TB_Pace.clearCalorieLog;
window.buildFoodTracker = TB_Pace.buildFoodTracker;
window.FOOD_RULES = TB_Pace.FOOD_RULES;
