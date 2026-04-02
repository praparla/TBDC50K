// ── TB Stops — Stop detail panel, popup builder, menu data ──
// Extracted from app.js. IIFE module, no build step.
// Depends on: TACO_BELL_STOPS, STOP_DISTANCES, GPX_WAYPOINTS (globals)
//             map, escapeHtml, directionsBtn, getViewMode, TB_Events (app.js globals)

const TB_Stops = window.TB_Stops = (() => {

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

  // ── Taco Bell Menu Data (calories + prices) ──
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

  // ── Shared Stop Info Builder (dedup: popup + detail panel consume this) ──
  function buildStopInfo(stopIndex, format) {
    const stop = TACO_BELL_STOPS[stopIndex];
    const wpt = GPX_WAYPOINTS[stopIndex];
    if (!stop || !wpt) return '';

    if (format === 'popup') {
      let html = `<div class="popup-content">
        <h3>${stop.label}</h3>
        <p>${wpt.name}</p>
        <p>${stop.note}</p>`;
      if (stop.mandatory) {
        html += `<p class="mandatory">⚠️ ${stop.mandatory}</p>`;
      }
      html += directionsBtn(wpt.lat, wpt.lon, stop.label);
      html += '</div>';
      return html;
    }

    // format === 'detail'
    const meta = STOP_META[stopIndex];
    if (!meta) return '';
    const dist = STOP_DISTANCES[stopIndex];
    const nextDist = stopIndex < STOP_DISTANCES.length - 2 ? (STOP_DISTANCES[stopIndex + 1] - dist).toFixed(1) : 'N/A';
    const isMandatory = stopIndex === 3 || stopIndex === 7;

    function ratingPips(emoji, count) {
      return emoji.repeat(count) + '<span class="rating-empty">' + emoji.repeat(5 - count) + '</span>';
    }

    return `
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
        ${directionsBtn(wpt.lat, wpt.lon, stop.label)}
      </div>
    `;
  }

  let detailPanelOpen = false;

  function buildStopPopup(stopIndex) {
    return buildStopInfo(stopIndex, 'popup');
  }

  function openStopDetail(stopIndex) {
    const panel = document.getElementById('stop-detail-panel');
    if (!panel) return;
    panel.innerHTML = buildStopInfo(stopIndex, 'detail');
    panel.classList.remove('hidden');
    detailPanelOpen = true;
  }

  function closeStopDetail() {
    const panel = document.getElementById('stop-detail-panel');
    if (panel) panel.classList.add('hidden');
    detailPanelOpen = false;
  }

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

  // ── Public API ──
  return {
    STOP_META,
    TB_MENU_DATA,
    buildStopPopup,
    buildStopInfo,
    openStopDetail,
    closeStopDetail,
    buildMenuPanel,
    get detailPanelOpen() { return detailPanelOpen; },
  };
})();

// Backward-compat globals for inline onclick handlers and tests
window.buildStopPopup = TB_Stops.buildStopPopup;
window.openStopDetail = TB_Stops.openStopDetail;
window.closeStopDetail = TB_Stops.closeStopDetail;
window.STOP_META = TB_Stops.STOP_META;
window.TB_MENU_DATA = TB_Stops.TB_MENU_DATA;
