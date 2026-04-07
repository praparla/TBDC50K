# Backlog - Taco Bell DC 50K Route Planner

## Priority Legend
- **P0** - Must have (blocking or critical)
- **P1** - Should have (high value)
- **P2** - Nice to have (enhancements)
- **P3** - Someday/Maybe

---

## Open Items

### P1 - Performance

*(No open items — see Completed section below)*

### P2 - Features

- [ ] **Friend location sharing** — Real-time location sharing on race day via Supabase Realtime + Geolocation API.
- [ ] **Race-day GPS tracking** — Full GPS tracking with live position logged and split times recorded at each stop.
- [ ] **Strava integration** — Import training runs, overlay on race route.
- [ ] **Photo gallery** — Race-day photo upload tied to map locations.
- [ ] **Street-level photo pins** — Community-contributed photos geotagged to route points (static GeoJSON with image URLs).
- [ ] **Funny reviews panel (Google Places)** — Fetch top reviews per TB stop from Google Places API. Pre-authored satirical fallback reviews in `STOP_META`. API key restricted to domain; inject from `.env`.

### P2 - Code Simplification

- [ ] **Remove inline `onclick` handlers** — Convert all `onclick="funcName()"` in `index.html` to `data-action` attributes with a single event delegation handler. This eliminates ~25 backward-compat `window.x = Module.x` shims across 5 IIFE modules and decouples HTML from global function names.
- [ ] **CSS font-size token scale** — Replace ~180 individual font-size declarations (0.7rem–0.9rem spread across 8 granularities) with CSS custom properties (`--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-md`, etc.). Reduces style.css by ~150 lines and enables consistent typography scaling across themes.
- [ ] **Lazy-load auth CSS** — Move ~50 account/auth CSS rules (`acct-*`, `auth-dropdown*`) into a separate stylesheet that's loaded only when auth.js initializes. Reduces initial CSS payload for anonymous visitors.

---

## Hosting & Deployment

| Layer | Option | Cost |
|-------|--------|------|
| Frontend | GitHub Pages or Cloudflare Pages | Free |
| Backend | Supabase free tier (500MB DB, 50K MAU) | Free |
| Domain | Cloudflare Registrar `.com` | ~$10/yr |
| **Total** | **Minimum viable** | **$0/mo** |

Fork-and-deploy: fork repo → create Supabase project → run `schema.sql` → update `config.js` → deploy to Pages. ~10 minutes.

---

## Completed (Summary)

### P0 — Quick Wins (4 items, 2026-03-10)
Directions deep-link button on all popups, bathroom finder (Overpass API), Google Maps route export, event link pill redesign.

### P1 — Route & Visualization (5 items, 2026-03-11 – 2026-03-16)
Elevation profile (Open-Meteo API + canvas chart), grade-colored route polyline, leg-by-leg segments, named course sections (7 sections), offline tile caching (SW + Tools button).

### P1 — Race Planning (6 items, 2026-03-10 – 2026-03-11)
Pace calculator with fatigue decay, GAP estimator (Minetti model), mandatory food tracker, race day countdown clock, time-of-day ETA, weather overlay (NWS API).

### P2 — Navigation & Map UX (4 items, 2026-03-11 – 2026-03-18)
Tile layer switcher, fly-to-stop animation, 3 alternative routes, spectator spots layer.

### P2 — Custom Pins & Social (3 items, 2026-03-15 – 2026-03-17)
Pin categories/filtering, shareable pin URL encoding, pin notes with 📝 badge.

### P2 — Race Day Mode (3 items, 2026-03-11 – 2026-03-16)
Live location tracker (Geolocation API), distance-to-next-stop HUD, split history.

### P2 — Sharing & Export (5 items, 2026-03-10 – 2026-03-16)
Printable pace card, GPX export, .ics calendar download, shareable race card image, location search (Nominatim).

### P2 — UX Simplification (7 items, 2026-03-26 – 2026-03-28)
Merged food sections into tabbed "Food & Nutrition", merged split/segment/finisher into "Race Results", merged block parties into "Parties" with tabs, hidden backend-not-configured sections, auto-hide empty pre-race sections, fixed pace/countdown label mismatch, consolidated calorie tracker.

### P2 — Code Simplification (8 items, 2026-03-28 – 2026-04-02)
Consolidated 3 duplicate `@media` blocks, single-source `ASSET_VERSIONS` in `config.js`, DRY `directionsBtn()` helper, event bus (`events.js`) decoupling 6 cross-section calls, elevation module extraction (`elevation.js`, 476 lines), shared `buildStopPopup()` deduplicating popup/panel rendering. Full modularization of `app.js` (~2,900→~350 lines): extracted `stops.js`, `pins.js`, `pace.js`, `race.js`, `tools.js` as IIFE modules with read-only state getters and backward-compat window globals.

### P2 — UI/UX (5 items, 2026-03-10 – 2026-03-16)
6-theme switcher (CSS custom properties + tile swap), mobile-first redesign, location search, draggable pins, course preview flythrough.

### P2 — PWA & Gamification (2 items, 2026-03-15)
Installable PWA (manifest + service worker), Taco Bell Passport (10 achievement badges).

### P3 — Social & Accounts (10 items, 2026-03-11 – 2026-03-15)
Supabase integration: Google OAuth + magic links, food consumption log, social feed (realtime), party hosting + alerts, friend betting, account settings panel (emoji avatars), cloud prefs sync, delete account cascade, session expiry handling, runner/crew view toggle.

### P3 — Extras (6 items, 2026-03-15 – 2026-03-18)
TB menu integration (14 items with calories), calorie tracker, finisher wall, KOM/QOM leaderboard, training heatmap overlay, audio cheers (Web Audio API), Strava segment deep-links.

### P2 — Rich Info Cards (3 items, 2026-03-15)
Stop detail panel with slide-in UX, emoji rating scales (burrito price / experience / vomit risk), sauce packet wisdom copy on Sauce theme.

### P2 — Block Parties (3 items, 2026-03-15 – 2026-03-17)
`block_parties.json` data layer, sidebar section with amenity badges, party submission form (mailto).

### P1 — Performance (3 items, 2026-04-02)
Python build script (`build.py`) bundles 8 core JS files into `dist/bundle.min.js` (126KB→105KB, 17% smaller), minifies `style.css` into `dist/style.min.css` (70KB→54KB, 23% smaller), minifies `gpx_data.js` (48KB→44KB). Reduced script requests from ~12 to 3. Added `<link rel="preload">` for Leaflet JS, GPX data, and bundle. Updated service worker cache manifest.

---

## Theme System Reference

6 themes available: Live Más Modern (default), Retro '85, Purple Reign '94, Baja Blast, Cantina Night, Sauce Packet. Each defines: background, accent colors, text colors, route line color, tile layer URL. Persisted to localStorage. CSS custom properties with `[data-theme]` selectors.
