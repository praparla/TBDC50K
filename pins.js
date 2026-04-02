// ── TB Pins — Custom pin CRUD, filters, URL sharing, search, drag ──
// Extracted from app.js. IIFE module, no build step.
// Depends on: PIN_ICONS, map, escapeHtml, directionsBtn, isMobile, haversine (app.js globals)
//             TB_Events (events.js)

const TB_Pins = window.TB_Pins = (() => {
  let customPins = [];
  let pinMarkers = [];
  let pendingPinLatLng = null;
  const hiddenPinCategories = new Set();
  let searchTimeout = null;

  // ── Pin CRUD ──

  function setupEventListeners() {
    const addBtn = document.getElementById('btn-add-pin');
    addBtn.addEventListener('click', () => {
      if (pendingPinLatLng) placePin(pendingPinLatLng);
    });

    document.getElementById('ctx-add-pin').addEventListener('click', () => {
      document.getElementById('context-menu').classList.add('hidden');
      if (pendingPinLatLng) placePin(pendingPinLatLng);
    });

    document.getElementById('ctx-cancel').addEventListener('click', () => {
      document.getElementById('context-menu').classList.add('hidden');
      pendingPinLatLng = null;
      resetAddButton();
    });

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
      ${directionsBtn(pin.lat, pin.lng, pin.name)}
    </div>`);

    marker.pinId = pin.id;
    pinMarkers.push(marker);
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
      const m = pinMarkers.find(m => m.pinId === pin.id);
      if (m) m.openPopup();
    });

    item.querySelector('.pin-delete').addEventListener('click', () => deletePin(pin.id));
    list.appendChild(item);
  }

  function deletePin(id) {
    customPins = customPins.filter(p => p.id !== id);
    saveCustomPins();

    const markerIdx = pinMarkers.findIndex(m => m.pinId === id);
    if (markerIdx !== -1) {
      map.removeLayer(pinMarkers[markerIdx]);
      pinMarkers.splice(markerIdx, 1);
    }

    const item = document.querySelector(`.pin-item[data-pin-id="${id}"]`);
    if (item) item.remove();
  }

  function resetAddButton() {
    const addBtn = document.getElementById('btn-add-pin');
    addBtn.disabled = true;
    addBtn.textContent = isMobile() ? 'Tap Map to Place Pin' : 'Click Map to Place Pin';
    addBtn.classList.remove('ready');
  }

  // ── Draggable Pins ──

  function makePinDraggable(marker, pin) {
    marker.dragging.enable();
    marker.on('dragend', () => {
      const newPos = marker.getLatLng();
      pin.lat = newPos.lat;
      pin.lng = newPos.lng;
      saveCustomPins();

      const emoji = PIN_ICONS[pin.iconType];
      const safeName = escapeHtml(pin.name);
      marker.setPopupContent(`<div class="popup-content">
        <h3>${emoji} ${safeName}</h3>
        <p>${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}</p>
        ${directionsBtn(pin.lat, pin.lng, pin.name)}
      </div>`);
    });
  }

  // ── Pin Filters ──

  function buildPinFilters() {
    const container = document.getElementById('pin-filters');
    if (!container) return;

    const categories = Object.entries(PIN_ICONS);
    let html = '<div class="pin-filter-row">';
    categories.forEach(([key, emoji]) => {
      html += `<button class="pin-filter-btn active" data-category="${key}" title="Toggle ${key} pins" onclick="TB_Pins.togglePinCategory('${key}', this)">${emoji}</button>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function togglePinCategory(category, btn) {
    if (hiddenPinCategories.has(category)) {
      hiddenPinCategories.delete(category);
      btn.classList.add('active');
    } else {
      hiddenPinCategories.add(category);
      btn.classList.remove('active');
    }
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
      const name = decodeURIComponent(parts.slice(3).join(','));
      if (isNaN(lat) || isNaN(lng)) return;
      if (customPins.some(p => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001)) return;
      const pin = { id: Date.now() + imported, name, iconType, lat, lng };
      customPins.push(pin);
      addPinToMap(pin);
      addPinToSidebar(pin);
      imported++;
    });
    if (imported > 0) {
      saveCustomPins();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // ── Location Search (Nominatim Geocoding) ──

  function searchLocation(query) {
    if (!query || query.length < 3) return;

    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<p class="hint">Searching...</p>';

    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
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
    }, 500);
  }

  // ── LocalStorage ──

  function saveCustomPins() {
    localStorage.setItem('tb50k_pins', JSON.stringify(customPins));
    TB_Events.emit('pinSaved');
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

  // ── Public API ──
  return {
    get pins() { return customPins; },
    get markers() { return pinMarkers; },
    setupEventListeners,
    onMapClick,
    resetAddButton,
    loadCustomPins,
    buildPinFilters,
    loadPinsFromURL,
    encodePinsToURL,
    searchLocation,
    togglePinCategory,
  };
})();

// Backward-compat globals for inline onclick handlers
window.togglePinCategory = TB_Pins.togglePinCategory;
window.encodePinsToURL = TB_Pins.encodePinsToURL;
window.searchLocation = TB_Pins.searchLocation;
