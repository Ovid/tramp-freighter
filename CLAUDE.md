# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Worktree Directory

Use `.worktrees/` (project-local, hidden) for all git worktrees.

## Project Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real star systems within 20 light-years of Sol, connected by wormhole networks. Core gameplay: commodity trading, ship resource management, NPC relationships, and danger encounters.

IMPORTANT: you must NEVER BE SYCOPHANTIC or a "yes man." You have to think about what's being asked and offer honest feedback. After that, if the user insists, assume there's a reason for and you go with it.

## Commands

```bash
npm run dev              # Vite dev server (port 5173, HMR)
npm run build            # Production build to dist/
npm test                 # Run all tests once (vitest --run)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8, HTML)
npm run lint             # ESLint check
npm run lint:fix         # ESLint autofix
npm run format:check     # Prettier check
npm run format:write     # Prettier format
npm run clean            # Lint + format all files
npm run all              # Clean + test

# Run a single test file
npm test -- tests/unit/game-trading.test.js

# Run tests matching a pattern
npm test -- --grep "Bridge Pattern"
```

**Important:** This project's npm version does NOT accept the `--run` argument. Use `npm test` not `npm test --run`.

## Architecture

**For architecture details, read `DEVELOPMENT.md`.** This file is the canonical reference for coding standards (constants, rounding, TDD, commits). The summary below is enough to orient — go to `DEVELOPMENT.md` for diagrams, full manager tables, the Bridge Pattern example, the save system, and mobile.

### Bridge Pattern (one-paragraph summary)

`GameCoordinator` (`src/game/state/game-coordinator.js`) is the imperative singleton. React reaches it via `useGameEvent(eventName)` for reactive reads, specific getters like `game.getCurrentSystem()` for one-shot lookups, and feature-specific action hooks (`useTradeActions`, `useShipActions`, `useNavigationActions`, etc.) for writes. **Never call `gsm.getState()` during render.** Never copy game state into React `useState`.

### View Mode State Machine (one-paragraph summary)

No router. `App.jsx` manages seven view modes: `TITLE`, `SHIP_NAMING`, `ORBIT`, `STATION`, `ENCOUNTER`, `PAVONIS_RUN`, `EPILOGUE`. Panels (trade, refuel, etc.) and narrative overlays are not view modes — they render on top of `STATION` (or any mode) via separate state. Encounters return to `ORBIT`, not forward to PAVONIS_RUN. See `DEVELOPMENT.md` for the full diagram and transition citations.

### Manager Delegation (one-paragraph summary)

`GameCoordinator` is a ~1640-line facade. Real logic lives in 24 domain managers under `src/game/state/managers/`, each extending `BaseManager` and receiving a capabilities object (see `src/game/state/capabilities.js`). Managers call `this.gameStateManager.markDirty()` after mutations — never `saveGame()` directly. `SaveLoadManager` debounces dirty marks with a 500ms trailing write to `localStorage`. Combat, inspection, distress, and mechanical-failure paths use `SeededRandom` with seeds shaped like `gameDay_systemId_encounterType`. **Never use `Math.random()` in gameplay paths.** See the full manager table in `DEVELOPMENT.md`.

Path aliases: `@` → `src/`, `@components`, `@features`, `@hooks`, `@context`, `@game`, `@assets`.

## Coding Standards

### Constants
**ALL magic numbers must go in `src/game/constants.js`.** Never hard-code numeric values in implementation files. This includes percentages, multipliers, ranges, thresholds, prices, distances, timeouts.

### Numeric Display
**Round at the calculation layer, not the display layer.** Utility functions must return integers — never raw floating-point values that will be displayed to the player.
- **Credits (costs):** `Math.ceil()` — always round up so the player never pays less than the true cost.
- **Percentages (conditions, capacities):** `Math.round()` — standard rounding for display clarity.
- Never interpolate a calculation result directly into JSX without ensuring the underlying function already rounds.

### Testing
- **Test types:** Unit (`tests/unit/`), property-based with fast-check (`tests/property/`), integration (`tests/integration/`)
- **TDD required:** RED (one failing test) → GREEN (minimal passing code) → REFACTOR. Never batch multiple failing tests.
- **Clean output:** Tests must produce no stderr warnings. Mock `console` methods when testing error conditions.
- **Property tests:** Minimum 100 iterations, tag with feature and property references.
- **All tasks must leave the full test suite passing.**

### React Patterns
- Functional components with hooks only
- Feature utility files contain pure functions for validation/calculations
- Three.js scenes initialize once in `useEffect` with empty deps; dispose on unmount
- Never create objects in hot loops (animation frames, frequent events)

### Accessibility (a11y)
Full a11y pass is planned. In the meantime, new and modified components should include basic accessibility: `aria-label` on icon-only buttons, semantic HTML elements, and keyboard-navigable interactive controls. Accessibility suggestions from code review are welcome and should be applied when low-effort.

### Git Commits
- Commit messages must be plain text strings passed directly to `git commit -m "plain text here"`. **NEVER** use shell interpolation (`$(...)`), heredocs (`<<EOF`, `<<'EOF'`), command substitution, or `$(cat ...)` wrappers in commit messages. This means **NO** `git commit -m "$(cat <<'EOF' ... EOF)"` — just a simple quoted string. Multi-line messages should use multiple `-m` flags: `git commit -m "subject" -m "body"`.

### Style
- ES Modules, 2-space indentation
- `const`/`let` only, never `var`
- Comments explain WHY, not WHAT. Never mention task numbers in comments.
- Import order: external libraries → internal modules → components → utilities → data/constants → styles

IMPORTANT: after reading this file, you MUST say "CLAUDE.md read and understood. Ready to assist with code tasks."
