# Issues & Bug Tracker - Taco Bell DC 50K Route Planner

## Key Pointers (Lessons Learned)
- **Leaflet + flex layouts:** Always call `map.invalidateSize()` before `fitBounds()` when map container size isn't known at init time (sidebar flex layouts, tabs, etc.). Use a short `setTimeout` (~100ms) to let the DOM settle.
- **iCloud Drive + system python3:** `/usr/bin/python3` throws `PermissionError` when cwd is in iCloud Drive. Use a shell wrapper that `cd`s to a non-iCloud path first.
- **Embedded data > fetch for static sites:** Embedding GPX data as JS avoids CORS issues with `file://` protocol and removes server dependency for local development.

---

## Open Issues

_No open issues._

---

## Closed Issues

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
