// ── TB Tools — Bathrooms, weather, flythrough, exports, course sections,
//    spectators, heatmap, alt routes, audio, race card, finishers, leaderboard, offline ──
// Extracted from app.js. IIFE module, no build step.
// Depends on: TACO_BELL_STOPS, STOP_DISTANCES, COURSE_SECTIONS, GPX_TRACK, GPX_WAYPOINTS (globals)
//             map, routeLayer, tileLayer, escapeHtml, directionsBtn, isMobile, haversine,
//             getTheme, getThemeId, currentThemeId, getViewMode (app.js globals)
//             TB_Events, TB_Elevation, TB_Pins, TB_Stops (modules)

const TB_Tools = window.TB_Tools = (() => {

  // ── Audio ──
  let audioCtx = null;
  let audioEnabled = localStorage.getItem('tb50k_audio') !== 'false';

  function playTacoBellBong() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(261.63, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(784.0, audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(392.0, audioCtx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (e) { /* Audio not supported */ }
  }

  function playAchievementSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) { /* silent */ }
  }

  function toggleAudio() {
    audioEnabled = !audioEnabled;
    localStorage.setItem('tb50k_audio', audioEnabled);
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      btn.textContent = audioEnabled ? '🔔 Cheers On' : '🔕 Cheers Off';
      btn.classList.toggle('active', audioEnabled);
    }
  }

  // ── Achievement Tracking ──

  function trackAchievement(key) {
    const wasBefore = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, 'true');
    if (!wasBefore && audioEnabled) playAchievementSound();
    TB_Events.emit('achievementUnlocked', { key });
  }

  // ── Bathroom Finder (Overpass API) ──
  const BATHROOM_CACHE_KEY = 'tb50k_bathrooms';
  const BATHROOM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  let bathroomLayer = null;
  let bathroomToggleOn = false;

  function toggleBathrooms() {
    const btn = document.getElementById('btn-bathrooms');
    if (!btn) return;

    if (bathroomToggleOn) {
      if (bathroomLayer) map.removeLayer(bathroomLayer);
      bathroomToggleOn = false;
      btn.classList.remove('active');
      btn.textContent = '🚽 Find Restrooms';
      return;
    }

    bathroomToggleOn = true;
    btn.classList.add('active');
    btn.textContent = '🚽 Restrooms On';
    trackAchievement('tb50k_bathrooms_used');

    try {
      const cached = JSON.parse(localStorage.getItem(BATHROOM_CACHE_KEY));
      if (cached && Date.now() - cached.ts < BATHROOM_CACHE_TTL) {
        renderBathrooms(cached.data);
        return;
      }
    } catch (e) { /* cache miss */ }

    btn.textContent = '🚽 Loading...';

    const query = `[out:json];node["amenity"="toilets"](38.78,-77.18,38.95,-76.96);out center;`;
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then(r => r.json())
      .then(data => {
        const nodes = data.elements || [];
        localStorage.setItem(BATHROOM_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: nodes }));
        renderBathrooms(nodes);
        btn.textContent = '🚽 Restrooms On';
      })
      .catch(err => {
        console.error('Bathroom fetch failed:', err);
        btn.textContent = '🚽 Fetch Failed';
        bathroomToggleOn = false;
        btn.classList.remove('active');
        setTimeout(() => { btn.textContent = '🚽 Find Restrooms'; }, 2000);
      });
  }

  function renderBathrooms(nodes) {
    if (bathroomLayer) map.removeLayer(bathroomLayer);
    bathroomLayer = L.layerGroup();

    nodes.forEach(node => {
      const lat = node.lat;
      const lng = node.lon;
      if (!lat || !lng) return;

      const name = (node.tags && node.tags.name) || 'Public Restroom';
      const icon = L.divIcon({
        className: 'bathroom-marker',
        html: '🚽',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`<div class="popup-content">
        <h3>🚽 ${name}</h3>
        ${directionsBtn(lat, lng, name)}
      </div>`);
      bathroomLayer.addLayer(marker);
    });

    bathroomLayer.addTo(map);
  }

  // ── Export Route to Google Maps ──

  function exportToGoogleMaps() {
    const stops = GPX_WAYPOINTS;
    if (!stops || stops.length < 2) return;

    const origin = `${stops[0].lat},${stops[0].lon}`;
    const destination = origin;
    const waypoints = stops.slice(1).map(s => `${s.lat},${s.lon}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=walking`;
    window.open(url, '_blank');
  }

  // ── Add to Calendar (.ics) ──

  function downloadICS() {
    trackAchievement('tb50k_calendar_added');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TB DC 50K//Route Planner//EN',
      'BEGIN:VEVENT',
      'DTSTART:20261127T120000Z',
      'DTEND:20261127T230000Z',
      'SUMMARY:Taco Bell DC 50K',
      'DESCRIPTION:32.4-mile ultramarathon through 8 Taco Bell locations in DC/Arlington/Alexandria. 11-hour time limit. Must eat Chalupa Supreme or Crunchwrap by Stop 3 and Burrito Supreme or Nachos Bell Grande by Stop 7.',
      'LOCATION:417 King St\\, Alexandria\\, VA 22314',
      'URL:https://tacobelldc50k.com/',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taco-bell-dc-50k.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Course Preview Flythrough ──
  let flythroughActive = false;
  let flythroughInterval = null;

  function startFlythrough() {
    if (flythroughActive) {
      stopFlythrough();
      return;
    }

    const btn = document.getElementById('btn-flythrough');
    if (btn) {
      btn.textContent = '⏹ Stop Preview';
      btn.classList.add('active');
    }

    flythroughActive = true;
    trackAchievement('tb50k_flythrough_used');
    const track = GPX_TRACK;
    const totalPoints = track.length;
    const step = Math.max(1, Math.floor(totalPoints / 200));
    let idx = 0;

    map.setZoom(15);

    flythroughInterval = setInterval(() => {
      if (idx >= totalPoints) {
        stopFlythrough();
        return;
      }
      map.panTo(track[idx], { animate: true, duration: 0.15 });
      idx += step;
    }, 180);
  }

  function stopFlythrough() {
    flythroughActive = false;
    if (flythroughInterval) {
      clearInterval(flythroughInterval);
      flythroughInterval = null;
    }
    const btn = document.getElementById('btn-flythrough');
    if (btn) {
      btn.textContent = '🎬 Preview Route';
      btn.classList.remove('active');
    }
  }

  // ── Weather Overlay (NWS API) ──
  const WEATHER_CACHE_KEY = 'tb50k_weather';
  const WEATHER_CACHE_TTL = 3 * 60 * 60 * 1000;

  function loadWeather() {
    const container = document.getElementById('weather-content');
    if (!container) return;

    try {
      const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
      if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL) {
        renderWeather(cached.data);
        return;
      }
    } catch (e) { /* cache miss */ }

    container.innerHTML = '<p class="hint">Loading forecast...</p>';

    fetch('https://api.weather.gov/points/38.8047,-77.0442', {
      headers: { 'User-Agent': 'TacoBellDC50K-RoutePlanner' },
    })
      .then(r => r.json())
      .then(pointData => {
        const forecastUrl = pointData.properties?.forecast;
        if (!forecastUrl) throw new Error('No forecast URL');
        return fetch(forecastUrl, {
          headers: { 'User-Agent': 'TacoBellDC50K-RoutePlanner' },
        });
      })
      .then(r => r.json())
      .then(forecastData => {
        const periods = forecastData.properties?.periods || [];
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: periods }));
        renderWeather(periods);
      })
      .catch(err => {
        console.error('Weather fetch failed:', err);
        container.innerHTML = '<p class="hint">Forecast unavailable. Check back later.</p>';
      });
  }

  function renderWeather(periods) {
    const container = document.getElementById('weather-content');
    if (!container || !periods.length) {
      if (container) container.innerHTML = '<p class="hint">No forecast data available.</p>';
      return;
    }

    let html = '';
    periods.slice(0, 4).forEach(p => {
      html += `<div class="weather-period">
        <div class="weather-period-name">${p.name || 'N/A'}</div>
        <div class="weather-period-temp">${p.temperature || '?'}°${p.temperatureUnit || 'F'}</div>
        <div class="weather-period-desc">${p.shortForecast || 'N/A'}</div>
        ${p.probabilityOfPrecipitation?.value ? `<div class="weather-period-precip">💧 ${p.probabilityOfPrecipitation.value}%</div>` : ''}
      </div>`;
    });
    container.innerHTML = html;
  }

  // ── Sauce Packet Wisdom Copy ──
  const SAUCE_COPY = {
    'pace-hint': 'Will you marry me?',
    'food-hint': "I knew you were the one when you picked Fire.",
    'tools-hint': "I'm not like other hot sauces.",
    'pins-hint': "At this point, you might as well just move in.",
    'route-hint': "This is the longest relationship I've ever had.",
    'countdown-hint': "If you never do, you'll never know.",
    'weather-hint': "Is it hot in here, or is it just me?",
    'segments-hint': "Together, we could do great things. Or at least finish.",
    'elevation-hint': "What goes up must come down. Except your heart rate.",
    'splits-hint': "I knew you'd come back for me.",
    'finisher-hint': "Nice to finally meet you.",
    'calorie-hint': "You can't outrun a bad diet. But you can out-taco it.",
    'leaderboard-hint': "I've been waiting for someone like you.",
    'block-party-hint': "Let's just enjoy this moment together.",
    'sections-guide-hint': "You had me at 'mile one.'",
  };

  function applySaucePacketCopy() {
    const theme = getThemeId();
    document.querySelectorAll('[data-sauce-id]').forEach(el => {
      if (theme === 'sauce') {
        el.textContent = SAUCE_COPY[el.dataset.sauceId] || el.dataset.defaultHint || el.textContent;
      } else {
        el.textContent = el.dataset.defaultHint || el.textContent;
      }
    });
  }

  // ── Named Course Sections ──
  let courseSectionLayers = [];
  let courseSectionsVisible = false;

  function toggleCourseSections() {
    const btn = document.getElementById('btn-course-sections');
    if (!btn) return;

    if (courseSectionsVisible) {
      courseSectionLayers.forEach(l => map.removeLayer(l));
      courseSectionLayers = [];
      courseSectionsVisible = false;
      btn.classList.remove('active');
      btn.textContent = '🗺 Course Sections';
      return;
    }

    courseSectionsVisible = true;
    btn.classList.add('active');
    btn.textContent = '🗺 Sections On';

    const totalDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
    const totalPoints = GPX_TRACK.length;

    COURSE_SECTIONS.forEach(section => {
      const startIdx = Math.round((section.miStart / totalDist) * totalPoints);
      const endIdx = Math.min(Math.round((section.miEnd / totalDist) * totalPoints), totalPoints - 1);
      const segCoords = GPX_TRACK.slice(startIdx, endIdx + 1);

      if (segCoords.length < 2) return;

      const polyline = L.polyline(segCoords, {
        color: section.color,
        weight: 7,
        opacity: 0.8,
      }).addTo(map);

      polyline.bindPopup(`<div class="popup-content">
        <h3>${section.name}</h3>
        <p><strong>Miles ${section.miStart}–${section.miEnd}</strong> (${(section.miEnd - section.miStart).toFixed(1)} mi)</p>
        <p>${section.note}</p>
      </div>`);

      courseSectionLayers.push(polyline);
    });
  }

  // ── Strava Segment Deep-Links ──
  const STRAVA_SEGMENTS = {
    'Old Town Stroll': null,
    'The Van Dorn Shuffle': null,
    'Arlington Long Haul': null,
    'The Georgetown Climb': null,
    'DC Entry Push': null,
    'The Capitol Grind': null,
    'The Final Push': null,
  };

  function buildCourseSectionsList() {
    const container = document.getElementById('course-sections-list');
    if (!container) return;

    let html = '';
    COURSE_SECTIONS.forEach(section => {
      const segId = STRAVA_SEGMENTS[section.name];
      const stravaLink = segId ? ` <a href="https://www.strava.com/segments/${segId}" target="_blank" rel="noopener" class="strava-link" title="View on Strava" onclick="event.stopPropagation()">🏃‍♂️</a>` : '';
      html += `<div class="course-section-item section-row course-section-row" data-section-name="${section.name}" data-mi-start="${section.miStart}" data-mi-end="${section.miEnd}">
        <div class="course-section-header">
          <span class="section-color-dot" style="background: ${section.color}"></span>
          <span class="section-row-name">${section.name}</span>
          <span class="segment-dist">${section.miStart}–${section.miEnd} mi</span>${stravaLink}
        </div>
      </div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.course-section-row').forEach(row => {
      row.addEventListener('click', () => {
        const miStart = parseFloat(row.dataset.miStart);
        const miEnd = parseFloat(row.dataset.miEnd);
        const midMile = (miStart + miEnd) / 2;
        const totalDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
        const midIdx = Math.round((midMile / totalDist) * GPX_TRACK.length);
        const pt = GPX_TRACK[Math.min(midIdx, GPX_TRACK.length - 1)];
        map.flyTo(pt, 14, { duration: 1.2 });
      });
    });
  }

  // ── GPX Export ──

  function exportGPX() {
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TacoBellDC50K-RoutePlanner" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Taco Bell DC 50K Route</name>
    <desc>32.4-mile ultramarathon through 8 Taco Bell locations in DC/Arlington/Alexandria</desc>
  </metadata>
`;

    GPX_WAYPOINTS.forEach((wpt, i) => {
      const stop = TACO_BELL_STOPS[i];
      gpx += `  <wpt lat="${wpt.lat}" lon="${wpt.lon}">
    <name>${stop ? stop.label : wpt.name}</name>
  </wpt>\n`;
    });

    TB_Pins.pins.forEach(pin => {
      gpx += `  <wpt lat="${pin.lat}" lon="${pin.lng}">
    <name>${pin.name}</name>
    <sym>${pin.iconType}</sym>
  </wpt>\n`;
    });

    gpx += '  <trk>\n    <name>TB DC 50K Route</name>\n    <trkseg>\n';
    GPX_TRACK.forEach(pt => {
      gpx += `      <trkpt lat="${pt[0]}" lon="${pt[1]}"></trkpt>\n`;
    });
    gpx += '    </trkseg>\n  </trk>\n</gpx>';

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taco-bell-dc-50k.gpx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Spectator Spots Layer ──
  let spectatorLayer = null;
  let spectatorToggleOn = false;

  function toggleSpectatorSpots() {
    const btn = document.getElementById('btn-spectators');
    if (!btn) return;

    if (spectatorToggleOn) {
      if (spectatorLayer) map.removeLayer(spectatorLayer);
      spectatorToggleOn = false;
      btn.classList.remove('active');
      btn.textContent = '👀 Spectator Spots';
      return;
    }

    spectatorToggleOn = true;
    btn.classList.add('active');
    btn.textContent = '👀 Spots On';

    spectatorLayer = L.layerGroup();
    SPECTATOR_SPOTS.forEach(spot => {
      const icon = L.divIcon({
        className: 'spectator-marker',
        html: '👀',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon });
      marker.bindPopup(() => {
        const isCrew = getViewMode() === 'crew';
        let html = `<div class="popup-content">
          <h3>👀 ${spot.name}</h3>
          <p><strong>Mile ${spot.mile}</strong></p>
          <p>${spot.note}</p>`;
        if (isCrew) {
          html += `<p><em>🅿️ ${spot.parking}</em></p>`;
        }
        html += `${directionsBtn(spot.lat, spot.lng, spot.name)}
        </div>`;
        return html;
      });
      spectatorLayer.addLayer(marker);
    });

    spectatorLayer.addTo(map);
  }

  // ── Taco Bell Passport ──

  function buildPassport() {
    const container = document.getElementById('passport-content');
    if (!container) return;

    let earned = 0;
    let html = '<div class="passport-grid">';
    ACHIEVEMENTS.forEach(a => {
      const unlocked = a.check();
      if (unlocked) earned++;
      html += `<div class="passport-badge ${unlocked ? 'unlocked' : 'locked'}" title="${a.desc}">
        <span class="passport-emoji">${a.emoji}</span>
        <span class="passport-name">${a.name}</span>
      </div>`;
    });
    html += '</div>';
    html += `<p class="passport-score">${earned}/${ACHIEVEMENTS.length} badges earned</p>`;
    container.innerHTML = html;
  }

  // ── Runner / Crew View Toggle ──
  const RUNNER_AMENITIES = ['water', 'snacks', 'music', 'ice', 'portapotty', 'medical'];

  function initViewToggle() {
    const toggle = document.getElementById('view-toggle');
    if (!toggle) return;

    const saved = localStorage.getItem('tb50k_view_mode') || 'runner';
    window.TB_VIEW_MODE = saved;
    toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === saved);
    });

    toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.view;
        window.TB_VIEW_MODE = mode;
        localStorage.setItem('tb50k_view_mode', mode);
        toggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        TB_Events.emit('viewModeChanged', { mode });
      });
    });

    if (typeof TB_AUTH !== 'undefined') {
      TB_AUTH.onAuthChange(({ profile }) => {
        if (profile && !localStorage.getItem('tb50k_view_mode')) {
          const autoMode = profile.role === 'cheerer' ? 'crew' : 'runner';
          window.TB_VIEW_MODE = autoMode;
          toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === autoMode);
          });
        }
      });
    }
  }

  // ── Block Parties ──
  const BLOCK_PARTY_CACHE_KEY = 'tb50k_block_parties';
  const BLOCK_PARTY_CACHE_TTL = 60 * 60 * 1000;
  let blockPartyLayer = null;
  let blockPartyToggleOn = false;
  let blockParties = [];

  const AMENITY_EMOJI = {
    beer: '🍺', shots: '🥃', snacks: '🌮', water: '💧', music: '🎵',
    chairs: '🪑', ice: '🧊', portapotty: '🚽', tattoos: '🎨',
    dogs: '🐶', medical: '🏥', family: '👨‍👩‍👧',
  };

  function loadBlockParties() {
    try {
      const cached = JSON.parse(localStorage.getItem(BLOCK_PARTY_CACHE_KEY));
      if (cached && Date.now() - cached.ts < BLOCK_PARTY_CACHE_TTL) {
        blockParties = cached.data;
        renderBlockPartySidebar();
        return;
      }
    } catch (e) { /* cache miss */ }

    fetch('block_parties.json')
      .then(r => r.json())
      .then(data => {
        blockParties = data.filter(p => p.confirmed);
        localStorage.setItem(BLOCK_PARTY_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: blockParties }));
        renderBlockPartySidebar();
      })
      .catch(err => {
        console.warn('Block parties fetch failed:', err);
        const container = document.getElementById('block-parties-list');
        if (container) container.innerHTML = '<p class="hint">No party data available.</p>';
      });
  }

  function renderBlockPartySidebar() {
    const container = document.getElementById('block-parties-list');
    if (!container) return;

    if (blockParties.length === 0) {
      container.innerHTML = '<p class="hint">No confirmed parties yet.</p>';
      return;
    }

    let html = '';
    blockParties.sort((a, b) => a.mile_marker - b.mile_marker).forEach(party => {
      const amenityBadges = (party.amenities || []).map(a => AMENITY_EMOJI[a] || '').join(' ');
      html += `<div class="block-party-item" data-id="${party.id}" data-lat="${party.lat}" data-lng="${party.lng}">
        <div class="block-party-header">
          <span class="block-party-name">🎉 ${party.name}</span>
          <span class="segment-dist">mi ${party.mile_marker}</span>
        </div>
        <div class="block-party-host">Hosted by ${party.host}</div>
        <div class="block-party-amenities">${amenityBadges}</div>
      </div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.block-party-item').forEach(item => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        map.flyTo([lat, lng], 16, { duration: 1.2 });
        if (blockPartyLayer) {
          blockPartyLayer.eachLayer(l => {
            if (l.getLatLng && Math.abs(l.getLatLng().lat - lat) < 0.001) l.openPopup();
          });
        }
      });
    });
  }

  function toggleBlockParties() {
    const btn = document.getElementById('btn-block-parties');
    if (!btn) return;

    if (blockPartyToggleOn) {
      if (blockPartyLayer) map.removeLayer(blockPartyLayer);
      blockPartyToggleOn = false;
      btn.classList.remove('active');
      btn.textContent = '🎉 Show on Map';
      return;
    }

    blockPartyToggleOn = true;
    btn.classList.add('active');
    btn.textContent = '🎉 Parties On';

    blockPartyLayer = L.layerGroup();
    blockParties.forEach(party => {
      const icon = L.divIcon({
        className: 'block-party-marker',
        html: '🎉',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([party.lat, party.lng], { icon });
      marker.bindPopup(() => buildBlockPartyPopup(party));
      blockPartyLayer.addLayer(marker);
    });

    blockPartyLayer.addTo(map);
  }

  function buildBlockPartyPopup(party) {
    const isCrew = getViewMode() === 'crew';
    const amenities = party.amenities || [];
    const filteredAmenities = isCrew ? amenities : amenities.filter(a => RUNNER_AMENITIES.includes(a));
    const amenityBadges = filteredAmenities.map(a => AMENITY_EMOJI[a] || '').join(' ');

    let html = `<div class="popup-content">
      <h3>🎉 ${party.name}</h3>
      <p><strong>Mile ${party.mile_marker}</strong> — Hosted by ${party.host}</p>`;
    if (party.runner_note) html += `<p>${party.runner_note}</p>`;
    if (isCrew && party.crew_note) html += `<p><em>🧑‍🤝‍🧑 ${party.crew_note}</em></p>`;
    if (amenityBadges) html += `<p>${amenityBadges}</p>`;
    html += `${directionsBtn(party.lat, party.lng, party.name)}
    </div>`;
    return html;
  }

  // ── Shareable Race Card ──

  function showRaceCard() {
    const existing = document.getElementById('race-card-overlay');
    if (existing) { existing.remove(); return; }

    const paceH = localStorage.getItem('tb50k_pace_hours') || '';
    const paceM = localStorage.getItem('tb50k_pace_minutes') || '';
    const goalTime = (paceH || paceM) ? `${paceH || 0}h ${paceM || 0}m` : 'Not set';
    const themeName = getTheme(currentThemeId).name;

    const overlay = document.createElement('div');
    overlay.id = 'race-card-overlay';
    overlay.className = 'race-card-overlay';
    overlay.innerHTML = `
      <div class="race-card">
        <div class="race-card-header">
          <span class="race-card-emoji">🌮</span>
          <h2>Taco Bell DC 50K</h2>
          <span class="race-card-emoji">🌮</span>
        </div>
        <div class="race-card-date">November 27, 2026</div>
        <div class="race-card-route">
          <div class="race-card-stat">
            <span class="race-card-stat-value">32.4</span>
            <span class="race-card-stat-label">Miles</span>
          </div>
          <div class="race-card-stat">
            <span class="race-card-stat-value">8</span>
            <span class="race-card-stat-label">TB Stops</span>
          </div>
          <div class="race-card-stat">
            <span class="race-card-stat-value">${TB_Elevation.data ? Math.round(Math.max(...TB_Elevation.data.elevations)) + ' ft' : '~400 ft'}</span>
            <span class="race-card-stat-label">Max Elev</span>
          </div>
        </div>
        <div class="race-card-goal">
          <span class="race-card-goal-label">Goal Time</span>
          <span class="race-card-goal-value">${goalTime}</span>
        </div>
        <div class="race-card-stops">
          ${TACO_BELL_STOPS.map((s, i) => `<span class="race-card-stop">${i === 0 ? 'S' : s.num}</span>`).join('')}
        </div>
        <div class="race-card-footer">
          <span>Alexandria → Arlington → DC → Alexandria</span>
          <span class="race-card-theme">Theme: ${themeName}</span>
        </div>
        <div class="race-card-tagline">Run 32 miles. Eat 8 Taco Bells. No regrets.</div>
        <p class="race-card-hint">Screenshot this card to share! Tap to close.</p>
      </div>
    `;

    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  }

  // ── Finisher Wall ──
  const FINISHER_DATA = [
    { name: 'The Route Itself', year: 2025, time: 'Surveyed', note: 'Test run — the 8 Taco Bell route was mapped and verified by the organizing crew.' },
    { name: 'Race Day 2026', year: 2026, time: 'Nov 27', note: 'Inaugural event! Be one of the first finishers.' },
  ];

  function buildFinisherWall() {
    const container = document.getElementById('finisher-content');
    if (!container) return;

    if (FINISHER_DATA.length === 0) {
      container.innerHTML = '<p class="hint">No finishers yet — be the first!</p>';
      return;
    }

    let html = '<div class="finisher-list">';
    FINISHER_DATA.forEach((f, i) => {
      html += `<div class="finisher-row">
        <span class="finisher-rank">${i + 1}</span>
        <span class="finisher-name">${f.name}</span>
        <span class="finisher-time">${f.time}</span>
        <span class="finisher-note">${f.note}</span>
      </div>`;
    });
    html += '</div>';
    html += '<p class="hint" style="margin-top:8px;">Results will be posted after the Nov 27, 2026 race.</p>';
    container.innerHTML = html;
  }

  // ── KOM/QOM Segment Records ──
  const SEGMENT_RECORDS = [
    { section: 'Old Town Stroll', distance: 3.0, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'The Van Dorn Shuffle', distance: 2.1, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'Arlington Long Haul', distance: 7.6, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'The Georgetown Climb', distance: 2.8, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'DC Entry Push', distance: 4.5, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'The Capitol Grind', distance: 3.5, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
    { section: 'The Final Push', distance: 8.9, kom: { name: 'TBD', time: '--:--' }, qom: { name: 'TBD', time: '--:--' } },
  ];

  function buildSegmentLeaderboard() {
    const container = document.getElementById('leaderboard-content');
    if (!container) return;

    let html = '<div class="leaderboard-list">';
    SEGMENT_RECORDS.forEach(rec => {
      html += `<div class="leaderboard-row">
        <div class="leaderboard-section">${rec.section} <span class="segment-dist">${rec.distance} mi</span></div>
        <div class="leaderboard-records">
          <span class="leaderboard-record" title="King of the Mountain">👑 KOM: ${rec.kom.name} ${rec.kom.time}</span>
          <span class="leaderboard-record" title="Queen of the Mountain">👸 QOM: ${rec.qom.name} ${rec.qom.time}</span>
        </div>
      </div>`;
    });
    html += '</div>';
    html += '<p class="hint" style="margin-top:8px;">Records will be populated after the Nov 27, 2026 race.</p>';
    container.innerHTML = html;
  }

  // ── Offline Tile Caching ──

  function lat2tile(lat, zoom) { return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)); }
  function lon2tile(lon, zoom) { return Math.floor((lon + 180) / 360 * Math.pow(2, zoom)); }

  function cacheOfflineTiles() {
    const btn = document.getElementById('btn-offline-tiles');
    if (!btn) return;

    const bounds = routeLayer.getBounds().pad(0.1);
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const subdomains = ['a', 'b', 'c', 'd'];
    const urls = [];

    for (let z = 13; z <= 16; z++) {
      const xMin = lon2tile(minLng, z);
      const xMax = lon2tile(maxLng, z);
      const yMin = lat2tile(maxLat, z);
      const yMax = lat2tile(minLat, z);

      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          const s = subdomains[(x + y) % subdomains.length];
          urls.push(tileUrl.replace('{s}', s).replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{r}', ''));
        }
      }
    }

    const total = urls.length;
    btn.textContent = `Caching 0/${total}...`;
    btn.disabled = true;

    let done = 0;
    const batchSize = 10;
    let idx = 0;

    function fetchBatch() {
      if (idx >= urls.length) {
        btn.textContent = `✅ Cached ${done} tiles`;
        btn.disabled = false;
        setTimeout(() => { btn.textContent = '📥 Cache for Offline'; }, 3000);
        localStorage.setItem('tb50k_tiles_cached', 'true');
        return;
      }

      const batch = urls.slice(idx, idx + batchSize);
      idx += batchSize;

      Promise.allSettled(batch.map(url => {
        return caches.open('tb50k-v5').then(cache => {
          return cache.match(url).then(existing => {
            if (existing) { done++; return; }
            return fetch(url).then(resp => {
              if (resp.ok) { cache.put(url, resp); }
              done++;
            });
          });
        }).catch(() => { done++; });
      })).then(() => {
        btn.textContent = `Caching ${done}/${total}...`;
        requestAnimationFrame(fetchBatch);
      });
    }

    fetchBatch();
  }

  // ── Alternative Routes ──
  const ALT_ROUTES = [
    {
      id: 'alt-arlington-scenic', name: 'W&OD Trail Scenic', leg: 'Stop 1 → Stop 2', legIndex: 1,
      description: 'Follow the W&OD Trail through Falls Church. Paved bike path, flat, tree-lined. Slightly longer but no traffic.',
      distanceMi: 8.2, mainDistanceMi: 7.6, color: '#22d3ee',
      coords: [[38.8111,-77.1324],[38.8145,-77.1280],[38.8200,-77.1200],[38.8280,-77.1150],[38.8350,-77.1180],[38.8420,-77.1220],[38.8500,-77.1250],[38.8560,-77.1280],[38.8630,-77.1310],[38.8700,-77.1340],[38.8760,-77.1350],[38.8830,-77.1340],[38.8890,-77.1310],[38.8930,-77.1290],[38.8967,-77.1288]],
    },
    {
      id: 'alt-georgetown-river', name: 'Potomac River Path', leg: 'Stop 2 → Stop 3', legIndex: 2,
      description: 'Drop south to the Potomac Heritage Trail along the river. Flatter than the Georgetown Climb but adds distance. Scenic waterfront views.',
      distanceMi: 3.4, mainDistanceMi: 2.8, color: '#34d399',
      coords: [[38.8967,-77.1288],[38.8950,-77.1200],[38.8920,-77.1120],[38.8880,-77.1050],[38.8870,-77.0980],[38.8860,-77.0920],[38.8870,-77.0880],[38.8900,-77.0850],[38.8921,-77.0836]],
    },
    {
      id: 'alt-capitol-mall', name: 'National Mall Route', leg: 'Stop 5 → Stop 7', legIndex: 5,
      description: 'South to the National Mall, past the Capitol, then to Union Station. More iconic but exposed — no shade, more tourists.',
      distanceMi: 4.1, mainDistanceMi: 3.5, color: '#fbbf24',
      coords: [[38.9169,-77.0325],[38.9120,-77.0300],[38.9070,-77.0280],[38.9020,-77.0250],[38.8970,-77.0230],[38.8920,-77.0200],[38.8890,-77.0170],[38.8880,-77.0130],[38.8900,-77.0100],[38.8930,-77.0080],[38.8960,-77.0065],[38.8982,-77.0062]],
    },
  ];

  let altRouteLayers = [];
  let altRoutesVisible = false;

  function toggleAltRoutes() {
    const btn = document.getElementById('btn-alt-routes');
    if (!btn) return;

    if (altRoutesVisible) {
      altRouteLayers.forEach(l => map.removeLayer(l));
      altRouteLayers = [];
      altRoutesVisible = false;
      btn.classList.remove('active');
      btn.textContent = '🔀 Alt Routes';
      renderAltRoutesSidebar(false);
      return;
    }

    altRoutesVisible = true;
    btn.classList.add('active');
    btn.textContent = '🔀 Routes On';

    ALT_ROUTES.forEach(alt => {
      const polyline = L.polyline(alt.coords, {
        color: alt.color,
        weight: 4,
        opacity: 0.8,
        dashArray: '8 6',
      }).addTo(map);

      const delta = alt.distanceMi - alt.mainDistanceMi;
      const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

      polyline.bindPopup(`<div class="popup-content">
        <h3>🔀 ${escapeHtml(alt.name)}</h3>
        <p><strong>${alt.leg}</strong></p>
        <p>${alt.description}</p>
        <p><strong>${alt.distanceMi} mi</strong> (${deltaStr} mi vs main route)</p>
      </div>`);

      altRouteLayers.push(polyline);
    });

    renderAltRoutesSidebar(true);
  }

  function renderAltRoutesSidebar(show) {
    const container = document.getElementById('alt-routes-list');
    if (!container) return;

    if (!show) {
      container.innerHTML = '<p class="hint">Toggle alt routes to see options.</p>';
      return;
    }

    let html = '';
    ALT_ROUTES.forEach(alt => {
      const delta = alt.distanceMi - alt.mainDistanceMi;
      const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
      html += `<div class="alt-route-item section-row" data-alt-id="${alt.id}">
        <div class="alt-route-header">
          <span class="section-color-dot" style="background: ${alt.color}"></span>
          <span class="section-row-name">${escapeHtml(alt.name)}</span>
          <span class="segment-dist">${alt.distanceMi} mi (${deltaStr})</span>
        </div>
        <div class="alt-route-desc">${alt.leg} &mdash; ${alt.description}</div>
      </div>`;
    });
    container.innerHTML = html;

    container.querySelectorAll('.alt-route-item').forEach(row => {
      row.addEventListener('click', () => {
        const altId = row.dataset.altId;
        const alt = ALT_ROUTES.find(a => a.id === altId);
        if (!alt) return;
        const midIdx = Math.floor(alt.coords.length / 2);
        map.flyTo(alt.coords[midIdx], 13, { duration: 1.2 });
      });
    });
  }

  // ── Community Training Heatmap ──
  let heatmapLayer = null;
  let heatmapVisible = false;

  function toggleHeatmap() {
    const btn = document.getElementById('btn-heatmap');
    if (!btn) return;

    if (heatmapVisible) {
      if (heatmapLayer) map.removeLayer(heatmapLayer);
      heatmapLayer = null;
      heatmapVisible = false;
      btn.classList.remove('active');
      btn.textContent = '🔥 Training Heatmap';
      return;
    }

    heatmapVisible = true;
    btn.classList.add('active');
    btn.textContent = '🔥 Heatmap On';

    heatmapLayer = L.layerGroup();

    const sampleRate = Math.max(1, Math.floor(GPX_TRACK.length / 200));
    const points = [];
    for (let i = 0; i < GPX_TRACK.length; i += sampleRate) {
      points.push(GPX_TRACK[i]);
    }

    const weightedPoints = points.map(pt => {
      let weight = 0.3;
      GPX_WAYPOINTS.forEach(wpt => {
        const dMi = haversine(pt, [wpt.lat, wpt.lon]) / 1609.34;
        if (dMi < 1.0) weight += 0.4 * (1 - dMi / 1.0);
        if (dMi < 0.3) weight += 0.3;
      });
      const dStartMi = haversine(pt, [GPX_WAYPOINTS[0].lat, GPX_WAYPOINTS[0].lon]) / 1609.34;
      if (dStartMi < 2.0) weight += 0.3 * (1 - dStartMi / 2.0);
      if (pt[0] > 38.86 && pt[0] < 38.91 && pt[1] > -77.14 && pt[1] < -77.08) weight += 0.2;
      return { lat: pt[0], lng: pt[1], weight: Math.min(1.0, weight) };
    });

    weightedPoints.forEach(wp => {
      const radius = 120 + wp.weight * 180;
      const opacity = 0.15 + wp.weight * 0.25;
      let color;
      if (wp.weight < 0.4) color = '#3b82f6';
      else if (wp.weight < 0.6) color = '#eab308';
      else if (wp.weight < 0.8) color = '#f97316';
      else color = '#ef4444';

      heatmapLayer.addLayer(L.circle([wp.lat, wp.lng], {
        radius, color: 'transparent', fillColor: color, fillOpacity: opacity, interactive: false,
      }));
    });

    heatmapLayer.addTo(map);
  }

  // ── Public API ──
  return {
    get audioEnabled() { return audioEnabled; },
    FINISHER_DATA,
    SEGMENT_RECORDS,
    STRAVA_SEGMENTS,
    ALT_ROUTES,
    SAUCE_COPY,
    AMENITY_EMOJI,
    RUNNER_AMENITIES,
    playTacoBellBong,
    playAchievementSound,
    toggleAudio,
    trackAchievement,
    toggleBathrooms,
    exportToGoogleMaps,
    downloadICS,
    startFlythrough,
    loadWeather,
    applySaucePacketCopy,
    toggleCourseSections,
    buildCourseSectionsList,
    exportGPX,
    toggleSpectatorSpots,
    buildPassport,
    initViewToggle,
    loadBlockParties,
    toggleBlockParties,
    showRaceCard,
    buildFinisherWall,
    buildSegmentLeaderboard,
    cacheOfflineTiles,
    toggleAltRoutes,
    renderAltRoutesSidebar,
    toggleHeatmap,
    get blockPartyToggleOn() { return blockPartyToggleOn; },
    get spectatorToggleOn() { return spectatorToggleOn; },
    get bathroomToggleOn() { return bathroomToggleOn; },
    get flythroughActive() { return flythroughActive; },
    get courseSectionsVisible() { return courseSectionsVisible; },
    get altRoutesVisible() { return altRoutesVisible; },
    get altRouteLayers() { return altRouteLayers; },
    get heatmapVisible() { return heatmapVisible; },
    get heatmapLayer() { return heatmapLayer; },
  };
})();

// Backward-compat globals for inline onclick handlers
window.toggleBathrooms = TB_Tools.toggleBathrooms;
window.exportToGoogleMaps = TB_Tools.exportToGoogleMaps;
window.downloadICS = TB_Tools.downloadICS;
window.startFlythrough = TB_Tools.startFlythrough;
window.toggleCourseSections = TB_Tools.toggleCourseSections;
window.exportGPX = TB_Tools.exportGPX;
window.toggleSpectatorSpots = TB_Tools.toggleSpectatorSpots;
window.toggleBlockParties = TB_Tools.toggleBlockParties;
window.showRaceCard = TB_Tools.showRaceCard;
window.cacheOfflineTiles = TB_Tools.cacheOfflineTiles;
window.toggleAltRoutes = TB_Tools.toggleAltRoutes;
window.toggleAudio = TB_Tools.toggleAudio;
window.toggleHeatmap = TB_Tools.toggleHeatmap;

// Expose audio globals for cross-module access (race.js, pace.js check these)
window.audioEnabled = TB_Tools.audioEnabled;
window.playTacoBellBong = TB_Tools.playTacoBellBong;
window.playAchievementSound = TB_Tools.playAchievementSound;
window.trackAchievement = TB_Tools.trackAchievement;

// Expose data globals for race.js cross-reference and tests
window.FINISHER_DATA = TB_Tools.FINISHER_DATA;
window.SEGMENT_RECORDS = TB_Tools.SEGMENT_RECORDS;
window.STRAVA_SEGMENTS = TB_Tools.STRAVA_SEGMENTS;
window.ALT_ROUTES = TB_Tools.ALT_ROUTES;
window.SAUCE_COPY = TB_Tools.SAUCE_COPY;
window.AMENITY_EMOJI = TB_Tools.AMENITY_EMOJI;
window.RUNNER_AMENITIES = TB_Tools.RUNNER_AMENITIES;

// Read-only state getters — tests and devtools can read, but not mutate
Object.defineProperties(window, {
  bathroomToggleOn:      { get() { return TB_Tools.bathroomToggleOn; } },
  flythroughActive:      { get() { return TB_Tools.flythroughActive; } },
  courseSectionsVisible: { get() { return TB_Tools.courseSectionsVisible; } },
  spectatorToggleOn:     { get() { return TB_Tools.spectatorToggleOn; } },
  blockPartyToggleOn:    { get() { return TB_Tools.blockPartyToggleOn; } },
  altRoutesVisible:      { get() { return TB_Tools.altRoutesVisible; } },
  altRouteLayers:        { get() { return TB_Tools.altRouteLayers; } },
  heatmapVisible:        { get() { return TB_Tools.heatmapVisible; } },
  heatmapLayer:          { get() { return TB_Tools.heatmapLayer; } },
  audioEnabled:          { get() { return TB_Tools.audioEnabled; } },
});
