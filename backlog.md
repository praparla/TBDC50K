# Backlog - Taco Bell DC 50K Route Planner

## Priority Legend
- **P0** - Must have (blocking or critical)
- **P1** - Should have (high value)
- **P2** - Nice to have (enhancements)
- **P3** - Someday/Maybe

---

## Open Items

### P1 - Performance

- [ ] **Bundle & minify JS/CSS** — Set up esbuild (or similar zero-config bundler) to bundle all 10+ core JS files into 1-2 bundles and minify `style.css`. Would reduce request count from ~14 to 2-3 and save ~15-20% on transfer size via dead-code elimination and minification. No framework needed — just a build script.
- [ ] **Minify style.css** — Remove comments and whitespace from the 69KB stylesheet. Quick standalone win (~15-20% reduction) even without full bundling.
- [ ] **Preload critical assets** — Add `<link rel="preload">` for Leaflet JS/CSS and `gpx_data.js` to start downloads earlier in the critical path.

### P2 - Features

- [ ] **Friend location sharing** — Real-time location sharing on race day via Supabase Realtime + Geolocation API.
- [ ] **Race-day GPS tracking** — Full GPS tracking with live position logged and split times recorded at each stop.
- [ ] **Strava integration** — Import training runs, overlay on race route.
- [ ] **Photo gallery** — Race-day photo upload tied to map locations.
- [ ] **Street-level photo pins** — Community-contributed photos geotagged to route points (static GeoJSON with image URLs).
- [ ] **Funny reviews panel (Google Places)** — Fetch top reviews per TB stop from Google Places API. Pre-authored satirical fallback reviews in `STOP_META`. API key restricted to domain; inject from `.env`.

### P2 - Code Simplification

*(No open items — see Completed section below)*

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

---

## Theme System Reference

6 themes available: Live Más Modern (default), Retro '85, Purple Reign '94, Baja Blast, Cantina Night, Sauce Packet. Each defines: background, accent colors, text colors, route line color, tile layer URL. Persisted to localStorage. CSS custom properties with `[data-theme]` selectors.
