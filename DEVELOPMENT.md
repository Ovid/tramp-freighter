# Development Guide

## Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18, Three.js, and Vite. Players navigate a 3D starmap of 117 real star systems within 20 light-years of Sol, connected by a wormhole network. The gameplay loop is: trade commodities between systems, manage ship resources (fuel, hull, life support), build NPC relationships, and survive encounters with pirates, customs inspectors, and distressed ships.

This document is the entry point for developers working on the codebase. Read it alongside `CLAUDE.md`, which contains the canonical coding standards (constants, rounding, commits, TDD).

## Quick Start

```bash
npm install
npm run dev    # http://localhost:5173/
```

## Where to Start Reading

When orienting yourself in the codebase, follow this trail:

1. **`src/App.jsx`** — view mode state machine and top-level orchestration
2. **`src/context/GameContext.jsx`** — how React reaches into game logic
3. **`src/hooks/useGameEvent.js`** + **`src/hooks/useGameAction.js`** — Bridge Pattern read/write hooks. `useGameAction()` is composed from 7 domain-specific action hooks (`useTradeActions`, `useShipActions`, `useNavigationActions`, etc.), which you can import directly when you want a narrower API.
4. **`src/game/state/game-coordinator.js`** — the singleton facade (~1640 lines, mostly delegation)
5. **`src/game/state/capabilities.js`** — capability interfaces defining what each manager can read/write
6. **One manager** in `src/game/state/managers/` (e.g. `refuel.js`) to see the pattern in practice
7. **`src/game/constants.js`** — every tunable number in the game

## Commands

```bash
npm run dev              # Vite dev server (port 5173, HMR)
npm run build            # Production build to dist/
npm run preview          # Preview production build locally

npm test                 # Run all tests once (vitest --run)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8, HTML)

npm run lint             # ESLint (zero warnings)
npm run lint:fix         # ESLint autofix
npm run format:check     # Prettier check
npm run format:write     # Prettier format
npm run clean            # lint:fix + format:write across the repo
npm run knip             # Find unused exports
npm run all              # clean + test + knip

# Run a single test file
npm test -- tests/unit/game-trading.test.js

# Run tests matching a pattern (vitest uses --testNamePattern, not --grep)
npm test -- --testNamePattern "Bridge Pattern"
```

**Gotcha:** The `test` script already includes `--run` (`vitest --run`), so you don't need to pass it again. If you write `npm test --run` without a `--` separator, npm interprets `--run` as one of its own CLI flags (it isn't), and the arg never reaches vitest — so the command behaves the same as `npm test` rather than failing loudly. Just use `npm test`. (To intentionally pass an arg through to vitest, use `npm test -- <args>`.)

## Architecture

### View Mode State Machine

The application has no router. `App.jsx` manages a single state machine over seven view modes (see the `VIEW_MODES` constant near the top of `src/App.jsx`):

```
                ┌─────────┐
       ┌───────►│  TITLE  │
       │        └────┬────┘
       │             │ new game
       │             ▼
       │      ┌─────────────┐
       │      │ SHIP_NAMING │
       │      └────┬────────┘
       │           │
       │           ▼                      (load game returns straight to ORBIT)
       │      ┌──────────┐         ┌───────────┐
       │      │  ORBIT   │ ──────► │ ENCOUNTER │
       │      └────┬─▲───┘ encounter└─────┬─────┘
       │      dock │ │ undock   resolves  │
       │           ▼ │ ◄──────────────────┘
       │      ┌──────────┐
       │      │ STATION  │
       │      └────┬─▲───┘
       │ pavonisRunEvent │ cancel
       │           ▼ │
       │      ┌─────────────┐
       │      │ PAVONIS_RUN │
       │      └────┬────────┘
       │           │ complete (markVictory)
       │           ▼
       │      ┌──────────┐
       │      │ EPILOGUE │
       │      └────┬─────┘
       │           │ post-credits
       │           ▼
       │      ┌──────────────────┐
       │      │ STATION          │
       │      │ (postCredits=true)│
       │      └────┬─────────────┘
       │           │ return to title
       └───────────┘
```

Key transitions (all live in `src/App.jsx`):

- `TITLE → SHIP_NAMING` on new game; `TITLE → ORBIT` on load.
- `ORBIT ↔ STATION` via dock/undock.
- `ORBIT → ENCOUNTER` is driven by `useEncounterOrchestration`, which receives `setViewMode` from `App.jsx`. `ENCOUNTER → ORBIT` after resolution. Encounters **never** transition directly to PAVONIS_RUN or EPILOGUE.
- `STATION → PAVONIS_RUN` is triggered by a `pavonisRunEvent` from the game engine. `PAVONIS_RUN → STATION` on cancel. `PAVONIS_RUN → EPILOGUE` on completion.
- `EPILOGUE → STATION` after post-credits, with `postCredits=true` state on the station screen. Then `STATION → TITLE` via return-to-title.
- The dev-admin panel can teleport straight to EPILOGUE for testing.

`PANEL`-style overlays (trade, refuel, repair, upgrades, info broker, cargo, ship status) are rendered on top of `STATION` rather than being separate modes — `activePanel` is a sibling state variable to `viewMode`, not a viewMode value. Narrative event overlays work the same way: they render on top of whatever view mode is active, without changing `viewMode`.

### Bridge Pattern

The single most important pattern in this codebase. It connects the imperative `GameCoordinator` singleton to React's declarative model. Three pieces:

- **`GameContext`** (`src/context/GameContext.jsx`) — exposes `GameCoordinator` via React Context.
- **`useGameEvent(eventName)`** (`src/hooks/useGameEvent.js`) — subscribes to a `GameCoordinator` event, triggers a re-render on fire, auto-unsubscribes on unmount. Returns the event's payload — for state-tracked events, the value extracted via `EVENT_STATE_MAP` in `src/game/constants.js`; for direct-data events (encounters, narrative), the raw payload the manager emitted.
- **`useGameAction()`** (`src/hooks/useGameAction.js`) — returns action methods composed from 7 domain-specific hooks (`useTradeActions`, `useShipActions`, `useNavigationActions`, `useMissionActions`, `useQuestActions`, `useNPCActions`, `useDebtActions`) plus a few `GameCoordinator` lifecycle pass-throughs (`dock`, `undock`, `saveGame`, `updateCredits`). Use whichever fits: `useGameAction()` for convenience, or the feature-specific hooks when you want a narrower surface and clearer dependencies.

**Critical rule:** Components must never call `GameCoordinator.getState()` directly during render, and must never copy game state into React `useState`. `getState()` returns a snapshot, not a subscription — values read during render won't update when the underlying state changes, so the UI silently goes stale. Copying game state into `useState` creates a second source of truth that drifts from the coordinator as soon as the coordinator mutates without going through your setter. If you see `getState()` under `src/features/`, it must be inside a `useEffect` or in a non-component helper called from an action handler — never in a render path.

#### The three-tier read/write pattern

| Tier | Use for | How |
|---|---|---|
| **Reactive read** | Values that must trigger a re-render when they change (credits, cargo, fuel, current system) | `useGameEvent(EVENT_NAMES.CARGO_CHANGED)` |
| **One-shot read** | Values needed *once* per render that don't need to re-render on change, or where the relevant event already triggers the re-render | Specific getter methods: `game.getCurrentSystem()`, `game.getKnownPrices(systemId)`, `game.getShip()`, `game.getAchievementProgress()` |
| **Write / action** | Any state mutation | `useGameAction()` for convenience, or feature-specific hooks (`useTradeActions`, `useShipActions`, `useNavigationActions`, `useMissionActions`, etc.) for a narrower surface. |

**Never** call `game.getState()` during render — use a specific getter instead.

#### Example

```javascript
import { useState } from 'react';
import { useGame } from '@context/GameContext';
import { useGameEvent } from '@hooks/useGameEvent';
import { useTradeActions } from '@hooks/useTradeActions';
import { EVENT_NAMES } from '@game/constants';

function TradePanel({ onClose }) {
  // Local UI state only — not game state
  const [selectedGood, setSelectedGood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Reactive reads — these re-render the panel when state changes
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  // Actions
  const { buyGood, sellGood } = useTradeActions();

  // One-shot non-reactive lookup via specific getter — re-runs whenever
  // currentSystemId changes (because that subscription already triggered a re-render)
  const game = useGame();
  const knownPrices = game.getKnownPrices(currentSystemId);

  return /* ... */;
}
```

**Why it works:**

1. `useGameEvent(EVENT_NAMES.CREDITS_CHANGED)` subscribes to the event.
2. When credits change, `EventSystemManager` fires the event.
3. The hook bumps local state, triggering a re-render.
4. Unmount cleans up the subscription automatically.
5. The non-reactive lookup (`getKnownPrices`) does not subscribe — but it re-runs on every render, and renders are driven by the reactive subscriptions above. If you need a value to drive a re-render, subscribe to its event.

### GameCoordinator + Manager Delegation

`GameCoordinator` (`src/game/state/game-coordinator.js`, ~1640 lines) is a facade. Almost all of its body is delegation methods — the real logic lives in domain managers under `src/game/state/managers/`. This is the result of the GSM refactor and is intentional; the facade is the project's public API surface.

#### The 24 domain managers

| Manager | Responsibility | File |
|---------|----------------|------|
| StateManager | Core state mutations (credits, cargo, fuel primitives) | `state.js` |
| ShipManager | Ship attributes, upgrades, quirks | `ship.js` |
| TradingManager | Prices, market conditions, price knowledge | `trading.js` |
| NavigationManager | Jumps, current system, visited systems | `navigation.js` |
| RefuelManager | Refuel calculations and transactions | `refuel.js` |
| RepairManager | Hull / engine / life-support repair | `repair.js` |
| DangerManager | Karma, faction reputation, encounter probability | `danger.js` |
| CombatManager | Pirate combat resolution | `combat.js` |
| NegotiationManager | Pirate negotiation paths | `negotiation.js` |
| InspectionManager | Customs inspection encounters | `inspection.js` |
| DistressManager | Civilian distress calls | `distress.js` |
| MechanicalFailureManager | Ship system failure checks | `mechanical-failure.js` |
| NPCManager | NPC presence and relationships | `npc.js` |
| DialogueManager | Dialogue tree state | `dialogue.js` |
| MissionManager | Generated cargo missions | `mission.js` |
| QuestManager | Hand-written quest definitions | `quest-manager.js` |
| AchievementsManager | Unlock tracking | `achievements.js` |
| DebtManager | Loans and debt obligations | `debt.js` |
| InfoBrokerManager | Intelligence purchases | `info-broker.js` |
| EventSystemManager | Event pub/sub (powers Bridge Pattern) | `event-system.js` |
| EventsManager | Active world events | `events.js` |
| EventEngineManager | Narrative event flags, cooldowns, triggers | `event-engine.js` |
| InitializationManager | New-game and load-game initialization | `initialization.js` |
| SaveLoadManager | Save / load with debounced writes | `save-load.js` |

Each manager extends `BaseManager` (`src/game/state/managers/base-manager.js`) and receives a **capabilities** object (not the full GameCoordinator) — see `src/game/state/capabilities.js` for the per-manager getter/mutator interfaces. This is how cross-manager reads and writes stay explicit rather than turning into a god object. The `managers/` directory contains 25 files: the 24 domain managers above plus `base-manager.js`.

#### Save pattern

Managers call `this.gameStateManager.markDirty()` after mutations. They never call `saveGame()` directly. `SaveLoadManager` debounces all dirty marks with a 500ms trailing write (`UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS`), so a burst of mutations produces a single `localStorage` write.

#### Encounter RNG

Combat, inspection, distress, and mechanical-failure paths use `SeededRandom` (`src/game/utils/seeded-random.js`) with deterministic seeds shaped like `gameDay_systemId_encounterType`. **Never use `Math.random()` in gameplay paths** — same game day + same system + same encounter type must produce the same outcome.

### Three.js Engine

The Three.js stack lives in `src/game/engine/` (`scene.js`, `stars.js`, `wormholes.js`, `interaction.js`, `game-animation.js`) and is mounted by `src/features/navigation/StarMapCanvas.jsx`. `initScene()` (`scene.js`) is called once in an empty-deps `useEffect`, guarded by `sceneRef.current` so React StrictMode double-mounts don't reinitialize. It returns an object containing `scene`, `camera`, `renderer`, `controls`, `lights`, `stars`, `wormholes`, and `sectorBoundary`, which `StarMapCanvas` stores in `sceneRef` for the lifetime of the component.

**Container handoff:** the renderer's `domElement` is appended to a stable `containerRef` `<div>`. The ref is set once and the renderer never re-attaches.

**Animation loop:** `requestAnimationFrame` runs inside `StarMapCanvas` (`animate()` closure), decoupled from React's render cycle. It animates label scale, selection rings, and camera damping, then calls `renderer.render()`. It never sets React state; React updates come only from `useGameEvent` subscriptions.

**Data flow:** `createStarSystems(scene, starData)` and `createWormholeLines(scene, connections, starObjects)` receive their data as parameters at init time — they do not read from `GameCoordinator`. Dynamic updates (current-system indicator, selection ring, fuel-range coloring) are imperative function calls from `StarMapCanvas` in response to `useGameEvent` re-renders.

**Click routing:** a raycaster in `StarMapCanvas` intersects star sprites/labels; on hit it calls `selectStar()` (`interaction.js`) to mutate the scene, then fires the `onSystemSelected(systemId)` callback prop so React can open the system panel. Programmatic selection (e.g. from the system panel itself) goes through `StarmapContext` (`src/context/StarmapContext.jsx`), which exposes `selectStarById` / `deselectStar` backed by the same `interaction.js` functions.

**Cleanup:** on unmount, `StarMapCanvas` cancels the rAF loop, disposes the renderer, traverses the scene to dispose geometries and materials, removes DOM listeners, and calls `_resetState()` in `interaction.js`. Selection and current-system rings reuse shared materials/geometries to keep GPU memory bounded; that cleanup path is the only place they're disposed.

### Save System

The save system is the only persistence mechanism. Treat it as load-bearing.

**Backend:** `localStorage`, single key `'trampFreighterSave'` (`SAVE_KEY` in `src/game/constants.js`). No remote sync, no IndexedDB, no file export. Private browsing breaks saves.

**Format:** The full state tree is serialized as JSON. Each save includes `meta.timestamp` (epoch ms) and is tagged with the current `GAME_VERSION` (currently `'5.0.0'`).

**Versioning and migration:** Save schema versioning is real. Migration functions live in `src/game/state/state-validators.js`; `game-coordinator.js` imports them (`migrateFromV1ToV2`, `migrateFromV2ToV2_1`, `migrateFromV2_1ToV4`, `migrateFromV4ToV4_1`, `migrateFromV4_1ToV5`) and applies them in sequence on load via `restoreState()`. When you ship a state-shape change, you must (a) bump `GAME_VERSION`, (b) add a new migration function in `state-validators.js`, and (c) register it in the migration chain in `game-coordinator.js` so existing saves don't break.

**Error handling:**
- Save failures emit `EVENT_NAMES.SAVE_FAILED` and log via the manager's `error()` method. The game does not stop.
- Load failures attempt recovery. If NPC data is corrupted, `SaveLoadManager.attemptNPCRecovery()` resets NPC state and dialogue and retries. Other corruption returns `null`, which the initialization path treats as "no save."

**Wiping a save during development:**
1. DevTools → Application → Local Storage → `http://localhost:5173` → delete the `trampFreighterSave` key. Or:
2. From the browser console: `localStorage.removeItem('trampFreighterSave')`.
3. The Dev Admin panel (gear icon, when a `.dev` file is present at the repo root — `touch .dev` to enable; it's in `.gitignore`) has a clear-save button.

**Testing:** `tests/setup.js` provides a `localStorage` mock so tests do not pollute the host environment. Integration tests that exercise save/load should reset the mock between cases.

### Mobile

Mobile is a first-class target. The HUD, panels, camera toolbar, and z-index layering all branch on viewport.

**Detection:** `useMobileLayout()` (`src/hooks/useMobileLayout.js`) watches `matchMedia('(max-width: 600px)')` (`UI_CONFIG.MOBILE_BREAKPOINT_PX`). It returns `{ isMobile }`. `App.jsx` calls this once and wraps the tree in `<MobileProvider isMobile={isMobile}>`.

**Consumer hook:** Components read mobile state with `useMobile()` from `@context/MobileContext`. It throws if used outside `MobileProvider`, so the consumer assumption is safe.

**Z-index layering:** Mobile uses a separate z-index scale to keep the camera toolbar, expanded HUD, and full-screen panels from overlapping incorrectly. The values live in `css/variables.css`:

| Token | Value | Purpose |
|---|---|---|
| `--z-camera-toolbar` | 10 | Mobile camera/zoom toolbar |
| `--z-panel-fullscreen` | 20 | Mobile full-screen panels (trade, repair, etc.) |
| `--z-hud-collapsed` | 30 | Collapsed mobile HUD |
| `--z-hud-expanded` | 40 | Expanded mobile HUD with quick-access buttons |
| `--z-hud` | 200 | Desktop HUD |
| `--z-overlay` | 250 | Narrative overlays |
| `--z-panel` | 300 | Desktop panels |
| `--z-modal` | 1100 | Modals |

When adding new mobile-aware UI, prefer these tokens over raw `z-index` numbers. The "system panel above HUD, below camera toolbar" relationship is encoded by these values — using ad-hoc numbers will reintroduce overlap bugs that have already been fixed.

**Testing mobile:**
- See `notes/uat.md` for the canonical mobile UAT checklist, including viewport sizing tips and the "Expand HUD" interaction model.
- Use a 375×812 viewport for iPhone-sized testing.
- The `find` tool by `ref` is more reliable than coordinate clicks when driving the browser at mobile sizes.
- Trade and repair panels go full-screen on mobile; ensure changes don't break the full-screen layout.

## Directory Structure

```
project-root/
├── index.html                    # Vite entry point
├── vite.config.js                # Build configuration
├── vitest.config.js              # Test configuration
├── shared-config.js              # Path aliases (shared by Vite + Vitest)
├── package.json
│
├── src/
│   ├── main.jsx                  # React entry
│   ├── App.jsx                   # View mode state machine
│   │
│   ├── assets/                   # Images and static resources
│   │
│   ├── components/               # Shared UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── CustomSelect.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Modal.jsx
│   │   └── NotificationContainer.jsx
│   │
│   ├── context/
│   │   ├── GameContext.jsx       # GameCoordinator provider (Bridge Pattern)
│   │   ├── StarmapContext.jsx    # Three.js scene context
│   │   ├── MobileContext.jsx     # Viewport / mobile layout
│   │   └── NotificationContext.jsx
│   │
│   ├── hooks/                    # ~20 hooks; key ones:
│   │   ├── useGameEvent.js       # Bridge Pattern: subscribe
│   │   ├── useGameAction.js      # Bridge Pattern: act
│   │   ├── useEncounterOrchestration.js   # Drives ENCOUNTER mode
│   │   ├── useTradeActions.js / useShipActions.js / useNavigationActions.js
│   │   ├── useMissionActions.js / useQuestActions.js / useNPCActions.js
│   │   ├── useDangerZone.js / useEncounterProbabilities.js / useJumpValidation.js
│   │   ├── useDialogue.js / useEventTriggers.js / useStarData.js
│   │   ├── useAnimationLock.js / useNotification.js
│   │   └── useMobileLayout.js / useClickOutside.js / useDebtActions.js
│   │
│   ├── features/                 # Feature modules (component + utils co-located)
│   │   ├── achievements/         # Achievement tracking and display
│   │   ├── cargo/                # Cargo manifest panel
│   │   ├── danger/               # Encounter UI (combat, negotiation, inspection, distress)
│   │   ├── dev-admin/            # Developer admin panel
│   │   ├── dialogue/             # Dialogue tree UI
│   │   ├── endgame/              # Pavonis Run + epilogue
│   │   ├── finance/              # Loans and debt UI
│   │   ├── hud/                  # HUD overlay (resources, ship, quick access)
│   │   ├── info-broker/          # Intelligence purchase panel
│   │   ├── instructions/         # In-game help
│   │   ├── missions/             # Mission board and cargo missions
│   │   ├── narrative/            # Narrative event overlays
│   │   ├── navigation/           # StarMapCanvas (Three.js), JumpDialog, SystemPanel
│   │   ├── refuel/               # Refueling panel
│   │   ├── repair/               # Repair panel
│   │   ├── ship-status/          # Ship status panel
│   │   ├── station/              # StationMenu, PanelContainer
│   │   ├── title-screen/         # Title and ship-naming
│   │   ├── trade/                # Trading panel
│   │   └── upgrades/             # Upgrades panel
│   │
│   └── game/                     # Pure game logic — no React
│       ├── constants.js          # All tunable numbers
│       ├── event-conditions.js
│       ├── game-trading.js / game-navigation.js / game-events.js
│       ├── game-dialogue.js / game-npcs.js / game-information-broker.js
│       ├── mission-generator.js
│       │
│       ├── state/
│       │   ├── game-coordinator.js  # The facade singleton
│       │   ├── capabilities.js      # Per-manager capability interfaces
│       │   ├── save-load.js
│       │   ├── state-validators.js
│       │   └── managers/            # 24 domain managers (see table above)
│       │
│       ├── engine/                  # Three.js
│       │   ├── scene.js
│       │   ├── stars.js
│       │   ├── wormholes.js
│       │   ├── interaction.js
│       │   └── game-animation.js
│       │
│       ├── data/                    # Static game data
│       │   ├── star-data.js         # 117 star systems
│       │   ├── wormhole-data.js
│       │   ├── dialogue-trees.js / dialogue/
│       │   ├── danger-events.js / narrative-events.js
│       │   ├── npc-data.js
│       │   ├── achievements-data.js
│       │   ├── cole-missions.js / quest-definitions.js
│       │   └── epilogue-data.js
│       │
│       └── utils/
│           ├── seeded-random.js     # Deterministic RNG for encounters
│           ├── calculators.js
│           ├── danger-utils.js / date-utils.js
│           ├── string-utils.js / star-visuals.js / wormhole-graph.js
│           └── page-title.js / reduced-motion.js / dev-logger.js
│
├── css/                          # Stylesheets
│   ├── base.css / hud.css / modals.css / starmap-scene.css
│   └── panel/                    # Panel-specific styles
│
└── tests/
    ├── unit/                     # Unit tests
    ├── property/                 # Property-based tests (fast-check)
    ├── integration/              # Integration tests
    ├── setup.js / setup-three-mock.js
    ├── react-test-utils.jsx
    └── test-utils.js / test-data.js
```

### Path Aliases

Defined in `shared-config.js` and used by both Vite and Vitest:

| Alias | Resolves to |
|-------|-------------|
| `@` | `src/` |
| `@components` | `src/components/` |
| `@features` | `src/features/` |
| `@hooks` | `src/hooks/` |
| `@context` | `src/context/` |
| `@game` | `src/game/` |
| `@assets` | `src/assets/` |

## Coding Standards

See [`CLAUDE.md`](./CLAUDE.md) — it is the single source of truth for constants, numeric rounding, TDD discipline, testing requirements, React patterns, accessibility expectations, git commit format, and style. Do not duplicate those rules here; if you find a gap, update `CLAUDE.md`.

## Development Workflow

1. `npm run dev` — start Vite (HMR is reliable; full reload is rare).
2. Edit files under `src/`.
3. `npm run test:watch` — keep tests running in the background while editing.
4. `npm run lint` and `npm run format:check` before committing.
5. Run `npm run all` (clean + test + knip) before opening a PR.

## Testing

### Suites

- **Unit** (`tests/unit/`) — functions and components in isolation.
- **Property-based** (`tests/property/`) — invariants verified across generated inputs with `fast-check` (≥100 runs).
- **Integration** (`tests/integration/`) — multi-component workflows (a complete trade, a jump cycle, an encounter).

### Unit test example

```javascript
// tests/unit/trade-utils.test.js
import { describe, it, expect } from 'vitest';
import { validateTrade } from '@features/trade/tradeUtils';

describe('validateTrade', () => {
  it('rejects buys with insufficient credits', () => {
    const state = { player: { credits: 100 }, ship: { cargo: [] } };
    const result = validateTrade('buy', 'electronics', 10, state);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient credits');
  });
});
```

### Property test example

```javascript
// tests/property/karma-clamping.property.test.js
/**
 * Feature: danger-system, Property 12: Karma Clamping
 * Validates: Requirements 9.1, 9.2, 9.3, 9.8
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';
import { KARMA_CONFIG } from '@game/constants.js';

describe('Karma Clamping Properties', () => {
  it('stays within bounds after any single modification', () => {
    fc.assert(
      fc.property(fc.integer({ min: -500, max: 500 }), (amount) => {
        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();
        game.modifyKarma(amount, 'test');
        const karma = game.getKarma();
        return karma >= KARMA_CONFIG.MIN && karma <= KARMA_CONFIG.MAX;
      }),
      { numRuns: 100 }
    );
  });
});
```

Conventions to follow:
- **Tag the file** with a docstring naming the feature, property number, and requirement IDs it validates. This makes coverage traceable.
- **Pass `{ numRuns: 100 }`** explicitly to `fc.assert` — CLAUDE.md mandates ≥100 iterations.
- **Build state through `GameCoordinator`**, not ad-hoc objects. Property tests exercise the real coordinator the same way integration tests do.
- **Return a boolean predicate** from `fc.property` for clear pass/fail. Use `expect()` for one-shot setup assertions outside `fc.assert`.

Shared test helpers live in `tests/react-test-utils.jsx` (React rendering wrappers) and `tests/test-utils.js` (game-state factories and DOM setup).

## Troubleshooting

### Port already in use

```bash
lsof -ti:5173 | xargs kill -9
```

### Module resolution errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Vite cache issues

```bash
rm -rf node_modules/.vite
npm run dev
```

### Three.js scene doesn't render

1. Check browser console for WebGL errors.
2. Verify `StarMapCanvas` is mounted (React DevTools).
3. Confirm `initScene` is called exactly once (empty-deps `useEffect`).
4. Verify the container ref is attached before scene init.
5. Make sure Three.js resources aren't disposed prematurely on a parent re-render.

### Tests fail after a refactor

1. Run `npm run test:watch` and read the first failing assertion.
2. Check that Bridge Pattern hooks haven't been bypassed (no direct `getState()` in render).
3. Confirm subscriptions are cleaned up (`useGameEvent` does this automatically; custom listeners must too).
4. Check `tests/setup-three-mock.js` if a Three.js mock is missing.

## Performance

### React

- `React.memo` on panels that re-render frequently.
- `useMemo` / `useCallback` for expensive derivations and stable references.
- React 18 automatic batching covers most multi-update flows.

### Three.js

- Scene initialized once; never re-initialized.
- `requestAnimationFrame` loop runs outside React's render cycle.
- All geometries, materials, textures disposed on unmount.
- Container access via ref, not `document.querySelector`.

### Bundle

- Vendor and Three.js are split into separate chunks (`vite.config.js`).
- Tree shaking removes unused exports — run `npm run knip` periodically to surface dead code.

## Resources

### External docs

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [fast-check](https://fast-check.dev/)
- [Three.js](https://threejs.org/docs/)

### In-repo

- `CLAUDE.md` — canonical coding standards (constants, rounding, commits, TDD).
- `notes/tramp-freighter.md` — product requirements and design notes.
- `.kiro/steering/` — additional development guidelines.
- `.kiro/specs/react-migration/` — historical migration spec (kept for reference; current architecture is documented above).
