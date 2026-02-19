# Encounter Resolution Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the OutcomePanel into the encounter resolution flow so players see a detailed breakdown of what happened before returning to orbit.

**Architecture:** App.jsx gets a new `encounterOutcome` state variable. When a player confirms an encounter choice, the outcome is resolved, applied to game state, transformed for display, and shown in OutcomePanel. Player clicks "Continue" to return to orbit. A pure `transformOutcomeForDisplay()` function converts DangerManager's raw outcome shape to OutcomePanel's expected shape.

**Tech Stack:** React 18, Vitest, @testing-library/react

---

## Context

- **Branch:** `ovid/danger`
- **Design doc:** `docs/plans/2026-02-18-encounter-resolution-flow-design.md`
- **All 1319 tests currently pass.** Do not break them.
- **Key files:**
  - `src/App.jsx` — root orchestrator with encounter handling (lines 186-338)
  - `src/features/danger/OutcomePanel.jsx` — already built, expects specific data shape
  - `src/game/state/game-state-manager.js` — has `resolveEncounter()` method (uncommitted)
  - `tests/integration/encounter-resolution.integration.test.jsx` — existing test (untracked)
- **Test command:** `npm test`
- **Single file:** `npm test -- tests/unit/transform-outcome.test.js`
- **Important:** npm does NOT accept `--run`. Use `npm test`, not `npm test --run`.

---

### Task 1: Write transformOutcomeForDisplay unit tests

**Files:**
- Create: `tests/unit/transform-outcome.test.js`

This is a pure function test — no React rendering needed.

**Step 1: Write the test file**

```javascript
import { describe, it, expect } from 'vitest';
import { transformOutcomeForDisplay } from '../../src/features/danger/transformOutcome';

describe('transformOutcomeForDisplay', () => {
  it('should map success, encounterType, and choiceMade', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {},
      description: 'You escaped.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'flee');

    expect(result.success).toBe(true);
    expect(result.encounterType).toBe('pirate');
    expect(result.choiceMade).toBe('flee');
    expect(result.explanation).toBe('You escaped.');
  });

  it('should convert costs to negative resourceChanges', () => {
    const raw = {
      success: false,
      costs: { hull: 20, fuel: 15, credits: 500 },
      rewards: {},
      description: 'Took damage.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'fight');

    expect(result.resourceChanges.hull).toBe(-20);
    expect(result.resourceChanges.fuel).toBe(-15);
    expect(result.resourceChanges.credits).toBe(-500);
  });

  it('should convert credit rewards to positive resourceChanges', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { credits: 500 },
      description: 'Rewarded.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.resourceChanges.credits).toBe(500);
  });

  it('should combine credit costs and rewards', () => {
    const raw = {
      success: true,
      costs: { credits: 200 },
      rewards: { credits: 500 },
      description: 'Net gain.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    // -200 cost + 500 reward = net +300
    expect(result.resourceChanges.credits).toBe(300);
  });

  it('should extract karma into karmaChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { karma: 1 },
      description: 'Good deed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.karmaChanges).toEqual([{ amount: 1, reason: 'distress_call' }]);
  });

  it('should extract negative karma into karmaChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { karma: -3 },
      description: 'Bad deed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'loot');

    expect(result.karmaChanges).toEqual([{ amount: -3, reason: 'distress_call' }]);
  });

  it('should extract factionRep into reputationChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {
        factionRep: {
          civilians: 10,
          outlaws: -5,
        },
      },
      description: 'Helped.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.reputationChanges).toEqual([
      { faction: 'civilians', amount: 10, reason: 'distress_call' },
      { faction: 'outlaws', amount: -5, reason: 'distress_call' },
    ]);
  });

  it('should return empty arrays/objects when no karma or factionRep', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {},
      description: 'Nothing special.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'surrender');

    expect(result.karmaChanges).toEqual([]);
    expect(result.reputationChanges).toEqual([]);
    expect(result.modifiers).toEqual([]);
  });

  it('should handle cargoLoss cost', () => {
    const raw = {
      success: false,
      costs: { cargoLoss: true },
      rewards: {},
      description: 'Lost all cargo.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'fight');

    expect(result.resourceChanges.cargo).toBeDefined();
  });

  it('should handle cargoPercent cost', () => {
    const raw = {
      success: true,
      costs: { cargoPercent: 50 },
      rewards: {},
      description: 'Lost half cargo.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'flee');

    expect(result.resourceChanges.cargo).toBe(-50);
  });

  it('should handle days cost', () => {
    const raw = {
      success: true,
      costs: { days: 2 },
      rewards: {},
      description: 'Delayed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.resourceChanges.days).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/transform-outcome.test.js`
Expected: FAIL — module not found

---

### Task 2: Implement transformOutcomeForDisplay

**Files:**
- Create: `src/features/danger/transformOutcome.js`

**Step 1: Write the implementation**

```javascript
/**
 * Transform a raw DangerManager outcome into the shape OutcomePanel expects.
 *
 * DangerManager returns: { success, costs, rewards, description }
 * OutcomePanel expects: { success, encounterType, choiceMade, explanation,
 *   modifiers, consequences, karmaChanges, reputationChanges, resourceChanges }
 *
 * @param {Object} rawOutcome - Raw outcome from DangerManager resolution
 * @param {string} encounterType - Encounter type (pirate, inspection, etc.)
 * @param {string} choice - Player's choice string
 * @returns {Object} Transformed outcome for OutcomePanel
 */
export function transformOutcomeForDisplay(rawOutcome, encounterType, choice) {
  const resourceChanges = {};

  // Convert costs to negative resource changes
  const costs = rawOutcome.costs || {};
  if (costs.hull) resourceChanges.hull = -costs.hull;
  if (costs.engine) resourceChanges.engine = -costs.engine;
  if (costs.fuel) resourceChanges.fuel = -costs.fuel;
  if (costs.lifeSupport) resourceChanges.lifeSupport = -costs.lifeSupport;
  if (costs.days) resourceChanges.days = costs.days;

  // Cargo loss tracking
  if (costs.cargoLoss === true) {
    resourceChanges.cargo = -100;
  } else if (costs.cargoPercent) {
    resourceChanges.cargo = -costs.cargoPercent;
  }

  // Credit costs (negative)
  if (costs.credits) {
    resourceChanges.credits = (resourceChanges.credits || 0) - costs.credits;
  }

  // Credit rewards (positive)
  const rewards = rawOutcome.rewards || {};
  if (rewards.credits) {
    resourceChanges.credits = (resourceChanges.credits || 0) + rewards.credits;
  }

  // Extract karma changes
  const karmaChanges = [];
  if (rewards.karma) {
    karmaChanges.push({ amount: rewards.karma, reason: encounterType });
  }

  // Extract faction reputation changes
  const reputationChanges = [];
  if (rewards.factionRep) {
    Object.entries(rewards.factionRep).forEach(([faction, amount]) => {
      reputationChanges.push({ faction, amount, reason: encounterType });
    });
  }

  return {
    success: rawOutcome.success,
    encounterType,
    choiceMade: choice,
    explanation: rawOutcome.description,
    modifiers: [],
    consequences: {},
    karmaChanges,
    reputationChanges,
    resourceChanges,
  };
}
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- tests/unit/transform-outcome.test.js`
Expected: All PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All 1319+ tests pass

**Step 4: Commit**

```bash
git add src/features/danger/transformOutcome.js tests/unit/transform-outcome.test.js
git commit -m "feat: add transformOutcomeForDisplay for encounter resolution"
```

---

### Task 3: Wire OutcomePanel into App.jsx

**Files:**
- Modify: `src/App.jsx`

This task modifies `handleEncounterChoice` to show OutcomePanel instead of returning to orbit directly.

**Step 1: Add import for OutcomePanel and transformOutcomeForDisplay**

At `src/App.jsx:14` (after DistressCallPanel import), add:

```javascript
import { OutcomePanel } from './features/danger/OutcomePanel';
import { transformOutcomeForDisplay } from './features/danger/transformOutcome';
```

**Step 2: Remove unused notification imports**

Remove these lines (currently lines 15, 18):

```javascript
import { NotificationArea } from './components/NotificationArea';
import { useNotification } from './hooks/useNotification';
```

**Step 3: Add encounterOutcome state**

At `src/App.jsx:60` (after `currentEncounter` state), add:

```javascript
const [encounterOutcome, setEncounterOutcome] = useState(null);
```

**Step 4: Remove useNotification hook call**

Remove this line (currently line 52):

```javascript
const { showSuccess, showError, showInfo, notifications } = useNotification();
```

**Step 5: Rewrite handleEncounterChoice**

Replace the current `handleEncounterChoice` function (lines 186-207) with:

```javascript
  const handleEncounterChoice = (choice) => {
    if (currentEncounter && gameStateManager.resolveEncounter) {
      try {
        const outcome = gameStateManager.resolveEncounter(currentEncounter, choice);

        // Apply the resolution outcome to game state
        applyEncounterOutcome(outcome);

        // Transform for OutcomePanel display
        const displayOutcome = transformOutcomeForDisplay(
          outcome,
          currentEncounter.type,
          choice,
        );

        // Show OutcomePanel (stay in ENCOUNTER mode)
        setEncounterOutcome(displayOutcome);
      } catch (error) {
        console.error('Encounter resolution failed:', error);
        // On error, return to orbit
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setViewMode(VIEW_MODES.ORBIT);
      }
    }
  };
```

**Step 6: Add handleOutcomeContinue**

After `handleEncounterClose` (around line 211), add:

```javascript
  const handleOutcomeContinue = () => {
    setCurrentEncounter(null);
    setEncounterOutcome(null);
    setViewMode(VIEW_MODES.ORBIT);
  };
```

**Step 7: Remove showEncounterResult function**

Delete the `showEncounterResult` function (lines 332-338) — OutcomePanel replaces it.

**Step 8: Update ENCOUNTER render section**

Replace the encounter render block (lines 420-452) with:

```javascript
              {/* Encounter panels (rendered when an encounter is active) */}
              {viewMode === VIEW_MODES.ENCOUNTER && currentEncounter && !encounterOutcome && (
                <>
                  {currentEncounter.type === 'pirate' && (
                    <PirateEncounterPanel
                      encounter={currentEncounter.encounter}
                      onChoice={handleEncounterChoice}
                      onClose={handleEncounterClose}
                    />
                  )}
                  {currentEncounter.type === 'inspection' && (
                    <InspectionPanel
                      encounter={currentEncounter.encounter}
                      onChoice={handleEncounterChoice}
                      onClose={handleEncounterClose}
                    />
                  )}
                  {currentEncounter.type === 'mechanical_failure' && (
                    <MechanicalFailurePanel
                      encounter={currentEncounter.encounter}
                      onChoice={handleEncounterChoice}
                      onClose={handleEncounterClose}
                    />
                  )}
                  {currentEncounter.type === 'distress_call' && (
                    <DistressCallPanel
                      encounter={currentEncounter.encounter}
                      onChoice={handleEncounterChoice}
                      onClose={handleEncounterClose}
                    />
                  )}
                </>
              )}

              {/* Outcome panel (shown after encounter choice is resolved) */}
              {viewMode === VIEW_MODES.ENCOUNTER && encounterOutcome && (
                <OutcomePanel
                  outcome={encounterOutcome}
                  onContinue={handleOutcomeContinue}
                  onClose={handleOutcomeContinue}
                />
              )}
```

**Step 9: Remove NotificationArea from render**

Remove this block (around line 457):

```javascript
        {/* Notification area - always rendered for toast messages */}
        <NotificationArea notifications={notifications} />
```

**Step 10: Run full test suite**

Run: `npm test`
Expected: All tests pass (the existing integration test may need updates — see Task 4)

**Step 11: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire OutcomePanel into encounter resolution flow"
```

---

### Task 4: Update integration test

**Files:**
- Modify: `tests/integration/encounter-resolution.integration.test.jsx`

The test currently expects encounters to resolve and return to orbit immediately. Now there's an OutcomePanel step in between.

**Step 1: Rewrite the integration test**

Replace the full file content with:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import App from '../../src/App';

/**
 * Integration tests for encounter resolution flow
 *
 * Tests the complete flow:
 * 1. DevAdminPanel triggers encounter
 * 2. App displays encounter panel
 * 3. User makes choice
 * 4. OutcomePanel shows result
 * 5. User clicks Continue
 * 6. Returns to orbit
 *
 * Feature: danger-system
 */
describe('Encounter Resolution Integration', () => {
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

  /**
   * Helper: navigate past title screen to orbit mode
   * Returns true if successfully reached orbit, false if WebGL failed
   */
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

    if (screen.queryByText('Something went wrong')) {
      return false;
    }
    return true;
  }

  /**
   * Helper: open dev admin and trigger pirate encounter
   */
  async function triggerPirateEncounter() {
    const devAdminButton = screen.getByText('⚙');
    fireEvent.click(devAdminButton);

    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });

    const pirateButton = screen.getByText('🏴‍☠️ Pirate');
    fireEvent.click(pirateButton);

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  }

  it('should show OutcomePanel after resolving pirate encounter', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Select surrender (guaranteed success)
    const surrenderOption = screen.getByText('Surrender');
    fireEvent.click(surrenderOption);

    const confirmButton = screen.getByText('Confirm Surrender');
    fireEvent.click(confirmButton);

    // OutcomePanel should appear with result
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Should show Continue button
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should return to orbit after clicking Continue on OutcomePanel', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Surrender and resolve
    const surrenderOption = screen.getByText('Surrender');
    fireEvent.click(surrenderOption);
    fireEvent.click(screen.getByText('Confirm Surrender'));

    // Wait for OutcomePanel
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Click Continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // OutcomePanel should disappear
    await waitFor(() => {
      expect(screen.queryByText('Encounter Outcome')).not.toBeInTheDocument();
    });

    // Pirate encounter panel should also be gone
    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
  });

  it('should apply game state changes from encounter resolution', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    const initialCredits = gameStateManager.getState().player.credits;

    await triggerPirateEncounter();

    // Flee (costs fuel on success or hull on failure)
    const fleeOption = screen.getByText('Flee');
    fireEvent.click(fleeOption);
    fireEvent.click(screen.getByText('Confirm Flee'));

    // Wait for OutcomePanel
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Game state should have changed
    const state = gameStateManager.getState();
    const fuelChanged = state.ship.fuel !== 100;
    const hullChanged = state.ship.hull !== 100;

    // Flee either costs fuel (success) or hull (failure)
    expect(fuelChanged || hullChanged).toBe(true);
  });
});
```

**Step 2: Run the integration test**

Run: `npm test -- tests/integration/encounter-resolution.integration.test.jsx`
Expected: All PASS (may skip if WebGL unavailable in test env)

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/encounter-resolution.integration.test.jsx
git commit -m "test: update encounter resolution integration tests for OutcomePanel flow"
```

---

### Task 5: Final verification and cleanup commit

**Files:**
- Verify: all uncommitted changes from the session

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Check git status**

Run: `git status`
Check for any remaining uncommitted changes. The debug-log-removal changes in `useGameEvent.js`, `event-system.js`, `DevAdminPanel.jsx`, and the `game-state-manager.js` resolveEncounter methods should still be uncommitted from before.

**Step 4: Commit remaining changes**

```bash
git add src/hooks/useGameEvent.js src/game/state/managers/event-system.js src/features/dev-admin/DevAdminPanel.jsx src/game/state/game-state-manager.js
git commit -m "feat: complete encounter resolution with debug cleanup

Remove encounter debug logging from useGameEvent, EventSystemManager,
and DevAdminPanel. Add resolveEncounter/resolvePirateEncounter methods
to GameStateManager for routing encounter choices to DangerManager."
```

**Step 5: Verify clean working tree**

Run: `git status`
Expected: Only untracked `CLAUDE.md` and `docs/plans/*.md` remain (plus `.kiro/hooks` if modified)

**Step 6: Run tests one final time**

Run: `npm test`
Expected: All tests pass
