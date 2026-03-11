# Backlog - Taco Bell DC 50K Route Planner

## Priority Legend
- **P0** - Must have (blocking or critical)
- **P1** - Should have (high value)
- **P2** - Nice to have (enhancements)
- **P3** - Someday/Maybe

---

## Active Backlog

### P0 - Quick Wins (High Priority)

- [x] **Click any pin → open in native maps app** — Every marker popup (TB stops, custom pins, bathrooms) should have a "Directions" button that deep-links to the device's native maps app. Use UA detection: `maps://?ll=LAT,LNG&q=LABEL` on iOS, `geo:LAT,LNG?q=LAT,LNG(LABEL)` on Android, and `https://www.google.com/maps/search/?api=1&query=LAT,LNG` on desktop. ~15 lines of JS in a shared `openInMaps(lat, lng, label)` utility. Add to `buildStopPopup()`, `buildPinPopup()`, and future bathroom popups.

- [x] **Bathroom finder toggle** — "Find Restrooms" toggle button in the sidebar that fetches public restrooms near the route from the OpenStreetMap Overpass API (free, no API key). POST to `https://overpass-api.de/api/interpreter` with query `[out:json]; node["amenity"="toilets"](38.80,-77.15,38.93,-76.99); out center;` (bounding box covers the full DC/Arlington/Alexandria corridor). Cache the JSON response in `localStorage` key `tb50k_bathrooms` for 7 days so subsequent loads are instant. Render as a toggleable `L.layerGroup` of 🚽 markers with popups showing name (if any) and a "Directions" deep-link button. ~60 lines of JS + a new sidebar toggle button. Supersedes the existing `P1` aid station / restroom finder entry above.

- [x] **Export full route to Google Maps** — "Open in Google Maps" button that opens the full 32-mile route in Google Maps. Constructs a `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=PIPE_SEPARATED` URL with all 8 stops as waypoints. Exposed in the Tools sidebar section.

- [x] **Better event website UX** — ~~Redesign event link as pill button.~~ **DONE** (2026-03-10). Restyled as a rounded pill badge with 🌮 icon, hover/focus styles driven by theme system CSS variables, adequate mobile tap target.

---

### P1 - Route & Visualization
- [ ] **Elevation profile** - Show interactive elevation chart (via `leaflet-elevation` plugin) below the map. Hover/scrub to move a dot along the route. Shows grade, elevation, and cumulative distance. Already have GPX data — zero new network requests needed.
- [ ] **Grade-colored route polyline** - Segment the `GPX_TRACK` array and color each segment by steepness: green (flat), yellow (moderate), red (steep). Lets runners instantly spot hard sections without reading a chart.
- [x] **Turn-by-turn segments** - Break route into named stop-to-stop segments with individual distances and elevation change per leg.
- [ ] **Named course sections** - Define and highlight named sub-sections ("The Georgetown Climb," "Capitol Hill Push," "Final 5K") as clickable overlays with character notes. Storytelling for the course.
- [ ] **Offline map support** - Service worker pre-fetches CARTO dark tiles for the route corridor at zoom 13–16 (~3–8 MB). The `gpx_data.js` embedded data is already offline; only tile layer needs caching.

### P1 - Race Planning & Pacing
- [x] **Pace calculator with aid station splits** - Enter goal finish time → get estimated arrival at each of the 8 Taco Bell stops accounting for cumulative distances. Includes 4% fatigue decay factor for miles 20–32. Pure client-side JS math, persisted to localStorage.
- [ ] **Grade-adjusted pace estimator (GAP)** - Slider for user's flat-road pace + Minetti GAP model (~3.5% time penalty per 1% grade uphill). Refines the aid station split calculator for hilly sections like the Georgetown climb.
- [x] **Mandatory food requirement tracker** - Checklist panel for the two race rules (Chalupa Supreme OR Crunchwrap by Stop 3; Burrito Supreme OR Nachos Bell Grande by Stop 7). Checkboxes turn green with strikethrough when satisfied; persisted to localStorage.
- [x] **Race day countdown clock** - User enters their start time (e.g., 7:00 AM); a panel shows: time elapsed, estimated current position at target pace, and time remaining before the 11-hour cutoff. Runs via `setInterval`; start time persisted to localStorage.
- [x] **Time-of-day estimator** - Show estimated arrival time at each stop based on entered start time + pace, so runners know "I should be at Stop 4 by 11:45 AM."
- [x] **Aid station / restroom finder** - Superseded by P0 Bathroom finder toggle (Overpass API).
- [x] **Weather overlay** - Pull NWS forecast for Nov 27, 2026 race day; display at a glance in the sidebar.

### P2 - Navigation & Map UX
- [x] **Map tile layer switcher** - Toggle between: CARTO Dark (current), Esri World Imagery (satellite), OpenTopoMap (contour lines), OSM Standard. Uses Leaflet's built-in `L.control.layers()`. Low effort, high utility.
- [x] **"Fly to stop" smooth navigation** - Replaced `map.setView()` with `map.flyTo()` for smooth cinematic pan-and-zoom when clicking a stop or pin in the sidebar.
- [ ] **Alternative route suggestions** - Toggle between different route options between stops.
- [ ] **Spectator spots map layer** - Toggleable GeoJSON layer of recommended crew/spectator positions with easy parking or Metro access (Lincoln Memorial area ~mile 15, Capitol Hill ~mile 23, Old Town start/finish). Static file, no backend.

### P2 - Custom Pins & Social
- [ ] **Pin categories & filtering** - Toggle visibility of pin types (restrooms, friends, food, etc.)
- [ ] **Shareable pin sets via URL** - Encode custom pins into a URL hash/query string so runners can share crew stop locations with their support team. No backend — pure client-side URL state.
- [ ] **Pin notes & photos** - Add notes or photos to custom pins
- [ ] **Friend location sharing** - Real-time location sharing on race day

### P2 - Race Day Mode
- [x] **Live location tracker (Race Mode)** - "Start Race Mode" toggle using the Geolocation API (`navigator.geolocation.watchPosition`). Shows user's live position as a pulsing dot on the map. ~20 lines of Leaflet + JS.
- [x] **Distance-to-next-stop banner** - In race mode: persistent heads-up display showing "Next: Stop 4 - Columbia Heights | 2.3 mi away." Uses Haversine already in `app.js` + live geolocation.
- [ ] **Race-day GPS tracking** - Full GPS tracking with live position logged and split times recorded at each stop.
- [ ] **Split history** - Log actual splits at each stop during the race.

### P2 - Sharing & Export
- [x] **Printable pace card** - "Print" button generates a clean single-page pace card (stop names, cumulative distances, goal arrivals, mandatory food notes) via `window.print()` with print-specific CSS. Runners can laminate and carry in their vest.
- [ ] **GPX export** - Export the route with custom pins as a GPX file for Garmin/Wahoo.
- [ ] **Strava integration** - Import training runs, overlay on race route.
- [x] **Add to Calendar (.ics)** - One-click `.ics` download for Nov 27, 2026 race day with event details pre-filled. Works in Apple Calendar, Google Calendar, and Outlook — no API keys needed.
- [ ] **Shareable race card image** - CSS-styled `<div>` showing route thumbnail, goal time, name, and Taco Bell branding — screenshottable for Instagram/social hype.

### P2 - UI/UX
- [x] **Theme switcher** - ~~See detailed plan below.~~ **DONE.** 6 TB-era themes (Live Más Modern, Retro '85, Purple Reign '94, Baja Blast, Cantina Night, Sauce Packet) switchable from swatch picker in sidebar header. CSS custom properties, tile layer swap, route color swap, themed sidebar background patterns, persisted to localStorage. See "Taco Bell Theme System" section for original plan.
- [x] **Mobile-first redesign** - Collapsible sidebar sections on all viewports, proper touch targets, responsive tools grid
- [ ] **Search for locations** - Geocoding to search and add pins by address
- [ ] **Drag to reposition pins** - Allow dragging placed pins to adjust location
- [x] **Course preview flythrough animation** - "Preview Route" button animates the map camera panning along the GPX track start-to-finish using `setInterval` + `map.panTo()`. Toggle to start/stop.

### P2 - PWA & Offline
- [ ] **Installable PWA** - `manifest.json` + service worker → "Add to Home Screen" on iOS/Android. Race-day quick launch from home screen without navigating to a URL. Taco Bell 🌮 launcher icon.
- [ ] **Offline tile caching** - Pre-cache map tiles for route corridor. See offline map support above.

### P2 - Gamification
- [ ] **"Taco Bell Passport" achievement system** - Checklist-style badges: "Visited All 8 TBs on a Training Run," "Logged 20+ Mile Training Run," "Both Mandatory Food Items Checked," "Finished Under 9 Hours." SVG/emoji badges shown in a passport panel; state in localStorage. No backend.

### P2 - Rich Info Cards Per Stop

Each Taco Bell stop and bathroom deserves a richer experience than a basic Leaflet popup. Replace popups with a Komoot/AllTrails-style sidebar detail panel that slides in when you click a marker.

- [ ] **Stop detail panel** — Clicking a TB stop in the sidebar or on the map slides open a detail panel (replacing sidebar list content, or as a bottom sheet on mobile). Panel layout:
  - **Above the fold:** Stop number + name, cumulative miles from start, miles to next stop, estimated arrival time (if pace calculator is set), mandatory food indicator (🌮 badge if this is Stop 3 or Stop 7)
  - **Below the fold:** Crew/spectator access notes (parking, Metro station, street address), "Open in Maps" button, fun stop rating
  - **Collapsible extra:** historical Taco Bell trivia blurb for that location

- [ ] **Funny stop rating scales** — Each TB stop gets three fun ratings displayed as emoji pip rows:
  - 🌯 **Bean Burrito Price Scale** (1–5): relative cost of the mandatory food item, calibrated so 1 burrito ≈ $1.49. Shows what you're paying in burrito-equivalents. Tooltip: "This stop will cost you 3 Bean Burritos."
  - 🌮 **Stop Experience Scale** (1–5): overall vibe from "Sad Sauce Packet" (1) to "Cantina Tier" (5). Ratings are pre-authored in a `STOP_META` object in `app.js`.
  - 🤢 **Vomit Risk Scale** (1–5): from "100% Upchuck Guarantee" (1) → "Odds Not Good" (2) → "Roll The Dice" (3) → "Probably Fine" (4) → "Would Eat A Chalupa Off This Floor" (5). Pre-authored per stop; shown on bathroom finder layer markers too. Each bathroom marker popup leads with this rating in big text so runners can make a split-second call at mile 24.
  - Implementation: define a `STOP_META` array in `app.js` with `{ stopIndex, burritoRating, tacoRating, bathroomRating, vibeNote, crewAccess, trivia }` for each of the 8 stops. Rendering is pure DOM — no new dependencies.

- [ ] **Funny reviews panel (Google Places)** — Fetch top 3–5 reviews per Taco Bell stop from the Google Places API (`Places Details` endpoint, `fields=reviews,rating`). Pre-look up and hardcode each stop's `placeId` in `STOP_DATA` once (they never change). Cache raw API response in `localStorage` keyed `tb50k_reviews_{placeId}` with a 30-day TTL — 8 stops × ~1 API request per visitor stays well inside the $200/month free credit tier (~$0.017/lookup). Render in the stop detail panel as a horizontal scroll of review cards: ★★★★☆ rating, reviewer name, relative timestamp, and review text capped at 240 chars with a "Read more" toggle. Sort by Google's relevance-first default, which naturally surfaces the most distinctive and funny reviews. Tag any review mentioning Taco Bell menu items (chalupa, bean burrito, baja blast, fire sauce, crunchwrap, etc.) with a 🌮 badge. **Fallback plan (critical):** if API call fails or quota is hit, fall back to 2–3 pre-authored satirical placeholder reviews committed in `STOP_META` — e.g., *"Ate here at mile 21. Can confirm the Chalupa Supreme is still good when you're dissociating."* No review panel on OSM bathroom markers — no Place IDs available and the vibes would be grim. **API key hygiene:** browser-side key restricted to this domain only; inject at build time from `.env`; never commit raw.

- [x] **Sauce packet wisdom copy** — When "Sauce Packet" theme is active, replace standard UI hint text with sauce packet sayings. Examples: sidebar empty state → *"Will you marry me?"* | bathroom tooltip → *"Is it hot in here, or is it just me?"* | distance banner → *"I'm not like other hot sauces."* Defined in a `SAUCE_COPY` object keyed by UI element ID; `applyTheme()` swaps copy in when theme === 'sauce'.

---

### P2 - Neighborhood Block Parties & Crew Spots

A static, organizer-curated layer of neighborhood hospitality stops: private homes or local spots along the route where spectators are setting up parties, offering snacks, handing out beer, blasting music. Completely unique to this race and extremely on-brand for the TB DC community vibe.

- [ ] **`block_parties.json` data layer** — Add `block_parties.json` to the repo root. Schema per entry:
  ```json
  {
    "id": "bp-001",
    "name": "Jake's Corner Party",
    "lat": 38.8921,
    "lng": -77.0321,
    "mile_marker": 14.2,
    "host": "Jake M.",
    "runner_note": "Cold towels, beer, and a cowbell. Find us on the corner.",
    "crew_note": "Parking on 14th St N. Ring bell for gate code.",
    "amenities": ["beer", "shots", "snacks", "water", "music", "chairs", "ice", "porta-potty", "tattoos", "dog-petting-zone", "medical", "family-zone"],
    "confirmed": true
  }
  ```
  Full amenity glossary (rendered as emoji badges in UI): 🍺 beer · 🥃 shots · 🌮 snacks · 💧 water · 🎵 music · 🪑 chairs · 🧊 ice · 🚽 porta-potty · 🎨 tattoos · 🐶 dog-petting-zone · 🏥 medical · 👨‍👩‍👧 family-zone. Runner view shows only runner-relevant badges (water, snacks, shots, tattoos, dogs); Crew view shows all including parking/medical. Load via `fetch('block_parties.json')` on page init; cache in `localStorage` key `tb50k_block_parties` for 1 hour. Render as a toggleable 🎉 marker layer.

- [ ] **Runner vs. Crew view toggle** — Toggle in the sidebar header (two-button pill: 🏃 Runner | 🧑‍🤝‍🧑 Crew). In **Runner view**: block party popups show name, mile marker, what to expect, and "Open in Maps" button — no address, no parking, nothing distracting. In **Crew view**: full address, parking notes, host contact (if provided), and all amenities. State persisted to `localStorage`. Also controls visibility of other crew-relevant info (e.g., parking callouts on spectator spots layer).

- [ ] **Block party sidebar section** — New collapsible section "🎉 Party Spots" in the sidebar listing confirmed block parties sorted by mile marker. Each item shows: party name, mile marker, host name, amenity emoji badges (🍺🎵🪑). Clicking flies the map to that pin and opens the detail popup.

- [ ] **Intake form for submitting a party** — Link in the "Party Spots" sidebar section: "Hosting a party? Submit here →" opens a Google Form (or Formspree-backed HTML form) for hosts to register. Fields: name, address, approximate mile marker, what you're offering, runner-facing note, crew-facing note, contact email. Submissions are reviewed and manually curated into `block_parties.json` by the race organizer before going live — no auto-publish. Keeps spam out while keeping setup zero-backend.

---

### P3 - Social & User Accounts (Long-term / Requires Backend)

These features require user authentication and a persistent backend. **Implemented using Supabase** (2026-03-11) — free-tier BaaS with auth, Postgres, realtime, and Row Level Security. No build tools; CDN script tags + vanilla JS IIFEs.

- [x] **Runner vs. Cheerer registration** — Users sign up via Google OAuth or email magic links and declare: "I'm running" or "I'm cheering." Role stored on `profiles` table; switchable from the auth dropdown. Auth bar renders avatar, display name, and role emoji.

- [x] **Food consumption log at every stop** — Runners log what they ate at all 8 TB stops. Each entry: stop number, menu item(s) from picker, optional hot take (280 chars), GPS auto-capture. Mandatory stops (Stop 3 + Stop 7) auto-validate and display green "Rule satisfied" badges. Running tally with taco emojis. Entries grouped by stop with timestamps. Stored in `food_logs` table with RLS policies.

- [x] **Social feed — what did you eat?** — Real-time feed (Supabase Realtime `postgres_changes`) showing posts from all runners: "Stop 4 — Jake just ate a Chalupa Supreme at 10:42 AM." Sortable by recency or stop number. Moderation: flag button on non-own posts, entries auto-hidden after 3+ flags. Offline fallback: last 20 entries cached in localStorage.

- [x] **Party hosting + subscriber alerts** — Hosts create parties with map pin placement, amenity checkboxes (11 types), mile marker, runner note. Subscribe/unsubscribe to parties. "Go Live" triggers in-app banner + browser notification for subscribers. Leaflet layer group with party markers. Realtime subscription for party updates. Offline cache in localStorage.

- [x] **Friend betting system** — Pre-race wagers on: finish time (over/under), food items consumed, bathroom stops, DNF prediction. Runner search with debounced typeahead. Target runners resolve bets with Correct/Wrong buttons. Leaderboard sorted by accuracy with medal emojis. No real money — bragging rights only. Stored in `bets` table.

---

### P3 - Extras
- [ ] **Taco Bell menu integration** - Show menus at each stop, plan what to eat
- [ ] **Calorie tracker** - Track calories consumed vs burned during the race
- [ ] **Photo gallery** - Race-day photo upload tied to map locations
- [ ] **Street-level photo pins** - Community-contributed photos geotagged to route points (static GeoJSON with image URLs)
- [ ] **Finisher wall / results panel** - Static JSON-driven list of past finishers with times and notes. Committed JSON file updated after each race.
- [ ] **KOM/QOM leaderboard per segment** - Fastest times between each Taco Bell pair, pulled from a static results JSON.
- [ ] **Community training heatmap overlay** - Static pre-rendered semi-transparent heatmap image showing high-activity corridors on the route from Strava's public Global Heatmap.
- [ ] **Taco Bell-themed audio cheers** - Optional Web Audio API sound effects (Taco Bell "bong") when checking off stops or mandatory food items. RaceJoy-inspired.
- [ ] **Strava segment deep-links** - Links from named route sections to corresponding Strava segment pages for leaderboard comparison.

---

## Hosting & Deployment — Cost-Effective Options

The app is a static site + Supabase BaaS. Here's how to host it cheaply or free.

### Frontend (Static Files)

| Option | Cost | Notes |
|--------|------|-------|
| **GitHub Pages** | Free | Best for this project. Push to `main`, enable Pages. Custom domain supported. HTTPS free via Let's Encrypt. |
| **Cloudflare Pages** | Free (unlimited bandwidth) | Deploy from GitHub. Fastest global CDN. Free custom domains + HTTPS. |
| **Netlify** | Free (100GB/mo) | Git-push deploy. Free custom domains. 300 build minutes/mo. |
| **Vercel** | Free (100GB/mo) | Similar to Netlify. Slightly better DX for preview deploys. |
| **Surge.sh** | Free | CLI deploy (`surge .`). Good for quick sharing. |

**Recommendation:** GitHub Pages or Cloudflare Pages. Zero cost, zero config, automatic deploys on push.

### Backend (Supabase)

| Tier | Cost | Limits |
|------|------|--------|
| **Free** | $0/mo | 500MB DB, 1GB file storage, 50K MAU, 2M Edge Function invocations, unlimited realtime. **More than enough for this race.** |
| **Pro** | $25/mo | 8GB DB, 100GB storage, 100K MAU. Only needed if 50K+ users or heavy file uploads. |

**Recommendation:** Free tier is sufficient for a single-race event. Supabase pauses inactive projects after 7 days on free tier — keep alive with a weekly cron ping or upgrade to Pro ($25/mo) if needed for race week reliability.

### Custom Domain

| Option | Cost |
|--------|------|
| `.com` via Cloudflare Registrar | ~$10/yr (at-cost, no markup) |
| `.com` via Namecheap | ~$9/yr first year |
| `.dev` via Google Domains | ~$12/yr |
| Use `username.github.io` | Free |

### Total Cost to Host

- **Minimum viable:** $0/mo (GitHub Pages + Supabase free tier + `*.github.io` domain)
- **With custom domain:** ~$10/yr ($0.83/mo)
- **Production-grade for race week:** ~$25/mo (Supabase Pro for guaranteed uptime) + ~$10/yr domain

### Sharing with Others

To let someone else host their own copy:
1. Fork the repo
2. Create a Supabase project (free)
3. Run `schema.sql` in the SQL editor
4. Replace `TB_CONFIG.SUPABASE_URL` and `TB_CONFIG.SUPABASE_ANON_KEY` in `config.js`
5. Enable Google OAuth in Supabase Auth settings (optional)
6. Deploy to GitHub Pages / Cloudflare Pages / Netlify
7. Done — full working app in ~10 minutes

---

## Taco Bell Theme System — Detailed Plan

### Background & Motivation
Taco Bell has a rich 60+ year design history with several visually distinct eras. Implementing a theme switcher using CSS custom properties would let users choose the vibe that resonates with them — from the current clean purple to a sizzling 80s retro to a neon nightlife aesthetic. Themes are persisted to `localStorage` and applied via a `data-theme="..."` attribute on `<body>`.

### Architecture
1. **CSS Custom Properties** — Move all colors in `style.css` to CSS variables under `:root { ... }`. Each theme overrides these variables via `[data-theme="theme-name"] { ... }` selectors.
2. **Theme Switcher UI** — Small themed pill or icon button in the sidebar header (near the "Event Site" link). Clicking opens a theme picker with preview swatches.
3. **Map Tile Swap** — Each theme specifies a preferred tile layer (CARTO Dark, Light, Warm topo, etc.). Switching themes also swaps the tile URL and replaces the route polyline color.
4. **Persistence** — Store selected theme in `localStorage` key `tb50k_theme`. Apply on page load before render to avoid flash of default theme.
5. **Accessible contrast** — Each theme must pass WCAG AA contrast ratios for all text on its background colors.

### The 6 Themes

#### 1. "Live Más Modern" (default — 2016 to present)
The current brand. Flat, bold, digital-first. Commissioned by Lippincott in 2016 — the most dramatic redesign in TB history, built for digital-native touchpoints.
- **Background:** `#1A0A2E` (near-black purple)
- **Primary accent:** `#682A8D` (Ocean Purple — official TB purple PMS 526 C)
- **Secondary accent:** `#EF1897` (magenta — brand extended palette for CTAs)
- **Text primary:** `#FFFFFF`
- **Text secondary:** `#D8B4FE` (soft lavender)
- **Border/divider:** `#4A2070`
- **Route line:** `#a78bfa`
- **Map tiles:** CARTO Dark All (current)
- **Vibe:** Clean, confident, digital-native. Feels like a well-funded startup, not a legacy fast food chain.

#### 2. "Retro Bell '85" (1985–1994)
The era that defined the bell as a standalone icon. Yellow bell on red arch, bold diagonal-serif wordmark. Miami Vice and road-trip signage energy.
- **Background:** `#7A0A1A` (dark crimson)
- **Sidebar bg:** `#1A0800` (near-black warm)
- **Primary accent:** `#F5C518` (golden yellow — the bell)
- **Secondary accent:** `#3A7D44` (taco green — bell accent stripe)
- **Warm fill:** `#E8410A` (burnt orange)
- **Text primary:** `#FFF8E7` (warm cream)
- **Border/divider:** `#C41230` (deep red)
- **Route line:** `#F5C518` (golden)
- **Map tiles:** Stamen Terrain or OSM Standard (warm earthy feel)
- **Font vibe:** Condensed bold (Oswald, Bebas Neue)
- **Vibe:** Energetic, hungry, Saturday afternoon. Retro-kitsch. Neon diner clock meets vinyl booth.

#### 3. "Purple Reign '94" (1994–2016)
22 years of pop culture dominance. Fuchsia bell on electric purple. The "Yo Quiero Taco Bell" Chihuahua era. "Out went the earth tones. In came fuchsia, electric purple, and taxi-cab yellow."
- **Background:** `#2D0050` (midnight purple)
- **Sidebar bg:** `#1A002E`
- **Primary accent:** `#D9208A` (hot magenta — the pink bell)
- **Secondary accent:** `#FFE033` (neon yellow)
- **Electric purple:** `#8B2FC9` (vivid violet fills)
- **Text primary:** `#FFFFFF`
- **Border/divider:** `#5C1E8C`
- **Route line:** `#D9208A` (magenta)
- **Map tiles:** CARTO Dark (works well with this palette)
- **Font vibe:** Slightly angled display font (Archivo Black, Barlow Condensed)
- **Vibe:** Bold, irreverent, late-night. 90s Saturday morning cartoon meets mall food court. Maximum personality.

#### 4. "Baja Blast" (2004–present)
The iconic teal-turquoise color of Mountain Dew Baja Blast — designed to contrast with TB's purple. Became so embedded it defined the 2019 Palm Springs hotel aesthetic: "one part La Croix, one part fun-in-the-sun." In 2024, made permanently available in retail.
- **Background:** `#FFFFFF` (bright white / light mode)
- **Sidebar bg:** `#F0FCFC` (teal-tinted white)
- **Primary accent:** `#00BFB3` (Baja Blast teal)
- **Secondary accent:** `#EF1897` (hot pink / brand magenta)
- **Dark anchor:** `#682A8D` (TB purple as subtle bg element)
- **Text primary:** `#0D0D0D`
- **Text secondary:** `#007A78` (deep teal)
- **Border/divider:** `#B2F0ED` (light teal)
- **Route line:** `#00BFB3` (teal)
- **Map tiles:** CartoDB Positron (light, clean) or Stamen Watercolor
- **Font vibe:** Bold display + clean body (Playfair + Lato mix)
- **Vibe:** Summer vacation. Poolside. California sunshine. Bright, retro-tropical, unbothered. Light mode!

#### 5. "Cantina Night" (2015–present)
Upscale urban Cantina format: no drive-through, open kitchen, alcohol, DJ sets, distressed wood, pendant lighting. The Las Vegas flagship is a two-story dance club, restaurant, and wedding chapel. Gold and near-black.
- **Background:** `#0D0D0D` (near black)
- **Sidebar bg:** `#111111`
- **Primary accent:** `#C9A84C` (warm gold — distressed metal, pendant lighting)
- **Secondary accent:** `#EF1897` (neon magenta pop)
- **Bell glow:** `#682A8D` (TB purple as ambient glow)
- **Text primary:** `#F5F5F0` (warm white)
- **Text secondary:** `#A08060` (aged gold)
- **Border/divider:** `#2A1A00` (dark warm brown)
- **Route line:** `#C9A84C` (gold)
- **Map tiles:** CARTO Dark Nolabels or CartoDB Dark Matter
- **Font vibe:** Futura PT Heavy or Oswald for headers; Lato for body
- **Vibe:** After dark. Sophisticated but irreverent. Neon signs reflecting in rain puddles. Date night starting and ending at Taco Bell.

#### 6. "Sauce Packet" (fun/novelty — 2004–present)
Every sauce packet is a sub-brand. White (Mild) → Orange (Hot) → Red (Fire) → Near-black (Diablo). The heat-level gradient doubles as a data visualization system for race difficulty. The UI copy speaks in sauce packet wisdom.
- **Background:** `#F5F0E8` (Mild — off-white cream)
- **Sidebar bg:** `#FFF8F0`
- **P1 accent (low intensity):** `#F08030` (Breakfast Salsa orange)
- **P2 accent (mid):** `#E8410A` (Hot — burnt orange-red)
- **P3 accent (high):** `#C41230` (Fire — deep red)
- **P4 accent (max):** `#3B0A0A` (Diablo — near-black dark red)
- **Text primary:** `#1A0A00`
- **Interactive elements:** `#E8410A`
- **Route line:** Gradient from orange (start) → red (hard sections) → near-black (final miles)
- **Map tiles:** OSM Standard or Stamen Toner Lite
- **Font vibe:** Montserrat Bold for labels + Caveat/Permanent Marker for callout "sauce packet saying" text
- **Vibe:** Playful, self-aware. The brand winking at itself. Internet-friendly. The heat-level gradient maps directly onto route difficulty / fatigue curve — Mild for easy early miles, Diablo for the final push.
- **Special:** UI copy for tooltips/hints written as sauce packet sayings (e.g., "I've seen things from this sidebar you wouldn't believe.")

### Implementation Steps
1. **Audit current CSS** — Identify every hardcoded color value in `style.css` and map to a semantic variable name (`--color-bg`, `--color-accent-primary`, `--color-accent-secondary`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-route-line`, `--color-marker-bg`, `--color-marker-text`, etc.)
2. **Refactor `style.css`** — Replace all color literals with `var(--...)` references; define defaults in `:root` (Live Más Modern values)
3. **Write theme blocks** — Add 5 additional `[data-theme="..."]` blocks in `style.css` overriding just the custom properties that change
4. **Add tile layer config** — Store preferred tile URL per theme in `app.js` `THEMES` object; swap on theme change
5. **Build theme picker UI** — Six colored swatches in sidebar (small circles or pills with theme name). Clicking applies immediately.
6. **Persist selection** — `localStorage.setItem('tb50k_theme', themeName)` on change; apply before first render on page load
7. **Update marker colors** — TB stop markers currently use hardcoded colors inline; move to CSS classes driven by custom properties
8. **Test all themes on mobile** — Each theme must be legible on a phone screen in bright outdoor conditions

---

## Implementation Plan (2026-03-10 Session)

Working through backlog in priority order. Skipping features that require user accounts/backend.

### Batch 1 — P0 Quick Wins
1. **Directions button** — `openInMaps(lat, lng, label)` utility with UA detection (iOS/Android/desktop). Add to all stop popups and custom pin popups.
2. **Bathroom finder toggle** — Overpass API query for `amenity=toilets` in DC corridor. Toggleable layer group. 7-day localStorage cache. Directions button on each bathroom popup.
3. **Export route to Google Maps** — Sidebar button that opens a Google Maps directions URL with all 8 TB stops as waypoints. Mobile fallback note.

### Batch 2 — P1 Race Planning
4. **Pace calculator** — Enter goal time → get estimated arrival at each stop. Optional decay factor for late miles. Pure client-side math.
5. **Mandatory food tracker** — Checklist for the two race rules (Stop 3 & Stop 7). Checkboxes persisted to localStorage.
6. **Fly-to-stop** — Replace `map.setView()` with `map.flyTo()` for smooth pan-zoom.

### Batch 3 — P2 Quick Wins
7. **Add to Calendar (.ics)** — One-click .ics download for Nov 27, 2026.
8. **Course preview flythrough** — Animate camera along GPX track.

---

## Implementation Plan (2026-03-11 Session #2)

Working through remaining backlog in priority order. Skipping features requiring user accounts or external API keys.

### Batch 1 — P1 Quick Wins
1. **Map tile layer switcher** — `L.control.layers()` with CARTO Dark, CARTO Light, OSM Standard, Esri Satellite, OpenTopoMap. Uses existing THEMES tile URLs. ~20 lines JS.
2. **Race day countdown clock** — New sidebar section. Enter start time → shows elapsed, estimated position, time remaining to 11h cutoff. `setInterval` timer. Persisted to localStorage.
3. **Time-of-day estimator** — Extend pace calculator to show wall-clock arrival times (e.g., "11:45 AM") based on entered start time.
4. **Turn-by-turn segments** — Show per-leg distances between consecutive stops in Route Info section.

### Batch 2 — Race Day Features
5. **Live location tracker (Race Mode)** — `navigator.geolocation.watchPosition`. Pulsing blue dot on map. Toggle button in Tools.
6. **Distance-to-next-stop banner** — Fixed HUD when race mode active showing nearest stop + distance away.

### Batch 3 — Polish & Export
7. **Printable pace card** — Print CSS + "Print Pace Card" button. Clean single-page layout for laminating.
8. **Sauce packet wisdom copy** — Sauce packet theme replaces UI hints with packet sayings.
9. **Weather overlay** — NWS API for race day forecast. Single fetch, display in sidebar.

---

## Completed
- [x] **Theme switcher** (2026-03-10) — 6 TB-era themes with CSS custom properties, tile layer swap, route color swap, themed sidebar background patterns (pure CSS gradients, zero HTTP requests), event link redesign as pill button. Persisted to localStorage. Mobile/desktop tested.
- [x] **Better event website UX** (2026-03-10) — Event link redesigned as rounded pill badge with 🌮 icon, theme-aware hover/focus styles, proper mobile tap targets. Implemented as part of theme system work.
- [x] **Directions button on all popups** (2026-03-10) — `openInMaps()` utility with UA detection (iOS/Android/desktop deep-links). Added to all stop popups, custom pin popups, and bathroom popups.
- [x] **Bathroom finder toggle** (2026-03-10) — Overpass API query for `amenity=toilets` in DC corridor. Toggleable layer group with 7-day localStorage cache. Each bathroom popup has a Directions button.
- [x] **Export route to Google Maps** (2026-03-10) — Sidebar button constructs Google Maps directions URL with all 8 TB stops as walking waypoints.
- [x] **Pace calculator with aid station splits** (2026-03-10) — Enter goal time, get estimated arrival at each stop with 4% fatigue decay after mile 20. Persisted to localStorage.
- [x] **Mandatory food requirement tracker** (2026-03-10) — Two race-rule checkboxes with green strikethrough on completion. Persisted to localStorage.
- [x] **Fly-to-stop smooth navigation** (2026-03-10) — `map.flyTo()` replaces `map.setView()` for cinematic pan-zoom on sidebar clicks.
- [x] **Add to Calendar (.ics)** (2026-03-10) — One-click .ics download for Nov 27, 2026 with race details.
- [x] **Course preview flythrough** (2026-03-10) — Animated camera pan along GPX track, togglable start/stop.
- [x] **Mobile-first redesign** (2026-03-10) — Collapsible sidebar sections on all viewports, 44px+ touch targets, responsive tools grid.
- [x] **Collapsible sections on desktop** (2026-03-10) — Sections start collapsed to reduce visual clutter; click to expand. Toggle arrows visible on all viewports.
- [x] **Comprehensive test rewrite** (2026-03-10) — Rewrote `tests/responsive.test.html` to cover all new features. 246 total assertions across 14 test groups: DOM structure, event link, theme system, collapsible sections, responsive CSS, JS functions, map init, pin form, directions, pace calculator, food tracker, tools section, flythrough, stop distances. Tests pass at both mobile (375px) and desktop (1280px) viewports.
- [x] **Backend: User accounts & auth** (2026-03-11) — Supabase integration with Google OAuth + email magic links. IIFE module `TB_AUTH` with session management, profile auto-creation, role picker modal, auth bar UI. Graceful degradation when backend not configured.
- [x] **Backend: Food consumption log** (2026-03-11) — `TB_FOOD_LOG` module. Stop selector, menu item checkboxes, hot take input, GPS auto-capture. Running tally, mandatory rule validation, entries grouped by stop. Data layer in `TB_DB`.
- [x] **Backend: Social feed** (2026-03-11) — `TB_SOCIAL_FEED` module. Realtime subscription via Supabase postgres_changes. Sort by recency/stop. Moderation with flag system (auto-hide at 3+ flags). Offline cache fallback.
- [x] **Backend: Party hosting** (2026-03-11) — `TB_PARTIES` module. Party creation with map pin, amenity checkboxes, mile marker. Subscribe/unsubscribe. Go Live with in-app banner + browser notifications. Leaflet marker layer. Realtime updates.
- [x] **Backend: Friend betting** (2026-03-11) — `TB_BETTING` module. Runner search with debounced typeahead. 4 bet types (finish time, food items, bathroom stops, DNF). Resolve bets. Leaderboard with accuracy rankings.
- [x] **Backend test suite** (2026-03-11) — `tests/supabase-mock.js` mock client + `tests/backend.test.html` with 18 test groups covering: config, mock CRUD, mock auth, mock realtime, all module APIs, auth guards, CRUD operations, UI rendering, graceful degradation, edge cases, mandatory rules, auth bar UI, offline caching.
- [x] **Hosting & deployment guide** (2026-03-11) — Added cost-effective hosting recommendations to backlog: GitHub Pages/Cloudflare Pages (free), Supabase free tier, domain options, fork-and-deploy instructions.
- [x] **Map tile layer switcher** (2026-03-11) — `L.control.layers()` with 5 tile options (CARTO Dark, CARTO Light, OSM, OpenTopoMap, Esri Satellite). Persists selection to localStorage. Themed to match current app theme.
- [x] **Race day countdown clock** (2026-03-11) — New sidebar section. Enter start time → live countdown showing elapsed time, time remaining to 11h cutoff, estimated position (when pace is set). `setInterval` timer, persisted to localStorage.
- [x] **Time-of-day estimator** (2026-03-11) — Extended pace calculator with ETA column showing wall-clock arrival times (e.g., "11:45 AM") at each stop. Uses `formatClockTime()` and `addMinutesToTime()` helpers. Only shown when race start time is set.
- [x] **Turn-by-turn segments** (2026-03-11) — New "Leg-by-Leg" sidebar section showing 8 stop-to-stop segments with area names and distances. Built by `buildSegments()` from `STOP_DISTANCES` array.
- [x] **Live location tracker (Race Mode)** (2026-03-11) — Toggle button in Tools. Uses `navigator.geolocation.watchPosition` with pulsing blue dot marker (`race-pulse` CSS animation). Auto-stops on geolocation error.
- [x] **Distance-to-next-stop banner** (2026-03-11) — Fixed HUD banner when race mode active. Shows nearest stop name + distance in miles via Haversine calculation. Auto-hides when race mode stops.
- [x] **Weather overlay** (2026-03-11) — NWS API integration (`api.weather.gov`) for race start area forecast. Shows 4 periods with temperature, description, precipitation probability. 3-hour localStorage cache. Graceful fallback on fetch failure.
- [x] **Sauce packet wisdom copy** (2026-03-11) — `SAUCE_COPY` object with 8 sauce packet sayings. `applySaucePacketCopy()` swaps hint text when sauce theme is active using `data-sauce-id` and `data-default-hint` attributes. Reverts on theme change.
- [x] **Printable pace card** (2026-03-11) — "Print Pace Card" button in Tools. Triggers `window.print()` with comprehensive `@media print` CSS hiding map/sidebar chrome, forcing black-on-white layout. Auto-calculates pace first.
- [x] **Test suite update** (2026-03-11) — Added 7 new test groups (102 assertions) to `tests/responsive.test.html`: Countdown Clock, Segments, Weather, Race Mode, Sauce Packet Copy, Time-of-Day Estimator, Layer Control. Updated existing tests for new 6-button tools grid and 9-section DOM. 301/303 total assertions pass.
