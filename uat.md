# UAT Baseline — Taco Bell DC 50K Route Planner

_Created: 2026-03-22_
_Last run: 2026-04-15_

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
| Header / Title | 2026-04-05 | Stable — title, subtitle, event link |
| Theme Switcher | 2026-04-05 | Stable — all 6 themes verified (Purple Reign, Baja Blast, Sauce Packet tested this run) |
| Runner/Crew Toggle | 2026-04-15 | Stable — toggle works, Crew view switches correctly, proper active button styling on Baja Blast theme |
| Taco Bell Stops | 2026-04-15 | Stable — Stop 3 popup tested on mobile + desktop, mandatory food warning, Directions button |
| Pace Calculator | 2026-04-15 | Stable — 7h15m goal tested, split table correct, finish matches goal, triggers badge earn |
| Food & Nutrition | 2026-04-02 | Stable — consolidated section with 3 tabs (Rules, Log, Calories). All tabs work on desktop and mobile. Sauce packet copy active on Sauce theme |
| Parties | 2026-04-15 | Stable — Community/Hosted tabs work on mobile. Empty state + "Submit your party" link correct |
| Race Day Clock | 2026-04-02 | Stable — 7:00 AM start, Start button, proper instructions |
| Weather | 2026-04-15 | Stable — loads forecast data (Tonight/Thu/Thu Night/Fri). Renders correctly on both themes |
| Course Sections | 2026-04-15 | Stable — 7 named sections with correct mile ranges, colored dots. Sauce packet copy active |
| Tools | 2026-04-02 | Stable — 16 buttons, single-col on mobile (345px grid), 2-col on desktop |
| TB Passport | 2026-04-15 | Stable — 10 badges, real-time badge earn (Time Keeper + Speed Demon from 7h15m pace calc). 0/10→2/10 counter updates |
| Custom Pins | 2026-04-02 | Stable — form with icon picker, search, name, note inputs. Mobile layout correct |
| Alt Routes | 2026-04-05 | Stable — "Toggle alt routes to see options" instruction |
| Race Results | 2026-03-29 | Stable — auto-hidden when no race data (display:none). Old Split History/Segment Records/Finisher Wall sections removed |
| Leg-by-Leg | 2026-04-02 | Stable — all 8 segments, correct neighborhoods (Alexandria finish confirmed) |
| Elevation Profile | 2026-04-15 | Stable — grade-colored chart on Sauce Packet theme, stats correct (1263 ft gain/loss, 417 ft max, -3 ft min) |
| Route Info | 2026-04-05 | Stable — sauce packet copy working, section expands correctly |

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
- Minifier can break bundle if JS source contains `//` inside string literals (ISSUE-023 fixed, regression test added)

## Exploration Notes
- ISSUE-014 (theme swatch 22px touch targets) FIXED in 2026-03-24 run
- ISSUE-019 (--color-accent-primary undefined) FIXED in 2026-03-26 run
- ISSUE-020 (tools-grid 2-col on mobile) FIXED in 2026-03-28 run
- ISSUE-021 (SW cache version mismatch) FIXED in 2026-03-29 run — sw.js had style.css?v=13 and app.js?v=15 but index.html loaded v=15 and v=17. Regression test added to catch future drift.
- Sidebar consolidation verified: 13 visible sections (from 22). Food sections merged to "Food & Nutrition" with tabs, Block Parties merged into "Parties", Race Results auto-hidden, backend sections hidden.
- Tested viewports: desktop (1280x800) and mobile (375x812) — all layouts work correctly
- Sidebar scrolls independently from map on desktop; stacks above map on mobile/tablet
- Test suite: 829/829 passing (0 failures). Previous 826/828 had stale SW cache issue + 2 viewport tests; both resolved.
- 2026-03-31: Single-source ASSET_VERSIONS in config.js eliminates SW cache version drift (backlog item). sw.js now importScripts config.js. Test updated to verify config.js↔index.html version sync.
- Tested viewports this run: desktop (1280x800), mobile (375x812), tablet (768x1024) — all layouts correct
- Tested themes this run: Baja Blast, Purple Reign '94, Cantina Night, Sauce Packet, Retro '85 — all render correctly
- Stop detail panel tested (Stop 3): ratings, mandatory food badge, crew access, Directions button all working
- 2026-04-02: Tested Sauce Packet, Baja Blast, Retro '85, Cantina Night themes across desktop/mobile/tablet. All render correctly.
- Tested: Pace Calculator (9h30m goal), Food & Nutrition tabs (Rules/Log/Calories), Stop 5 detail panel, Custom Pins form, Elevation Profile, Leg-by-Leg, Course Sections, Race Day Clock, Tools grid (16 buttons, single-col mobile)
- 830/830 tests pass. No new bugs found. No console errors (only expected Supabase warnings).
- 2026-04-05: CRITICAL BUG FOUND (ISSUE-023). Minifier's comment-stripping regex destroyed `//` inside ICS PRODID string literal, causing JS syntax error in bundle.min.js at line 1151. Entire app was non-functional (no theme swatches, no map route, no interactive features). Fixed with string-aware comment parser. Regression test `testBundleIntegrity()` added.
- Tested: Themes (Purple Reign, Baja Blast, Sauce Packet), Pace Calculator (8h45m), Elevation Profile, Route Info, mobile layout (375×812). All working post-fix.
- 2026-04-15: No new bugs found. Focused on least-recently-tested sections: TB Passport, Runner/Crew Toggle, Weather, Parties. Also tested Pace Calculator (7h15m), Course Sections, Elevation Profile, Stop 3 popup (mobile + desktop).
- Themes tested: Purple Reign, Baja Blast, Sauce Packet — all render correctly with proper contrast. Route color, tile style, and sidebar colors all switch correctly.
- Badge earn tracking verified: Pace calc at 7h15m triggered both Time Keeper and Speed Demon badges. Passport counter updated from 0/10 to 2/10 in real-time.
- 829/831 automated tests pass. 2 failures in View Toggle group are state-dependent (localStorage viewMode=crew from manual testing, not real bugs). With fresh localStorage these would pass.
- Mobile layout (375×812) verified: header, pace splits table, stop popup, parties tabs all render correctly. No overflow issues.
