# UAT Baseline — Taco Bell DC 50K Route Planner

_Created: 2026-03-22_
_Last run: 2026-03-22_

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
| Theme Switcher | 2026-03-22 | Stable — all 6 themes work |
| Runner/Crew Toggle | 2026-03-22 | Stable — switches view mode |
| Taco Bell Stops | 2026-03-22 | Stable |
| Pace Calculator | 2026-03-22 | Stable — tested with 6h30m |
| Mandatory Food | 2026-03-22 | Stable — 2 checkboxes |
| Food Log | 2026-03-22 | Not tested in detail |
| Live Feed | 2026-03-22 | Not tested (needs backend) |
| Party Spots | 2026-03-22 | Not tested (needs backend) |
| Bets | 2026-03-22 | Not tested (needs backend) |
| Race Day Clock | 2026-03-22 | Stable — countdown shows 250d, cutoff 6:00 PM |
| Weather | 2026-03-22 | Stable — loads 4-day forecast (initial fetch may fail, retries succeed) |
| Block Parties | 2026-03-22 | Not tested in detail (empty data) |
| Course Sections | 2026-03-22 | Stable — 7 named sections with mile ranges |
| Tools | 2026-03-22 | Stable — 14-button grid renders |
| TB Passport | 2026-03-22 | Not tested in detail |
| Custom Pins | 2026-03-22 | Stable — form with icon picker, name, note, type dropdown, search |
| Alt Routes | 2026-03-22 | Not tested in detail |
| Split History | 2026-03-22 | Not tested in detail |
| Calorie Tracker | 2026-03-22 | Stable — +Add updates consumed/burned/net |
| Segment Records | 2026-03-22 | Not tested in detail |
| Finisher Wall | 2026-03-22 | Stable — shows 2 entries |
| Leg-by-Leg | 2026-03-22 | Fixed ISSUE-013 — last segment now shows Alexandria |
| Elevation Profile | 2026-03-22 | Stable — canvas chart renders |
| Route Info | 2026-03-22 | Stable — all stats correct |

## Known Stable Areas
- Theme switching (all 6 themes)
- Map rendering with route polyline and stop markers
- Pace Calculator with split table
- Collapsible sections expand/collapse
- Elevation Profile canvas chart
- Route Info statistics
- Course Sections display
- Calorie Tracker add/clear

## Known Flaky / Unstable Areas
- Weather fetch: initial load sometimes fails with `TypeError: Failed to fetch`, but data appears after retry. Console error is cosmetic.
- 2 pre-existing test failures: "map has .map-ready class after load" and "Default view mode is runner" — likely timing/race conditions in test environment.

## Exploration Notes
- Theme swatch buttons are 22x22px (below 44px touch target minimum) — logged as ISSUE-014
- Tested viewports: desktop (1280x800), tablet (768x1024), mobile (375x812) — all layouts work correctly
- Sidebar scrolls independently from map on desktop; stacks above map on mobile/tablet
- "Stop 6 → Stop 7" and "Stop 7 → Finish" previously both showed "Union Station" — fixed in ISSUE-013
- Backend-dependent sections (Live Feed, Party Spots, Bets) show graceful degradation with "Backend not configured" message
