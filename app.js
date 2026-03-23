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

// ── Named Course Sections ──
const COURSE_SECTIONS = [
  { name: 'Old Town Stroll', miStart: 0, miEnd: 3.0, color: '#34d399', note: 'Flat, scenic streets of Old Town Alexandria. Ease into it — the cobblestones are charming now, less so at mile 30.' },
  { name: 'The Van Dorn Shuffle', miStart: 3.0, miEnd: 5.1, color: '#60a5fa', note: 'Out to the first Taco Bell on Van Dorn St. Suburban stretch. Save energy — you\'ll need it.' },
  { name: 'Arlington Long Haul', miStart: 5.1, miEnd: 12.7, color: '#fbbf24', note: 'The big one. 7.6 miles through Arlington to Stop 2. Longest leg of the race. Trail sections and bike paths.' },
  { name: 'The Georgetown Climb', miStart: 12.7, miEnd: 15.5, color: '#f87171', note: 'Rolling hills through Arlington to Stop 3. Mandatory food checkpoint — eat your Chalupa or Crunchwrap.' },
  { name: 'DC Entry Push', miStart: 15.5, miEnd: 20.0, color: '#c084fc', note: 'Cross into DC proper. Columbia Heights to U Street. Urban buzz, good crowd energy. Miles 15–20.' },
  { name: 'The Capitol Grind', miStart: 20.0, miEnd: 23.5, color: '#fb923c', note: 'Chinatown through to Union Station. Stop 7 mandatory food. The wall hits here for most runners.' },
  { name: 'The Final Push', miStart: 23.5, miEnd: 32.4, color: '#ef4444', note: '8.9 miles back to Old Town. Longest leg, highest fatigue. Dig deep. The finish line chalupa awaits.' },
];

// ── Stop Detail Metadata ──
const STOP_META = [
  { stopIndex: 0, burritoRating: 3, tacoRating: 5, vomitRisk: 5, vibeNote: 'The Cantina flagship. Alcohol available. DJ on race day. You\'ll end here — make it count.', crewAccess: 'King St Metro, street parking on King St. Crew-friendly sidewalks.', trivia: 'This is a Taco Bell Cantina — one of TB\'s upscale locations with booze, open kitchen, and no drive-through.' },
  { stopIndex: 1, burritoRating: 2, tacoRating: 3, vomitRisk: 4, vibeNote: 'Suburban classic. Drive-through vibes. Get in, fuel up, get out.', crewAccess: 'Large parking lot. Easy crew access. Van Dorn St has wide shoulders.', trivia: 'A standard Taco Bell with the original 90s interior — purple booths and all.' },
  { stopIndex: 2, burritoRating: 3, tacoRating: 3, vomitRisk: 3, vibeNote: 'Lee Highway location. You\'ve earned this one after 12.7 miles.', crewAccess: 'Parking lot access from Lee Hwy. Bus stops nearby.', trivia: 'The Lee Highway corridor was once the main route from DC to the Shenandoah Valley.' },
  { stopIndex: 3, burritoRating: 4, tacoRating: 4, vomitRisk: 3, vibeNote: 'MANDATORY FOOD STOP. Chalupa Supreme or Crunchwrap required. Choose wisely.', crewAccess: 'Wilson Blvd, Courthouse Metro nearby. Metered street parking.', trivia: 'The Crunchwrap Supreme was invented in 2005 and immediately became TB\'s #1 seller.' },
  { stopIndex: 4, burritoRating: 3, tacoRating: 4, vomitRisk: 2, vibeNote: 'Columbia Heights — the energy shift. DC proper. You might see protesters or a parade.', crewAccess: 'Columbia Heights Metro. Paid garage parking on 14th St.', trivia: 'The 14th St corridor has more Taco Bells per mile than any other street in DC.' },
  { stopIndex: 5, burritoRating: 2, tacoRating: 3, vomitRisk: 2, vibeNote: 'U Street. Jazz history meets fast food destiny. Only 1 mile from the last stop.', crewAccess: 'U St Metro. Street parking limited — crew should use Metro.', trivia: 'U Street was known as "Black Broadway" in the early 1900s. Now it\'s known for its TB.' },
  { stopIndex: 6, burritoRating: 3, tacoRating: 3, vomitRisk: 2, vibeNote: 'Chinatown. The Verizon Center looms. You\'re in the home stretch... kind of.', crewAccess: 'Gallery Place Metro. Multiple parking garages within 2 blocks.', trivia: 'The Chinatown TB is one of the few fast food locations required to display its name in Chinese characters.' },
  { stopIndex: 7, burritoRating: 5, tacoRating: 4, vomitRisk: 1, vibeNote: 'MANDATORY FOOD STOP #2. Union Station. Burrito Supreme or Nachos Bell Grande. Then 8.9 miles home.', crewAccess: 'Union Station Metro + Amtrak. Massive parking garage. Best crew access on the course.', trivia: 'Union Station serves 40 million visitors per year. Most of them wish there was a Taco Bell inside.' },
];

// ── Spectator Spots ──
const SPECTATOR_SPOTS = [
  { name: 'Old Town Start/Finish', lat: 38.8047, lng: -77.0442, mile: 0, note: 'Best spot to see runners off and welcome them home. King St has plenty of cafes for waiting.', parking: 'King St Metro, street parking, nearby garages.' },
  { name: 'Shirlington Village', lat: 38.8425, lng: -77.0870, mile: 8.5, note: 'Midway through the Arlington Long Haul. Restaurants and shops to kill time.', parking: 'Free parking in Shirlington garage.' },
  { name: 'Rosslyn Overlook', lat: 38.8967, lng: -77.0719, mile: 13.5, note: 'Great views of Georgetown and the Potomac. Catch runners on the Georgetown Climb.', parking: 'Rosslyn Metro. Paid garages.' },
  { name: 'Lincoln Memorial Area', lat: 38.8893, lng: -77.0502, mile: 15.0, note: 'Iconic backdrop. Runners pass through around mile 15. Great photo op.', parking: 'Foggy Bottom Metro. Limited street parking.' },
  { name: 'U Street Corridor', lat: 38.9169, lng: -77.0325, mile: 20.0, note: 'High-energy neighborhood. Bars and restaurants everywhere. Cheer from a patio.', parking: 'U St Metro. Street parking available.' },
  { name: 'Capitol Hill / Union Station', lat: 38.8982, lng: -77.0062, mile: 23.5, note: 'Last TB stop before the Final Push. Runners need encouragement here.', parking: 'Union Station garage. Multiple Metro lines.' },
];

// ── Taco Bell Passport Achievements ──
const ACHIEVEMENTS = [
  { id: 'visit_all_8', name: 'Grand Slam', emoji: '🏆', desc: 'Visited all 8 Taco Bell stops', check: () => { const pins = JSON.parse(localStorage.getItem('tb50k_pins') || '[]'); return pins.length >= 8; } },
  { id: 'mandatory_food', name: 'Rule Follower', emoji: '✅', desc: 'Completed both mandatory food items', check: () => localStorage.getItem('tb50k_food_rule_1') === 'true' && localStorage.getItem('tb50k_food_rule_2') === 'true' },
  { id: 'pace_set', name: 'Time Keeper', emoji: '⏱', desc: 'Set a goal finish time', check: () => !!(localStorage.getItem('tb50k_pace_hours') || localStorage.getItem('tb50k_pace_minutes')) },
  { id: 'race_mode', name: 'Gone Live', emoji: '📡', desc: 'Activated Race Mode', check: () => localStorage.getItem('tb50k_race_mode_used') === 'true' },
  { id: 'calendar_added', name: 'Committed', emoji: '📅', desc: 'Added race to calendar', check: () => localStorage.getItem('tb50k_calendar_added') === 'true' },
  { id: 'theme_explorer', name: 'Fashionista', emoji: '🎨', desc: 'Tried 3+ themes', check: () => { try { return (JSON.parse(localStorage.getItem('tb50k_themes_tried') || '[]')).length >= 3; } catch(e) { return false; } } },
  { id: 'pin_master', name: 'Pin Master', emoji: '📌', desc: 'Placed 5+ custom pins', check: () => (JSON.parse(localStorage.getItem('tb50k_pins') || '[]')).length >= 5 },
  { id: 'sub_9', name: 'Speed Demon', emoji: '🔥', desc: 'Set a goal time under 9 hours', check: () => { const h = parseInt(localStorage.getItem('tb50k_pace_hours') || '0'); const m = parseInt(localStorage.getItem('tb50k_pace_minutes') || '0'); return (h * 60 + m) > 0 && (h * 60 + m) < 540; } },
  { id: 'bathrooms_found', name: 'Bathroom Scout', emoji: '🚽', desc: 'Used the bathroom finder', check: () => localStorage.getItem('tb50k_bathrooms_used') === 'true' },
  { id: 'flythrough_watched', name: 'Film Buff', emoji: '🎬', desc: 'Watched the route flythrough', check: () => localStorage.getItem('tb50k_flythrough_used') === 'true' },
];

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
let layerControl = null;
let courseSectionLayers = [];
let courseSectionsVisible = false;
let spectatorLayer = null;
let spectatorToggleOn = false;
let detailPanelOpen = false;
let blockPartyLayer = null;
let blockPartyToggleOn = false;
let blockParties = [];

// ── Map Tile Options (for layer switcher) ──
const MAP_TILES = {
  'CARTO Dark': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  'CARTO Light': {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  'OpenStreetMap': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  'OpenTopoMap': {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  'Esri Satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri',
    subdomains: '',
  },
};

// ── Race Mode State ──
let raceModeActive = false;
let raceWatchId = null;
let raceMarker = null;
let raceBanner = null;

// ── Countdown State ──
let countdownInterval = null;

// ── HTML Sanitization ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
window.escapeHtml = escapeHtml;

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

  // Track for achievement
  try {
    const tried = JSON.parse(localStorage.getItem('tb50k_themes_tried') || '[]');
    if (!tried.includes(theme.id)) { tried.push(theme.id); localStorage.setItem('tb50k_themes_tried', JSON.stringify(tried)); }
  } catch(e) { /* ignore */ }

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

  // Sauce packet copy swap
  applySaucePacketCopy();
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

  // New features
  buildSegments();
  restoreCountdownInputs();
  loadWeather();
  applySaucePacketCopy();
  buildCourseSectionsList();
  buildPassport();
  buildPinFilters();
  loadPinsFromURL();
  loadBlockParties();
  fetchElevation();
  loadSplitHistory();
  buildFinisherWall();
  buildCalorieTracker();
  buildCalorieLogForm();
  buildSegmentLeaderboard();
  renderAltRoutesSidebar(false);

  // Initialize view toggle
  initViewToggle();

  // Initialize backend features (graceful degradation — works without these scripts)
  if (typeof TB_AUTH !== 'undefined') TB_AUTH.init();
  if (typeof TB_FOOD_LOG !== 'undefined') TB_FOOD_LOG.init();
  if (typeof TB_SOCIAL_FEED !== 'undefined') TB_SOCIAL_FEED.init();
  if (typeof TB_PARTIES !== 'undefined') TB_PARTIES.init();
  if (typeof TB_BETTING !== 'undefined') TB_BETTING.init();
  if (typeof TB_PREFS_SYNC !== 'undefined') TB_PREFS_SYNC.init();
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

  // Build layer switcher control
  buildLayerControl();
}

function buildLayerControl() {
  const baseLayers = {};
  Object.entries(MAP_TILES).forEach(([name, cfg]) => {
    baseLayers[name] = L.tileLayer(cfg.url, {
      attribution: cfg.attr,
      subdomains: cfg.subdomains !== undefined ? cfg.subdomains : 'abcd',
      maxZoom: 19,
    });
  });

  layerControl = L.control.layers(baseLayers, null, { position: 'topright', collapsed: true }).addTo(map);

  // When user switches base layer via the control, persist and sync
  map.on('baselayerchange', (e) => {
    tileLayer = e.layer;
    localStorage.setItem('tb50k_tile_layer', e.name);
  });
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
      openStopDetail(i);
    });
    stopsList.appendChild(item);
  });
}

// ── Route Info ──
function updateRouteInfo(coords) {
  const routeMiles = STOP_DISTANCES[STOP_DISTANCES.length - 1]; // canonical distance

  const info = document.getElementById('route-info');
  info.innerHTML = `
    <strong>Route Distance:</strong> ${routeMiles} miles<br>
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
  const noteInput = document.getElementById('pin-note');

  const name = nameInput.value.trim() || 'Unnamed Pin';
  const iconType = iconSelect.value;
  const note = noteInput ? noteInput.value.trim() : '';

  const pin = {
    id: Date.now(),
    name,
    iconType,
    lat: latlng.lat,
    lng: latlng.lng,
    note,
  };

  customPins.push(pin);
  saveCustomPins();
  addPinToMap(pin);
  addPinToSidebar(pin);

  // Reset form
  nameInput.value = '';
  if (noteInput) noteInput.value = '';
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

  const marker = L.marker([pin.lat, pin.lng], { icon, draggable: true }).addTo(map);
  const safeName = escapeHtml(pin.name);
  const safeNote = pin.note ? escapeHtml(pin.note) : '';
  marker.bindPopup(`<div class="popup-content">
    <h3>${emoji} ${safeName}</h3>
    ${safeNote ? `<p class="pin-note-text">${safeNote}</p>` : ''}
    <p>${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</p>
    <button class="popup-directions-btn" onclick="openInMaps(${pin.lat}, ${pin.lng}, '${safeName.replace(/'/g, "\\'")}')">🧭 Directions</button>
  </div>`);

  marker.pinId = pin.id;
  pinMarkers.push(marker);

  // Enable drag-to-reposition
  makePinDraggable(marker, pin);
}

function addPinToSidebar(pin) {
  const emoji = PIN_ICONS[pin.iconType];
  const list = document.getElementById('pins-list');

  const item = document.createElement('div');
  item.className = 'pin-item';
  item.dataset.pinId = pin.id;
  if (pin.note) item.title = pin.note;
  item.innerHTML = `
    <span class="pin-icon-label">${emoji}</span>
    <span class="pin-name">${pin.name}</span>
    ${pin.note ? '<span class="pin-note-badge" title="Has note">📝</span>' : ''}
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
  trackAchievement('tb50k_bathrooms_used');

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
  trackAchievement('tb50k_flythrough_used');
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
  const gapEnabled = document.getElementById('gap-toggle')?.checked && elevationData;
  const gapFactors = gapEnabled ? getGAPFactors() : null;

  // Solve for base pace that hits the goal time *after* fatigue + GAP adjustments.
  // Without this, applying 4% fatigue after mi 20 on top of a straight-line pace
  // causes the finish time to overshoot the goal (ISSUE-016).
  const fatigueThreshold = 20;
  let effectiveDist = totalDist; // weighted distance accounting for fatigue + GAP
  if (totalDist > fatigueThreshold) {
    effectiveDist = fatigueThreshold + (totalDist - fatigueThreshold) * 1.04;
  }
  if (gapFactors) {
    // Re-compute effectiveDist using per-leg GAP factors
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
    // Add finish leg
    const lastLegDist = totalDist - STOP_DISTANCES[STOP_DISTANCES.length - 2];
    let lastFactor = 1.04;
    if (gapFactors[gapFactors.length - 1]) lastFactor *= gapFactors[gapFactors.length - 1];
    effectiveDist += lastLegDist * lastFactor;
  }
  const pacePerMile = totalMinutes / effectiveDist;

  // Get start time for time-of-day estimates
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
      // Start — 0 elapsed
      cumulativeMinutes = 0;
    } else {
      const legDist = STOP_DISTANCES[i] - STOP_DISTANCES[i - 1];
      let legPace = pacePerMile;

      // Fatigue factor after mile 20
      if (STOP_DISTANCES[i - 1] >= 20) {
        legPace *= 1.04;
      } else if (dist > 20) {
        const preWallDist = 20 - STOP_DISTANCES[i - 1];
        const postWallDist = dist - 20;
        legPace = ((preWallDist * pacePerMile) + (postWallDist * pacePerMile * 1.04)) / legDist;
      }

      // GAP adjustment
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

  // Add finish line
  const finishDist = STOP_DISTANCES[STOP_DISTANCES.length - 1];
  const lastLegDist = finishDist - STOP_DISTANCES[STOP_DISTANCES.length - 2];
  let lastLegPace = pacePerMile * 1.04; // all post-20
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
  if (gapEnabled) {
    noteText += ' + grade-adjusted';
  }
  html += `<p class="pace-note">${noteText}</p>`;
  if (gapEnabled && !elevationData) {
    html += '<p class="pace-note">Waiting for elevation data to load...</p>';
  }
  if (!hasStartTime) {
    html += '<p class="pace-note">Set a start time in the Countdown section to see arrival times.</p>';
  }
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
      if (e.target.checked && audioEnabled) playTacoBellBong();
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

  // Race date: Nov 27, 2026
  const raceDate = new Date(2026, 10, 27); // month is 0-indexed
  const startTime = new Date(raceDate);
  startTime.setHours(hours, minutes, 0, 0);

  const cutoffMs = 11 * 60 * 60 * 1000; // 11 hours
  const cutoffTime = new Date(startTime.getTime() + cutoffMs);

  if (countdownInterval) clearInterval(countdownInterval);

  function updateCountdown() {
    const now = new Date();
    const elapsed = now - startTime;
    const remaining = cutoffTime - now;

    if (elapsed < 0) {
      // Race hasn't started yet
      const until = startTime - now;
      const dUntil = Math.floor(until / 86400000);
      const hUntil = Math.floor((until % 86400000) / 3600000);
      const mUntil = Math.floor((until % 3600000) / 60000);
      resultsDiv.innerHTML = `
        <div class="countdown-row"><span class="countdown-label">Race starts in</span><span class="countdown-value">${dUntil}d ${hUntil}h ${mUntil}m</span></div>
        <div class="countdown-row"><span class="countdown-label">Start Time</span><span class="countdown-value">${formatClockTime(hours, minutes)}</span></div>
        <div class="countdown-row"><span class="countdown-label">Cutoff</span><span class="countdown-value">${formatClockTime(cutoffTime.getHours(), cutoffTime.getMinutes())}</span></div>
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

    // Estimate current position based on pace
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
      <div class="countdown-row"><span class="countdown-label">Cutoff</span><span class="countdown-value">${formatClockTime(cutoffTime.getHours(), cutoffTime.getMinutes())}</span></div>
    `;
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

window.startCountdown = startCountdown;

function restoreCountdownInputs() {
  const h = localStorage.getItem('tb50k_race_start_h');
  const m = localStorage.getItem('tb50k_race_start_m');
  const startH = document.getElementById('race-start-hours');
  const startM = document.getElementById('race-start-minutes');
  if (startH && h) startH.value = h;
  if (startM && m) startM.value = m;
}

// ── Time-of-Day Helper ──
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

// ── Turn-by-Turn Segments ──
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

// ── Live Location Tracker (Race Mode) ──
function toggleRaceMode() {
  if (raceModeActive) {
    stopRaceMode();
  } else {
    startRaceMode();
  }
}

window.toggleRaceMode = toggleRaceMode;

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

  // Create pulsing marker
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

  // Auto-record split when within ~0.05 miles (80m) of a stop
  if (nearestDist < 80) {
    recordSplit(nearest.index);
    if (audioEnabled) playTacoBellBong();
  }
}

function hideDistanceBanner() {
  if (raceBanner) {
    raceBanner.classList.add('hidden');
  }
}

// ── Weather Overlay (NWS API) ──
const WEATHER_CACHE_KEY = 'tb50k_weather';
const WEATHER_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

function loadWeather() {
  const container = document.getElementById('weather-content');
  if (!container) return;

  // Check cache
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
    if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL) {
      renderWeather(cached.data);
      return;
    }
  } catch (e) { /* cache miss */ }

  container.innerHTML = '<p class="hint">Loading forecast...</p>';

  // NWS API: Get grid point for Old Town Alexandria (start/finish)
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

  // Show first 4 periods (covers ~2 days)
  let html = '';
  const show = periods.slice(0, 4);
  show.forEach(p => {
    html += `<div class="weather-period">
      <div class="weather-period-name">${p.name || 'N/A'}</div>
      <div class="weather-period-temp">${p.temperature || '?'}°${p.temperatureUnit || 'F'}</div>
      <div class="weather-period-desc">${p.shortForecast || 'N/A'}</div>
      ${p.probabilityOfPrecipitation?.value ? `<div class="weather-period-precip">💧 ${p.probabilityOfPrecipitation.value}%</div>` : ''}
    </div>`;
  });

  container.innerHTML = html;
}

// ── Elevation Profile ──
const ELEVATION_CACHE_KEY = 'tb50k_elevation';
const ELEVATION_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const ELEVATION_SAMPLE_STEP = 20; // Sample every Nth track point

let elevationData = null; // { distances: [], elevations: [], trackIndices: [] }
let elevationMarker = null;
let gradeColorActive = false;
let gradeColorLayers = null;

function fetchElevation() {
  const container = document.getElementById('elevation-content');
  if (!container) return;

  // Check localStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem(ELEVATION_CACHE_KEY));
    if (cached && Date.now() - cached.ts < ELEVATION_CACHE_TTL) {
      elevationData = cached.data;
      onElevationLoaded();
      return;
    }
  } catch (e) { /* cache miss */ }

  container.innerHTML = '<p class="hint">Loading elevation data...</p>';

  // Sample track points (max 100 for API limit)
  const maxPts = 100;
  const step = Math.max(ELEVATION_SAMPLE_STEP, Math.ceil(GPX_TRACK.length / (maxPts - 1)));
  const lats = [];
  const lons = [];
  const indices = [];
  for (let i = 0; i < GPX_TRACK.length; i += step) {
    lats.push(GPX_TRACK[i][0].toFixed(4));
    lons.push(GPX_TRACK[i][1].toFixed(4));
    indices.push(i);
  }
  // Include last point if not already included
  const lastIdx = GPX_TRACK.length - 1;
  if (indices[indices.length - 1] !== lastIdx && lats.length < maxPts) {
    lats.push(GPX_TRACK[lastIdx][0].toFixed(4));
    lons.push(GPX_TRACK[lastIdx][1].toFixed(4));
    indices.push(lastIdx);
  }

  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lons.join(',')}`;

  fetch(url, { headers: { 'User-Agent': 'TacoBellDC50K-RoutePlanner' } })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(data => {
      if (!data.elevation || !Array.isArray(data.elevation)) throw new Error('Bad elevation response');

      // Build cumulative distances for sampled points (in miles)
      const distances = [0];
      let cumDist = 0;
      for (let j = 1; j < indices.length; j++) {
        for (let k = indices[j - 1]; k < indices[j]; k++) {
          cumDist += haversine(GPX_TRACK[k], GPX_TRACK[k + 1]);
        }
        distances.push(cumDist / 1609.34); // meters to miles
      }

      elevationData = {
        distances: distances,
        elevations: data.elevation.map(e => e * 3.28084), // meters to feet
        trackIndices: indices,
      };

      localStorage.setItem(ELEVATION_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: elevationData }));
      onElevationLoaded();
    })
    .catch(err => {
      console.warn('Elevation fetch failed:', err);
      container.innerHTML = '<p class="hint">Elevation data unavailable. Try refreshing later.</p>';
    });
}

function onElevationLoaded() {
  renderElevationProfile();
  updateRouteInfoWithElevation();
}

function renderElevationProfile() {
  const container = document.getElementById('elevation-content');
  if (!container || !elevationData) return;

  const { distances, elevations } = elevationData;
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);

  // Calculate total gain/loss
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) totalGain += diff;
    else totalLoss += Math.abs(diff);
  }

  container.innerHTML = '';

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'elevation-canvas';
  canvas.style.width = '100%';
  canvas.style.cursor = 'crosshair';
  container.appendChild(canvas);

  // Stats row
  const statsDiv = document.createElement('div');
  statsDiv.className = 'elevation-stats';
  statsDiv.innerHTML = `
    <span>↑ ${Math.round(totalGain)} ft gain</span>
    <span>↓ ${Math.round(totalLoss)} ft loss</span>
    <span>⬆ ${Math.round(maxElev)} ft max</span>
    <span>⬇ ${Math.round(minElev)} ft min</span>
  `;
  container.appendChild(statsDiv);

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'elevation-tooltip';
  tooltip.className = 'elevation-tooltip hidden';
  container.appendChild(tooltip);

  drawElevationChart(canvas);
  setupElevationHover(canvas, tooltip);

  // Redraw on resize
  const resizeObs = new ResizeObserver(() => drawElevationChart(canvas));
  resizeObs.observe(container);
}

function drawElevationChart(canvas) {
  if (!elevationData) return;

  const { distances, elevations } = elevationData;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 120 * dpr;
  canvas.style.height = '120px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 120;
  const pad = { top: 10, bottom: 20, left: 35, right: 10 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const minElev = Math.min(...elevations) - 5;
  const maxElev = Math.max(...elevations) + 15;
  const maxDist = distances[distances.length - 1];

  const xScale = (d) => pad.left + (d / maxDist) * plotW;
  const yScale = (e) => pad.top + plotH - ((e - minElev) / (maxElev - minElev)) * plotH;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Grid lines
  const cs = getComputedStyle(document.documentElement);
  const textColor = cs.getPropertyValue('--color-text-secondary').trim() || '#999';
  const borderColor = cs.getPropertyValue('--color-border').trim() || '#333';

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 3]);
  const elevStep = Math.ceil((maxElev - minElev) / 4 / 25) * 25;
  for (let e = Math.ceil(minElev / elevStep) * elevStep; e <= maxElev; e += elevStep) {
    const y = yScale(e);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(e)}`, pad.left - 4, y + 3);
  }
  ctx.setLineDash([]);

  // Distance labels on x-axis
  ctx.fillStyle = textColor;
  ctx.font = '9px system-ui';
  ctx.textAlign = 'center';
  for (let d = 0; d <= maxDist; d += 5) {
    ctx.fillText(`${d}`, xScale(d), h - 4);
  }
  ctx.fillText('mi', w - pad.right + 2, h - 4);

  // Fill gradient under the curve
  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  gradient.addColorStop(0, 'rgba(168,85,247,0.4)');
  gradient.addColorStop(1, 'rgba(168,85,247,0.05)');

  ctx.beginPath();
  ctx.moveTo(xScale(distances[0]), yScale(elevations[0]));
  for (let i = 1; i < distances.length; i++) {
    ctx.lineTo(xScale(distances[i]), yScale(elevations[i]));
  }
  ctx.lineTo(xScale(distances[distances.length - 1]), pad.top + plotH);
  ctx.lineTo(xScale(distances[0]), pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Grade-colored line segments
  for (let i = 1; i < distances.length; i++) {
    const grade = getGrade(i - 1, i);
    ctx.beginPath();
    ctx.moveTo(xScale(distances[i - 1]), yScale(elevations[i - 1]));
    ctx.lineTo(xScale(distances[i]), yScale(elevations[i]));
    ctx.strokeStyle = gradeToColor(grade);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Mark TB stops on the chart
  ctx.fillStyle = textColor;
  STOP_DISTANCES.forEach((sd, i) => {
    if (i === 0 || i === STOP_DISTANCES.length - 1) return;
    const x = xScale(sd);
    ctx.beginPath();
    ctx.setLineDash([1, 2]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function getGrade(i, j) {
  if (!elevationData) return 0;
  const { distances, elevations } = elevationData;
  const dDist = (distances[j] - distances[i]) * 5280; // miles to feet
  if (dDist === 0) return 0;
  const dElev = elevations[j] - elevations[i];
  return (dElev / dDist) * 100; // percent grade
}

function gradeToColor(grade) {
  const absGrade = Math.abs(grade);
  if (absGrade < 2) return '#34d399'; // flat - green
  if (absGrade < 4) return '#fbbf24'; // moderate - yellow
  if (absGrade < 7) return '#fb923c'; // steep - orange
  return '#ef4444'; // very steep - red
}

function setupElevationHover(canvas, tooltip) {
  if (!elevationData) return;

  const { distances, elevations, trackIndices } = elevationData;
  const maxDist = distances[distances.length - 1];

  function getDataAtX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const pad = { left: 35, right: 10 };
    const plotW = rect.width - pad.left - pad.right;
    const relX = clientX - rect.left - pad.left;
    const dist = (relX / plotW) * maxDist;

    // Find nearest sampled point
    let idx = 0;
    for (let i = 1; i < distances.length; i++) {
      if (Math.abs(distances[i] - dist) < Math.abs(distances[idx] - dist)) idx = i;
    }
    return { dist: distances[idx], elev: elevations[idx], trackIdx: trackIndices[idx] };
  }

  canvas.addEventListener('mousemove', (e) => {
    const data = getDataAtX(e.clientX);
    tooltip.classList.remove('hidden');
    tooltip.innerHTML = `${data.dist.toFixed(1)} mi · ${Math.round(data.elev)} ft`;

    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.style.top = '-20px';

    // Show marker on map
    const trackPt = GPX_TRACK[data.trackIdx];
    if (!elevationMarker) {
      elevationMarker = L.circleMarker([trackPt[0], trackPt[1]], {
        radius: 6, color: '#fff', fillColor: '#a855f7', fillOpacity: 1, weight: 2,
      }).addTo(map);
    } else {
      elevationMarker.setLatLng([trackPt[0], trackPt[1]]);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
    if (elevationMarker) {
      map.removeLayer(elevationMarker);
      elevationMarker = null;
    }
  });

  // Touch support
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const data = getDataAtX(touch.clientX);
    tooltip.classList.remove('hidden');
    tooltip.innerHTML = `${data.dist.toFixed(1)} mi · ${Math.round(data.elev)} ft`;
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${touch.clientX - rect.left}px`;
    tooltip.style.top = '-20px';

    const trackPt = GPX_TRACK[data.trackIdx];
    if (!elevationMarker) {
      elevationMarker = L.circleMarker([trackPt[0], trackPt[1]], {
        radius: 6, color: '#fff', fillColor: '#a855f7', fillOpacity: 1, weight: 2,
      }).addTo(map);
    } else {
      elevationMarker.setLatLng([trackPt[0], trackPt[1]]);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    tooltip.classList.add('hidden');
    if (elevationMarker) {
      map.removeLayer(elevationMarker);
      elevationMarker = null;
    }
  });
}

function updateRouteInfoWithElevation() {
  if (!elevationData) return;
  const info = document.getElementById('route-info');
  if (!info) return;

  const { elevations } = elevationData;
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) totalGain += diff;
    else totalLoss += Math.abs(diff);
  }

  // Append elevation stats to route info
  const existingElevDiv = info.querySelector('.route-elev-info');
  if (existingElevDiv) existingElevDiv.remove();

  const elevDiv = document.createElement('div');
  elevDiv.className = 'route-elev-info';
  elevDiv.innerHTML = `
    <strong>Elevation Gain:</strong> ${Math.round(totalGain)} ft<br>
    <strong>Elevation Loss:</strong> ${Math.round(totalLoss)} ft<br>
    <strong>Max Elevation:</strong> ${Math.round(Math.max(...elevations))} ft<br>
    <strong>Min Elevation:</strong> ${Math.round(Math.min(...elevations))} ft
  `;
  info.appendChild(elevDiv);
}

// ── Grade-Colored Route Polyline ──
function toggleGradeColor() {
  if (!elevationData) {
    alert('Elevation data not loaded yet. Please wait...');
    return;
  }

  gradeColorActive = !gradeColorActive;
  const btn = document.getElementById('btn-grade-color');
  if (btn) btn.classList.toggle('active', gradeColorActive);

  if (gradeColorActive) {
    buildGradedPolyline();
    if (routeLayer) routeLayer.setStyle({ opacity: 0 });
  } else {
    removeGradedPolyline();
    if (routeLayer) {
      const theme = getTheme(currentThemeId);
      routeLayer.setStyle({ opacity: 0.85, color: theme.routeColor });
    }
  }
}

window.toggleGradeColor = toggleGradeColor;

function buildGradedPolyline() {
  if (!elevationData || !gradeColorActive) return;
  removeGradedPolyline();

  const { trackIndices, elevations } = elevationData;
  gradeColorLayers = L.layerGroup().addTo(map);

  for (let i = 1; i < trackIndices.length; i++) {
    const startIdx = trackIndices[i - 1];
    const endIdx = trackIndices[i];
    const grade = getGrade(i - 1, i);
    const color = gradeToColor(grade);

    const segPts = [];
    for (let k = startIdx; k <= endIdx && k < GPX_TRACK.length; k++) {
      segPts.push(GPX_TRACK[k]);
    }

    L.polyline(segPts, {
      color: color,
      weight: 5,
      opacity: 0.9,
    }).addTo(gradeColorLayers);
  }
}

function removeGradedPolyline() {
  if (gradeColorLayers) {
    map.removeLayer(gradeColorLayers);
    gradeColorLayers = null;
  }
}

// ── Grade-Adjusted Pace (GAP) Estimator ──
// Simplified Minetti model: ~3.5% time penalty per 1% uphill grade
// Mild downhill benefit up to -5% grade, then penalty
function getGAPFactors() {
  if (!elevationData) return null;

  const { distances, elevations } = elevationData;
  // Calculate average grade per stop-to-stop segment
  const gapFactors = [];

  for (let s = 0; s < STOP_DISTANCES.length - 1; s++) {
    const segStart = STOP_DISTANCES[s];
    const segEnd = STOP_DISTANCES[s + 1];

    // Find elevation samples in this segment range
    let totalGradePenalty = 0;
    let segCount = 0;

    for (let i = 1; i < distances.length; i++) {
      const midDist = (distances[i - 1] + distances[i]) / 2;
      if (midDist >= segStart && midDist < segEnd) {
        const grade = getGrade(i - 1, i);
        let factor;
        if (grade > 0) {
          factor = 1 + 0.035 * grade; // uphill penalty
        } else if (grade > -5) {
          factor = 1 + 0.015 * grade; // mild downhill benefit (grade is negative)
        } else {
          factor = 1 + 0.02 * Math.abs(grade); // steep downhill penalty
        }
        totalGradePenalty += factor;
        segCount++;
      }
    }

    gapFactors.push(segCount > 0 ? totalGradePenalty / segCount : 1.0);
  }

  return gapFactors;
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

// ── Printable Pace Card ──
function printPaceCard() {
  // Trigger pace calculation first if not already done
  calculatePace();
  window.print();
}

window.printPaceCard = printPaceCard;

// ── Named Course Sections ──
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

  // Map mile markers to approximate track indices
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

window.toggleCourseSections = toggleCourseSections;

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

  // Click to fly to section midpoint
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

  // Waypoints (TB stops)
  GPX_WAYPOINTS.forEach((wpt, i) => {
    const stop = TACO_BELL_STOPS[i];
    gpx += `  <wpt lat="${wpt.lat}" lon="${wpt.lon}">
    <name>${stop ? stop.label : wpt.name}</name>
  </wpt>\n`;
  });

  // Custom pins as waypoints
  customPins.forEach(pin => {
    gpx += `  <wpt lat="${pin.lat}" lon="${pin.lng}">
    <name>${pin.name}</name>
    <sym>${pin.iconType}</sym>
  </wpt>\n`;
  });

  // Track
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

window.exportGPX = exportGPX;

// ── Spectator Spots Layer ──
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
      html += `<button class="popup-directions-btn" onclick="openInMaps(${spot.lat}, ${spot.lng}, '${spot.name.replace(/'/g, "\\'")}')">🧭 Directions</button>
      </div>`;
      return html;
    });
    spectatorLayer.addLayer(marker);
  });

  spectatorLayer.addTo(map);
}

window.toggleSpectatorSpots = toggleSpectatorSpots;

// ── Stop Detail Panel ──
function openStopDetail(stopIndex) {
  const stop = TACO_BELL_STOPS[stopIndex];
  const meta = STOP_META[stopIndex];
  const wpt = GPX_WAYPOINTS[stopIndex];
  if (!stop || !meta) return;

  const panel = document.getElementById('stop-detail-panel');
  if (!panel) return;

  const dist = STOP_DISTANCES[stopIndex];
  const nextDist = stopIndex < STOP_DISTANCES.length - 2 ? (STOP_DISTANCES[stopIndex + 1] - dist).toFixed(1) : 'N/A';
  const isMandatory = stopIndex === 3 || stopIndex === 7;

  // Build rating pips
  function ratingPips(emoji, count) {
    return emoji.repeat(count) + '<span class="rating-empty">' + emoji.repeat(5 - count) + '</span>';
  }

  panel.innerHTML = `
    <div class="stop-detail-header">
      <button class="stop-detail-close" onclick="closeStopDetail()">&times;</button>
      <div class="stop-detail-num ${stopIndex === 0 ? 'start-finish' : ''}">${stopIndex === 0 ? 'S' : stop.num}</div>
      <h3>${stop.label}</h3>
      ${isMandatory ? '<span class="stop-detail-badge">🌮 Mandatory Food Stop</span>' : ''}
    </div>
    <div class="stop-detail-body">
      <div class="stop-detail-stats">
        <div class="stop-detail-stat"><span class="stat-label">Distance</span><span class="stat-value">${dist} mi</span></div>
        <div class="stop-detail-stat"><span class="stat-label">To Next Stop</span><span class="stat-value">${nextDist} mi</span></div>
      </div>
      <div class="stop-detail-ratings">
        <div class="rating-row" title="Relative cost in Bean Burrito equivalents"><span class="rating-label">🌯 Price</span><span class="rating-pips">${ratingPips('🌯', meta.burritoRating)}</span></div>
        <div class="rating-row" title="Overall stop experience"><span class="rating-label">🌮 Vibe</span><span class="rating-pips">${ratingPips('🌮', meta.tacoRating)}</span></div>
        <div class="rating-row" title="Odds of keeping food down"><span class="rating-label">🤢 Risk</span><span class="rating-pips">${ratingPips('🤢', 6 - meta.vomitRisk)}</span></div>
      </div>
      <p class="stop-detail-vibe">${meta.vibeNote}</p>
      <div class="stop-detail-crew">
        <h4>🅿️ Crew & Spectator Access</h4>
        <p>${meta.crewAccess}</p>
      </div>
      <details class="stop-detail-trivia">
        <summary>📖 Taco Bell Trivia</summary>
        <p>${meta.trivia}</p>
      </details>
      <details class="stop-detail-menu">
        <summary>🌮 Menu & Calories</summary>
        ${buildMenuPanel(stopIndex)}
      </details>
      <button class="popup-directions-btn" onclick="openInMaps(${wpt.lat}, ${wpt.lon}, '${stop.label.replace(/'/g, "\\'")}')">🧭 Directions</button>
    </div>
  `;

  panel.classList.remove('hidden');
  detailPanelOpen = true;
}

window.openStopDetail = openStopDetail;

function closeStopDetail() {
  const panel = document.getElementById('stop-detail-panel');
  if (panel) panel.classList.add('hidden');
  detailPanelOpen = false;
}

window.closeStopDetail = closeStopDetail;

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

// Track achievement triggers
function trackAchievement(key) {
  const wasBefore = localStorage.getItem(key) === 'true';
  localStorage.setItem(key, 'true');
  if (!wasBefore && audioEnabled) playAchievementSound();
}

// ── Pin Category Filtering ──
function buildPinFilters() {
  const container = document.getElementById('pin-filters');
  if (!container) return;

  const categories = Object.entries(PIN_ICONS);
  let html = '<div class="pin-filter-row">';
  categories.forEach(([key, emoji]) => {
    html += `<button class="pin-filter-btn active" data-category="${key}" title="Toggle ${key} pins" onclick="togglePinCategory('${key}', this)">${emoji}</button>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

const hiddenPinCategories = new Set();

function togglePinCategory(category, btn) {
  if (hiddenPinCategories.has(category)) {
    hiddenPinCategories.delete(category);
    btn.classList.add('active');
  } else {
    hiddenPinCategories.add(category);
    btn.classList.remove('active');
  }
  // Show/hide matching markers
  pinMarkers.forEach(m => {
    const pin = customPins.find(p => p.id === m.pinId);
    if (!pin) return;
    if (hiddenPinCategories.has(pin.iconType)) {
      map.removeLayer(m);
    } else {
      m.addTo(map);
    }
  });
}

window.togglePinCategory = togglePinCategory;

// ── Shareable Pin Sets via URL ──
function encodePinsToURL() {
  if (customPins.length === 0) {
    alert('No pins to share. Place some pins first!');
    return;
  }
  const data = customPins.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)},${encodeURIComponent(p.iconType)},${encodeURIComponent(p.name)}`).join(';');
  const url = `${window.location.origin}${window.location.pathname}#pins=${data}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-share-pins');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }).catch(() => {
    prompt('Copy this URL to share your pins:', url);
  });
}

window.encodePinsToURL = encodePinsToURL;

// ── Runner / Crew View Toggle ──
window.TB_VIEW_MODE = localStorage.getItem('tb50k_view_mode') || 'runner';

function getViewMode() {
  return window.TB_VIEW_MODE;
}

function initViewToggle() {
  const toggle = document.getElementById('view-toggle');
  if (!toggle) return;

  // Restore saved state
  const saved = localStorage.getItem('tb50k_view_mode') || 'runner';
  window.TB_VIEW_MODE = saved;
  toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === saved);
  });

  // Wire up click handlers
  toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.view;
      window.TB_VIEW_MODE = mode;
      localStorage.setItem('tb50k_view_mode', mode);
      toggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Refresh block party and spectator popups if layers are on
      if (blockPartyToggleOn) {
        toggleBlockParties(); // off
        toggleBlockParties(); // re-create with new view mode
      }
      if (spectatorToggleOn) {
        toggleSpectatorSpots(); // off
        toggleSpectatorSpots(); // re-create with new view mode
      }
    });
  });

  // Auto-set based on auth role when signed in
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

// Runner-facing amenity subset
const RUNNER_AMENITIES = ['water', 'snacks', 'music', 'ice', 'portapotty', 'medical'];

// ── Block Parties ──
const BLOCK_PARTY_CACHE_KEY = 'tb50k_block_parties';
const BLOCK_PARTY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const AMENITY_EMOJI = {
  beer: '🍺', shots: '🥃', snacks: '🌮', water: '💧', music: '🎵',
  chairs: '🪑', ice: '🧊', portapotty: '🚽', tattoos: '🎨',
  dogs: '🐶', medical: '🏥', family: '👨‍👩‍👧',
};

function loadBlockParties() {
  // Check cache
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
      // Open popup if party layer is on
      if (blockPartyLayer) {
        blockPartyLayer.eachLayer(l => {
          if (l.getLatLng && Math.abs(l.getLatLng().lat - lat) < 0.001) {
            l.openPopup();
          }
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

window.toggleBlockParties = toggleBlockParties;

function buildBlockPartyPopup(party) {
  const isCrew = getViewMode() === 'crew';
  const amenities = party.amenities || [];

  // Runner view: only show runner-relevant amenities
  const filteredAmenities = isCrew ? amenities : amenities.filter(a => RUNNER_AMENITIES.includes(a));
  const amenityBadges = filteredAmenities.map(a => AMENITY_EMOJI[a] || '').join(' ');

  let html = `<div class="popup-content">
    <h3>🎉 ${party.name}</h3>
    <p><strong>Mile ${party.mile_marker}</strong> — Hosted by ${party.host}</p>`;

  if (party.runner_note) {
    html += `<p>${party.runner_note}</p>`;
  }

  if (isCrew && party.crew_note) {
    html += `<p><em>🧑‍🤝‍🧑 ${party.crew_note}</em></p>`;
  }

  if (amenityBadges) {
    html += `<p>${amenityBadges}</p>`;
  }

  html += `<button class="popup-directions-btn" onclick="openInMaps(${party.lat}, ${party.lng}, '${party.name.replace(/'/g, "\\'")}')">🧭 Directions</button>
  </div>`;
  return html;
}

// ── Shareable Race Card Image ──
function showRaceCard() {
  // Remove existing if any
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
          <span class="race-card-stat-value">${elevationData ? Math.round(Math.max(...elevationData.elevations)) + ' ft' : '~400 ft'}</span>
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

window.showRaceCard = showRaceCard;

// ── Location Search (Nominatim Geocoding) ──
let searchTimeout = null;

function searchLocation(query) {
  if (!query || query.length < 3) return;

  const resultsDiv = document.getElementById('search-results');
  if (!resultsDiv) return;
  resultsDiv.innerHTML = '<p class="hint">Searching...</p>';

  // Rate limit: 1 req/sec for Nominatim
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const bbox = '38.75,-77.20,38.95,-76.95'; // DC/Arlington/Alexandria area
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=-77.20,38.75,-76.95,38.95&bounded=1&limit=5`;

    fetch(url, {
      headers: { 'User-Agent': 'TacoBellDC50K-RoutePlanner' },
    })
      .then(r => r.json())
      .then(results => {
        if (!results.length) {
          resultsDiv.innerHTML = '<p class="hint">No results found.</p>';
          return;
        }

        let html = '';
        results.forEach(r => {
          const shortName = r.display_name.split(',').slice(0, 3).join(',');
          html += `<div class="search-result" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${shortName}">
            <span class="search-result-name">${shortName}</span>
          </div>`;
        });
        resultsDiv.innerHTML = html;

        resultsDiv.querySelectorAll('.search-result').forEach(item => {
          item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.dataset.name;
            map.flyTo([lat, lon], 16, { duration: 1.2 });
            resultsDiv.innerHTML = '';
            document.getElementById('search-input').value = '';

            // Offer to add a pin
            if (confirm(`Add a pin at "${name}"?`)) {
              const pin = {
                id: Date.now(),
                name: name.split(',')[0],
                iconType: 'custom',
                lat: lat,
                lng: lon,
              };
              customPins.push(pin);
              addPinToMap(pin);
              addPinToSidebar(pin);
              saveCustomPins();
              buildPinFilters();
            }
          });
        });
      })
      .catch(err => {
        console.warn('Geocoding failed:', err);
        resultsDiv.innerHTML = '<p class="hint">Search failed. Try again.</p>';
      });
  }, 500); // debounce
}

window.searchLocation = searchLocation;

// ── Draggable Pins ──
function makePinDraggable(marker, pin) {
  marker.dragging.enable();

  marker.on('dragend', () => {
    const newPos = marker.getLatLng();
    pin.lat = newPos.lat;
    pin.lng = newPos.lng;
    saveCustomPins();

    // Update popup content
    const emoji = PIN_ICONS[pin.iconType];
    const safeName = escapeHtml(pin.name);
    marker.setPopupContent(`<div class="popup-content">
      <h3>${emoji} ${safeName}</h3>
      <p>${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</p>
      <button class="popup-directions-btn" onclick="openInMaps(${pin.lat}, ${pin.lng}, '${safeName.replace(/'/g, "\\'")}')">🧭 Directions</button>
    </div>`);
  });
}

// ── Split History (Race Mode) ──
let splitHistory = [];

function recordSplit(stopIndex) {
  const now = new Date();
  const existing = splitHistory.find(s => s.stopIndex === stopIndex);
  if (existing) return; // Already recorded

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
    html += '<button class="tool-btn" style="margin-top:8px;font-size:0.72rem;" onclick="clearSplits()">Clear Splits</button>';
  }

  container.innerHTML = html;
}

function formatElapsed(startISO, endISO) {
  const diff = (new Date(endISO) - new Date(startISO)) / 60000; // minutes
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function clearSplits() {
  splitHistory = [];
  localStorage.removeItem('tb50k_splits');
  renderSplitHistory();
}

window.clearSplits = clearSplits;

function loadSplitHistory() {
  try {
    splitHistory = JSON.parse(localStorage.getItem('tb50k_splits') || '[]');
  } catch (e) { splitHistory = []; }
  renderSplitHistory();
}

// ── Taco Bell Audio Cheers ──
let audioCtx = null;

function playTacoBellBong() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create a fun "bong" sound like the TB bell
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(261.63, audioCtx.currentTime + 0.3); // C4

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.6);

    // Second harmonic for richness
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(784.0, audioCtx.currentTime); // G5
    osc2.frequency.exponentialRampToValueAtTime(392.0, audioCtx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Audio not supported — silent fail
  }
}

function playAchievementSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Quick ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
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

// Audio preference toggle
let audioEnabled = localStorage.getItem('tb50k_audio') !== 'false'; // default on

function toggleAudio() {
  audioEnabled = !audioEnabled;
  localStorage.setItem('tb50k_audio', audioEnabled);
  const btn = document.getElementById('btn-audio-toggle');
  if (btn) {
    btn.textContent = audioEnabled ? '🔔 Cheers On' : '🔕 Cheers Off';
    btn.classList.toggle('active', audioEnabled);
  }
}

window.toggleAudio = toggleAudio;

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

function loadPinsFromURL() {
  const hash = window.location.hash;
  if (!hash.startsWith('#pins=')) return;
  const data = hash.substring(6);
  const entries = data.split(';');
  let imported = 0;
  entries.forEach(entry => {
    const parts = entry.split(',');
    if (parts.length < 4) return;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    const iconType = decodeURIComponent(parts[2]);
    // Rejoin remaining parts in case the name itself contained commas
    const name = decodeURIComponent(parts.slice(3).join(','));
    if (isNaN(lat) || isNaN(lng)) return;
    // Check for duplicate
    if (customPins.some(p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001)) return;
    const pin = { id: Date.now() + imported, name, iconType, lat, lng };
    customPins.push(pin);
    addPinToMap(pin);
    addPinToSidebar(pin);
    imported++;
  });
  if (imported > 0) {
    saveCustomPins();
    // Clear hash after import
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// ── Offline Tile Caching ──
function lat2tile(lat, zoom) { return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)); }
function lon2tile(lon, zoom) { return Math.floor((lon + 180) / 360 * Math.pow(2, zoom)); }

function cacheOfflineTiles() {
  const btn = document.getElementById('btn-offline-tiles');
  if (!btn) return;

  // Route bounding box with padding
  const bounds = routeLayer.getBounds().pad(0.1);
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLng = bounds.getWest();
  const maxLng = bounds.getEast();

  // Collect tile URLs for zoom 13-16 on CARTO Dark (default theme tiles)
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const subdomains = ['a', 'b', 'c', 'd'];
  const urls = [];

  for (let z = 13; z <= 16; z++) {
    const xMin = lon2tile(minLng, z);
    const xMax = lon2tile(maxLng, z);
    const yMin = lat2tile(maxLat, z); // note: y is inverted
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
  let errors = 0;

  // Batch fetch to avoid overwhelming the browser
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
          if (existing) { done++; return; } // already cached
          return fetch(url).then(resp => {
            if (resp.ok) { cache.put(url, resp); }
            done++;
          });
        });
      }).catch(() => { errors++; done++; });
    })).then(() => {
      btn.textContent = `Caching ${done}/${total}...`;
      // Use requestAnimationFrame to avoid blocking UI
      requestAnimationFrame(fetchBatch);
    });
  }

  fetchBatch();
}

window.cacheOfflineTiles = cacheOfflineTiles;

// ── Taco Bell Menu Data (calories + prices for calorie tracker) ──
const TB_MENU_DATA = [
  { name: 'Chalupa Supreme', cal: 350, price: 4.19, category: 'entree' },
  { name: 'Crunchwrap Supreme', cal: 530, price: 5.49, category: 'entree' },
  { name: 'Burrito Supreme', cal: 390, price: 4.49, category: 'entree' },
  { name: 'Nachos Bell Grande', cal: 740, price: 5.49, category: 'entree' },
  { name: 'Cheesy Gordita Crunch', cal: 500, price: 4.99, category: 'entree' },
  { name: 'Mexican Pizza', cal: 540, price: 5.49, category: 'entree' },
  { name: 'Crunchy Taco', cal: 170, price: 1.79, category: 'taco' },
  { name: 'Soft Taco', cal: 180, price: 1.79, category: 'taco' },
  { name: 'Bean Burrito', cal: 380, price: 1.49, category: 'value' },
  { name: 'Quesadilla', cal: 470, price: 4.49, category: 'entree' },
  { name: 'Cinnamon Twists', cal: 170, price: 1.49, category: 'side' },
  { name: 'Baja Blast', cal: 220, price: 2.29, category: 'drink' },
  { name: 'Mountain Dew', cal: 220, price: 2.29, category: 'drink' },
  { name: 'Water', cal: 0, price: 0, category: 'drink' },
];

function buildMenuPanel(stopIndex) {
  const isMandatory3 = stopIndex === 3;
  const isMandatory7 = stopIndex === 7;
  let html = '<div class="menu-panel"><h4>🌮 Menu</h4>';

  if (isMandatory3) {
    html += '<p class="menu-mandatory">⚠️ Must order: Chalupa Supreme or Crunchwrap</p>';
  } else if (isMandatory7) {
    html += '<p class="menu-mandatory">⚠️ Must order: Burrito Supreme or Nachos Bell Grande</p>';
  }

  html += '<div class="menu-items">';
  TB_MENU_DATA.forEach(item => {
    const highlight = (isMandatory3 && (item.name === 'Chalupa Supreme' || item.name === 'Crunchwrap Supreme')) ||
                      (isMandatory7 && (item.name === 'Burrito Supreme' || item.name === 'Nachos Bell Grande'));
    html += `<div class="menu-item ${highlight ? 'mandatory-highlight' : ''}">
      <span class="menu-item-name">${item.name}</span>
      <span class="menu-item-cal">${item.cal} cal</span>
      <span class="menu-item-price">${item.price > 0 ? '$' + item.price.toFixed(2) : 'Free'}</span>
    </div>`;
  });
  html += '</div></div>';
  return html;
}

// ── Calorie Tracker ──
// Estimated calories burned per mile for an average runner (varies by weight/pace)
const CALORIES_PER_MILE = 100; // ~100 cal/mile for 150lb runner

function buildCalorieTracker() {
  const container = document.getElementById('calorie-tracker-content');
  if (!container) return;

  // Consumed: sum up calories from checked food tracker items
  const consumed = getConsumedCalories();

  // Burned: from pace calculator distance (or total race distance)
  const burned = getBurnedCalories();

  const net = consumed - burned;

  let html = '<div class="calorie-summary">';
  html += `<div class="calorie-stat"><span class="calorie-label">🍔 Consumed</span><span class="calorie-value">${consumed} cal</span></div>`;
  html += `<div class="calorie-stat"><span class="calorie-label">🔥 Burned (est.)</span><span class="calorie-value">${burned} cal</span></div>`;
  html += `<div class="calorie-stat net ${net >= 0 ? 'positive' : 'negative'}"><span class="calorie-label">📊 Net</span><span class="calorie-value">${net >= 0 ? '+' : ''}${net} cal</span></div>`;
  html += '</div>';

  // Food item breakdown
  const checkedItems = getCheckedFoodItems();
  if (checkedItems.length > 0) {
    html += '<div class="calorie-breakdown"><h4>Food Log</h4>';
    checkedItems.forEach(item => {
      html += `<div class="calorie-item"><span>${item.name}</span><span>${item.cal} cal</span></div>`;
    });
    html += '</div>';
  } else {
    html += '<p class="hint">Check off food items in the Mandatory Food section or use the Food Log to track calories.</p>';
  }

  // Burn estimate note
  html += `<p class="hint" style="margin-top:8px;font-size:0.65rem;">Burn estimate: ~${CALORIES_PER_MILE} cal/mile for 150lb runner at moderate pace. Distance: ${getEstimatedDistance().toFixed(1)} mi.</p>`;

  container.innerHTML = html;
}

function getConsumedCalories() {
  let total = 0;
  // Check mandatory food tracker
  const rule1 = localStorage.getItem('tb50k_food_rule_1') === 'true';
  const rule2 = localStorage.getItem('tb50k_food_rule_2') === 'true';
  if (rule1) {
    // Assume average of Chalupa Supreme (350) and Crunchwrap (530) = 440
    total += 440;
  }
  if (rule2) {
    // Assume average of Burrito Supreme (390) and Nachos BG (740) = 565
    total += 565;
  }

  // Check calorie log items stored in localStorage
  try {
    const logged = JSON.parse(localStorage.getItem('tb50k_calorie_log') || '[]');
    logged.forEach(item => {
      const menuItem = TB_MENU_DATA.find(m => m.name === item);
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
      const menuItem = TB_MENU_DATA.find(m => m.name === name);
      if (menuItem) items.push({ name: menuItem.name, cal: menuItem.cal });
    });
  } catch (e) { /* ignore */ }

  return items;
}

function getBurnedCalories() {
  return Math.round(getEstimatedDistance() * CALORIES_PER_MILE);
}

function getEstimatedDistance() {
  // If race mode has recorded splits, use the last split distance
  try {
    const splits = JSON.parse(localStorage.getItem('tb50k_splits') || '[]');
    if (splits.length > 0) {
      const lastSplit = splits[splits.length - 1];
      if (lastSplit.distance) return parseFloat(lastSplit.distance);
    }
  } catch (e) { /* ignore */ }

  // Default to total race distance
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

window.addCalorieLogItem = addCalorieLogItem;
window.clearCalorieLog = clearCalorieLog;

// ── Calorie Log Quick-Add UI ──
function buildCalorieLogForm() {
  const container = document.getElementById('calorie-log-form');
  if (!container) return;

  let html = '<select id="calorie-item-select">';
  TB_MENU_DATA.forEach(item => {
    html += `<option value="${item.name}">${item.name} (${item.cal} cal)</option>`;
  });
  html += '</select>';
  html += '<button class="tool-btn" onclick="addCalorieLogItem(document.getElementById(\'calorie-item-select\').value)">+ Add</button>';
  html += ' <button class="tool-btn" onclick="clearCalorieLog()">Clear</button>';

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

// ── Strava Segment Deep-Links ──
// Strava segment IDs for each course section (approximate Strava segments along the route)
const STRAVA_SEGMENTS = {
  'Old Town Stroll': null,
  'The Van Dorn Shuffle': null,
  'Arlington Long Haul': null,
  'The Georgetown Climb': null,
  'DC Entry Push': null,
  'The Capitol Grind': null,
  'The Final Push': null,
};

// Enhance course section list items with Strava links when segment IDs are available
function addStravaLinks() {
  const items = document.querySelectorAll('.course-section-item');
  items.forEach(item => {
    const name = item.dataset.sectionName;
    const segmentId = STRAVA_SEGMENTS[name];
    if (segmentId) {
      const link = document.createElement('a');
      link.href = `https://www.strava.com/segments/${segmentId}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'strava-link';
      link.textContent = '🏃 Strava';
      link.title = 'View on Strava';
      item.querySelector('.course-section-header')?.appendChild(link);
    }
  });
}

// ── Alternative Route Suggestions ──
// Static alternative route variants for key legs
const ALT_ROUTES = [
  {
    id: 'alt-arlington-scenic',
    name: 'W&OD Trail Scenic',
    leg: 'Stop 1 → Stop 2',
    legIndex: 1, // corresponds to STOP_DISTANCES index range 1→2
    description: 'Follow the W&OD Trail through Falls Church. Paved bike path, flat, tree-lined. Slightly longer but no traffic.',
    distanceMi: 8.2,
    mainDistanceMi: 7.6,
    color: '#22d3ee',
    coords: [
      [38.8111, -77.1324], // Stop 1
      [38.8145, -77.1280],
      [38.8200, -77.1200],
      [38.8280, -77.1150],
      [38.8350, -77.1180],
      [38.8420, -77.1220],
      [38.8500, -77.1250],
      [38.8560, -77.1280],
      [38.8630, -77.1310],
      [38.8700, -77.1340],
      [38.8760, -77.1350],
      [38.8830, -77.1340],
      [38.8890, -77.1310],
      [38.8930, -77.1290],
      [38.8967, -77.1288], // Stop 2
    ],
  },
  {
    id: 'alt-georgetown-river',
    name: 'Potomac River Path',
    leg: 'Stop 2 → Stop 3',
    legIndex: 2,
    description: 'Drop south to the Potomac Heritage Trail along the river. Flatter than the Georgetown Climb but adds distance. Scenic waterfront views.',
    distanceMi: 3.4,
    mainDistanceMi: 2.8,
    color: '#34d399',
    coords: [
      [38.8967, -77.1288], // Stop 2
      [38.8950, -77.1200],
      [38.8920, -77.1120],
      [38.8880, -77.1050],
      [38.8870, -77.0980],
      [38.8860, -77.0920],
      [38.8870, -77.0880],
      [38.8900, -77.0850],
      [38.8921, -77.0836], // Stop 3
    ],
  },
  {
    id: 'alt-capitol-mall',
    name: 'National Mall Route',
    leg: 'Stop 5 → Stop 7',
    legIndex: 5, // U St to Union Station (skipping Chinatown)
    description: 'South to the National Mall, past the Capitol, then to Union Station. More iconic but exposed — no shade, more tourists.',
    distanceMi: 4.1,
    mainDistanceMi: 3.5,
    color: '#fbbf24',
    coords: [
      [38.9169, -77.0325], // Stop 5 (U St)
      [38.9120, -77.0300],
      [38.9070, -77.0280],
      [38.9020, -77.0250],
      [38.8970, -77.0230],
      [38.8920, -77.0200],
      [38.8890, -77.0170],
      [38.8880, -77.0130],
      [38.8900, -77.0100],
      [38.8930, -77.0080],
      [38.8960, -77.0065],
      [38.8982, -77.0062], // Stop 7 (Union Station)
    ],
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

  // Click to fly to alt route midpoint
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

window.toggleAltRoutes = toggleAltRoutes;

// ── Community Training Heatmap Overlay ──
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

  // Generate heatmap from GPX track data
  // Weight points based on proximity to stops and popular training areas
  heatmapLayer = L.layerGroup();

  // Sample every Nth point for performance
  const sampleRate = Math.max(1, Math.floor(GPX_TRACK.length / 200));
  const points = [];
  for (let i = 0; i < GPX_TRACK.length; i += sampleRate) {
    points.push(GPX_TRACK[i]);
  }

  // Assign intensity weights: higher near stops and key landmarks
  // haversine([lat1,lon1],[lat2,lon2]) returns meters
  const weightedPoints = points.map(pt => {
    let weight = 0.3; // base weight (less-trained areas)

    // Boost near Taco Bell stops (runners train these sections more)
    GPX_WAYPOINTS.forEach(wpt => {
      const dMeters = haversine(pt, [wpt.lat, wpt.lon]);
      const dMi = dMeters / 1609.34;
      if (dMi < 1.0) weight += 0.4 * (1 - dMi / 1.0);
      if (dMi < 0.3) weight += 0.3;
    });

    // Boost near start/finish (most trained area)
    const dStartM = haversine(pt, [GPX_WAYPOINTS[0].lat, GPX_WAYPOINTS[0].lon]);
    const dStartMi = dStartM / 1609.34;
    if (dStartMi < 2.0) weight += 0.3 * (1 - dStartMi / 2.0);

    // Boost popular trail sections (Arlington/Georgetown)
    if (pt[0] > 38.86 && pt[0] < 38.91 && pt[1] > -77.14 && pt[1] < -77.08) {
      weight += 0.2; // Arlington trail corridor
    }

    // Cap at 1.0
    weight = Math.min(1.0, weight);
    return { lat: pt[0], lng: pt[1], weight };
  });

  // Render as semi-transparent circles with color based on weight
  weightedPoints.forEach(wp => {
    const radius = 120 + wp.weight * 180; // 120-300m
    const opacity = 0.15 + wp.weight * 0.25; // 0.15-0.40

    // Color gradient: blue (low) → yellow (mid) → red (high)
    let color;
    if (wp.weight < 0.4) {
      color = '#3b82f6'; // blue
    } else if (wp.weight < 0.6) {
      color = '#eab308'; // yellow
    } else if (wp.weight < 0.8) {
      color = '#f97316'; // orange
    } else {
      color = '#ef4444'; // red
    }

    const circle = L.circle([wp.lat, wp.lng], {
      radius: radius,
      color: 'transparent',
      fillColor: color,
      fillOpacity: opacity,
      interactive: false,
    });
    heatmapLayer.addLayer(circle);
  });

  heatmapLayer.addTo(map);
}

window.toggleHeatmap = toggleHeatmap;

