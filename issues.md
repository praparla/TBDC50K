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
