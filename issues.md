# Issues & Bug Tracker - Taco Bell DC 50K Route Planner

## Key Pointers (Lessons Learned)
- **Leaflet + flex layouts:** Always call `map.invalidateSize()` before `fitBounds()` when map container size isn't known at init time (sidebar flex layouts, tabs, etc.). Use a short `setTimeout` (~100ms) to let the DOM settle.
- **iCloud Drive + system python3:** `/usr/bin/python3` throws `PermissionError` when cwd is in iCloud Drive. Use a shell wrapper that `cd`s to a non-iCloud path first.
- **Embedded data > fetch for static sites:** Embedding GPX data as JS avoids CORS issues with `file://` protocol and removes server dependency for local development.
- **Browser caching during dev:** When changing JS that defines new globals (e.g. `THEMES`), aggressive browser caching can serve stale files even after server restart. Temporary cache-bust query params on `<script>` tags (`?v=2`) force a fresh load. Remove after confirming.
- **FOUC prevention for themes:** Apply saved theme via inline `<script>` in `<head>` (before body renders) to avoid flash of default theme. Read `localStorage` and set `data-theme` attribute immediately.
- **Leaflet init without setView:** For flex layouts, create the map without `setView()` and use `requestAnimationFrame` + `fitBounds({ animate: false })`. Avoids visible map jump on load. Don't use CSS `visibility`/`opacity` to hide the map container — Leaflet needs it visible for size calculations.
- **Stale file copies on dev server:** When serving from `/tmp` via a copy-on-start script, edits to source files in iCloud Drive aren't reflected until you manually re-copy. Always re-copy all changed files after edits, then force reload with cache-bust params (`?v=N`) on `<link>` and `<script>` tags.
- **Testing without a live backend:** For BaaS-dependent features (Supabase, Firebase), create a mock client that implements the same chained query API (`.from().select().eq().order()`) with in-memory storage. Override the global SDK (`window.supabase = MockSupabase`) before loading app modules, and set config to non-placeholder values so initialization proceeds. Test helpers (`_reset`, `_seedTable`, `_setSession`) enable isolated test scenarios.
- **Graceful degradation pattern:** Check `typeof MODULE !== 'undefined'` before calling `.init()` on each backend module. Inside each module, check `typeof supabase !== 'undefined'` and whether config has placeholder values. This allows the static site to function fully without backend scripts loaded.
- **JSONB for user preferences sync:** Instead of creating a new table for user settings, add a `preferences JSONB DEFAULT '{}'` column to the existing profiles table. Store all localStorage keys as a flat JSON object. One column, zero new tables, zero additional cost on Supabase free tier.
- **Emoji avatars over file uploads:** Using emoji characters as avatars eliminates the need for file storage (Supabase Storage, S3, etc.). Store as a TEXT column, render directly in UI. Zero storage cost, zero CDN cost, works offline.
- **Postgres SECURITY DEFINER for account deletion:** CASCADE-deleting a user's profile and all child records requires a function that runs with elevated privileges. `CREATE FUNCTION ... SECURITY DEFINER` executes as the function owner (admin), not the caller, allowing the function to delete the profile row which then cascades to all FK-referencing tables. Called via `supabase.rpc('delete_own_account')` from the client. No Edge Functions needed.
- **Session expiry detection:** Track a `wasSignedIn` boolean in the auth module. When Supabase fires `SIGNED_OUT` and `wasSignedIn` is true but `signOut()` wasn't explicitly called, show a user-facing toast notification. Set `wasSignedIn = false` before intentional sign-out to prevent false positive.
- **Leaflet popup factories for dynamic content:** When popup content depends on runtime state (e.g., Runner vs. Crew view mode), pass a function to `marker.bindPopup(fn)` instead of a static string. Leaflet calls the function each time the popup opens, ensuring content reflects current state without rebuilding the layer.
- **Mock _reset() wipes auth listeners:** When the mock Supabase `_reset()` clears `authListeners = []`, any `onAuthStateChange` callbacks registered by `TB_AUTH.init()` are lost. Subsequent `simulateSignIn()` calls fire `_setSession` but no listener updates `currentUser`. Fix: pass `keepAuthListeners = true` to `_reset()` when resetting between test groups that share an init'd auth module.
- **Session user vs effective user in tests:** `simulateSignIn()` sets the mock session user ID, but `TB_AUTH.user.id` may differ due to async `ensureProfile()` propagation. DB functions use `TB_AUTH.user.id` (via `userId()`), so test assertions checking mock DB state must verify against the effective user ID, not the session user ID.

- **AMENITY_EMOJI / RUNNER_AMENITIES key alignment:** When `app.js` defines dictionary keys for amenities, they must match the `id` values in `config.js PARTY_AMENITIES`. Hyphenated keys like `porta-potty` vs `portapotty` are easy to miss — always cross-reference the source of truth in `config.js`.
- **URL-encoded data with commas:** When encoding structured data into URL fragments using commas as field delimiters, the last field (typically a name) should be parsed with `parts.slice(N).join(',')` to handle values that themselves contain commas.
- **User-supplied text in innerHTML:** Any string from user input or external data (pin names, display names, hot takes, party names) must be escaped before inserting into `innerHTML`. Use a DOM-based `escapeHtml()` utility (create a text node, read back `.innerHTML`) rather than regex replacement.
- **Service worker cache versioning:** When `index.html` loads assets with cache-bust query strings (`style.css?v=8`), the service worker's `CORE_ASSETS` list must use the same versioned paths. Mismatched paths cause the SW to cache a resource that the page never requests.
- **Test stub alignment:** When production data arrays change length or shape, test stubs must be updated to match. Periodically audit test stubs against their production counterparts (e.g., `TACO_BELL_STOPS` count).

---

## Open Issues

### [ISSUE-016] Pace Calculator finish time overshoots goal when fatigue/GAP is applied
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-23
- **Fixed:** 2026-03-23
- **Root Cause:** The Pace Calculator computed base pace as `goalMinutes / totalDistance`, then applied 4% fatigue after mile 20 (and optionally GAP elevation adjustments) on top. This caused the estimated finish to exceed the goal by 7–18 minutes. Additionally, time formatting had a rounding edge case where `Math.round(59.99)` → 60 produced "10h 60m" instead of "11h 0m".
- **Fix:** (1) Compute `effectiveDist` — a weighted distance that accounts for fatigue (and GAP factors when enabled) — then derive `pacePerMile = goalMinutes / effectiveDist`. This ensures splits sum exactly to the goal time. (2) Added carry-over logic for the 60-minute rounding edge case. Bumped `app.js?v=13`, `sw.js` to `tb50k-v8`.
- **Lesson:** When a pace model applies adjustments (fatigue, grade), solve for the base pace algebraically rather than applying adjustments to a naive pace. The base pace = goal time / weighted distance where each segment's weight reflects its adjustment factor.

### [ISSUE-018] Pace Calculator doesn't auto-refresh arrival times when Race Day Clock start time is set
- **Status:** Open
- **Severity:** Low
- **Found:** 2026-03-25
- **Root Cause:** Setting a start time in the Race Day Clock section doesn't trigger a re-render of the Pace Calculator splits table. The Pace Calculator still shows "Set a start time in the Countdown section to see arrival times" until the user manually re-clicks Calculate. The two sections don't communicate.
- **Fix:** _(UX papercut — arrival times appear after the next Calculate click, but the prompt is misleading)_

### [ISSUE-017] TB Passport badges don't update in real-time after badge-triggering actions
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-25
- **Fixed:** 2026-03-25
- **Root Cause:** `buildPassport()` was only called once during page init (`app.js:303`). After badge-triggering actions — switching themes (Fashionista), using the pace calculator (Time Keeper/Speed Demon), checking off mandatory food (Rule Follower), etc. — the passport grid was not re-rendered. Badges remained visually locked until a full page reload, even though localStorage already had the qualifying data.
- **Fix:** Added `buildPassport()` calls to: `trackAchievement()` (covers bathrooms, calendar, flythrough, race mode), theme switch handler, `calculatePace()`, mandatory food checkbox handler, and `saveCustomPins()`. Bumped `app.js?v=14`, `sw.js` to `tb50k-v10`.
- **Lesson:** When a gamification/achievement system checks state lazily (via localStorage), the display function must be re-invoked after every state-changing action, not just on init.

### [ISSUE-015] Weather fetch fails with TypeError on local/non-HTTPS dev server
- **Status:** Open
- **Severity:** Low
- **Found:** 2026-03-23
- **Root Cause:** `fetchWeather()` calls `api.weather.gov` which fails in non-HTTPS/localhost contexts. Two console errors logged on every page load. The weather section still renders cached/fallback data gracefully, so UX impact is minimal.
- **Fix:** _(known limitation — works on deployed HTTPS site)_

### [ISSUE-014] Theme swatch buttons are 22×22px — below 44×44px minimum touch target
- **Status:** Fixed
- **Severity:** Low
- **Found:** 2026-03-22
- **Fixed:** 2026-03-24
- **Root Cause:** `.theme-swatch` CSS sets `width` and `height` to 22px. WCAG 2.5.8 and Apple HIG recommend minimum 44×44px touch targets for interactive elements, especially on mobile.
- **Fix:** Added a `::before` pseudo-element overlay (44×44px, centered, invisible) to each swatch button. This provides the required touch target area while keeping the visual circle compact at 22px. Bumped `style.css?v=11`, `sw.js` to `tb50k-v9`. Added regression tests for the touch target dimensions.
- **Lesson:** Use invisible `::before`/`::after` pseudo-element overlays to expand touch targets without changing visual size. This is the standard technique used by Apple and Material Design.

---

## Closed Issues

### [ISSUE-013] Leg-by-Leg "Stop 7 → Finish" shows wrong neighborhood ("Union Station" instead of "Alexandria")
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-22
- **Fixed:** 2026-03-22
- **Root Cause:** `buildSegments()` in `app.js:1129` derives the neighborhood label from the destination stop using `TACO_BELL_STOPS[Math.min(i+1, len-1)]`. For the last leg (i=7), `i+1=8` exceeds `TACO_BELL_STOPS` bounds (0–7), so `Math.min(8,7)=7` maps to Stop 7 (Union Station). But the actual destination is the Start/Finish location in Alexandria (`TACO_BELL_STOPS[0]`).
- **Fix:** Added `isLastLeg` check in `buildSegments()`. When rendering the last segment, use `'Alexandria'` as the area name instead of deriving from `TACO_BELL_STOPS[0]` (whose label is "Taco Bell Cantina", not a neighborhood). Bumped `app.js?v=12`, `sw.js` to `tb50k-v7`.
- **Lesson:** When a loop uses an index that wraps around (finish = start), handle the boundary explicitly rather than clamping.

### [ISSUE-012] Route Info section shows incorrect distance (32.8 mi vs 32.4 mi)
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-20
- **Fixed:** 2026-03-20
- **Root Cause:** `updateRouteInfo()` in `app.js` computed route distance by summing haversine distances between all GPX track points (`totalDist / 1609.34`), yielding 32.8 miles. Every other part of the app uses the canonical 32.4 mi from `STOP_DISTANCES[8]`. The haversine sum was inflated by GPS track point jitter.
- **Fix:** Changed `updateRouteInfo()` to use `STOP_DISTANCES[STOP_DISTANCES.length - 1]` (32.4) instead of computing from track points. Bumped cache-bust versions (`app.js?v=11`, SW `tb50k-v6`).
- **Lesson:** Use canonical/curated distances as the single source of truth rather than computing from raw GPS data, which accumulates jitter.

### [ISSUE-011] Missing block_parties.json causes 404 on every page load
- **Status:** Fixed
- **Severity:** Low
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** `loadBlockParties()` fetches `block_parties.json` but the file was never created in the repo, causing a 404 error + console warning on every page load.
- **Fix:** Created an empty `block_parties.json` (`[]`) placeholder. Added the file to the SW `CORE_ASSETS` for offline caching.
- **Lesson:** When code references a data file, always ship a placeholder even if real data comes later.

### [ISSUE-010] Service worker caches un-versioned asset paths
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** `sw.js` listed `/style.css` and `/app.js` in `CORE_ASSETS`, but `index.html` loads `style.css?v=8` and `app.js?v=8`. The SW cached resources that the page never actually requested, so the cache was useless for offline and stale assets could be served.
- **Fix:** Updated `CORE_ASSETS` paths to include the `?v=8` query strings matching `index.html`. Bumped cache version to `tb50k-v3`.
- **Lesson:** SW CORE_ASSETS must exactly match the URLs in index.html, including cache-bust query strings.

### [ISSUE-009] Backend test TACO_BELL_STOPS stub has 9 entries instead of 8
- **Status:** Fixed
- **Severity:** Low
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** The test stub in `backend.test.html` defined 9 stops (num 0-8) with a spurious `num: 8` entry. Production code only has 8 stops (num 0-7). This caused test isolation issues and could mask real bugs.
- **Fix:** Removed the extra entry. Updated labels and mandatory fields to match production data shape.
- **Lesson:** Test stubs must mirror production data structure. Added to Key Pointers.

### [ISSUE-008] XSS vulnerability in popup/feed HTML rendering
- **Status:** Fixed
- **Severity:** High
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** User-supplied strings (custom pin names, display names, hot takes, party names/notes) were inserted directly into `innerHTML` without escaping. An attacker could inject `<img onerror=...>` or `<script>` tags.
- **Fix:** Added `escapeHtml()` utility (DOM text node method) in `app.js`, exposed globally. Applied it in `addPinToMap`, `makePinDraggable`, `social-feed.js renderEntry`, `food-log.js renderLogEntries`, and `party.js renderPartyList/renderPartyMarkers`.
- **Lesson:** Any user-sourced text inserted via innerHTML must be escaped. Added to Key Pointers.

### [ISSUE-007] loadPinsFromURL drops pin names containing commas
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** `loadPinsFromURL` splits each pin entry on commas to extract `lat,lng,iconType,name`. But pin names can contain commas (e.g. "Jake's House, Basement"). `split(',')` + `parts[3]` would truncate the name.
- **Fix:** Changed `parts[3]` to `parts.slice(3).join(',')` to rejoin all remaining parts as the name.
- **Lesson:** When using delimiters in serialized data, the last field should consume all remaining parts.

### [ISSUE-006] RUNNER_AMENITIES filter never matches portapotty
- **Status:** Fixed
- **Severity:** Medium
- **Found:** 2026-03-16
- **Fixed:** 2026-03-16
- **Root Cause:** `RUNNER_AMENITIES` in `app.js` used `'porta-potty'` (hyphenated), but `PARTY_AMENITIES` in `config.js` uses `'portapotty'` (no hyphen). The filter `amenities.filter(a => RUNNER_AMENITIES.includes(a))` never matched, so runners never saw porta-potty amenities in block party popups. Same mismatch for `'dog-petting-zone'` vs `'dogs'` and `'family-zone'` vs `'family'` in `AMENITY_EMOJI`.
- **Fix:** Aligned `RUNNER_AMENITIES` and `AMENITY_EMOJI` keys to match `PARTY_AMENITIES` ids: `portapotty`, `dogs`, `family`.
- **Lesson:** Dictionary keys referencing another module's IDs must be cross-checked. Added to Key Pointers.

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
