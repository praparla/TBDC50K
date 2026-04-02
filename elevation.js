// ── TB Elevation — Elevation profile, grade coloring, GAP estimator ──
// Extracted from app.js monolith. IIFE module, no build step.
// Depends on: GPX_TRACK, GPX_WAYPOINTS, STOP_DISTANCES (gpx_data.js / app.js globals)
//             map, routeLayer, haversine, getTheme, currentThemeId (app.js globals)

const TB_Elevation = window.TB_Elevation = (() => {
  const CACHE_KEY = 'tb50k_elevation';
  const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
  const SAMPLE_STEP = 20; // Sample every Nth track point

  let elevationData = null; // { distances: [], elevations: [], trackIndices: [] }
  let elevationMarker = null;
  let gradeColorActive = false;
  let gradeColorLayers = null;

  function fetchElevation() {
    const container = document.getElementById('elevation-content');
    if (!container) return;

    // Check localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        elevationData = cached.data;
        onElevationLoaded();
        return;
      }
    } catch (e) { /* cache miss */ }

    container.innerHTML = '<p class="hint">Loading elevation data...</p>';

    // Sample track points (max 100 for API limit)
    const maxPts = 100;
    const step = Math.max(SAMPLE_STEP, Math.ceil(GPX_TRACK.length / (maxPts - 1)));
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

        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: elevationData }));
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

  function buildGradedPolyline() {
    if (!elevationData || !gradeColorActive) return;
    removeGradedPolyline();

    const { trackIndices } = elevationData;
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
    const gapFactors = [];

    for (let s = 0; s < STOP_DISTANCES.length - 1; s++) {
      const segStart = STOP_DISTANCES[s];
      const segEnd = STOP_DISTANCES[s + 1];

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
            factor = 1 + 0.015 * grade; // mild downhill benefit
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

  // ── Public API ──
  return {
    init: fetchElevation,
    get data() { return elevationData; },
    get gradeColorActive() { return gradeColorActive; },
    toggleGradeColor,
    getGAPFactors,
    getGrade,
    gradeToColor,
  };
})();

// Expose globals for backward compatibility with inline onclick handlers and tests
window.toggleGradeColor = TB_Elevation.toggleGradeColor;
