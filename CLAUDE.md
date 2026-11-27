# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Worktree Directory

Use `.worktrees/` (project-local, hidden) for all git worktrees.

## Project Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real stars in 84 systems within 20 light-years of Sol, connected by wormhole networks. Core gameplay: commodity trading, ship resource management, NPC relationships, and danger encounters.

IMPORTANT: you must NEVER BE SYCOPHANTIC or a "yes man." You have to think about what's being asked and offer honest feedback. After that, if the user insists, assume there's a reason for and you go with it.

## Commands

Scripts are in `package.json`; `DEVELOPMENT.md` explains each. The non-obvious ones:

```bash
npm run all                                    # lint:fix + format + test + knip — run before committing
npm test -- tests/unit/game-trading.test.js    # single file
npm test -- --testNamePattern "Bridge Pattern" # by name
```

- `npm test` already runs `vitest --run`. Args need the `--` separator: `npm test --run` silently drops the flag instead of failing.
- `npm run lint` fails on any warning (`--max-warnings 0`).

## Architecture

**Read `DEVELOPMENT.md` for architecture**: view-mode diagram, Bridge Pattern example, manager table, save system, mobile. The rules below are the ones that break things when ignored.

- **Bridge Pattern.** `GameCoordinator` (`src/game/state/game-coordinator.js`) is the imperative singleton. React reads via `useGameEvent(eventName)` or one-shot getters like `game.getCurrentSystem()`, and writes via action hooks (`useTradeActions`, `useShipActions`, `useNavigationActions`, etc.). **Never call `game.getState()` during render.** Never copy game state into React `useState`.
- **Managers.** `GameCoordinator` is a thin facade over the domain managers in `src/game/state/managers/`. Most extend `BaseManager`; all receive a capabilities object (`src/game/state/capabilities.js`). After a mutation, call `this.capabilities.markDirty()` — never `saveGame()`. `SaveLoadManager` debounces the write to `localStorage`.
- **Randomness.** **Never use `Math.random()` in gameplay paths.** Use `SeededRandom` (`src/game/utils/seeded-random.js`); encounter paths seed with `buildEncounterSeed(gameDay, systemId, encounterType)`.
- **View modes.** No router. `App.jsx` switches between `TITLE`, `SHIP_NAMING`, `ORBIT`, `STATION`, `ENCOUNTER`, `PAVONIS_RUN`, `EPILOGUE`. Panels (trade, refuel, etc.) and narrative overlays are not view modes — they render on top via separate state. Encounters return to `ORBIT`.

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
New and modified components need basic accessibility: `aria-label` on icon-only buttons, semantic HTML elements, and keyboard-navigable interactive controls. Apply low-effort accessibility suggestions from code review.

### Git Commits
- Commit messages must be plain text strings passed directly to `git commit -m "plain text here"`. **NEVER** use shell interpolation (`$(...)`), heredocs (`<<EOF`, `<<'EOF'`), command substitution, or `$(cat ...)` wrappers in commit messages. This means **NO** `git commit -m "$(cat <<'EOF' ... EOF)"` — just a simple quoted string. Multi-line messages should use multiple `-m` flags: `git commit -m "subject" -m "body"`.

### Style
- ES Modules, 2-space indentation
- `const`/`let` only, never `var`
- Comments explain WHY, not WHAT. Never mention task numbers in comments.
- Import order: external libraries → internal modules → components → utilities → data/constants → styles

IMPORTANT: after reading this file, you MUST say "CLAUDE.md read and understood. Ready to assist with code tasks."
