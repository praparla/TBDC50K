// ── Taco Bell DC 50K Route Planner ──

// ── Theme Configuration (modular — add new themes here) ──
const THEMES = {
  modern: {
    id: 'modern',
    name: 'Live Más',
    swatch: '#682a8d',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    routeColor: '#a78bfa',
  },
  retro85: {
    id: 'retro85',
    name: "Retro '85",
    swatch: '#f5c518',
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    routeColor: '#f5c518',
  },
  reign94: {
    id: 'reign94',
    name: "Purple Reign '94",
    swatch: '#d9208a',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    routeColor: '#d9208a',
  },
  baja: {
    id: 'baja',
    name: 'Baja Blast',
    swatch: '#00bfb3',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    routeColor: '#00bfb3',
  },
  cantina: {
    id: 'cantina',
    name: 'Cantina Night',
    swatch: '#c9a84c',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    routeColor: '#c9a84c',
  },
  sauce: {
    id: 'sauce',
    name: 'Sauce Packet',
    swatch: '#e8410a',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    tileAttr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    routeColor: '#e8410a',
  },
};

const DEFAULT_THEME = 'reign94';
const THEME_STORAGE_KEY = 'tb50k_theme';

const TACO_BELL_STOPS = [
  { num: 0, address: '417 King St, Alexandria, VA 22314', label: 'Start/Finish - Taco Bell Cantina', note: 'Start & Finish Line', mandatory: null },
  { num: 1, address: '231 S Van Dorn St, Alexandria, VA 22304', label: 'Stop 1 - Alexandria', note: '5.1 mi cumulative', mandatory: null },
  { num: 2, address: '4923 Lee Hwy, Arlington, VA 22207', label: 'Stop 2 - Arlington', note: '12.7 mi cumulative', mandatory: null },
  { num: 3, address: '2039 Wilson Blvd, Arlington, VA 22201', label: 'Stop 3 - Arlington', note: '15.5 mi cumulative', mandatory: 'Must eat Chalupa Supreme OR Crunchwrap by this stop' },
  { num: 4, address: '3100 14th St NW ste 103, Washington, DC 20010', label: 'Stop 4 - Columbia Heights', note: '~19 mi cumulative', mandatory: null },
  { num: 5, address: '1412 U St NW, Washington, DC 20009', label: 'Stop 5 - U Street', note: '~20 mi cumulative', mandatory: null },
  { num: 6, address: '808 7th St NW, Washington, DC 20001', label: 'Stop 6 - Chinatown', note: '~22 mi cumulative', mandatory: null },
  { num: 7, address: '50 Massachusetts Ave NE, Washington, DC 20002', label: 'Stop 7 - Union Station', note: '~23.5 mi cumulative', mandatory: 'Must eat Burrito Supreme OR Nachos Bell Grande by this stop' },
];

const PIN_ICONS = {
  restroom: '🚽',
  water: '💧',
  friend: '🏠',
  food: '🍔',
  medical: '⛑',
  parking: '🚗',
  custom: '📌',
};

// ── Stop Metadata (cumulative distances in miles from start) ──
const STOP_DISTANCES = [0, 5.1, 12.7, 15.5, 19.0, 20.0, 22.0, 23.5, 32.4];
// Index 0 = Start, 1–7 = Stops 1–7, 8 = Finish (same location as Start)

let map;
let tileLayer;
let routeLayer;
let stopMarkers = [];
let pinMarkers = [];
let pendingPinLatLng = null;
let customPins = [];
let currentThemeId = DEFAULT_THEME;
let bathroomLayer = null;
let bathroomToggleOn = false;

// ── Device Detection ──
function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// ── Directions: Open in native maps app ──
function openInMaps(lat, lng, label) {
  const ua = navigator.userAgent || '';
  const encodedLabel = encodeURIComponent(label || 'Pin');
  let url;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    url = `maps://?ll=${lat},${lng}&q=${encodedLabel}`;
  } else if (/android/i.test(ua)) {
    url = `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  window.open(url, '_blank');
}

// Make globally accessible for inline onclick handlers in popups
window.openInMaps = openInMaps;

// ── Theme System ──
function getThemeId() {
  return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
}

function getTheme(id) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}

function applyTheme(themeId) {
  const theme = getTheme(themeId);
  currentThemeId = theme.id;

  // Apply data-theme attribute (CSS variables switch)
  document.documentElement.setAttribute('data-theme', theme.id);

  // Persist
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);

  // Swap tile layer
  if (tileLayer) {
    map.removeLayer(tileLayer);
  }
  tileLayer = L.tileLayer(theme.tileUrl, {
    attribution: theme.tileAttr,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Update route polyline color
  if (routeLayer) {
    routeLayer.setStyle({ color: theme.routeColor });
  }

  // Update active swatch indicator
  document.querySelectorAll('.theme-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.theme === theme.id);
  });
}

function buildThemePicker() {
  const picker = document.getElementById('theme-picker');
  if (!picker) return;

  const savedTheme = getThemeId();

  Object.values(THEMES).forEach(theme => {
    const swatch = document.createElement('button');
    swatch.className = 'theme-swatch';
    if (theme.id === savedTheme) swatch.classList.add('active');
    swatch.style.background = theme.swatch;
    swatch.dataset.theme = theme.id;
    swatch.dataset.name = theme.name;
    swatch.title = theme.name;
    swatch.setAttribute('aria-label', `Switch to ${theme.name} theme`);
    swatch.addEventListener('click', () => applyTheme(theme.id));
    picker.appendChild(swatch);
  });
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  buildThemePicker();
  loadGPX();
  loadCustomPins();
  setupEventListeners();
  setupMobileCollapsibleSections();
  handleOrientationAndResize();
  resetAddButton();
  buildFoodTracker();
  restorePaceInputs();
});

function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
  });

  // Apply saved theme's tile layer (or default)
  const theme = getTheme(getThemeId());
  currentThemeId = theme.id;
  tileLayer = L.tileLayer(theme.tileUrl, {
    attribution: theme.tileAttr,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Map click handler for adding pins
  map.on('click', onMapClick);
}

// ── Load Route Data (from gpx_data.js) ──
function loadGPX() {
  const theme = getTheme(currentThemeId);

  // Draw route from embedded track data
  routeLayer = L.polyline(GPX_TRACK, {
    color: theme.routeColor,
    weight: 4,
    opacity: 0.85,
    smoothFactor: 1,
  }).addTo(map);

  // Add Taco Bell stop markers from embedded waypoints
  addStopMarkers(GPX_WAYPOINTS);

  // Fit map to route — use rAF to let flex layout settle before sizing (ISSUE-004)
  requestAnimationFrame(() => {
    map.invalidateSize();
    const padding = isMobile() ? 0.02 : 0.05;
    map.fitBounds(routeLayer.getBounds().pad(padding), { animate: false });
    document.getElementById('map').classList.add('map-ready');
  });

  // Calculate route info
  updateRouteInfo(GPX_TRACK);
}

function addStopMarkers(wptCoords) {
  const stopsList = document.getElementById('stops-list');

  TACO_BELL_STOPS.forEach((stop, i) => {
    const wpt = wptCoords[i];
    if (!wpt) return;

    const isStartFinish = i === 0;
    const markerNum = isStartFinish ? 'S' : stop.num;

    // Create Leaflet marker
    const icon = L.divIcon({
      className: 'taco-bell-marker-wrapper',
      html: `<div class="taco-bell-marker ${isStartFinish ? 'start-finish' : ''}">${markerNum}</div>`,
      iconSize: [isStartFinish ? 32 : 28, isStartFinish ? 32 : 28],
      iconAnchor: [isStartFinish ? 16 : 14, isStartFinish ? 16 : 14],
    });

    const marker = L.marker([wpt.lat, wpt.lon], { icon }).addTo(map);

    let popupHtml = `<div class="popup-content">
      <h3>${stop.label}</h3>
      <p>${wpt.name}</p>
      <p>${stop.note}</p>`;
    if (stop.mandatory) {
      popupHtml += `<p class="mandatory">⚠️ ${stop.mandatory}</p>`;
    }
    popupHtml += `<button class="popup-directions-btn" onclick="openInMaps(${wpt.lat}, ${wpt.lon}, '${stop.label.replace(/'/g, "\\'")}')">🧭 Directions</button>`;
    popupHtml += '</div>';
    marker.bindPopup(popupHtml);

    stopMarkers.push(marker);

    // Sidebar list item
    const item = document.createElement('div');
    item.className = 'stop-item';
    item.innerHTML = `
      <div class="stop-number ${isStartFinish ? 'start-finish' : ''}">${markerNum}</div>
      <div class="stop-address">${wpt.name}</div>
    `;
    item.addEventListener('click', () => {
      map.flyTo([wpt.lat, wpt.lon], 15, { duration: 1.2 });
      marker.openPopup();
    });
    stopsList.appendChild(item);
  });
}

// ── Route Info ──
function updateRouteInfo(coords) {
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    totalDist += haversine(coords[i - 1], coords[i]);
  }

  const info = document.getElementById('route-info');
  info.innerHTML = `
    <strong>Route Distance:</strong> ${(totalDist / 1609.34).toFixed(1)} miles<br>
    <strong>Track Points:</strong> ${coords.length}<br>
    <strong>Stops:</strong> 8 Taco Bells + Start/Finish<br>
    <strong>Time Limit:</strong> 11 hours<br>
    <strong>Date:</strong> Nov 27, 2026
  `;
}

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Custom Pins ──
function setupEventListeners() {
  const addBtn = document.getElementById('btn-add-pin');
  addBtn.addEventListener('click', () => {
    if (pendingPinLatLng) {
      placePin(pendingPinLatLng);
    }
  });

  // Context menu
  document.getElementById('ctx-add-pin').addEventListener('click', () => {
    const menu = document.getElementById('context-menu');
    menu.classList.add('hidden');
    if (pendingPinLatLng) {
      placePin(pendingPinLatLng);
    }
  });

  document.getElementById('ctx-cancel').addEventListener('click', () => {
    document.getElementById('context-menu').classList.add('hidden');
    pendingPinLatLng = null;
    resetAddButton();
  });

  // Hide context menu on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      document.getElementById('context-menu').classList.add('hidden');
    }
  });
}

function onMapClick(e) {
  pendingPinLatLng = e.latlng;
  const addBtn = document.getElementById('btn-add-pin');
  addBtn.disabled = false;
  if (isMobile()) {
    addBtn.textContent = `Place Pin (${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)})`;
  } else {
    addBtn.textContent = `Place Pin at ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
  }
  addBtn.classList.add('ready');
}

function placePin(latlng) {
  const nameInput = document.getElementById('pin-name');
  const iconSelect = document.getElementById('pin-icon');

  const name = nameInput.value.trim() || 'Unnamed Pin';
  const iconType = iconSelect.value;

  const pin = {
    id: Date.now(),
    name,
    iconType,
    lat: latlng.lat,
    lng: latlng.lng,
  };

  customPins.push(pin);
  saveCustomPins();
  addPinToMap(pin);
  addPinToSidebar(pin);

  // Reset form
  nameInput.value = '';
  pendingPinLatLng = null;
  resetAddButton();
}

function addPinToMap(pin) {
  const emoji = PIN_ICONS[pin.iconType];

  const icon = L.divIcon({
    className: 'custom-pin-marker',
    html: emoji,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
  marker.bindPopup(`<div class="popup-content">
    <h3>${emoji} ${pin.name}</h3>
    <p>${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</p>
    <button class="popup-directions-btn" onclick="openInMaps(${pin.lat}, ${pin.lng}, '${pin.name.replace(/'/g, "\\'")}')">🧭 Directions</button>
  </div>`);

  marker.pinId = pin.id;
  pinMarkers.push(marker);
}

function addPinToSidebar(pin) {
  const emoji = PIN_ICONS[pin.iconType];
  const list = document.getElementById('pins-list');

  const item = document.createElement('div');
  item.className = 'pin-item';
  item.dataset.pinId = pin.id;
  item.innerHTML = `
    <span class="pin-icon-label">${emoji}</span>
    <span class="pin-name">${pin.name}</span>
    <button class="pin-delete" title="Remove pin">&times;</button>
  `;

  item.querySelector('.pin-name').addEventListener('click', () => {
    map.flyTo([pin.lat, pin.lng], 16, { duration: 1.2 });
    const marker = pinMarkers.find(m => m.pinId === pin.id);
    if (marker) marker.openPopup();
  });

  item.querySelector('.pin-delete').addEventListener('click', () => {
    deletePin(pin.id);
  });

  list.appendChild(item);
}

function deletePin(id) {
  customPins = customPins.filter(p => p.id !== id);
  saveCustomPins();

  // Remove marker from map
  const markerIdx = pinMarkers.findIndex(m => m.pinId === id);
  if (markerIdx !== -1) {
    map.removeLayer(pinMarkers[markerIdx]);
    pinMarkers.splice(markerIdx, 1);
  }

  // Remove from sidebar
  const item = document.querySelector(`.pin-item[data-pin-id="${id}"]`);
  if (item) item.remove();
}

function resetAddButton() {
  const addBtn = document.getElementById('btn-add-pin');
  addBtn.disabled = true;
  addBtn.textContent = isMobile() ? 'Tap Map to Place Pin' : 'Click Map to Place Pin';
  addBtn.classList.remove('ready');
}

// ── Bathroom Finder (Overpass API) ──
const BATHROOM_CACHE_KEY = 'tb50k_bathrooms';
const BATHROOM_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function toggleBathrooms() {
  const btn = document.getElementById('btn-bathrooms');
  if (!btn) return;

  if (bathroomToggleOn) {
    // Turn off
    if (bathroomLayer) {
      map.removeLayer(bathroomLayer);
    }
    bathroomToggleOn = false;
    btn.classList.remove('active');
    btn.textContent = '🚽 Find Restrooms';
    return;
  }

  // Turn on
  bathroomToggleOn = true;
  btn.classList.add('active');
  btn.textContent = '🚽 Restrooms On';

  // Check cache
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
  if (bathroomLayer) {
    map.removeLayer(bathroomLayer);
  }
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
      <button class="popup-directions-btn" onclick="openInMaps(${lat}, ${lng}, '${name.replace(/'/g, "\\'")}')">🧭 Directions</button>
    </div>`);
    bathroomLayer.addLayer(marker);
  });

  bathroomLayer.addTo(map);
}

// ── Export Route to Google Maps ──
function exportToGoogleMaps() {
  // Build Google Maps directions URL with all stops as waypoints
  const stops = GPX_WAYPOINTS;
  if (!stops || stops.length < 2) return;

  const origin = `${stops[0].lat},${stops[0].lon}`;
  // Destination is the same as origin (loop course)
  const destination = origin;

  // Intermediate waypoints (stops 1–7)
  const waypoints = stops.slice(1).map(s => `${s.lat},${s.lon}`).join('|');

  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=walking`;

  window.open(url, '_blank');
}

window.exportToGoogleMaps = exportToGoogleMaps;

// ── Add to Calendar (.ics) ──
function downloadICS() {
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

window.downloadICS = downloadICS;

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
  const track = GPX_TRACK;
  const totalPoints = track.length;
  const step = Math.max(1, Math.floor(totalPoints / 200)); // ~200 frames
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

window.startFlythrough = startFlythrough;

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

  const totalDist = STOP_DISTANCES[STOP_DISTANCES.length - 1]; // 32.4
  const pacePerMile = totalMinutes / totalDist;

  let html = '<div class="pace-splits">';
  TACO_BELL_STOPS.forEach((stop, i) => {
    const dist = STOP_DISTANCES[i];
    // Apply mild fatigue factor after mile 20: +2% per mile over 20
    let adjustedMinutes;
    if (dist <= 20) {
      adjustedMinutes = dist * pacePerMile;
    } else {
      const baseMins = 20 * pacePerMile;
      const extraMiles = dist - 20;
      const fatiguePerMile = pacePerMile * 1.04; // 4% slower
      adjustedMinutes = baseMins + extraMiles * fatiguePerMile;
    }
    const hrs = Math.floor(adjustedMinutes / 60);
    const mins = Math.round(adjustedMinutes % 60);
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const mandatory = stop.mandatory ? ' 🌮' : '';

    html += `<div class="pace-split-row">
      <span class="pace-split-label">${i === 0 ? 'Start' : 'Stop ' + stop.num}${mandatory}</span>
      <span class="pace-split-dist">${dist} mi</span>
      <span class="pace-split-time">${timeStr}</span>
    </div>`;
  });

  // Add finish line
  const finishDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
  const finishMins = 20 * pacePerMile + (finishDist - 20) * pacePerMile * 1.04;
  const fHrs = Math.floor(finishMins / 60);
  const fMins = Math.round(finishMins % 60);
  html += `<div class="pace-split-row finish-row">
    <span class="pace-split-label">🏁 Finish</span>
    <span class="pace-split-dist">${finishDist} mi</span>
    <span class="pace-split-time">${fHrs}h ${fMins}m</span>
  </div>`;

  html += `<p class="pace-note">Pace: ${pacePerMile.toFixed(1)} min/mi (with 4% fatigue after mi 20)</p>`;
  html += '</div>';
  resultsDiv.innerHTML = html;

  // Persist
  localStorage.setItem('tb50k_pace_hours', hoursInput.value);
  localStorage.setItem('tb50k_pace_minutes', minsInput.value);
}

window.calculatePace = calculatePace;

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
    });
    container.appendChild(row);
  });
}

// ── LocalStorage ──
function saveCustomPins() {
  localStorage.setItem('tb50k_pins', JSON.stringify(customPins));
}

function loadCustomPins() {
  try {
    const saved = localStorage.getItem('tb50k_pins');
    if (saved) {
      customPins = JSON.parse(saved);
      customPins.forEach(pin => {
        addPinToMap(pin);
        addPinToSidebar(pin);
      });
    }
  } catch (e) {
    console.warn('Failed to load saved pins:', e);
  }
}

// ── Mobile: Collapsible Sections ──
function setupMobileCollapsibleSections() {
  document.querySelectorAll('.section h2').forEach(h2 => {
    h2.addEventListener('click', () => {
      const section = h2.closest('.section');
      section.classList.toggle('collapsed');
      setTimeout(() => map.invalidateSize(), 50);
    });
  });
}

// ── Handle resize and orientation changes ──
function handleOrientationAndResize() {
  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => map.invalidateSize(), 300);
  });

  if (isMobile()) {
    document.querySelectorAll('.stop-item').forEach(item => {
      item.addEventListener('click', () => {
        setTimeout(() => map.invalidateSize(), 100);
      });
    });
  }
}

// ── Restore pace calculator inputs from localStorage ──
function restorePaceInputs() {
  const h = localStorage.getItem('tb50k_pace_hours');
  const m = localStorage.getItem('tb50k_pace_minutes');
  const hoursInput = document.getElementById('pace-hours');
  const minsInput = document.getElementById('pace-minutes');
  if (hoursInput && h) hoursInput.value = h;
  if (minsInput && m) minsInput.value = m;
  if (h || m) calculatePace();
}
