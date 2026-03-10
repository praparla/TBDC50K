# CLAUDE.md — General Development Principles

> Distilled from patterns across multiple projects. These are universal coding principles and best practices for Claude Code agents.

---

## Agent Workflow: Explore → Plan → Code → Verify

Do not blindly write code. Follow this loop:
1. **Explore:** Search the codebase to find relevant files and understand existing patterns.
2. **Plan:** Draft a brief implementation plan. Ask for human approval if the change is architecturally significant.
3. **Code:** Implement following the rules below.
4. **Verify:** Run tests and fix any failures before declaring the task complete.

---

## Communication Style

- **Concise output.** No filler, no apologies, no moralizing. Skip generic advice.
- **Show your work.** Use short internal monologues to break down complex problems.
- **Fail loud.** Never use catch-all exception handlers that silently swallow errors. Always raise or log explicitly.

---

## Error Resilience

- **Never let a single item failure crash the pipeline.** Wrap individual record/item processing in try/except. Log the error. Continue.
- **Log aggressively.** Every request, parse, API call, cache hit/miss, and filter decision should be logged.
- **Cache everything.** Re-runs should be fast and cheap. Use multi-layer caching where appropriate.
- **Validate everything.** Invalid responses from external services should be logged and skipped, not crash the program.
- **Track errors in output.** Include an errors array or log file so failures are visible, not silent.

---

## Security & Credential Handling

- **Never commit secrets.** API keys, tokens, passwords must never appear in committed code.
- Read credentials from environment variables only (e.g., `os.environ["API_KEY"]`). Halt with a clear error if missing.
- Never log or print credential values.
- Always `.gitignore`: `.env`, `.env.local`, `credentials.json`, `secrets/`.
- Before committing, scan for leaked secrets: `git diff --cached | grep -iE "apikey|password|token|secret"`.

---

## Testing & Validation

- **Write tests alongside code, not as an afterthought.** Every new module or bug fix should include corresponding tests.
- Write a regression test for every bug fix.
- Validate output data against expected schemas before writing to disk.
- **Cover edge cases, not just happy paths:**
  - Empty input: `[]`, `{}`, `""`
  - Null/undefined for every optional field
  - Single-item arrays (boundary case)
  - Combined states (e.g., multiple filters active simultaneously)
  - Boundary values (first/last page, exact date boundaries, zero counts)
- Run the full test suite before committing to catch regressions.
- **Read before edit:** Always read a file before editing it. Understand existing code before modifying.

---

## Git Discipline

- **Commit often** at natural checkpoints — small, focused commits are better than large monolithic ones.
- Write descriptive commit messages explaining *what* and *why*.
- Never commit large binary files or downloaded data — use `.gitignore`.
- Never commit API keys. Check `git diff --cached` before pushing.

---

## Data Handling

- **Append-only data.** When writing results, append new records rather than overwriting. Deduplicate via unique keys.
- **Source attribution.** Every data record should include the source URL or origin. Users must be able to trace data back to its source.
- **Defensive optional field handling.** Every optional field must be null-checked before rendering or processing. Never assume optional fields are populated.
- Null values should show explicit placeholders (e.g., "N/A", "TBD") — never blank/missing UI elements.

---

## Network Ethics & Rate Limiting

- Respect rate limits: add delays between requests to the same host (1.5-2s minimum).
- Set an informative `User-Agent` header.
- Handle 429 responses with exponential backoff.
- Cache all fetched content. Re-runs should never re-download already-cached pages.
- If a service persistently blocks after retries, log the issue and gracefully skip. Never crash.

---

## Frontend Standards

- Functional components + hooks. No class components.
- Colors, enums, and constants in a dedicated constants file — never hardcoded inline.
- Data transforms belong in hooks or utility functions, not in components.
- Proper loading, error, and empty states on every view.
- All interactive elements should have visible focus indicators for accessibility.
- **Mobile-first responsive design.** All features must work on both mobile and desktop.

---

## Python Standards

- Type hints on all functions.
- Use `pathlib.Path` for file paths.
- Use the `logging` module — no bare `print` for runtime output.
- All constants in a single config module.
- Pin dependencies in `requirements.txt`.
- Use Pydantic for data validation.

---

## Architecture Principles

- **No over-engineering.** Only make changes that are directly requested or clearly necessary. Keep solutions simple.
- **Single source of truth.** Deploy configs, base paths, and shared constants should derive from one place.
- **Modular design.** Separate concerns: data fetching, processing, storage, and presentation should be distinct layers.
- **Idempotent operations.** Re-running any operation should be safe and produce the same result. Use `INSERT OR IGNORE` patterns or cache checks.
- **Static when possible.** Prefer static site architectures with baked-in data over runtime backends when the data update cycle allows it.

---

## Issue Tracking (`issues.md`)

Maintain an `issues.md` file in the project root as a living bug/issue tracker.
- Log bugs and issues with: date, module/area, description, root cause classification (code bug vs. test bug), and status (Open / Fixed).
- Update entries when resolved: what the fix was, the commit that resolved it.
- After every bug fix, check whether a new regression test is needed.

---

## Backlog (`backlog.md`)

Maintain a `backlog.md` file in the project root for bigger ideas, new features, and enhancements.
- When ideas come up during development, add them immediately — don't lose them.
- Each item should include a brief description and priority (low / medium / high).
- Review and reprioritize periodically.

---

## Testing (this project)

- **Test file:** `tests/responsive.test.html` — browser-based test suite for responsive layout.
- **Run:** Serve the project (e.g. `python3 -m http.server 8050`) and open `http://localhost:8050/tests/responsive.test.html`.
- **What it covers:** DOM structure, event link, collapsible sections, responsive CSS (mobile/tablet/desktop media queries, touch targets, flex layout), JS functions, map init, pin form.
- **Viewport-dependent:** Tests auto-detect mobile vs desktop and run the appropriate assertions. Resize browser to test each breakpoint.
- **Updating:** When adding new UI features, add assertions to the matching group function (e.g. `testDOMStructure`, `testResponsiveCSS`). Add new groups via `function testMyFeature()` and call it from `runAllTests()`.

---

## Cost Optimization (for AI/API pipelines)

- Use the cheapest model that meets quality requirements by default.
- Apply pre-filtering to skip irrelevant content before sending to expensive APIs.
- Truncate/excerpt input text to reduce token usage.
- Cache API responses by content hash. Never re-classify identical content.
- Log cost impact of each optimization layer. Print cost summary at end of runs.
