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
3. **`src/hooks/useGameEvent.js`** + **`src/hooks/useGameAction.js`** — Bridge Pattern read/write hooks
4. **`src/game/state/game-coordinator.js`** — the singleton facade (~1640 lines, mostly delegation)
5. **`src/game/state/capabilities.js`** — capability interfaces defining what each manager can read/write
6. **One manager** in `src/game/state/managers/` (e.g. `trading.js`, `combat.js`) to see the pattern in practice
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

# Run tests matching a pattern
npm test -- --grep "Bridge Pattern"
```

**Gotcha:** The `test` script is `vitest --run`. Do **not** pass `--run` again on the command line (`npm test --run`) — npm in this project does not strip it correctly. Just use `npm test`.

## Architecture

### View Mode State Machine

The application has no router. `App.jsx` manages a single state machine over seven view modes (defined at `src/App.jsx:45-53`):

```
         ┌─────────┐
         │  TITLE  │
         └────┬────┘
              ▼
         ┌─────────────┐
         │ SHIP_NAMING │
         └────┬────────┘
              ▼
         ┌──────────┐      ┌──────────┐
         │  ORBIT   │ ◄──► │ STATION  │
         └────┬─────┘      └──────────┘
              ▼
         ┌───────────┐
         │ ENCOUNTER │
         └────┬──────┘
              ▼
         ┌─────────────┐      ┌──────────┐
         │ PAVONIS_RUN │ ───► │ EPILOGUE │
         └─────────────┘      └──────────┘
```

`PANEL`-style overlays (trade, refuel, repair, upgrades, info broker, cargo, ship status) are rendered on top of `STATION` rather than being separate modes. The `ENCOUNTER` view is driven by `useEncounterOrchestration`, which receives `setViewMode` from `App.jsx` and switches mode when the game raises an encounter event.

### Bridge Pattern

The single most important pattern in this codebase. It connects the imperative `GameCoordinator` singleton to React's declarative model. Three pieces:

- **`GameContext`** (`src/context/GameContext.jsx`) — exposes `GameCoordinator` via React Context.
- **`useGameEvent(eventName)`** (`src/hooks/useGameEvent.js`) — subscribes to a `GameCoordinator` event, triggers a re-render on fire, auto-unsubscribes on unmount.
- **`useGameAction()`** (`src/hooks/useGameAction.js`) — returns methods that mutate game state (`jump`, `buyGood`, `sellGood`, `refuel`, etc.).

**Critical rule:** Components must never call `GameCoordinator.getState()` directly during render, and must never copy game state into React `useState`. All reactive reads flow through `useGameEvent`; all mutations flow through `useGameAction` or a feature-specific action hook (e.g. `useTradeActions`, `useShipActions`, `useMissionActions`).

#### Example

```javascript
import { useState } from 'react';
import { useGameState } from '@context/GameContext';
import { useGameEvent } from '@hooks/useGameEvent';
import { useTradeActions } from '@hooks/useTradeActions';

function TradePanel({ onClose }) {
  // Local UI state only — not game state
  const [selectedGood, setSelectedGood] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Reactive reads
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');

  // Actions
  const { buyGood, sellGood } = useTradeActions();

  // Non-reactive lookups still go through GameCoordinator
  const gsm = useGameState();
  const knownPrices = gsm.getKnownPrices(gsm.getState().player.currentSystem);

  return /* ... */;
}
```

**Why it works:**

1. `useGameEvent('creditsChanged')` subscribes to the event.
2. When credits change, `EventSystemManager` fires the event.
3. The hook bumps local state, triggering a re-render.
4. Unmount cleans up the subscription automatically.

### GameCoordinator + Manager Delegation

`GameCoordinator` (`src/game/state/game-coordinator.js`, ~1640 lines) is a facade. Almost all of its body is delegation methods — the real logic lives in domain managers under `src/game/state/managers/`. This is the result of the GSM refactor and is intentional; the facade is the project's public API surface.

#### The 24 managers

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

Each manager extends `BaseManager` and receives a **capabilities** object (not the full GameCoordinator) — see `src/game/state/capabilities.js` for the per-manager getter/mutator interfaces. This is how cross-manager reads and writes stay explicit rather than turning into a god object.

#### Save pattern

Managers call `this.gameStateManager.markDirty()` after mutations. They never call `saveGame()` directly. `SaveLoadManager` debounces all dirty marks with a 500ms trailing write, so a burst of mutations produces a single `localStorage` write.

#### Encounter RNG

Combat, inspection, distress, and mechanical-failure paths use `SeededRandom` (`src/game/utils/seeded-random.js`) with deterministic seeds shaped like `gameDay_systemId_encounterType`. **Never use `Math.random()` in gameplay paths** — same game day + same system + same encounter type must produce the same outcome.

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
│   │   ├── useMobileLayout.js / useClickOutside.js / useDebtActions.js
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
│           ├── page-title.js / reduced-motion.js / dev-logger.js
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
    ├── test-utils.js / test-data.js
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

`CLAUDE.md` is the canonical reference. Key points repeated here:

### Constants

All magic numbers live in `src/game/constants.js`. Prices, capacities, thresholds, percentages, durations — never hard-code them in implementation files.

### Numeric display

Round at the calculation layer, not the display layer. Utility functions return integers.

- **Credits / costs:** `Math.ceil()` — the player never pays less than the true cost.
- **Percentages (condition, capacity):** `Math.round()` — standard display rounding.
- Never interpolate a raw float into JSX.

### TDD

Required for all feature work. RED (one failing test) → GREEN (minimal passing code) → REFACTOR. Never batch multiple failing tests.

### Tests

- Three suites: unit (`tests/unit/`), property-based with fast-check (`tests/property/`), integration (`tests/integration/`).
- Property tests: minimum 100 iterations, tagged with feature/property references.
- Tests must produce **no stderr warnings** — mock `console` methods when testing error paths.
- Every commit must leave the full suite passing.

### React patterns

- Functional components with hooks only.
- Three.js scenes initialize once in a `useEffect` with empty deps; dispose all resources on unmount.
- Never allocate objects in hot loops (animation frames, frequent events).

### Accessibility

Basic a11y is expected on new and modified components: `aria-label` on icon-only buttons, semantic HTML, keyboard-navigable controls. A full a11y pass is planned.

### Style

ES Modules, 2-space indentation, `const`/`let` only. Comments explain WHY not WHAT, and never mention task numbers. Import order: external libraries → internal modules → components → utilities → data/constants → styles.

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
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react';
import { useGameEvent } from '@hooks/useGameEvent';

describe('useGameEvent: automatic unsubscription on unmount', () => {
  it('removes its subscription when the component unmounts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('creditsChanged', 'fuelChanged', 'cargoChanged'),
        (eventName) => {
          const mockGSM = createMockGameCoordinator();
          const { unmount } = renderHook(() => useGameEvent(eventName), {
            wrapper: createWrapper(mockGSM),
          });
          const before = mockGSM.getSubscriptionCount(eventName);
          unmount();
          return mockGSM.getSubscriptionCount(eventName) === before - 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

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
