# UAT Baseline — Taco Bell DC 50K Route Planner

_Created: 2026-03-22_
_Last run: 2026-03-29_

## Project Info
- **Stack**: Vanilla HTML/CSS/JS + Leaflet map (no build step)
- **Dev server**: `bash -c "cd /tmp/tb50k_serve && python3 -m http.server 8050"` (files copied from iCloud Drive to /tmp)
- **Entry point**: index.html
- **Key routes**: Single-page app (no routing)

## Critical Flows (run every time)

1. **Page Load**: Map renders with route polyline and 8 numbered stop markers (S, 1-7). No console errors except expected weather fetch retry and Supabase-not-configured warning.
2. **Theme Switching**: All 6 themes (Live Mas, Retro '85, Purple Reign '94, Baja Blast, Cantina Night, Sauce Packet) apply correctly — route color changes, sidebar colors update, map tiles change.
3. **Collapsible Sections**: 13 visible sidebar sections (down from 22 after consolidation) expand/collapse on click. Toggle arrow rotates.
4. **Taco Bell Stops**: Section expands showing 8 stops with addresses. Clicking a stop number on map opens popup with details.
5. **Pace Calculator**: Enter hours/min, click Calculate — split table appears with all 8 stops + finish, distances, and elapsed times.
6. **Leg-by-Leg**: Shows 8 segments with correct neighborhoods (Start→Stop 1: Alexandria, ..., Stop 7→Finish: Alexandria).
7. **Elevation Profile**: Canvas chart renders with correct stats (1263 ft gain/loss, 417 ft max, -3 ft min).
8. **Route Info**: Shows 32.4 miles, 1992 track points, 8 stops, 11 hour limit, Nov 27, 2026.
9. **Mobile Layout**: At 375px width, sidebar stacks above map. All sections accessible. Touch targets functional.
10. **Food & Nutrition Tabs**: Rules/Log/Calories tabs all switch correctly within consolidated section.
11. **Parties Tabs**: Community/Hosted tabs switch correctly (hidden when backend not configured).

## Sections & Last Tested

| Section | Last Tested | Notes |
|---------|-------------|-------|
| Header / Title | 2026-03-22 | Stable — title, subtitle, event link |
| Theme Switcher | 2026-03-29 | Stable — all 6 themes verified (Live Más, Baja Blast, Sauce Packet tested this run) |
| Runner/Crew Toggle | 2026-03-28 | Stable — toggle works on mobile Baja Blast theme, accent colors correct |
| Taco Bell Stops | 2026-03-29 | Stable — stop detail panel with ratings, mandatory food, crew access, Directions |
| Pace Calculator | 2026-03-29 | Stable — 9h30m goal = 9h 30m finish, all 8 stops + finish correct |
| Food & Nutrition | 2026-03-29 | Stable — consolidated section with 3 tabs (Rules, Log, Calories). All tabs work. Calorie tracker: 350/3240/-2890 math correct |
| Parties | 2026-03-29 | Stable — consolidated Community/Hosted tabs. Hidden when backend not configured. Community shows empty state + "Submit your party" link |
| Race Day Clock | 2026-03-29 | Stable — 7:00 AM start, Start button, proper instructions |
| Weather | 2026-03-22 | Stable — loads forecast (initial fetch may fail on non-HTTPS) |
| Course Sections | 2026-03-27 | Stable — 7 named sections with correct mile ranges |
| Tools | 2026-03-29 | Stable — 16 buttons, single-col on mobile, 2-col on desktop |
| TB Passport | 2026-03-29 | Stable — 10 badges, 3 earned (Time Keeper, Fashionista, Film Buff), grid renders correctly |
| Custom Pins | 2026-03-27 | Stable — form with 7 icon picker, "Click Map to Place Pin" prompt |
| Alt Routes | 2026-03-27 | Stable — "Toggle alt routes to see options" instruction |
| Race Results | 2026-03-29 | Stable — auto-hidden when no race data (display:none). Old Split History/Segment Records/Finisher Wall sections removed |
| Leg-by-Leg | 2026-03-29 | Stable — all 8 segments, correct neighborhoods |
| Elevation Profile | 2026-03-29 | Stable — grade-colored chart, stats correct (1263 ft gain/loss, 417 ft max, -3 ft min) |
| Route Info | 2026-03-27 | Stable — 32.4 mi, 1992 pts, 8 stops, 11h, Nov 27 2026 |

## Known Stable Areas
- Theme switching (all 6 themes) — proper 44px touch targets
- Map rendering with route polyline and stop markers
- Pace Calculator with split table (with and without GAP)
- Collapsible sections expand/collapse
- Elevation Profile canvas chart
- Route Info statistics
- Course Sections display
- Food & Nutrition tabs (Rules, Log, Calories)
- Parties tabs (Community, Hosted)
- TB Passport badge grid
- Tools grid (16 buttons)
- Stop popups with Directions button
- Stop detail panel (ratings, crew access, trivia, menu)
- Backend sections hidden when Supabase not configured
- Race Results auto-hidden when no data

## Known Flaky / Unstable Areas
- Weather fetch: initial load sometimes fails with `TypeError: Failed to fetch`, but data appears after retry. Console error is cosmetic. (ISSUE-015)
- 2 pre-existing test failures: mobile CSS tests fail at desktop viewport width (expected — pass at 375px)
- SW cache can serve stale HTML if cache version not bumped (ISSUE-021 fixed, regression test added)

## Exploration Notes
- ISSUE-014 (theme swatch 22px touch targets) FIXED in 2026-03-24 run
- ISSUE-019 (--color-accent-primary undefined) FIXED in 2026-03-26 run
- ISSUE-020 (tools-grid 2-col on mobile) FIXED in 2026-03-28 run
- ISSUE-021 (SW cache version mismatch) FIXED in 2026-03-29 run — sw.js had style.css?v=13 and app.js?v=15 but index.html loaded v=15 and v=17. Regression test added to catch future drift.
- Sidebar consolidation verified: 13 visible sections (from 22). Food sections merged to "Food & Nutrition" with tabs, Block Parties merged into "Parties", Race Results auto-hidden, backend sections hidden.
- Tested viewports: desktop (1280x800) and mobile (375x812) — all layouts work correctly
- Sidebar scrolls independently from map on desktop; stacks above map on mobile/tablet
- Test suite: 826/828 passing (2 pre-existing mobile viewport tests that only pass at 375px)
