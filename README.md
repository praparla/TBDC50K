# Taco Bell DC 50K Route Planner

Interactive route planner for the [Taco Bell DC 50K](https://tacobelldc50k.com/) — a 32.4-mile ultramarathon through Alexandria, Arlington, and Washington DC that stops at every Taco Bell along the way.

**Live site:** [https://your-username.github.io/TacoBell50K/](https://your-username.github.io/TacoBell50K/)

## What is this?

The TB DC 50K is a self-supported ultra on November 27, 2026. Runners hit 8 Taco Bell stops across 32+ miles with mandatory food requirements (Chalupa Supreme or Crunchwrap by Stop 3, Burrito Supreme or Nachos Bell Grande by Stop 7) and an 11-hour cutoff.

This app helps runners plan their race by visualizing the full route on an interactive map with all Taco Bell stops marked, plus the ability to add custom pins for crew spots, restrooms, parking, and other points of interest.

## Features

- **Interactive Leaflet map** with the full GPX route and all 8 Taco Bell stop markers
- **Custom pins** — tap/click the map to add restrooms, water, friend houses, food, medical, parking, or custom markers. Saved to localStorage
- **6 Taco Bell-era themes** — switchable color schemes inspired by different TB brand eras:
  - *Live Mas Modern* (2016–present) — clean purple digital-first
  - *Retro '85* (1985–1994) — golden bell, warm crimson, diner vibes
  - *Purple Reign '94* (1994–2016) — hot pink, electric purple, 90s Memphis geometry
  - *Baja Blast* — tropical teal light mode
  - *Cantina Night* — upscale gold-on-black
  - *Sauce Packet* — heat gradient from mild orange to diablo red
- **Responsive layout** — works on mobile (collapsible sidebar, touch targets) and desktop (side-by-side)
- **Route info panel** — distance, track points, stop count, time limit
- **Theme persistence** — selection saved to localStorage with FOUC prevention
- **Zero backend** — pure static HTML/CSS/JS, GPX data embedded as JS arrays

## Tech Stack

- **Leaflet.js** for maps
- **CSS custom properties** for the theme system (one `[data-theme]` selector block per theme)
- **Vanilla JS** — no frameworks, no build step
- **GitHub Pages** for hosting

## Local Development

```bash
# Option 1: Python dev server
python3 -m http.server 8050
open http://localhost:8050

# Option 2: Any static file server
npx serve -p 8050
```

> **Note:** If the project lives in iCloud Drive, system python3 may throw a `PermissionError`. Copy files to `/tmp` and serve from there, or use `npx serve`.

## Running Tests

```bash
# Start server, then open test page
python3 -m http.server 8050
open http://localhost:8050/tests/responsive.test.html
```

Tests run in-browser and cover DOM structure, event link, theme system (all 6 themes), collapsible sections, responsive CSS (mobile/tablet/desktop media queries), JS functions, map initialization, and pin form. Resize the browser to test mobile vs desktop breakpoints.

## Project Structure

```
├── index.html          # Main app page
├── app.js              # All JS — map init, themes, pins, route info
├── style.css           # All CSS — themes, responsive layout, components
├── gpx_data.js         # Embedded GPX track + waypoint arrays
├── issues.md           # Bug tracker with lessons learned
├── backlog.md          # Feature backlog and roadmap
├── CLAUDE.md           # Development principles
└── tests/
    └── responsive.test.html  # In-browser test suite (108 assertions)
```

## Race Details

- **Distance:** 32.4 miles
- **Date:** November 27, 2026
- **Start/Finish:** 417 King St, Alexandria, VA (Taco Bell Cantina)
- **Stops:** 8 Taco Bells across Alexandria, Arlington, and DC
- **Time Limit:** 11 hours
- **Mandatory Food:** Chalupa Supreme or Crunchwrap by Stop 3; Burrito Supreme or Nachos Bell Grande by Stop 7

## License

MIT
