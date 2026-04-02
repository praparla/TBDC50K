// ── Taco Bell DC 50K Route Planner — Core Orchestration ──
// This file contains: constants, theme system, map init, route loading,
// shared utilities, and DOMContentLoaded orchestration.
// Feature modules: stops.js, pins.js, pace.js, race.js, tools.js, elevation.js

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

// ── Global State (shared across modules) ──
let map;
let tileLayer;
let routeLayer;
let stopMarkers = [];
let currentThemeId = DEFAULT_THEME;
let layerControl = null;

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

// ── Runner / Crew View ──
window.TB_VIEW_MODE = localStorage.getItem('tb50k_view_mode') || 'runner';

function getViewMode() {
  return window.TB_VIEW_MODE;
}

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
window.openInMaps = openInMaps;

// Helper: returns HTML for a directions button (used in 7+ popups/panels)
function directionsBtn(lat, lng, label) {
  const safe = (label || 'Pin').replace(/'/g, "\\'");
  return `<button class="popup-directions-btn" onclick="openInMaps(${lat}, ${lng}, '${safe}')">🧭 Directions</button>`;
}

// ── Haversine (geodetic distance in meters) ──
function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);

  try {
    const tried = JSON.parse(localStorage.getItem('tb50k_themes_tried') || '[]');
    if (!tried.includes(theme.id)) { tried.push(theme.id); localStorage.setItem('tb50k_themes_tried', JSON.stringify(tried)); }
  } catch(e) { /* ignore */ }
  TB_Events.emit('themeChanged', { themeId: theme.id });

  if (tileLayer) map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(theme.tileUrl, {
    attribution: theme.tileAttr,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  if (routeLayer) routeLayer.setStyle({ color: theme.routeColor });

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

// ── Map Initialization ──
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
  });

  const theme = getTheme(getThemeId());
  currentThemeId = theme.id;
  tileLayer = L.tileLayer(theme.tileUrl, {
    attribution: theme.tileAttr,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  map.on('click', TB_Pins.onMapClick);
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

  map.on('baselayerchange', (e) => {
    tileLayer = e.layer;
    localStorage.setItem('tb50k_tile_layer', e.name);
  });
}

// ── Load Route Data (from gpx_data.js) ──
function loadGPX() {
  const theme = getTheme(currentThemeId);

  routeLayer = L.polyline(GPX_TRACK, {
    color: theme.routeColor,
    weight: 4,
    opacity: 0.85,
    smoothFactor: 1,
  }).addTo(map);

  addStopMarkers(GPX_WAYPOINTS);

  requestAnimationFrame(() => {
    map.invalidateSize();
    const padding = isMobile() ? 0.02 : 0.05;
    map.fitBounds(routeLayer.getBounds().pad(padding), { animate: false });
  });

  document.getElementById('map').classList.add('map-ready');
  updateRouteInfo(GPX_TRACK);
}

function addStopMarkers(wptCoords) {
  const stopsList = document.getElementById('stops-list');

  TACO_BELL_STOPS.forEach((stop, i) => {
    const wpt = wptCoords[i];
    if (!wpt) return;

    const isStartFinish = i === 0;
    const markerNum = isStartFinish ? 'S' : stop.num;

    const icon = L.divIcon({
      className: 'taco-bell-marker-wrapper',
      html: `<div class="taco-bell-marker ${isStartFinish ? 'start-finish' : ''}">${markerNum}</div>`,
      iconSize: [isStartFinish ? 32 : 28, isStartFinish ? 32 : 28],
      iconAnchor: [isStartFinish ? 16 : 14, isStartFinish ? 16 : 14],
    });

    const marker = L.marker([wpt.lat, wpt.lon], { icon }).addTo(map);
    marker.bindPopup(TB_Stops.buildStopPopup(i));

    stopMarkers.push(marker);

    const item = document.createElement('div');
    item.className = 'stop-item';
    item.innerHTML = `
      <div class="stop-number ${isStartFinish ? 'start-finish' : ''}">${markerNum}</div>
      <div class="stop-address">${wpt.name}</div>
    `;
    item.addEventListener('click', () => {
      map.flyTo([wpt.lat, wpt.lon], 15, { duration: 1.2 });
      marker.openPopup();
      TB_Stops.openStopDetail(i);
    });
    stopsList.appendChild(item);
  });
}

// ── Route Info ──
function updateRouteInfo(coords) {
  const routeMiles = STOP_DISTANCES[STOP_DISTANCES.length - 1];
  const info = document.getElementById('route-info');
  info.innerHTML = `
    <strong>Route Distance:</strong> ${routeMiles} miles<br>
    <strong>Track Points:</strong> ${coords.length}<br>
    <strong>Stops:</strong> 8 Taco Bells + Start/Finish<br>
    <strong>Time Limit:</strong> 11 hours<br>
    <strong>Date:</strong> Nov 27, 2026
  `;
}

// ── Section Tabs (reusable) ──
function setupSectionTabs() {
  document.querySelectorAll('.food-tabs').forEach(tabBar => {
    const tabs = tabBar.querySelectorAll('.food-tab');
    const section = tabBar.closest('.section-body') || tabBar.parentElement;
    const panels = section.querySelectorAll('.food-tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(tab.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  });
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
    resizeTimer = setTimeout(() => map.invalidateSize(), 150);
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

// ── Elevation: backward-compat shims ──
function fetchElevation() { TB_Elevation.init(); }
function getGAPFactors() { return TB_Elevation.getGAPFactors(); }
function getGrade(i, j) { return TB_Elevation.getGrade(i, j); }
function gradeToColor(grade) { return TB_Elevation.gradeToColor(grade); }

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  buildThemePicker();
  loadGPX();
  TB_Pins.loadCustomPins();
  TB_Pins.setupEventListeners();
  setupMobileCollapsibleSections();
  handleOrientationAndResize();
  TB_Pins.resetAddButton();
  TB_Pace.buildFoodTracker();
  setupSectionTabs();
  TB_Pace.restorePaceInputs();

  TB_Pace.buildSegments();
  TB_Race.restoreCountdownInputs();
  TB_Tools.loadWeather();
  TB_Tools.applySaucePacketCopy();
  TB_Tools.buildCourseSectionsList();
  TB_Tools.buildPassport();
  TB_Pins.buildPinFilters();
  TB_Pins.loadPinsFromURL();
  TB_Tools.loadBlockParties();
  fetchElevation();
  TB_Race.loadSplitHistory();
  TB_Tools.buildFinisherWall();
  TB_Pace.buildCalorieTracker();
  TB_Pace.buildCalorieLogForm();
  TB_Tools.buildSegmentLeaderboard();
  TB_Race.updateRaceResultsVisibility();
  TB_Tools.renderAltRoutesSidebar(false);

  TB_Tools.initViewToggle();

  // ── Event Bus Subscriptions ──
  TB_Events.on('themeChanged', () => { TB_Tools.buildPassport(); TB_Tools.applySaucePacketCopy(); });
  TB_Events.on('paceCalculated', () => TB_Tools.buildPassport());
  TB_Events.on('foodRuleChanged', () => TB_Tools.buildPassport());
  TB_Events.on('pinSaved', () => TB_Tools.buildPassport());
  TB_Events.on('achievementUnlocked', () => TB_Tools.buildPassport());

  // Countdown start time → refresh pace calculator (ISSUE-018)
  TB_Events.on('startTimeChanged', () => {
    const paceH = document.getElementById('pace-hours');
    const paceM = document.getElementById('pace-minutes');
    if (paceH && paceM && (paceH.value || paceM.value)) {
      TB_Pace.calculatePace();
    }
  });

  // View mode change → refresh map layers that depend on runner/crew view
  TB_Events.on('viewModeChanged', () => {
    if (TB_Tools.blockPartyToggleOn) {
      TB_Tools.toggleBlockParties(); // off
      TB_Tools.toggleBlockParties(); // re-create with new view mode
    }
    if (TB_Tools.spectatorToggleOn) {
      TB_Tools.toggleSpectatorSpots(); // off
      TB_Tools.toggleSpectatorSpots(); // re-create with new view mode
    }
  });

  // Initialize backend features (graceful degradation — works without these scripts)
  if (typeof TB_AUTH !== 'undefined') TB_AUTH.init();
  if (typeof TB_FOOD_LOG !== 'undefined') TB_FOOD_LOG.init();
  if (typeof TB_SOCIAL_FEED !== 'undefined') TB_SOCIAL_FEED.init();
  if (typeof TB_PARTIES !== 'undefined') TB_PARTIES.init();
  if (typeof TB_BETTING !== 'undefined') TB_BETTING.init();
  if (typeof TB_PREFS_SYNC !== 'undefined') TB_PREFS_SYNC.init();
});
