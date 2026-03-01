# Customs Confiscation & Mission Failure Notification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix customs inspections to actually remove restricted goods from cargo, and show a modal on station entry when missions have expired.

**Architecture:** Two independent fixes. (1) Add `removeRestrictedCargo()` to `DangerManager`, delegate from `GameStateManager`, call it in `applyEncounterOutcome` before `failMissionsDueToCargoLoss`. (2) Store expired mission notices in `state.missions.pendingFailureNotices`, add `dismissMissionFailureNotice()` to `MissionManager`, and show the first notice in a modal when `StationMenu` mounts.

**Tech Stack:** JavaScript ES Modules, Vitest for tests, React + hooks for UI.

---

## Task 1: `removeRestrictedCargo()` in DangerManager + delegation

**Files:**
- Modify: `src/game/state/managers/danger.js` (add method after `countRestrictedGoods` at line 298)
- Modify: `src/game/state/game-state-manager.js` (add delegation after `countRestrictedGoods` at line 981)
- Create: `tests/unit/customs-cargo-confiscation.test.js`

### Step 1: Write the failing test

```js
// tests/unit/customs-cargo-confiscation.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('removeRestrictedCargo', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
    // Default system is Sol (ID 0): 'safe' zone → restricts 'electronics'
    // Core system restrictions → restricts 'parts'
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes restricted goods from cargo at current system', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'electronics')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes core-system-restricted goods (parts) at Sol', () => {
    gsm.updateCargo([
      { good: 'parts', qty: 3, buyPrice: 150 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'parts')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes illegal mission cargo', () => {
    gsm.updateCargo([
      { good: 'unmarked_crates', qty: 2, buyPrice: 0, missionId: 'mission_1' },
      { good: 'food', qty: 5, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.missionId === 'mission_1')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(5);
  });

  it('keeps cargo when nothing is restricted', () => {
    gsm.updateCargo([
      { good: 'food', qty: 10, buyPrice: 20 },
      { good: 'water', qty: 8, buyPrice: 15 },
    ]);

    gsm.removeRestrictedCargo();

    expect(gsm.getState().ship.cargo).toHaveLength(2);
  });
});
```

### Step 2: Run test to verify it fails

```
npm test -- tests/unit/customs-cargo-confiscation.test.js
```
Expected: FAIL — `gsm.removeRestrictedCargo is not a function`

### Step 3: Implement `removeRestrictedCargo` in DangerManager

Add after the `countRestrictedGoods` method (line 298 in `src/game/state/managers/danger.js`):

```js
  /**
   * Remove all restricted goods from the ship's cargo at the current system.
   *
   * Uses the same classification logic as countRestrictedGoods, but filters
   * them out of cargo and calls updateCargo. Called after customs confiscation.
   */
  removeRestrictedCargo() {
    this.validateState();
    const state = this.getState();
    const systemId = state.player.currentSystem;
    const zone = this.getDangerZone(systemId);

    const zoneRestrictions =
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
    const coreRestrictions =
      systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID
        ? RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED
        : [];
    const allRestricted = [...zoneRestrictions, ...coreRestrictions];

    const newCargo = state.ship.cargo.filter((item) => {
      if (item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good))
        return false;
      return !allRestricted.includes(item.good);
    });

    this.gameStateManager.updateCargo(newCargo);
  }
```

Add delegation in `src/game/state/game-state-manager.js` after `countRestrictedGoods` (line 981):

```js
  removeRestrictedCargo() {
    return this.dangerManager.removeRestrictedCargo();
  }
```

### Step 4: Run test to verify it passes

```
npm test -- tests/unit/customs-cargo-confiscation.test.js
```
Expected: 4 tests PASS

### Step 5: Commit

```bash
git add tests/unit/customs-cargo-confiscation.test.js src/game/state/managers/danger.js src/game/state/game-state-manager.js
git commit -m "Add removeRestrictedCargo to DangerManager to confiscate goods on inspection"
```

---

## Task 2: Call `removeRestrictedCargo` in `applyEncounterOutcome`

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js`
- Modify: `tests/unit/customs-cargo-confiscation.test.js` (add tests)

### Step 1: Write the failing tests

Add a new `describe` block to `tests/unit/customs-cargo-confiscation.test.js`:

```js
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('applyEncounterOutcome: restrictedGoodsConfiscated', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('removes restricted goods when restrictedGoodsConfiscated is true', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    applyEncounterOutcome(gsm, {
      costs: { restrictedGoodsConfiscated: true },
    });

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'electronics')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('fails missions with illegal mission cargo when confiscated', () => {
    const mission = {
      id: 'test_illegal_mission',
      type: 'delivery',
      title: 'Cargo Run: Unmarked Crates to Tau Ceti',
      destination: { systemId: 4, name: 'Tau Ceti' },
      requirements: { destination: 4, deadline: 20 },
      rewards: { credits: 500 },
      penalties: {},
      missionCargo: { good: 'unmarked_crates', quantity: 2, isIllegal: true },
    };
    gsm.acceptMission(mission);

    applyEncounterOutcome(gsm, {
      costs: { restrictedGoodsConfiscated: true },
    });

    const state = gsm.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('test_illegal_mission');
  });

  it('does not remove cargo when restrictedGoodsConfiscated is false', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
    ]);

    applyEncounterOutcome(gsm, {
      costs: { credits: 100 },
    });

    expect(gsm.getState().ship.cargo).toHaveLength(1);
  });
});
```

### Step 2: Run test to verify it fails

```
npm test -- tests/unit/customs-cargo-confiscation.test.js
```
Expected: new tests FAIL — electronics still present after outcome

### Step 3: Implement the fix in `applyEncounterOutcome.js`

In `src/features/danger/applyEncounterOutcome.js`, find the `hiddenCargoConfiscated` block (around line 78) and add the `removeRestrictedCargo` call immediately after it, **before** the `failMissionsDueToCargoLoss` block:

```js
    if (outcome.costs.hiddenCargoConfiscated) {
      state.ship.hiddenCargo = [];
      gameStateManager.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, []);
    }

    // NEW: actually remove restricted goods from regular cargo
    if (outcome.costs.restrictedGoodsConfiscated) {
      gameStateManager.removeRestrictedCargo();
    }

    // Fail missions whose cargo was lost or confiscated
    if (
      outcome.costs.cargoLoss ||
      outcome.costs.cargoPercent ||
      outcome.costs.restrictedGoodsConfiscated ||
      outcome.costs.hiddenCargoConfiscated
    ) {
      if (typeof gameStateManager.failMissionsDueToCargoLoss === 'function') {
        gameStateManager.failMissionsDueToCargoLoss();
      }
    }
```

### Step 4: Run tests to verify they pass

```
npm test -- tests/unit/customs-cargo-confiscation.test.js
```
Expected: all tests PASS

### Step 5: Run full suite

```
npm test
```
Expected: all 2465+ tests passing

### Step 6: Commit

```bash
git add src/features/danger/applyEncounterOutcome.js tests/unit/customs-cargo-confiscation.test.js
git commit -m "Fix customs inspection to actually confiscate restricted goods from cargo"
```

---

## Task 3: Add `pendingFailureNotices` to mission state

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Modify: `tests/unit/mission-state-initialization.test.js` (add assertion)

### Step 1: Update the existing test to assert the new field

In `tests/unit/mission-state-initialization.test.js`, add:

```js
    expect(state.missions.pendingFailureNotices).toEqual([]);
```

### Step 2: Run test to verify it fails

```
npm test -- tests/unit/mission-state-initialization.test.js
```
Expected: FAIL — `pendingFailureNotices` is undefined

### Step 3: Add the field to `initializeMissionState()`

In `src/game/state/managers/initialization.js`, find `initializeMissionState()` (line 233) and add `pendingFailureNotices: []`:

```js
  initializeMissionState() {
    return {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
      completionHistory: [],
      pendingFailureNotices: [],
    };
  }
```

### Step 4: Run test to verify it passes

```
npm test -- tests/unit/mission-state-initialization.test.js
```
Expected: PASS

### Step 5: Commit

```bash
git add src/game/state/managers/initialization.js tests/unit/mission-state-initialization.test.js
git commit -m "Add pendingFailureNotices to mission state initialization"
```

---

## Task 4: `dismissMissionFailureNotice()` + delegation + hook exposure

**Files:**
- Modify: `src/game/state/managers/mission.js` (add method)
- Modify: `src/game/state/game-state-manager.js` (add delegation)
- Modify: `src/hooks/useGameAction.js` (expose in hook)
- Create: `tests/unit/mission-failure-notices.test.js`

### Step 1: Write the failing test

```js
// tests/unit/mission-failure-notices.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('dismissMissionFailureNotice', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGameStateManager();
    // Seed a notice directly
    gsm.getState().missions.pendingFailureNotices = [
      { id: 'mission_1', title: 'Cargo Run: Tau Ceti', destination: 'Tau Ceti' },
      { id: 'mission_2', title: 'Cargo Run: Procyon', destination: 'Procyon' },
    ];
  });

  it('removes the notice with the given id', () => {
    gsm.dismissMissionFailureNotice('mission_1');

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe('mission_2');
  });

  it('emits missionsChanged after dismissal', () => {
    let emitted = null;
    gsm.subscribe('missionsChanged', (data) => { emitted = data; });

    gsm.dismissMissionFailureNotice('mission_1');

    expect(emitted).not.toBeNull();
    expect(emitted.pendingFailureNotices).toHaveLength(1);
  });

  it('does nothing when id not found', () => {
    gsm.dismissMissionFailureNotice('nonexistent');

    expect(gsm.getState().missions.pendingFailureNotices).toHaveLength(2);
  });
});
```

### Step 2: Run test to verify it fails

```
npm test -- tests/unit/mission-failure-notices.test.js
```
Expected: FAIL — `gsm.dismissMissionFailureNotice is not a function`

### Step 3: Implement in MissionManager

Add at the end of `MissionManager` class in `src/game/state/managers/mission.js`, before the closing `}`:

```js
  dismissMissionFailureNotice(missionId) {
    this.validateState();
    const state = this.getState();
    if (!state.missions.pendingFailureNotices) return;
    state.missions.pendingFailureNotices =
      state.missions.pendingFailureNotices.filter((n) => n.id !== missionId);
    this.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...state.missions });
    this.gameStateManager.markDirty();
  }
```

Add delegation in `src/game/state/game-state-manager.js`, near the other mission methods:

```js
  dismissMissionFailureNotice(missionId) {
    return this.missionManager.dismissMissionFailureNotice(missionId);
  }
```

Add to `src/hooks/useGameAction.js`, after `updatePassengerSatisfaction`:

```js
      dismissMissionFailureNotice: (missionId) =>
        gameStateManager.dismissMissionFailureNotice(missionId),
```

### Step 4: Run tests to verify they pass

```
npm test -- tests/unit/mission-failure-notices.test.js
```
Expected: 3 tests PASS

### Step 5: Commit

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js src/hooks/useGameAction.js tests/unit/mission-failure-notices.test.js
git commit -m "Add dismissMissionFailureNotice to clear expired mission alerts"
```

---

## Task 5: Push failure notices in `checkMissionDeadlines()`

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `tests/unit/mission-failure-notices.test.js` (add tests)

### Step 1: Write the failing tests

Add a new `describe` block to `tests/unit/mission-failure-notices.test.js`:

```js
describe('checkMissionDeadlines: pendingFailureNotices', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGameStateManager();
  });

  it('pushes a notice when a mission expires', () => {
    const mission = {
      id: 'expired_mission',
      type: 'delivery',
      title: 'Cargo Run: Unmarked Crates to Tau Ceti',
      destination: { systemId: 4, name: 'Tau Ceti' },
      requirements: { destination: 4, deadline: 3 },
      rewards: { credits: 500 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(4);

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe('expired_mission');
    expect(notices[0].title).toBe('Cargo Run: Unmarked Crates to Tau Ceti');
    expect(notices[0].destination).toBe('Tau Ceti');
  });

  it('handles missions without destination gracefully', () => {
    const mission = {
      id: 'no_dest_mission',
      type: 'delivery',
      title: 'Intel Run',
      requirements: { destination: 4, deadline: 2 },
      rewards: { credits: 200 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(3);

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].destination).toBeNull();
  });

  it('handles saves without pendingFailureNotices (backwards compat)', () => {
    const state = gsm.getState();
    // Simulate old save: delete the field
    delete state.missions.pendingFailureNotices;

    const mission = {
      id: 'compat_mission',
      type: 'delivery',
      title: 'Compat Test',
      requirements: { destination: 4, deadline: 1 },
      rewards: { credits: 100 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(2);

    expect(gsm.getState().missions.pendingFailureNotices).toHaveLength(1);
  });
});
```

### Step 2: Run tests to verify they fail

```
npm test -- tests/unit/mission-failure-notices.test.js
```
Expected: new tests FAIL — `pendingFailureNotices` stays empty

### Step 3: Push notices in `checkMissionDeadlines()`

In `src/game/state/managers/mission.js`, inside `checkMissionDeadlines()`, after `state.missions.failed.push(mission.id)` in the `for (const mission of expired)` loop:

```js
    for (const mission of expired) {
      state.missions.failed.push(mission.id);

      // Queue a notice for display on next station dock
      if (!state.missions.pendingFailureNotices) {
        state.missions.pendingFailureNotices = [];
      }
      state.missions.pendingFailureNotices.push({
        id: mission.id,
        title: mission.title,
        destination: mission.destination ? mission.destination.name : null,
      });

      // Remove mission cargo from hold
      // ... (existing code continues unchanged)
```

### Step 4: Run tests to verify they pass

```
npm test -- tests/unit/mission-failure-notices.test.js
```
Expected: all tests PASS

### Step 5: Run full suite

```
npm test
```
Expected: all tests passing

### Step 6: Commit

```bash
git add src/game/state/managers/mission.js tests/unit/mission-failure-notices.test.js
git commit -m "Queue failure notices in checkMissionDeadlines for display on station dock"
```

---

## Task 6: Show failure notice modal in StationMenu

**Files:**
- Modify: `src/features/station/StationMenu.jsx`

No new unit test needed (React component modal integration is covered by the game state tests above).

### Step 1: Add the modal to StationMenu

In `src/features/station/StationMenu.jsx`:

1. Add imports at the top:
```js
import { useState } from 'react';
import { Modal } from '../../components/Modal.jsx';
import { useGameAction } from '../../hooks/useGameAction.js';
```

Note: `useGameAction` is already imported. Add `useState` and `Modal` only.

2. Inside the `StationMenu` component, subscribe to missions state and extract notices:
```js
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const { dismissMissionFailureNotice } = useGameAction();
  const pendingNotices = missions?.pendingFailureNotices ?? [];
  const currentNotice = pendingNotices[0] ?? null;
```

3. Add the modal JSX before the closing `return` tag of the component's returned JSX:
```jsx
      <Modal
        isOpen={currentNotice !== null}
        onClose={() => dismissMissionFailureNotice(currentNotice?.id)}
        title="Mission Failed"
        showCloseButton={true}
      >
        <p>
          {currentNotice?.title}
          {currentNotice?.destination
            ? ` — delivery to ${currentNotice.destination} was not completed in time.`
            : ' — the deadline has passed.'}
        </p>
        <p>The contact won&apos;t be working with you again.</p>
      </Modal>
```

### Step 2: Run full test suite

```
npm test
```
Expected: all tests passing, no new failures

### Step 3: Commit

```bash
git add src/features/station/StationMenu.jsx
git commit -m "Show mission failure modal on station dock when deadlines have passed"
```

---

## Final verification

```
npm test
```
Expected: all tests passing.
