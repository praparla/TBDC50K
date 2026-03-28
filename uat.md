# UAT Baseline — Taco Bell DC 50K Route Planner

_Created: 2026-03-22_
_Last run: 2026-03-28_

## Project Info
- **Stack**: Vanilla HTML/CSS/JS + Leaflet map (no build step)
- **Dev server**: `bash -c "cd /tmp/tb50k_serve && python3 -m http.server 8050"` (files copied from iCloud Drive to /tmp)
- **Entry point**: index.html
- **Key routes**: Single-page app (no routing)

## Critical Flows (run every time)

1. **Page Load**: Map renders with route polyline and 8 numbered stop markers (S, 1-7). No console errors except expected weather fetch retry and Supabase-not-configured warning.
2. **Theme Switching**: All 6 themes (Live Mas, Retro '85, Purple Reign '94, Baja Blast, Cantina Night, Sauce Packet) apply correctly — route color changes, sidebar colors update, map tiles change.
3. **Collapsible Sections**: All 22 sidebar sections expand/collapse on click. Toggle arrow rotates.
4. **Taco Bell Stops**: Section expands showing 8 stops with addresses. Clicking a stop number on map opens popup with details.
5. **Pace Calculator**: Enter hours/min, click Calculate — split table appears with all 8 stops + finish, distances, and elapsed times.
6. **Leg-by-Leg**: Shows 8 segments with correct neighborhoods (Start→Stop 1: Alexandria, ..., Stop 7→Finish: Alexandria).
7. **Elevation Profile**: Canvas chart renders with correct stats (1263 ft gain/loss, 417 ft max, -3 ft min).
8. **Route Info**: Shows 32.4 miles, 1992 track points, 8 stops, 11 hour limit, Nov 27, 2026.
9. **Mobile Layout**: At 375px width, sidebar stacks above map. All sections accessible. Touch targets functional.

## Sections & Last Tested

| Section | Last Tested | Notes |
|---------|-------------|-------|
| Header / Title | 2026-03-22 | Stable — title, subtitle, event link |
| Theme Switcher | 2026-03-28 | Stable — all 6 themes verified, Baja Blast + Cantina Night + Sauce Packet tested |
| Runner/Crew Toggle | 2026-03-28 | Stable — toggle works on mobile Baja Blast theme, accent colors correct |
| Taco Bell Stops | 2026-03-28 | Stable — stop detail panel with ratings, mandatory food, crew access, Directions |
| Pace Calculator | 2026-03-28 | Stable — 9h30m goal = 9h 30m finish, all 8 stops + finish correct |
| Mandatory Food | 2026-03-27 | Stable — 2 checkboxes with sauce packet quote |
| Food Log | 2026-03-27 | Stable — shows sign-in prompt (expected without backend) |
| Live Feed | 2026-03-22 | Not tested (needs backend) |
| Party Spots | 2026-03-22 | Not tested (needs backend) |
| Bets | 2026-03-22 | Not tested (needs backend) |
| Race Day Clock | 2026-03-28 | Stable — 7:00 AM start, 243d countdown, 6:00 PM cutoff correct |
| Weather | 2026-03-22 | Stable — loads forecast (initial fetch may fail on non-HTTPS) |
| Block Parties | 2026-03-27 | Stable — empty state with "Submit your party" link, Show on Map toggle |
| Course Sections | 2026-03-27 | Stable — 7 named sections with correct mile ranges |
| Tools | 2026-03-28 | Stable — 16 buttons, single-col on mobile (ISSUE-020 fixed), 2-col on desktop |
| TB Passport | 2026-03-27 | Stable — 10 badges, 4 earned, grid renders correctly |
| Custom Pins | 2026-03-27 | Stable — form with 7 icon picker, "Click Map to Place Pin" prompt |
| Alt Routes | 2026-03-27 | Stable — "Toggle alt routes to see options" instruction |
| Split History | 2026-03-27 | Stable — empty state with sauce packet quote, proper instructions |
| Calorie Tracker | 2026-03-28 | Stable — +Add Chalupa Supreme updates to 350/3240/-2890, math correct |
| Segment Records | 2026-03-27 | Stable — 7 named segments with TBD KOM/QOM, distances correct |
| Finisher Wall | 2026-03-27 | Stable — 2 entries, note about Nov 27 race |
| Leg-by-Leg | 2026-03-27 | Stable — all 8 segments, last shows Alexandria |
| Elevation Profile | 2026-03-28 | Stable — grade-colored chart, stats correct (1263 ft gain/loss, 417 ft max, -3 ft min) |
| Route Info | 2026-03-27 | Stable — 32.4 mi, 1992 pts, 8 stops, 11h, Nov 27 2026 |

## Known Stable Areas
- Theme switching (all 6 themes) — now with proper 44px touch targets
- Map rendering with route polyline and stop markers
- Pace Calculator with split table (with and without GAP)
- Collapsible sections expand/collapse
- Elevation Profile canvas chart
- Route Info statistics
- Course Sections display
- Calorie Tracker add/clear
- TB Passport badge grid
- Segment Records display
- Tools grid (16 buttons)
- Stop popups with Directions button

## Known Flaky / Unstable Areas
- Weather fetch: initial load sometimes fails with `TypeError: Failed to fetch`, but data appears after retry. Console error is cosmetic. (ISSUE-015)
- 1 pre-existing test failure: "map has .map-ready class after load" — likely timing/race condition in test environment.

## Exploration Notes
- ISSUE-014 (theme swatch 22px touch targets) FIXED in 2026-03-24 run — now 44px via ::before pseudo-element
- ISSUE-019 (--color-accent-primary undefined) FIXED in 2026-03-26 run — 12 CSS rules used a variable that no theme defined; replaced with --color-accent
- Tested viewports: desktop (1280x800) and mobile (375x812) — all layouts work correctly
- Sidebar scrolls independently from map on desktop; stacks above map on mobile/tablet
- Backend-dependent sections (Live Feed, Party Spots, Bets) show graceful degradation with "Backend not configured" message
- Restroom finder (Overpass API) works — markers appear on map, button toggles to "Restrooms On"
- UX observation: 22 sidebar sections may be overwhelming — consolidation ideas added to backlog (P2 UX Simplification)
- ISSUE-020 (tools-grid 2-col on mobile) FIXED in 2026-03-28 run — duplicate CSS rule in later @media block overrode the correct single-column mobile rule
- Test suite: 836/837 passing (1 pre-existing flaky map-ready timing test)
