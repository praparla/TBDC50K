# Backlog - Taco Bell DC 50K Route Planner

## Priority Legend
- **P0** - Must have (blocking or critical)
- **P1** - Should have (high value)
- **P2** - Nice to have (enhancements)
- **P3** - Someday/Maybe

---

## Active Backlog

### P1 - Route & Visualization
- [ ] **Elevation profile** - Show interactive elevation chart (via `leaflet-elevation` plugin) below the map. Hover/scrub to move a dot along the route. Shows grade, elevation, and cumulative distance. Already have GPX data — zero new network requests needed.
- [ ] **Grade-colored route polyline** - Segment the `GPX_TRACK` array and color each segment by steepness: green (flat), yellow (moderate), red (steep). Lets runners instantly spot hard sections without reading a chart.
- [ ] **Turn-by-turn segments** - Break route into named stop-to-stop segments with individual distances and elevation change per leg.
- [ ] **Named course sections** - Define and highlight named sub-sections ("The Georgetown Climb," "Capitol Hill Push," "Final 5K") as clickable overlays with character notes. Storytelling for the course.
- [ ] **Offline map support** - Service worker pre-fetches CARTO dark tiles for the route corridor at zoom 13–16 (~3–8 MB). The `gpx_data.js` embedded data is already offline; only tile layer needs caching.

### P1 - Race Planning & Pacing
- [ ] **Pace calculator with aid station splits** - Enter goal finish time → get estimated arrival at each of the 8 Taco Bell stops accounting for cumulative distances. Include optional slowdown/decay factor for miles 20–32. Pure client-side JS math, no dependencies.
- [ ] **Grade-adjusted pace estimator (GAP)** - Slider for user's flat-road pace + Minetti GAP model (~3.5% time penalty per 1% grade uphill). Refines the aid station split calculator for hilly sections like the Georgetown climb.
- [ ] **Mandatory food requirement tracker** - Prominent checklist panel for the two race rules (Chalupa Supreme OR Crunchwrap by Stop 3; Burrito Supreme OR Nachos Bell Grande by Stop 7). Checkboxes turn green when satisfied; persisted to localStorage. Unique to this race and very on-brand.
- [ ] **Race day countdown clock** - User enters their start time (e.g., 7:00 AM); a panel shows: time elapsed, estimated current position at target pace, and time remaining before the 11-hour cutoff. Runs via `setInterval`; start time persisted to localStorage.
- [ ] **Time-of-day estimator** - Show estimated arrival time at each stop based on entered start time + pace, so runners know "I should be at Stop 4 by 11:45 AM."
- [ ] **Aid station / restroom finder** - Auto-populate public restrooms and water fountains near the route from OpenStreetMap Overpass API.
- [ ] **Weather overlay** - Pull NWS forecast for Nov 27, 2026 race day; display at a glance in the sidebar.

### P2 - Navigation & Map UX
- [ ] **Map tile layer switcher** - Toggle between: CARTO Dark (current), Esri World Imagery (satellite), OpenTopoMap (contour lines), OSM Standard. Uses Leaflet's built-in `L.control.layers()`. Low effort, high utility.
- [ ] **"Fly to stop" smooth navigation** - Replace `map.setView()` with `map.flyTo()` for smooth cinematic pan-and-zoom when clicking a stop in the sidebar.
- [ ] **Alternative route suggestions** - Toggle between different route options between stops.
- [ ] **Spectator spots map layer** - Toggleable GeoJSON layer of recommended crew/spectator positions with easy parking or Metro access (Lincoln Memorial area ~mile 15, Capitol Hill ~mile 23, Old Town start/finish). Static file, no backend.

### P2 - Custom Pins & Social
- [ ] **Pin categories & filtering** - Toggle visibility of pin types (restrooms, friends, food, etc.)
- [ ] **Shareable pin sets via URL** - Encode custom pins into a URL hash/query string so runners can share crew stop locations with their support team. No backend — pure client-side URL state.
- [ ] **Pin notes & photos** - Add notes or photos to custom pins
- [ ] **Friend location sharing** - Real-time location sharing on race day

### P2 - Race Day Mode
- [ ] **Live location tracker (Race Mode)** - "Start Race Mode" toggle using the Geolocation API (`navigator.geolocation.watchPosition`). Shows user's live position as a pulsing dot on the map. ~20 lines of Leaflet + JS.
- [ ] **Distance-to-next-stop banner** - In race mode: persistent heads-up display showing "Next: Stop 4 - Columbia Heights | 2.3 mi away." Uses Haversine already in `app.js` + live geolocation.
- [ ] **Race-day GPS tracking** - Full GPS tracking with live position logged and split times recorded at each stop.
- [ ] **Split history** - Log actual splits at each stop during the race.

### P2 - Sharing & Export
- [ ] **Printable pace card** - "Print" button generates a clean single-page pace card (stop names, cumulative distances, goal arrivals, mandatory food notes) via `window.print()` with print-specific CSS. Runners can laminate and carry in their vest.
- [ ] **GPX export** - Export the route with custom pins as a GPX file for Garmin/Wahoo.
- [ ] **Strava integration** - Import training runs, overlay on race route.
- [ ] **Add to Calendar (.ics)** - One-click `.ics` download for Nov 27, 2026 race day with event details pre-filled. Works in Apple Calendar, Google Calendar, and Outlook — no API keys needed.
- [ ] **Shareable race card image** - CSS-styled `<div>` showing route thumbnail, goal time, name, and Taco Bell branding — screenshottable for Instagram/social hype.

### P2 - UI/UX
- [ ] **Theme switcher** - See detailed plan below in "Taco Bell Theme System" section. Multiple TB-era themes switchable from a menu, persisted to localStorage.
- [ ] **Mobile-first redesign** - Better mobile experience with collapsible sidebar
- [ ] **Search for locations** - Geocoding to search and add pins by address
- [ ] **Drag to reposition pins** - Allow dragging placed pins to adjust location
- [ ] **Course preview flythrough animation** - "Preview Route" button animates the map camera flying along the GPX track start-to-finish using `setInterval` + `map.flyTo()`. ~50 lines of JS, visually impressive.

### P2 - PWA & Offline
- [ ] **Installable PWA** - `manifest.json` + service worker → "Add to Home Screen" on iOS/Android. Race-day quick launch from home screen without navigating to a URL. Taco Bell 🌮 launcher icon.
- [ ] **Offline tile caching** - Pre-cache map tiles for route corridor. See offline map support above.

### P2 - Gamification
- [ ] **"Taco Bell Passport" achievement system** - Checklist-style badges: "Visited All 8 TBs on a Training Run," "Logged 20+ Mile Training Run," "Both Mandatory Food Items Checked," "Finished Under 9 Hours." SVG/emoji badges shown in a passport panel; state in localStorage. No backend.

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

## Completed
_Nothing completed yet._
