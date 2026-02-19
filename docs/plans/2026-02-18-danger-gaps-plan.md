# Danger Spec Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close 6 gaps in the danger/combat system so the `ovid/danger` branch fully implements Spec 05.

**Architecture:** Add `encounterPhase` state to App.jsx for two-step pirate encounters (initial → combat/negotiation). Fix DangerManager's `countRestrictedGoods` to be zone-aware. Wire dangerFlags increments in encounter resolution methods and add reader effects in probability calculations and NPC dialogue. Emit missing Bridge Pattern events on save-load.

**Tech Stack:** React 18, Vitest, fast-check (property tests), existing GameStateManager/Bridge Pattern

---

## Prerequisites

- Branch: `ovid/danger`
- All existing tests must pass before starting: `npm test`
- Design doc: `docs/plans/2026-02-18-danger-gaps-design.md`

---

### Task 1: Save/Load Bridge Events (Gap 6)

Smallest, most isolated fix. No dependencies on other tasks.

**Files:**
- Modify: `src/game/state/managers/save-load.js:175-193`
- Test: `tests/unit/save-load-danger-events.test.js`

**Step 1: Write the failing test**

Create `tests/unit/save-load-danger-events.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Save/Load Danger Events', () => {
  let gameStateManager;
  let emittedEvents;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    emittedEvents = {};
    const originalEmit = gameStateManager.emit.bind(gameStateManager);
    vi.spyOn(gameStateManager, 'emit').mockImplementation((event, data) => {
      emittedEvents[event] = data;
      originalEmit(event, data);
    });
  });

  it('should emit karmaChanged when loading saved game', () => {
    const state = gameStateManager.getState();
    state.player.karma = 42;
    gameStateManager.saveGame();

    // Reset emitted events
    emittedEvents = {};

    // Reload
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify(gameStateManager.getState())
    );
    gameStateManager.loadGame();

    expect(emittedEvents).toHaveProperty('karmaChanged');
    expect(emittedEvents.karmaChanged).toBe(42);
  });

  it('should emit factionRepChanged when loading saved game', () => {
    const state = gameStateManager.getState();
    state.player.factions = {
      authorities: 10,
      traders: -5,
      outlaws: 20,
      civilians: 15,
    };
    gameStateManager.saveGame();

    emittedEvents = {};

    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify(gameStateManager.getState())
    );
    gameStateManager.loadGame();

    expect(emittedEvents).toHaveProperty('factionRepChanged');
    expect(emittedEvents.factionRepChanged).toEqual({
      authorities: 10,
      traders: -5,
      outlaws: 20,
      civilians: 15,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/save-load-danger-events.test.js`
Expected: FAIL — `karmaChanged` and `factionRepChanged` not in emittedEvents

**Step 3: Write minimal implementation**

In `src/game/state/managers/save-load.js`, add two lines after line 192 (after `quirksChanged` emission):

```javascript
    this.emit('karmaChanged', loadedState.player.karma || 0);
    this.emit('factionRepChanged', loadedState.player.factions || {});
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/save-load-danger-events.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/save-load.js tests/unit/save-load-danger-events.test.js
git commit -m "fix: emit karma and faction events on save-load"
```

---

### Task 2: Fix countRestrictedGoods (Gap 4)

**Files:**
- Modify: `src/game/state/managers/danger.js:280-336`
- Modify: `src/game/constants.js` (import RESTRICTED_GOODS_CONFIG in danger.js)
- Test: `tests/property/restricted-goods-counting.property.test.js`

**Step 1: Write the failing property test**

Create `tests/property/restricted-goods-counting.property.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { RESTRICTED_GOODS_CONFIG } from '../../src/game/constants.js';

describe('Restricted Goods Counting Properties', () => {
  it('should count zero restricted goods when cargo contains only unrestricted items for the zone', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom('safe', 'contested', 'dangerous'),
        (zone) => {
          const restricted = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
          // Create cargo with only items NOT in restricted list
          const unrestricted = ['grain', 'ore'].filter(g => !restricted.includes(g));
          if (unrestricted.length === 0) return true; // Skip if all goods restricted

          const cargo = unrestricted.map(good => ({
            good,
            quantity: 5,
            purchasePrice: 10,
          }));

          const count = gameStateManager.countRestrictedGoods(cargo, zone);
          return count === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count restricted goods correctly for each zone', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom('safe', 'contested', 'dangerous'),
        (zone) => {
          const restricted = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
          if (restricted.length === 0) return true;

          // Create cargo with one restricted item
          const cargo = [
            { good: restricted[0], quantity: 5, purchasePrice: 10 },
            { good: 'grain', quantity: 3, purchasePrice: 8 },
          ];

          const count = gameStateManager.countRestrictedGoods(cargo, zone);
          // Should count the restricted item but not grain (unless grain is restricted)
          const expectedCount = cargo.filter(item =>
            restricted.includes(item.good)
          ).length;
          return count === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count core system restricted goods when in core systems', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Core systems (Sol=0, Alpha Centauri=1) restrict 'parts'
    const cargo = [
      { good: 'parts', quantity: 5, purchasePrice: 30 },
      { good: 'grain', quantity: 3, purchasePrice: 8 },
    ];

    // systemId 0 (Sol) is a core system
    const count = gameStateManager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBe(1); // parts is restricted in core systems
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/property/restricted-goods-counting.property.test.js`
Expected: FAIL — current implementation counts all cargo items as restricted

**Step 3: Write minimal implementation**

In `src/game/state/managers/danger.js`, add `RESTRICTED_GOODS_CONFIG` to the import at line 1-14, then replace the `countRestrictedGoods` method (lines 332-336):

```javascript
  countRestrictedGoods(cargo, zone, systemId) {
    const zoneRestrictions = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];

    // Core systems have additional restrictions
    const coreRestrictions =
      systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID
        ? RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED
        : [];

    const allRestricted = [...zoneRestrictions, ...coreRestrictions];

    return cargo.filter(item => allRestricted.includes(item.good)).length;
  }
```

Update the call site in `calculateInspectionChance` (line 302-304) to pass zone and systemId:

```javascript
    const restrictedGoodsCount = this.countRestrictedGoods(
      gameState.ship.cargo,
      zone,
      systemId
    );
```

Also add `RESTRICTED_GOODS_CONFIG` to the import statement at the top of `danger.js` (line 2-14).

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/property/restricted-goods-counting.property.test.js`
Expected: PASS

**Step 5: Run full test suite, fix any broken tests**

Run: `npm test`

The existing `inspection-probability-scaling.property.test.js` tests may need adjustment since they relied on the old placeholder behavior. If a test expected all cargo to count as restricted, update its assertions to match the new zone-aware logic.

**Step 6: Commit**

```bash
git add src/game/state/managers/danger.js tests/property/restricted-goods-counting.property.test.js
git commit -m "fix: make countRestrictedGoods zone-aware using RESTRICTED_GOODS_CONFIG"
```

---

### Task 3: Two-Step Encounter Flow — App.jsx Routing (Gaps 1 & 2)

**Files:**
- Modify: `src/App.jsx:11-16, 49-63, 189-217, 457-491`
- Test: `tests/integration/two-step-encounter-flow.integration.test.jsx`

**Step 1: Write the failing integration test**

Create `tests/integration/two-step-encounter-flow.integration.test.jsx`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import App from '../../src/App';

describe('Two-Step Encounter Flow', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  async function navigateToOrbit() {
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    const shipNameInput = screen.getByPlaceholderText('Enter ship name...');
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });
    fireEvent.keyDown(shipNameInput, { key: 'Enter' });
    await waitFor(() => {
      const devButton = screen.queryByText('⚙');
      const errorBoundary = screen.queryByText('Something went wrong');
      expect(devButton || errorBoundary).toBeTruthy();
    });
    return !screen.queryByText('Something went wrong');
  }

  async function triggerPirateEncounter() {
    const devAdminButton = screen.getByText('⚙');
    fireEvent.click(devAdminButton);
    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🏴‍☠️ Pirate'));
    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  }

  it('should show CombatPanel when player chooses Fight', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Fight option
    fireEvent.click(screen.getByText('Fight'));
    fireEvent.click(screen.getByText(/Confirm Fight/i));

    // Should now see CombatPanel with its 4 options
    await waitFor(() => {
      expect(screen.getByText('Combat Resolution')).toBeInTheDocument();
      expect(screen.getByText('Evasive Maneuvers')).toBeInTheDocument();
      expect(screen.getByText('Return Fire')).toBeInTheDocument();
      expect(screen.getByText('Dump Cargo')).toBeInTheDocument();
      expect(screen.getByText('Distress Call')).toBeInTheDocument();
    });
  });

  it('should show NegotiationPanel when player chooses Negotiate', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Negotiate option
    fireEvent.click(screen.getByText('Negotiate'));
    fireEvent.click(screen.getByText(/Confirm Negotiate/i));

    // Should now see NegotiationPanel
    await waitFor(() => {
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Counter-Proposal')).toBeInTheDocument();
      expect(screen.getByText('Accept Demand')).toBeInTheDocument();
    });
  });

  it('should resolve immediately when player chooses Surrender', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Surrender option
    fireEvent.click(screen.getByText('Surrender'));
    fireEvent.click(screen.getByText(/Confirm Surrender/i));

    // Should go directly to OutcomePanel (not NegotiationPanel)
    await waitFor(() => {
      expect(screen.queryByText('Negotiation')).not.toBeInTheDocument();
      // OutcomePanel should be visible
      expect(screen.getByText(/Continue/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/two-step-encounter-flow.integration.test.jsx`
Expected: FAIL — "Combat Resolution" and "Negotiation" panels never appear

**Step 3: Write minimal implementation**

**3a. Add imports and encounterPhase state to App.jsx:**

Add imports for CombatPanel and NegotiationPanel at lines 11-15:
```javascript
import { CombatPanel } from './features/danger/CombatPanel';
import { NegotiationPanel } from './features/danger/NegotiationPanel';
```

Add state at line 62 (after `encounterOutcome`):
```javascript
  const [encounterPhase, setEncounterPhase] = useState(null);
```

**3b. Modify handleEncounterChoice (lines 189-217):**

Replace the handler to route pirate fight/flee/negotiate to sub-panels:

```javascript
  const handleEncounterChoice = (choice) => {
    if (!currentEncounter) return;

    // Two-step pirate encounter: route to sub-panels
    if (currentEncounter.type === 'pirate' && encounterPhase === 'initial') {
      if (choice === 'fight' || choice === 'flee') {
        setEncounterPhase('combat');
        return;
      }
      if (choice === 'negotiate') {
        setEncounterPhase('negotiation');
        return;
      }
      // Surrender resolves immediately
    }

    if (currentEncounter && gameStateManager.resolveEncounter) {
      try {
        const outcome = gameStateManager.resolveEncounter(
          currentEncounter,
          choice
        );

        applyEncounterOutcome(outcome);

        const displayOutcome = transformOutcomeForDisplay(
          outcome,
          currentEncounter.type,
          choice
        );

        setEncounterOutcome(displayOutcome);
      } catch (error) {
        console.error('Encounter resolution failed:', error);
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setEncounterPhase(null);
        setViewMode(VIEW_MODES.ORBIT);
      }
    }
  };
```

**3c. Update encounter setup** (where encounterTriggered event is consumed, around line 372-395):

When setting a pirate encounter, also set `encounterPhase`:
```javascript
    setEncounterPhase(encounterData.type === 'pirate' ? 'initial' : null);
```

**3d. Update handleEncounterClose and handleOutcomeContinue** to reset encounterPhase:

```javascript
  const handleEncounterClose = () => {
    setCurrentEncounter(null);
    setEncounterPhase(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleOutcomeContinue = () => {
    setCurrentEncounter(null);
    setEncounterOutcome(null);
    setEncounterPhase(null);
    setViewMode(VIEW_MODES.ORBIT);
  };
```

**3e. Update JSX rendering (lines 457-491):**

Replace the pirate encounter panel rendering:

```jsx
                    {currentEncounter.type === 'pirate' &&
                      encounterPhase === 'initial' && (
                        <PirateEncounterPanel
                          encounter={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
                    {currentEncounter.type === 'pirate' &&
                      encounterPhase === 'combat' && (
                        <CombatPanel
                          combat={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
                    {currentEncounter.type === 'pirate' &&
                      encounterPhase === 'negotiation' && (
                        <NegotiationPanel
                          encounter={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/two-step-encounter-flow.integration.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. Existing encounter-resolution integration tests may need updates since they expect Fight to resolve directly instead of showing CombatPanel.

**Step 6: Commit**

```bash
git add src/App.jsx tests/integration/two-step-encounter-flow.integration.test.jsx
git commit -m "feat: wire CombatPanel and NegotiationPanel into two-step encounter flow"
```

---

### Task 4: Update GameStateManager Pirate Resolution Routing

**Files:**
- Modify: `src/game/state/game-state-manager.js:732-749`
- Test: `tests/unit/pirate-resolution-routing.test.js`

**Step 1: Write the failing test**

Create `tests/unit/pirate-resolution-routing.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Pirate Resolution Routing', () => {
  let gameStateManager;
  const encounter = {
    id: 'test_pirate',
    type: 'pirate',
    threatLevel: 'moderate',
    demandPercent: 20,
  };

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should accept evasive as a direct combat sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'evasive');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('description');
  });

  it('should accept return_fire as a direct combat sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'return_fire');
    expect(result).toHaveProperty('success');
  });

  it('should accept dump_cargo as a direct combat sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'dump_cargo');
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should accept distress_call as a direct combat sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'distress_call');
    expect(result).toHaveProperty('success');
  });

  it('should accept counter_proposal as a direct negotiation sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'counter_proposal');
    expect(result).toHaveProperty('success');
  });

  it('should accept medicine_claim as a direct negotiation sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'medicine_claim');
    expect(result).toHaveProperty('success');
  });

  it('should accept intel_offer as a direct negotiation sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'intel_offer');
    expect(result).toHaveProperty('success');
  });

  it('should accept accept_demand as a direct negotiation sub-choice', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'accept_demand');
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  it('should still accept surrender as an alias for accept_demand', () => {
    const result = gameStateManager.resolvePirateEncounter(encounter, 'surrender');
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/pirate-resolution-routing.test.js`
Expected: FAIL — `evasive`, `dump_cargo`, `distress_call`, `counter_proposal`, `medicine_claim`, `intel_offer` are not recognized choices

**Step 3: Write minimal implementation**

Replace `resolvePirateEncounter` in `src/game/state/game-state-manager.js` (lines 732-749):

```javascript
  resolvePirateEncounter(encounter, choice, rng) {
    // Combat sub-choices (from CombatPanel)
    const combatChoices = ['evasive', 'return_fire', 'dump_cargo', 'distress_call'];
    if (combatChoices.includes(choice)) {
      return this.resolveCombatChoice(encounter, choice);
    }

    // Negotiation sub-choices (from NegotiationPanel)
    const negotiationChoices = [
      'counter_proposal',
      'medicine_claim',
      'intel_offer',
      'accept_demand',
    ];
    if (negotiationChoices.includes(choice)) {
      return this.resolveNegotiation(encounter, choice, rng ?? Math.random());
    }

    // Legacy/shortcut: surrender maps to accept_demand
    if (choice === 'surrender') {
      return this.resolveNegotiation(encounter, 'accept_demand', rng ?? Math.random());
    }

    throw new Error(`Unknown pirate encounter choice: ${choice}`);
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/pirate-resolution-routing.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`

**Step 6: Commit**

```bash
git add src/game/state/game-state-manager.js tests/unit/pirate-resolution-routing.test.js
git commit -m "feat: accept direct combat and negotiation sub-choices in pirate resolution"
```

---

### Task 5: Patrol Combat Chain (Gap 3)

**Files:**
- Modify: `src/game/constants.js` (add PATROL_ENCOUNTER_TEMPLATE)
- Modify: `src/App.jsx` (read triggerPatrolCombat in applyEncounterOutcome)
- Test: `tests/unit/patrol-combat-chain.test.js`

**Step 1: Write the failing test**

Create `tests/unit/patrol-combat-chain.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { PATROL_ENCOUNTER_TEMPLATE } from '../../src/game/constants.js';

describe('Patrol Combat Chain', () => {
  it('should export a PATROL_ENCOUNTER_TEMPLATE constant', () => {
    expect(PATROL_ENCOUNTER_TEMPLATE).toBeDefined();
    expect(PATROL_ENCOUNTER_TEMPLATE).toHaveProperty('type', 'pirate');
    expect(PATROL_ENCOUNTER_TEMPLATE).toHaveProperty('threatLevel');
    expect(PATROL_ENCOUNTER_TEMPLATE).toHaveProperty('name');
    expect(PATROL_ENCOUNTER_TEMPLATE).toHaveProperty('description');
    expect(PATROL_ENCOUNTER_TEMPLATE).toHaveProperty('demandPercent', 0);
  });

  it('should have a moderate threat level for patrol ships', () => {
    expect(PATROL_ENCOUNTER_TEMPLATE.threatLevel).toBe('moderate');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/patrol-combat-chain.test.js`
Expected: FAIL — PATROL_ENCOUNTER_TEMPLATE not exported

**Step 3: Add constant and wire App.jsx**

**3a. Add to `src/game/constants.js`** (after RESTRICTED_GOODS_CONFIG, around line 1278):

```javascript
/**
 * Patrol Encounter Template
 *
 * Used when a player flees a customs inspection and triggers pursuit combat.
 * Reuses the pirate combat system with a patrol ship profile.
 */
export const PATROL_ENCOUNTER_TEMPLATE = {
  type: 'pirate',
  threatLevel: 'moderate',
  name: 'System Patrol',
  description:
    'The patrol ship is in pursuit. Your engines whine as you try to outrun them.',
  demandPercent: 0,
};
```

**3b. In `src/App.jsx`, update `applyEncounterOutcome`** to check for `triggerPatrolCombat`.

Import PATROL_ENCOUNTER_TEMPLATE at top of file. After the existing outcome application logic (around line 369, before the `saveGame()` call), add:

```javascript
    // Check for patrol combat chain (inspection flee → combat)
    if (outcome.triggerPatrolCombat) {
      const patrolEncounter = {
        type: 'pirate',
        encounter: {
          ...PATROL_ENCOUNTER_TEMPLATE,
          id: `patrol_${Date.now()}`,
        },
      };
      setCurrentEncounter(patrolEncounter);
      setEncounterOutcome(null);
      setEncounterPhase('combat');
      gameStateManager.saveGame();
      return; // Don't save again or show OutcomePanel yet
    }
```

Note: This must be placed in the `handleEncounterChoice` function *after* `applyEncounterOutcome(outcome)` is called but *before* `setEncounterOutcome(displayOutcome)`. The flow needs careful placement — the patrol combat replaces the normal outcome display.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/patrol-combat-chain.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`

**Step 6: Commit**

```bash
git add src/game/constants.js src/App.jsx tests/unit/patrol-combat-chain.test.js
git commit -m "feat: chain patrol combat after inspection flee"
```

---

### Task 6: dangerFlags Increments (Gap 5 — Write Side)

**Files:**
- Modify: `src/game/state/managers/danger.js` (resolution methods)
- Modify: `src/game/state/game-state-manager.js` (add incrementDangerFlag delegation)
- Test: `tests/property/danger-flags-increment.property.test.js`

**Step 1: Write the failing property test**

Create `tests/property/danger-flags-increment.property.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Danger Flags Increment Properties', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  const encounter = {
    id: 'test',
    type: 'pirate',
    threatLevel: 'moderate',
    demandPercent: 20,
  };

  it('should increment piratesFought for any combat resolution', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('evasive', 'return_fire', 'dump_cargo', 'distress_call'),
        (choice) => {
          // Reset flags
          gameStateManager.initNewGame();
          const before = gameStateManager.getState().world.dangerFlags.piratesFought;

          gameStateManager.resolvePirateEncounter(encounter, choice);

          const after = gameStateManager.getState().world.dangerFlags.piratesFought;
          return after === before + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment piratesNegotiated for any negotiation resolution', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('counter_proposal', 'accept_demand'),
        (choice) => {
          gameStateManager.initNewGame();
          const before = gameStateManager.getState().world.dangerFlags.piratesNegotiated;

          gameStateManager.resolvePirateEncounter(encounter, choice);

          const after = gameStateManager.getState().world.dangerFlags.piratesNegotiated;
          return after === before + 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment civiliansSaved on distress respond', () => {
    const before = gameStateManager.getState().world.dangerFlags.civiliansSaved;

    gameStateManager.resolveDistressCall({}, 'respond');

    const after = gameStateManager.getState().world.dangerFlags.civiliansSaved;
    expect(after).toBe(before + 1);
  });

  it('should increment civiliansLooted on distress loot', () => {
    const before = gameStateManager.getState().world.dangerFlags.civiliansLooted;

    gameStateManager.resolveDistressCall({}, 'loot');

    const after = gameStateManager.getState().world.dangerFlags.civiliansLooted;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsBribed on bribe attempt', () => {
    const before = gameStateManager.getState().world.dangerFlags.inspectionsBribed;

    gameStateManager.resolveInspection('bribe', gameStateManager.getState(), 0.5);

    const after = gameStateManager.getState().world.dangerFlags.inspectionsBribed;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsFled on flee inspection', () => {
    const before = gameStateManager.getState().world.dangerFlags.inspectionsFled;

    gameStateManager.resolveInspection('flee', gameStateManager.getState(), 0.5);

    const after = gameStateManager.getState().world.dangerFlags.inspectionsFled;
    expect(after).toBe(before + 1);
  });

  it('should increment inspectionsPassed on clean cooperate', () => {
    // Ensure no restricted goods
    const state = gameStateManager.getState();
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];

    const before = state.world.dangerFlags.inspectionsPassed;

    gameStateManager.resolveInspection('cooperate', state, 0.5);

    const after = gameStateManager.getState().world.dangerFlags.inspectionsPassed;
    expect(after).toBe(before + 1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/property/danger-flags-increment.property.test.js`
Expected: FAIL — danger flags never increment

**Step 3: Write minimal implementation**

**3a. Add `incrementDangerFlag` method to DangerManager** in `src/game/state/managers/danger.js`:

```javascript
  incrementDangerFlag(flagName) {
    this.validateState();
    const state = this.getState();
    if (state.world.dangerFlags && typeof state.world.dangerFlags[flagName] === 'number') {
      state.world.dangerFlags[flagName]++;
    }
  }
```

**3b. Add delegation method to GameStateManager** in `src/game/state/game-state-manager.js`:

```javascript
  incrementDangerFlag(flagName) {
    return this.dangerManager.incrementDangerFlag(flagName);
  }
```

**3c. Add increment calls in DangerManager resolution methods:**

In `resolveCombatChoice` (after the switch statement resolves, before return):
```javascript
    this.incrementDangerFlag('piratesFought');
```

In `resolveNegotiation` (after the switch statement resolves, before return):
```javascript
    this.incrementDangerFlag('piratesNegotiated');
```

In `resolveDistressRespond`:
```javascript
    this.incrementDangerFlag('civiliansSaved');
```

In `resolveDistressLoot`:
```javascript
    this.incrementDangerFlag('civiliansLooted');
```

In `resolveInspectionCooperate` (on clean pass path):
```javascript
    this.incrementDangerFlag('inspectionsPassed');
```

In `resolveInspectionBribe`:
```javascript
    this.incrementDangerFlag('inspectionsBribed');
```

In `resolveInspectionFlee`:
```javascript
    this.incrementDangerFlag('inspectionsFled');
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/property/danger-flags-increment.property.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`

**Step 6: Commit**

```bash
git add src/game/state/managers/danger.js src/game/state/game-state-manager.js tests/property/danger-flags-increment.property.test.js
git commit -m "feat: increment dangerFlags during encounter resolution"
```

---

### Task 7: dangerFlags Reader Effects — Encounter Probabilities (Gap 5 — Read Side)

**Files:**
- Modify: `src/game/constants.js` (add DANGER_FLAGS_EFFECTS constants)
- Modify: `src/game/state/managers/danger.js:184-245, 280-320` (probability calculations)
- Test: `tests/property/danger-flags-probability-effects.property.test.js`

**Step 1: Write the failing property test**

Create `tests/property/danger-flags-probability-effects.property.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Danger Flags Probability Effects', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('piratesFought should reduce pirate encounter chance', () => {
    const state = gameStateManager.getState();
    const systemId = 7; // Sirius (contested)

    // Base probability with no flags
    state.world.dangerFlags.piratesFought = 0;
    const baseProb = gameStateManager.calculatePirateEncounterChance(systemId, state);

    // With piratesFought flags
    state.world.dangerFlags.piratesFought = 5;
    const modifiedProb = gameStateManager.calculatePirateEncounterChance(systemId, state);

    expect(modifiedProb).toBeLessThan(baseProb);
  });

  it('piratesNegotiated should increase pirate encounter chance', () => {
    const state = gameStateManager.getState();
    const systemId = 7; // Sirius (contested)

    state.world.dangerFlags.piratesNegotiated = 0;
    const baseProb = gameStateManager.calculatePirateEncounterChance(systemId, state);

    state.world.dangerFlags.piratesNegotiated = 5;
    const modifiedProb = gameStateManager.calculatePirateEncounterChance(systemId, state);

    expect(modifiedProb).toBeGreaterThan(baseProb);
  });

  it('inspectionsFled should increase inspection chance', () => {
    const state = gameStateManager.getState();
    const systemId = 7; // Sirius (contested)

    state.world.dangerFlags.inspectionsFled = 0;
    const baseProb = gameStateManager.calculateInspectionChance(systemId, state);

    state.world.dangerFlags.inspectionsFled = 3;
    const modifiedProb = gameStateManager.calculateInspectionChance(systemId, state);

    expect(modifiedProb).toBeGreaterThan(baseProb);
  });

  it('probability effects should scale with flag count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (count1, count2) => {
          if (count1 === count2) return true;

          const state = gameStateManager.getState();
          const systemId = 7;

          state.world.dangerFlags.piratesFought = count1;
          const prob1 = gameStateManager.calculatePirateEncounterChance(systemId, state);

          state.world.dangerFlags.piratesFought = count2;
          const prob2 = gameStateManager.calculatePirateEncounterChance(systemId, state);

          // Higher fight count should mean lower pirate chance
          if (count1 > count2) return prob1 <= prob2;
          return prob1 >= prob2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/property/danger-flags-probability-effects.property.test.js`
Expected: FAIL — probabilities identical regardless of flags

**Step 3: Write minimal implementation**

**3a. Add constants** to `src/game/constants.js` (inside DANGER_CONFIG, after FACTION_REPUTATION_SCALES):

```javascript
  // Danger flags effects on encounter probabilities
  // These create a feedback loop: player actions affect future encounter rates
  DANGER_FLAGS_EFFECTS: {
    // Each piratesFought flag reduces pirate encounter chance by 2%
    // At 10 fights: 0.8x pirate chance (tough target reputation)
    PIRATES_FOUGHT_REDUCTION_PER_FLAG: 0.02,
    PIRATES_FOUGHT_MAX_REDUCTION: 0.3, // Cap at 30% reduction

    // Each piratesNegotiated flag increases pirate encounter chance by 1.5%
    // At 10 negotiations: 1.15x pirate chance (known as easy mark)
    PIRATES_NEGOTIATED_INCREASE_PER_FLAG: 0.015,
    PIRATES_NEGOTIATED_MAX_INCREASE: 0.2, // Cap at 20% increase

    // Each inspectionsFled flag increases inspection chance by 3%
    // At 5 fled inspections: 1.15x inspection chance (watchlist effect)
    INSPECTIONS_FLED_INCREASE_PER_FLAG: 0.03,
    INSPECTIONS_FLED_MAX_INCREASE: 0.3, // Cap at 30% increase
  },
```

**3b. Modify `calculatePirateEncounterChance`** in `danger.js` (before the final clamp, around line 241):

```javascript
    // Apply danger flags modifiers
    const { DANGER_FLAGS_EFFECTS } = DANGER_CONFIG;
    const dangerFlags = gameState.world?.dangerFlags || {};

    // piratesFought reduces encounters (tough target reputation)
    const foughtReduction = Math.min(
      (dangerFlags.piratesFought || 0) * DANGER_FLAGS_EFFECTS.PIRATES_FOUGHT_REDUCTION_PER_FLAG,
      DANGER_FLAGS_EFFECTS.PIRATES_FOUGHT_MAX_REDUCTION
    );
    probability *= (1 - foughtReduction);

    // piratesNegotiated increases encounters (easy mark)
    const negotiatedIncrease = Math.min(
      (dangerFlags.piratesNegotiated || 0) * DANGER_FLAGS_EFFECTS.PIRATES_NEGOTIATED_INCREASE_PER_FLAG,
      DANGER_FLAGS_EFFECTS.PIRATES_NEGOTIATED_MAX_INCREASE
    );
    probability *= (1 + negotiatedIncrease);
```

**3c. Modify `calculateInspectionChance`** in `danger.js` (before the final clamp, around line 317):

```javascript
    // Apply danger flags modifier (watchlist effect)
    const { DANGER_FLAGS_EFFECTS } = DANGER_CONFIG;
    const dangerFlags = gameState.world?.dangerFlags || {};

    const fledIncrease = Math.min(
      (dangerFlags.inspectionsFled || 0) * DANGER_FLAGS_EFFECTS.INSPECTIONS_FLED_INCREASE_PER_FLAG,
      DANGER_FLAGS_EFFECTS.INSPECTIONS_FLED_MAX_INCREASE
    );
    probability *= (1 + fledIncrease);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/property/danger-flags-probability-effects.property.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Existing probability tests may need adjustment if they assumed no dangerFlags effect (all flags default to 0 so should be fine).

**Step 6: Commit**

```bash
git add src/game/constants.js src/game/state/managers/danger.js tests/property/danger-flags-probability-effects.property.test.js
git commit -m "feat: dangerFlags affect pirate and inspection encounter probabilities"
```

---

### Task 8: dangerFlags Reader Effects — NPC Dialogue (Gap 5 — Dialogue Side)

**Files:**
- Modify: `src/game/data/dialogue/faction-karma-conditions.js` (add getDangerFlagAttitudeModifier)
- Modify: `src/game/data/dialogue/wei-chen.js` (example: integrate into one NPC greeting)
- Test: `tests/unit/danger-flag-dialogue-modifiers.test.js`

**Step 1: Write the failing test**

Create `tests/unit/danger-flag-dialogue-modifiers.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { getDangerFlagAttitudeModifier } from '../../src/game/data/dialogue/faction-karma-conditions.js';

describe('Danger Flag Dialogue Modifiers', () => {
  function createMockGameStateManager(dangerFlags) {
    return {
      getState: () => ({
        world: { dangerFlags },
      }),
    };
  }

  it('should return positive modifier for high civiliansSaved', () => {
    const gsm = createMockGameStateManager({ civiliansSaved: 5, civiliansLooted: 0 });
    const modifier = getDangerFlagAttitudeModifier('civilians', gsm);
    expect(modifier).toContain('heard');
    expect(modifier.length).toBeGreaterThan(0);
  });

  it('should return negative modifier for high civiliansLooted', () => {
    const gsm = createMockGameStateManager({ civiliansSaved: 0, civiliansLooted: 3 });
    const modifier = getDangerFlagAttitudeModifier('civilians', gsm);
    expect(modifier.length).toBeGreaterThan(0);
    // Should be a negative reaction
    expect(modifier).toMatch(/rumor|heard|talk/i);
  });

  it('should return empty string when flags are neutral', () => {
    const gsm = createMockGameStateManager({ civiliansSaved: 0, civiliansLooted: 0 });
    const modifier = getDangerFlagAttitudeModifier('civilians', gsm);
    expect(modifier).toBe('');
  });

  it('should return empty string when dangerFlags is missing', () => {
    const gsm = { getState: () => ({ world: {} }) };
    const modifier = getDangerFlagAttitudeModifier('civilians', gsm);
    expect(modifier).toBe('');
  });

  it('should handle outlaw faction with piratesFought', () => {
    const gsm = createMockGameStateManager({ piratesFought: 5, piratesNegotiated: 0 });
    const modifier = getDangerFlagAttitudeModifier('outlaws', gsm);
    // Outlaws should react negatively to someone who fights pirates
    expect(modifier.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/danger-flag-dialogue-modifiers.test.js`
Expected: FAIL — getDangerFlagAttitudeModifier not exported

**Step 3: Write minimal implementation**

**3a. Add `getDangerFlagAttitudeModifier` to `src/game/data/dialogue/faction-karma-conditions.js`:**

```javascript
/**
 * Danger flag-based attitude modifier for NPC dialogue text
 *
 * Returns a modifier string reflecting NPC awareness of player's
 * encounter history (rescuing civilians, fighting pirates, etc.).
 *
 * @param {string} npcFaction - The faction this NPC sympathizes with
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {string} Text modifier to append to dialogue
 */
export function getDangerFlagAttitudeModifier(npcFaction, gameStateManager) {
  try {
    const dangerFlags = gameStateManager.getState().world?.dangerFlags;
    if (!dangerFlags) return '';

    if (npcFaction === 'civilians') {
      if (dangerFlags.civiliansSaved >= 3) {
        return " I've heard you help people in trouble. That means something out here.";
      }
      if (dangerFlags.civiliansLooted >= 2) {
        return ' There are rumors about you... not the good kind.';
      }
    }

    if (npcFaction === 'outlaws') {
      if (dangerFlags.piratesFought >= 5) {
        return " Word is you've been shooting at our kind. Watch yourself.";
      }
      if (dangerFlags.piratesNegotiated >= 5) {
        return " I hear you're reasonable when it comes to business.";
      }
    }

    if (npcFaction === 'authorities') {
      if (dangerFlags.inspectionsFled >= 3) {
        return " You've been flagged in our system. Don't cause trouble.";
      }
      if (dangerFlags.inspectionsPassed >= 5) {
        return ' Your record shows consistent compliance. Good.';
      }
    }

    return '';
  } catch {
    return '';
  }
}
```

**3b. Integrate into Wei Chen's greeting** in `src/game/data/dialogue/wei-chen.js`:

Add import:
```javascript
import {
  hasFactionRep,
  hasGoodKarma,
  hasBadKarma,
  isWantedByAuthorities,
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
  getDangerFlagAttitudeModifier,
} from './faction-karma-conditions.js';
```

Add after the existing `getFactionAttitudeModifier` call in the greeting text function:
```javascript
      // Add danger flag attitude modifier
      if (gameStateManager) {
        baseText += getDangerFlagAttitudeModifier('civilians', gameStateManager);
      }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/danger-flag-dialogue-modifiers.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`

**Step 6: Commit**

```bash
git add src/game/data/dialogue/faction-karma-conditions.js src/game/data/dialogue/wei-chen.js tests/unit/danger-flag-dialogue-modifiers.test.js
git commit -m "feat: add dangerFlags-based NPC dialogue modifiers"
```

---

### Task 9: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass, no stderr warnings

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No errors

**Step 3: Manual smoke test**

Run: `npm run dev`
- Start new game
- Use DevAdmin to trigger pirate encounter
- Verify Fight → CombatPanel (4 options)
- Verify Negotiate → NegotiationPanel (4 options)
- Verify Surrender → immediate OutcomePanel
- Trigger inspection, choose Flee, verify patrol combat follows
- Check DevAdmin danger flags section shows incremented counters

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup for danger spec gap fixes"
```

---

## Task Dependency Graph

```
Task 1 (save-load) ─────────────────┐
Task 2 (countRestrictedGoods) ───────┤
Task 3 (App.jsx routing) ──┐        │
Task 4 (GSM routing) ──────┤        ├─ Task 9 (verification)
Task 5 (patrol combat) ────┘        │
Task 6 (flags increment) ──┐        │
Task 7 (flags probabilities)┤───────┤
Task 8 (flags dialogue) ───┘        │
```

Tasks 1, 2, 6 can run in parallel (independent).
Tasks 3, 4, 5 are sequential (App routing → GSM routing → patrol chain).
Tasks 6, 7, 8 are sequential (increments → probability readers → dialogue readers).
Task 9 depends on all others.
