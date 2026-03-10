// ── Taco Bell DC 50K Route Planner ──

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

let map;
let routeLayer;
let stopMarkers = [];
let pinMarkers = [];
let pendingPinLatLng = null;
let customPins = [];

// ── Device Detection ──
function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadGPX();
  loadCustomPins();
  setupEventListeners();
  setupMobileCollapsibleSections();
  handleOrientationAndResize();
  resetAddButton();
});

function initMap() {
  map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
  }).setView([38.87, -77.05], 12);

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Map click handler for adding pins
  map.on('click', onMapClick);
}

// ── Load Route Data (from gpx_data.js) ──
function loadGPX() {
  // Draw route from embedded track data
  routeLayer = L.polyline(GPX_TRACK, {
    color: '#a78bfa',
    weight: 4,
    opacity: 0.85,
    smoothFactor: 1,
  }).addTo(map);

  // Add Taco Bell stop markers from embedded waypoints
  addStopMarkers(GPX_WAYPOINTS);

  // Fit map to route — defer so Leaflet has correct container size
  // Mobile needs longer delay for layout to settle
  const delay = isMobile() ? 300 : 100;
  setTimeout(() => {
    map.invalidateSize();
    const padding = isMobile() ? 0.02 : 0.05;
    map.fitBounds(routeLayer.getBounds().pad(padding));
  }, delay);

  // Calculate route info
  updateRouteInfo(GPX_TRACK);
}

function addStopMarkers(wptCoords) {
  const stopsList = document.getElementById('stops-list');

  // First waypoint = start/finish (Cantina on King St)
  // Remaining waypoints = stops 1-7
  // Stop 0 (start/finish) maps to wptCoords[0]
  // Stops 1-7 map to wptCoords[1-7]

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
      map.setView([wpt.lat, wpt.lon], 15);
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

  // Hide context menu on map click
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
  const emoji = PIN_ICONS[iconType];

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
    map.setView([pin.lat, pin.lng], 16);
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
      if (!isMobile()) return;
      const section = h2.closest('.section');
      section.classList.toggle('collapsed');
      // After collapsing/expanding, the map may need to recalculate its size
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
  // Some mobile browsers fire orientationchange separately
  window.addEventListener('orientationchange', () => {
    setTimeout(() => map.invalidateSize(), 300);
  });

  // On mobile, close sidebar popup when clicking a stop (focus the map)
  if (isMobile()) {
    document.querySelectorAll('.stop-item').forEach(item => {
      item.addEventListener('click', () => {
        // Let the map focus happen, then invalidate size
        setTimeout(() => map.invalidateSize(), 100);
      });
    });
  }
}
