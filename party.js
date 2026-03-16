// ── Taco Bell DC 50K — Party Hosting & Subscriptions ──
// Block party hosts claim spots on the map; subscribers get notified when parties go live.

const TB_PARTIES = (function () {
  let parties = [];
  let mySubscriptions = [];
  let partyLayer = null;
  let realtimeChannel = null;
  let placingPartyPin = false;
  let pendingPartyLatLng = null;

  function init() {
    TB_AUTH.onAuthChange(({ user, profile }) => {
      if (user && profile) {
        render();
        loadParties();
        subscribeRealtime();
      } else {
        renderLockedState();
        unsubscribeRealtime();
      }
    });
  }

  async function loadParties() {
    const { data, error } = await TB_DB.fetchParties();
    if (error) {
      console.error('Failed to load parties:', error);
      return;
    }
    parties = data || [];

    // Cache for offline
    try {
      localStorage.setItem('tb50k_cached_parties', JSON.stringify(parties));
    } catch (e) { /* full */ }

    // Load my subscriptions
    const { data: subs } = await TB_DB.fetchMySubscriptions();
    mySubscriptions = subs || [];

    renderPartyList();
    renderPartyMarkers();
  }

  function subscribeRealtime() {
    unsubscribeRealtime();
    realtimeChannel = TB_DB.subscribeParties((eventType, newData, oldData) => {
      if (eventType === 'INSERT') {
        parties.push(newData);
      } else if (eventType === 'UPDATE') {
        const idx = parties.findIndex(p => p.id === newData.id);
        if (idx !== -1) {
          parties[idx] = { ...parties[idx], ...newData };
          // Notify if a subscribed party went live
          if (newData.is_live && mySubscriptions.includes(newData.id)) {
            showPartyLiveNotification(parties[idx]);
          }
        }
      } else if (eventType === 'DELETE') {
        parties = parties.filter(p => p.id !== (oldData || {}).id);
      }
      renderPartyList();
      renderPartyMarkers();
    });
  }

  function unsubscribeRealtime() {
    if (realtimeChannel) {
      TB_DB.unsubscribeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  function showPartyLiveNotification(party) {
    // In-app banner
    const banner = document.createElement('div');
    banner.className = 'party-live-banner';
    banner.innerHTML = `🎉 <strong>${party.name}</strong> is now LIVE! <button class="party-live-dismiss">×</button>`;
    banner.querySelector('.party-live-dismiss').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 10000);

    // Browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('🎉 Party is LIVE!', {
        body: `${party.name} is now live at mile ${party.mile_marker || '?'}`,
        icon: '🌮',
      });
    }
  }

  function render() {
    const container = document.getElementById('parties-content');
    if (!container) return;

    container.innerHTML = `
      <div id="party-list" class="party-list">
        <p class="hint">Loading parties...</p>
      </div>
      <div class="party-create-section">
        <h4>Host a Party</h4>
        <div class="party-form" id="party-form">
          <input type="text" id="party-name" placeholder="Party name" maxlength="100" />
          <input type="text" id="party-description" placeholder="Description (optional)" maxlength="280" />
          <input type="text" id="party-runner-note" placeholder="Runner note (what to expect)" maxlength="280" />
          <input type="number" id="party-mile" placeholder="Mile marker" step="0.1" min="0" max="32.4" />
          <div class="party-amenities" id="party-amenities">
            ${PARTY_AMENITIES.map(a =>
              `<label class="party-amenity-check">
                <input type="checkbox" value="${a.id}" />
                <span>${a.emoji} ${a.label}</span>
              </label>`
            ).join('')}
          </div>
          <button id="party-place-btn" class="tool-btn">📍 Click Map to Place</button>
          <button id="party-submit-btn" class="tool-btn" disabled>Create Party 🎉</button>
          <div id="party-status" class="food-log-status"></div>
        </div>
      </div>
    `;

    // Place on map button
    const placeBtn = container.querySelector('#party-place-btn');
    placeBtn.addEventListener('click', () => {
      placingPartyPin = true;
      placeBtn.textContent = '📍 Now click the map...';
      placeBtn.classList.add('active');
    });

    // Listen for map clicks when placing
    if (typeof map !== 'undefined') {
      map.on('click', onPartyMapClick);
    }

    // Submit
    const submitBtn = container.querySelector('#party-submit-btn');
    submitBtn.addEventListener('click', submitParty);

    // Enable submit when name + location set
    const nameInput = container.querySelector('#party-name');
    nameInput.addEventListener('input', updatePartySubmitState);
  }

  function onPartyMapClick(e) {
    if (!placingPartyPin) return;
    pendingPartyLatLng = e.latlng;
    placingPartyPin = false;

    const placeBtn = document.getElementById('party-place-btn');
    if (placeBtn) {
      placeBtn.textContent = `📍 ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
      placeBtn.classList.remove('active');
    }
    updatePartySubmitState();
  }

  function updatePartySubmitState() {
    const nameInput = document.getElementById('party-name');
    const submitBtn = document.getElementById('party-submit-btn');
    if (!nameInput || !submitBtn) return;
    submitBtn.disabled = !(nameInput.value.trim() && pendingPartyLatLng);
  }

  async function submitParty() {
    const nameInput = document.getElementById('party-name');
    const descInput = document.getElementById('party-description');
    const runnerNoteInput = document.getElementById('party-runner-note');
    const mileInput = document.getElementById('party-mile');
    const statusEl = document.getElementById('party-status');
    const submitBtn = document.getElementById('party-submit-btn');

    if (!nameInput.value.trim() || !pendingPartyLatLng) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const amenities = Array.from(document.querySelectorAll('#party-amenities input:checked')).map(cb => cb.value);

    const { data, error } = await TB_DB.insertParty({
      name: nameInput.value.trim(),
      description: descInput ? descInput.value.trim() : '',
      lat: pendingPartyLatLng.lat,
      lng: pendingPartyLatLng.lng,
      mile_marker: mileInput ? parseFloat(mileInput.value) || null : null,
      amenities,
      runner_note: runnerNoteInput ? runnerNoteInput.value.trim() : '',
    });

    submitBtn.textContent = 'Create Party 🎉';

    if (error) {
      if (statusEl) {
        statusEl.textContent = 'Failed: ' + error;
        statusEl.className = 'food-log-status error';
      }
      submitBtn.disabled = false;
      return;
    }

    // Success
    if (statusEl) {
      statusEl.textContent = 'Party created! 🎉';
      statusEl.className = 'food-log-status success';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    }

    // Reset form
    nameInput.value = '';
    if (descInput) descInput.value = '';
    if (runnerNoteInput) runnerNoteInput.value = '';
    if (mileInput) mileInput.value = '';
    document.querySelectorAll('#party-amenities input').forEach(cb => cb.checked = false);
    pendingPartyLatLng = null;
    const placeBtn = document.getElementById('party-place-btn');
    if (placeBtn) placeBtn.textContent = '📍 Click Map to Place';

    // Refresh
    if (data) {
      parties.push(data);
      renderPartyList();
      renderPartyMarkers();
    }
  }

  function renderLockedState() {
    const container = document.getElementById('parties-content');
    if (!container) return;
    container.innerHTML = '<p class="auth-locked-msg">Sign in to see and host parties along the route.</p>';
  }

  function renderPartyList() {
    const container = document.getElementById('party-list');
    if (!container) return;

    if (parties.length === 0) {
      container.innerHTML = '<p class="hint">No parties yet. Host one!</p>';
      return;
    }

    const esc = typeof escapeHtml === 'function' ? escapeHtml : (s) => s;

    container.innerHTML = parties.map(party => {
      const amenityEmojis = (party.amenities || []).map(id => {
        const a = PARTY_AMENITIES.find(x => x.id === id);
        return a ? a.emoji : '';
      }).join(' ');

      const isHost = TB_AUTH.user && party.host_id === TB_AUTH.user.id;
      const isSubscribed = mySubscriptions.includes(party.id);
      const hostName = esc(party.profiles ? party.profiles.display_name : 'Unknown');
      const liveClass = party.is_live ? 'party-live' : '';

      let actions = '';
      if (isHost) {
        actions = party.is_live
          ? `<button class="party-action-btn" data-action="unlive" data-id="${party.id}">Set Offline</button>`
          : `<button class="party-action-btn party-go-live" data-action="live" data-id="${party.id}">Go Live! 🎉</button>`;
        actions += `<button class="party-action-btn party-delete-btn" data-action="delete" data-id="${party.id}">Delete</button>`;
      } else {
        actions = isSubscribed
          ? `<button class="party-action-btn" data-action="unsub" data-id="${party.id}">Unsubscribe</button>`
          : `<button class="party-action-btn party-sub-btn" data-action="sub" data-id="${party.id}">I'll Stop By 🙋</button>`;
      }

      return `<div class="party-item ${liveClass}" data-party-id="${party.id}">
        <div class="party-item-header">
          <span class="party-item-name">${esc(party.name)}</span>
          ${party.is_live ? '<span class="party-live-badge">LIVE</span>' : ''}
        </div>
        <div class="party-item-meta">
          <span>Host: ${hostName}</span>
          ${party.mile_marker ? `<span>Mile ${party.mile_marker}</span>` : ''}
        </div>
        ${party.runner_note ? `<div class="party-item-note">${esc(party.runner_note)}</div>` : ''}
        <div class="party-item-amenities">${amenityEmojis}</div>
        <div class="party-item-actions">${actions}</div>
      </div>`;
    }).join('');

    // Wire up action buttons
    container.querySelectorAll('.party-action-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'live') await TB_DB.updatePartyLive(id, true);
        else if (action === 'unlive') await TB_DB.updatePartyLive(id, false);
        else if (action === 'sub') {
          await TB_DB.subscribeToParty(id);
          mySubscriptions.push(id);
          requestNotificationPermission();
        }
        else if (action === 'unsub') {
          await TB_DB.unsubscribeFromParty(id);
          mySubscriptions = mySubscriptions.filter(s => s !== id);
        }
        else if (action === 'delete') {
          if (confirm('Delete this party?')) {
            await TB_DB.deleteParty(id);
            parties = parties.filter(p => p.id !== id);
          }
        }
        renderPartyList();
        renderPartyMarkers();
      });
    });

    // Click to fly to party
    container.querySelectorAll('.party-item-name').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const partyId = el.closest('.party-item').dataset.partyId;
        const party = parties.find(p => p.id === partyId);
        if (party && typeof map !== 'undefined') {
          map.flyTo([party.lat, party.lng], 16, { duration: 1.2 });
        }
      });
    });
  }

  function renderPartyMarkers() {
    if (typeof map === 'undefined') return;

    if (partyLayer) {
      map.removeLayer(partyLayer);
    }
    partyLayer = L.layerGroup();

    parties.forEach(party => {
      const icon = L.divIcon({
        className: 'party-marker',
        html: party.is_live ? '🎉' : '🎈',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const amenityEmojis = (party.amenities || []).map(id => {
        const a = PARTY_AMENITIES.find(x => x.id === id);
        return a ? a.emoji : '';
      }).join(' ');

      const marker = L.marker([party.lat, party.lng], { icon });
      const safeName = escapeHtml(party.name);
      const safeNote = party.runner_note ? escapeHtml(party.runner_note) : '';
      marker.bindPopup(`<div class="popup-content">
        <h3>${party.is_live ? '🎉' : '🎈'} ${safeName}</h3>
        ${safeNote ? `<p>${safeNote}</p>` : ''}
        ${party.mile_marker ? `<p>Mile ${party.mile_marker}</p>` : ''}
        <p>${amenityEmojis}</p>
        <button class="popup-directions-btn" onclick="openInMaps(${party.lat}, ${party.lng}, '${safeName.replace(/'/g, "\\'")}')">🧭 Directions</button>
      </div>`);
      partyLayer.addLayer(marker);
    });

    partyLayer.addTo(map);
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  return {
    init,
    render,
    renderLockedState,
    loadParties,
    getParties: () => parties,
  };
})();
