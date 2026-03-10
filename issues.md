# Issues & Bug Tracker - Taco Bell DC 50K Route Planner

## Key Pointers (Lessons Learned)
- **Leaflet + flex layouts:** Always call `map.invalidateSize()` before `fitBounds()` when map container size isn't known at init time (sidebar flex layouts, tabs, etc.). Use a short `setTimeout` (~100ms) to let the DOM settle.
- **iCloud Drive + system python3:** `/usr/bin/python3` throws `PermissionError` when cwd is in iCloud Drive. Use a shell wrapper that `cd`s to a non-iCloud path first.
- **Embedded data > fetch for static sites:** Embedding GPX data as JS avoids CORS issues with `file://` protocol and removes server dependency for local development.
- **Browser caching during dev:** When changing JS that defines new globals (e.g. `THEMES`), aggressive browser caching can serve stale files even after server restart. Temporary cache-bust query params on `<script>` tags (`?v=2`) force a fresh load. Remove after confirming.
- **FOUC prevention for themes:** Apply saved theme via inline `<script>` in `<head>` (before body renders) to avoid flash of default theme. Read `localStorage` and set `data-theme` attribute immediately.
- **Leaflet init without setView:** For flex layouts, create the map without `setView()` and use `requestAnimationFrame` + `fitBounds({ animate: false })`. Avoids visible map jump on load. Don't use CSS `visibility`/`opacity` to hide the map container — Leaflet needs it visible for size calculations.
- **Stale file copies on dev server:** When serving from `/tmp` via a copy-on-start script, edits to source files in iCloud Drive aren't reflected until you manually re-copy. Always re-copy all changed files after edits, then force reload with cache-bust params (`?v=N`) on `<link>` and `<script>` tags.

---

## Open Issues

(none)

---

## Closed Issues

### [ISSUE-005] CSS rules not loading after style.css edits
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-10
- **Fixed:** 2026-03-10
- **Root Cause:** The `/tmp/tb50k_serve.sh` dev server copies files from iCloud Drive to `/tmp` only at startup. After editing `style.css` and `app.js` to add new features (pace calculator, food tracker, tools grid, collapsible sections), the served files were stale. Browser only loaded 67 of the expected ~132 CSS rules; all new selectors were missing.
- **Fix:** (1) Manually re-copied all source files to `/tmp/tb50k_serve/` after each edit batch. (2) Added cache-bust query params `?v=2` to `<link rel="stylesheet">` and `<script>` tags in `index.html` to force browsers to reload fresh assets.
- **Lesson:** When using a copy-on-start dev server, always re-copy after edits and use cache-bust params to defeat browser caching. Added to Key Pointers.

### [ISSUE-004] Map visibly resizes/jumps on initial page load
- **Status:** Fixed
- **Severity:** Low
- **Found:** 2026-03-10
- **Fixed:** 2026-03-10
- **Root Cause:** On page load, the flex layout (sidebar + map) settles over ~100–300ms. The map initializes at a default `setView()` zoom, then `fitBounds` fires after a `setTimeout` delay. This creates a visible jump/resize as the map snaps from its initial state to the fitted route bounds.
- **Fix:** Three changes: (1) Initialize Leaflet map without `setView()` so there's no wrong initial zoom to snap from. (2) Replace `setTimeout` with `requestAnimationFrame` for tighter timing on `invalidateSize()` + `fitBounds()`. (3) Pass `{ animate: false }` to `fitBounds()` to prevent visible animated transition.
- **Lesson:** For flex layouts, defer Leaflet's initial view entirely — create the map without `setView`, then call `fitBounds` inside `requestAnimationFrame` after the layout paints. Avoid CSS visibility/opacity hacks on the map container as they break Leaflet's container size calculations.

### [ISSUE-001] Map renders at world zoom on first load
- **Status:** Fixed
- **Severity:** High
- **Found:** 2026-03-09
- **Fixed:** 2026-03-09
- **Root Cause:** Leaflet's `fitBounds()` runs before the flex layout finishes sizing the map container, so it calculates bounds against a 0-width or stale-width element.
- **Fix:** Added `setTimeout(() => { map.invalidateSize(); map.fitBounds(...) }, 100)` in `loadGPX()`.
- **Lesson:** Always invalidateSize before fitBounds in flex/dynamic layouts.

### [ISSUE-002] Python dev server PermissionError on iCloud Drive
- **Status:** Fixed (workaround)
- **Severity:** Medium
- **Found:** 2026-03-09
- **Fixed:** 2026-03-09
- **Root Cause:** System python3 at `/usr/bin/python3` can't call `os.getcwd()` when cwd is inside `~/Library/Mobile Documents/` (iCloud Drive) due to macOS sandbox restrictions.
- **Fix:** Created `/tmp/tb50k_serve.sh` wrapper that `cd /tmp/tb50k_serve` before launching python3. Files are copied to `/tmp` for serving.
- **Lesson:** Serve from /tmp when project lives in iCloud Drive.

### [ISSUE-003] GPX fetch fails with file:// protocol
- **Status:** Fixed
- **Severity:** High
- **Found:** 2026-03-09
- **Fixed:** 2026-03-09
- **Root Cause:** `fetch('route.gpx')` fails when opening index.html directly via `file://` due to browser CORS/security restrictions on local file access.
- **Fix:** Pre-parsed GPX into `gpx_data.js` with embedded `GPX_TRACK` and `GPX_WAYPOINTS` arrays. Loaded as a regular `<script>` tag - no fetch needed.
- **Lesson:** For static sites, embed data as JS instead of fetching local files.

---

## Issue Template

<!--
### [ISSUE-XXX] Short description
- **Status:** Open | In Progress | Fixed | Won't Fix
- **Severity:** Critical | High | Medium | Low
- **Found:** YYYY-MM-DD
- **Fixed:** YYYY-MM-DD
- **Root Cause:** Brief explanation
- **Fix:** What was done
- **Lesson:** Concise takeaway for Key Pointers section
-->
