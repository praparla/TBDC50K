// ── TB Race — Race mode, countdown clock, split history ──
// Extracted from app.js. IIFE module, no build step.
// Depends on: TACO_BELL_STOPS, STOP_DISTANCES, GPX_WAYPOINTS (globals)
//             map, haversine, TB_Events, TB_Pace (modules)
//             audioEnabled, playTacoBellBong, trackAchievement (tools.js globals)

const TB_Race = window.TB_Race = (() => {

  // ── Race Mode State ──
  let raceModeActive = false;
  let raceWatchId = null;
  let raceMarker = null;
  let raceBanner = null;

  // ── Countdown State ──
  let countdownInterval = null;

  // ── Split History State ──
  let splitHistory = [];

  // ── Race Mode ──

  function toggleRaceMode() {
    if (raceModeActive) stopRaceMode();
    else startRaceMode();
  }

  function startRaceMode() {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    const btn = document.getElementById('btn-race-mode');
    if (btn) {
      btn.textContent = '📍 Race Mode On';
      btn.classList.add('active');
    }

    raceModeActive = true;
    trackAchievement('tb50k_race_mode_used');

    const pulseIcon = L.divIcon({
      className: 'race-location-marker',
      html: '<div class="race-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    raceWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (raceMarker) {
          raceMarker.setLatLng([lat, lng]);
        } else {
          raceMarker = L.marker([lat, lng], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(map);
        }

        updateDistanceBanner(lat, lng);
      },
      (err) => {
        console.error('Geolocation error:', err);
        stopRaceMode();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopRaceMode() {
    raceModeActive = false;

    if (raceWatchId !== null) {
      navigator.geolocation.clearWatch(raceWatchId);
      raceWatchId = null;
    }

    if (raceMarker) {
      map.removeLayer(raceMarker);
      raceMarker = null;
    }

    const btn = document.getElementById('btn-race-mode');
    if (btn) {
      btn.textContent = '📍 Race Mode';
      btn.classList.remove('active');
    }

    hideDistanceBanner();
  }

  // ── Distance-to-Next-Stop Banner ──

  function updateDistanceBanner(lat, lng) {
    let nearest = null;
    let nearestDist = Infinity;

    GPX_WAYPOINTS.forEach((wpt, i) => {
      const d = haversine([lat, lng], [wpt.lat, wpt.lon]);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = { index: i, wpt, dist: d };
      }
    });

    if (!nearest) return;

    const distMiles = (nearestDist / 1609.34).toFixed(2);
    const stopLabel = nearest.index === 0 ? 'Start/Finish' : `Stop ${nearest.index}`;
    const stopName = TACO_BELL_STOPS[nearest.index]?.label.split(' - ')[1] || '';

    if (!raceBanner) {
      raceBanner = document.createElement('div');
      raceBanner.id = 'race-banner';
      raceBanner.className = 'race-banner';
      document.body.appendChild(raceBanner);
    }

    raceBanner.innerHTML = `
      <span class="race-banner-label">Next: ${stopLabel} — ${stopName}</span>
      <span class="race-banner-dist">${distMiles} mi away</span>
    `;
    raceBanner.classList.remove('hidden');

    if (nearestDist < 80) {
      recordSplit(nearest.index);
      if (typeof audioEnabled !== 'undefined' && audioEnabled) playTacoBellBong();
    }
  }

  function hideDistanceBanner() {
    if (raceBanner) raceBanner.classList.add('hidden');
  }

  // ── Race Day Countdown Clock ──

  function startCountdown() {
    const startH = document.getElementById('race-start-hours');
    const startM = document.getElementById('race-start-minutes');
    const resultsDiv = document.getElementById('countdown-results');
    if (!startH || !startM || !resultsDiv) return;

    const hours = parseInt(startH.value) || 7;
    const minutes = parseInt(startM.value) || 0;

    localStorage.setItem('tb50k_race_start_h', hours);
    localStorage.setItem('tb50k_race_start_m', minutes);

    TB_Events.emit('startTimeChanged', { hours, minutes });

    const raceDate = new Date(2026, 10, 27);
    const startTime = new Date(raceDate);
    startTime.setHours(hours, minutes, 0, 0);

    const cutoffMs = 11 * 60 * 60 * 1000;
    const cutoffTime = new Date(startTime.getTime() + cutoffMs);

    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
      const now = new Date();
      const elapsed = now - startTime;
      const remaining = cutoffTime - now;

      if (elapsed < 0) {
        const until = startTime - now;
        const dUntil = Math.floor(until / 86400000);
        const hUntil = Math.floor((until % 86400000) / 3600000);
        const mUntil = Math.floor((until % 3600000) / 60000);
        resultsDiv.innerHTML = `
          <div class="countdown-row"><span class="countdown-label">Race starts in</span><span class="countdown-value">${dUntil}d ${hUntil}h ${mUntil}m</span></div>
          <div class="countdown-row"><span class="countdown-label">Start Time</span><span class="countdown-value">${TB_Pace.formatClockTime(hours, minutes)}</span></div>
          <div class="countdown-row"><span class="countdown-label">Cutoff</span><span class="countdown-value">${TB_Pace.formatClockTime(cutoffTime.getHours(), cutoffTime.getMinutes())}</span></div>
        `;
        return;
      }

      if (remaining <= 0) {
        resultsDiv.innerHTML = '<div class="countdown-row finish-row"><span class="countdown-label">Time\'s up!</span><span class="countdown-value">11h cutoff reached</span></div>';
        clearInterval(countdownInterval);
        return;
      }

      const elapsedH = Math.floor(elapsed / 3600000);
      const elapsedM = Math.floor((elapsed % 3600000) / 60000);
      const elapsedS = Math.floor((elapsed % 60000) / 1000);
      const remainH = Math.floor(remaining / 3600000);
      const remainM = Math.floor((remaining % 3600000) / 60000);

      const elapsedMins = elapsed / 60000;
      const totalDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
      const paceGoalH = localStorage.getItem('tb50k_pace_hours');
      const paceGoalM = localStorage.getItem('tb50k_pace_minutes');
      let estMile = '';
      if (paceGoalH || paceGoalM) {
        const goalMins = (parseInt(paceGoalH) || 0) * 60 + (parseInt(paceGoalM) || 0);
        if (goalMins > 0) {
          const progressFrac = Math.min(elapsedMins / goalMins, 1);
          estMile = (progressFrac * totalDist).toFixed(1) + ' mi';
        }
      }

      resultsDiv.innerHTML = `
        <div class="countdown-row"><span class="countdown-label">Elapsed</span><span class="countdown-value">${elapsedH}h ${elapsedM}m ${elapsedS}s</span></div>
        <div class="countdown-row"><span class="countdown-label">Remaining</span><span class="countdown-value">${remainH}h ${remainM}m</span></div>
        ${estMile ? `<div class="countdown-row"><span class="countdown-label">Est. Position</span><span class="countdown-value">~${estMile}</span></div>` : ''}
        <div class="countdown-row"><span class="countdown-label">Cutoff</span><span class="countdown-value">${TB_Pace.formatClockTime(cutoffTime.getHours(), cutoffTime.getMinutes())}</span></div>
      `;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function restoreCountdownInputs() {
    const h = localStorage.getItem('tb50k_race_start_h');
    const m = localStorage.getItem('tb50k_race_start_m');
    const startH = document.getElementById('race-start-hours');
    const startM = document.getElementById('race-start-minutes');
    if (startH && h) startH.value = h;
    if (startM && m) startM.value = m;
  }

  // ── Split History ──

  function recordSplit(stopIndex) {
    const now = new Date();
    const existing = splitHistory.find(s => s.stopIndex === stopIndex);
    if (existing) return;

    splitHistory.push({
      stopIndex: stopIndex,
      time: now.toISOString(),
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dist: STOP_DISTANCES[stopIndex],
    });

    localStorage.setItem('tb50k_splits', JSON.stringify(splitHistory));
    renderSplitHistory();
  }

  function renderSplitHistory() {
    const container = document.getElementById('split-history-content');
    if (!container) return;

    updateRaceResultsVisibility();

    if (splitHistory.length === 0) {
      container.innerHTML = '<p class="hint">No splits recorded yet. Start Race Mode and approach a stop.</p>';
      return;
    }

    let html = '<div class="split-list">';
    splitHistory.sort((a, b) => a.stopIndex - b.stopIndex).forEach((split, i) => {
      const label = split.stopIndex === 0 ? 'Start' : `Stop ${split.stopIndex}`;
      const elapsed = i > 0 ? formatElapsed(splitHistory[0].time, split.time) : '0:00';
      html += `<div class="split-row">
        <span class="split-label">${label}</span>
        <span class="split-dist">${split.dist} mi</span>
        <span class="split-time">${split.timeStr}</span>
        <span class="split-elapsed">${elapsed}</span>
      </div>`;
    });
    html += '</div>';

    if (splitHistory.length > 1) {
      html += '<button class="tool-btn" style="margin-top:8px;font-size:0.72rem;" onclick="TB_Race.clearSplits()">Clear Splits</button>';
    }

    container.innerHTML = html;
  }

  function formatElapsed(startISO, endISO) {
    const diff = (new Date(endISO) - new Date(startISO)) / 60000;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function clearSplits() {
    splitHistory = [];
    localStorage.removeItem('tb50k_splits');
    renderSplitHistory();
  }

  function loadSplitHistory() {
    try {
      splitHistory = JSON.parse(localStorage.getItem('tb50k_splits') || '[]');
    } catch (e) { splitHistory = []; }
    renderSplitHistory();
  }

  // ── Race Results Visibility ──

  function updateRaceResultsVisibility() {
    const section = document.getElementById('section-race-results');
    if (!section) return;

    const hasSplits = splitHistory && splitHistory.length > 0;
    const hasRecords = typeof SEGMENT_RECORDS !== 'undefined' && SEGMENT_RECORDS.some(r => r.kom.name !== 'TBD' || r.qom.name !== 'TBD');
    const hasFinishers = typeof FINISHER_DATA !== 'undefined' && FINISHER_DATA.some(f => f.time !== 'Surveyed' && f.time !== 'Nov 27');

    section.style.display = (hasSplits || hasRecords || hasFinishers) ? '' : 'none';
  }

  // ── Public API ──
  return {
    get active() { return raceModeActive; },
    get splits() { return splitHistory; },
    get countdownInterval() { return countdownInterval; },
    recordSplit,
    toggleRaceMode,
    startCountdown,
    restoreCountdownInputs,
    loadSplitHistory,
    clearSplits,
    updateRaceResultsVisibility,
  };
})();

// Backward-compat globals
window.toggleRaceMode = TB_Race.toggleRaceMode;
window.startCountdown = TB_Race.startCountdown;
window.clearSplits = TB_Race.clearSplits;
window.recordSplit = TB_Race.recordSplit;

// Read-only state getters for tests
Object.defineProperties(window, {
  raceModeActive:    { get() { return TB_Race.active; } },
  splitHistory:      { get() { return TB_Race.splits; } },
  countdownInterval: { get() { return TB_Race.countdownInterval; } },
});
