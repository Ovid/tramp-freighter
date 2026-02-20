# Illegal Cargo Rumors & Encounter Dismiss Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a rumors mechanic that visibly warns players and increases pirate encounter probability when carrying illegal mission cargo, and fix encounter panels being dismissible via the close button.

**Architecture:** Detection logic lives in DangerManager (follows existing `countRestrictedGoods` pattern). New constant `ILLEGAL_CARGO_PIRATE_MULTIPLIER` in `DANGER_CONFIG`. HUD shows warning on illegal mission cards. Jump arrival triggers a notification via a self-contained `RumorAlert` component. Encounter close buttons trigger `onChoice('flee')` instead of `onClose`.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern hooks

---

### Task 1: Add `hasIllegalMissionCargo` to DangerManager

**Files:**
- Modify: `src/game/state/managers/danger.js`
- Test: `tests/unit/illegal-cargo-rumors.test.js` (create)

**Step 1: Write the failing test**

Create `tests/unit/illegal-cargo-rumors.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Illegal Cargo Rumors - Detection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return false when cargo is empty', () => {
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return false when cargo has only legal goods', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'grain', qty: 5, buyPrice: 10 },
      { good: 'parts', qty: 3, buyPrice: 20 },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return false for legal mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'sealed_containers', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return true for illegal mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return true for prohibited_tech mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'prohibited_tech', qty: 3, buyPrice: 0, missionId: 'mission_2' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return true for black_market_goods mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'black_market_goods', qty: 2, buyPrice: 0, missionId: 'mission_3' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return false for illegal goods without a missionId', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, buyPrice: 10 },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/illegal-cargo-rumors.test.js`
Expected: FAIL — `manager.hasIllegalMissionCargo is not a function`

**Step 3: Write minimal implementation**

In `src/game/state/managers/danger.js`, add method after `countRestrictedGoods` (after line ~358):

```javascript
hasIllegalMissionCargo(cargo) {
  if (!cargo) {
    cargo = this.getState().ship.cargo;
  }
  return cargo.some(
    (item) => item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)
  );
}
```

Ensure `MISSION_CARGO_TYPES` is already imported at the top of danger.js (it is — used in `countRestrictedGoods`).

Then add GSM delegation in `src/game/state/game-state-manager.js`, near the other danger delegations (~line 658):

```javascript
hasIllegalMissionCargo() {
  return this.dangerManager.hasIllegalMissionCargo();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/illegal-cargo-rumors.test.js`
Expected: PASS (7 tests)

**Step 5: Commit**

```
git add tests/unit/illegal-cargo-rumors.test.js src/game/state/managers/danger.js src/game/state/game-state-manager.js
git commit -m "feat: add hasIllegalMissionCargo detection to DangerManager"
```

---

### Task 2: Add pirate probability multiplier for illegal cargo

**Files:**
- Modify: `src/game/constants.js` (~line 1009)
- Modify: `src/game/state/managers/danger.js` (`calculatePirateEncounterChance`)
- Test: `tests/unit/illegal-cargo-rumors.test.js` (append)

**Step 1: Write the failing test**

Append to `tests/unit/illegal-cargo-rumors.test.js`:

```javascript
describe('Illegal Cargo Rumors - Pirate Probability', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should increase pirate encounter chance when carrying illegal mission cargo', () => {
    const state = manager.getState();
    const gameState = {
      ship: { cargo: [], engine: 100, upgrades: [] },
      player: { factions: { outlaws: 0, authorities: 0 } },
    };
    const baseChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    gameState.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    const rumorChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    expect(rumorChance).toBeGreaterThan(baseChance);
  });

  it('should not increase pirate chance for legal mission cargo', () => {
    const state = manager.getState();
    const gameState = {
      ship: { cargo: [], engine: 100, upgrades: [] },
      player: { factions: { outlaws: 0, authorities: 0 } },
    };
    const baseChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    gameState.ship.cargo = [
      { good: 'sealed_containers', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    const legalChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    expect(legalChance).toBe(baseChance);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/illegal-cargo-rumors.test.js`
Expected: FAIL — `rumorChance` equals `baseChance`

**Step 3: Write minimal implementation**

In `src/game/constants.js`, add after `CARGO_VALUE_MODIFIERS` block (after line 1008):

```javascript
// Illegal mission cargo modifier for pirate encounter probability
ILLEGAL_CARGO_PIRATE_MULTIPLIER: 1.3, // 1.3x pirate chance when carrying illegal mission cargo
```

In `src/game/state/managers/danger.js`, inside `calculatePirateEncounterChance`, add after the authority reputation modifier block (before the clamp, ~line 245):

```javascript
// Apply illegal mission cargo modifier (rumors attract pirates)
if (this.hasIllegalMissionCargo(gameState.ship.cargo)) {
  probability *= ILLEGAL_CARGO_PIRATE_MULTIPLIER;
}
```

Add `ILLEGAL_CARGO_PIRATE_MULTIPLIER` to the destructured config at the top of the method. Find the destructure block (~line 192-209) and add inside the DANGER_CONFIG destructure:

```javascript
ILLEGAL_CARGO_PIRATE_MULTIPLIER,
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/illegal-cargo-rumors.test.js`
Expected: PASS (9 tests)

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/game/constants.js src/game/state/managers/danger.js tests/unit/illegal-cargo-rumors.test.js
git commit -m "feat: illegal mission cargo increases pirate encounter probability"
```

---

### Task 3: Add rumor warning to Active Missions panel

**Files:**
- Modify: `src/features/hud/ActiveMissions.jsx`
- Modify: `css/hud.css`
- Test: `tests/integration/active-missions-hud.integration.test.jsx` (append)

**Step 1: Write the failing test**

Append to `tests/integration/active-missions-hud.integration.test.jsx`. Note: the existing mock already returns cargo via `cargoChanged`. We need to update the mock data to include an illegal mission with matching cargo, and test that the warning appears.

Add a new mission to the existing mock's `active` array:

```javascript
{
  id: 'delivery_003',
  type: 'delivery',
  title: 'Cargo Run: Unmarked Crates to Tau Ceti',
  deadlineDay: 35,
  requirements: {
    destination: 7,
    deadline: 28,
  },
  destination: { systemId: 7, name: 'Tau Ceti' },
  missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
  rewards: { credits: 400 },
},
```

Add to the mock's `cargoChanged` return: `{ good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'delivery_003' }`

Then add the test:

```javascript
describe('ActiveMissions HUD - Rumor Warning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display rumor warning for missions with illegal cargo in hold', () => {
    const { container } = render(<ActiveMissions />);
    const warnings = container.querySelectorAll('.mission-hud-rumor');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].textContent).toContain('Rumors spreading');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/active-missions-hud.integration.test.jsx`
Expected: FAIL — no `.mission-hud-rumor` elements found

**Step 3: Write minimal implementation**

In `src/features/hud/ActiveMissions.jsx`, inside the mission map callback, after the destination div and before the cargo progress div, add:

```jsx
{mission.missionCargo?.isIllegal &&
  (cargo || []).some((c) => c.missionId === mission.id) && (
    <div className="mission-hud-rumor">
      ⚠ Rumors spreading
    </div>
  )}
```

In `css/hud.css`, after `.mission-hud-destination` rule:

```css
.mission-hud-rumor {
  color: var(--color-danger);
  font-size: var(--font-size-small);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/active-missions-hud.integration.test.jsx`
Expected: PASS (all tests including new one)

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/features/hud/ActiveMissions.jsx css/hud.css tests/integration/active-missions-hud.integration.test.jsx
git commit -m "feat: show rumor warning on illegal mission cards in active missions HUD"
```

---

### Task 4: Add rumor notification on jump arrival

**Files:**
- Create: `src/features/hud/RumorAlert.jsx`
- Modify: `src/App.jsx` (add RumorAlert to HUD area)
- Create: `tests/integration/rumor-alert.integration.test.jsx`

**Step 1: Write the failing test**

Create `tests/integration/rumor-alert.integration.test.jsx`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RumorAlert } from '../../src/features/hud/RumorAlert.jsx';

let mockGameEventValues = {};

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => mockGameEventValues[eventName] ?? null,
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    hasIllegalMissionCargo: vi.fn(() => true),
  }),
}));

describe('RumorAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameEventValues = {
      locationChanged: 4,
      cargoChanged: [
        { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'mission_1' },
      ],
    };
  });

  it('should display rumor alert when arriving with illegal cargo', () => {
    render(<RumorAlert />);
    expect(screen.getByText(/illicit cargo/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/rumor-alert.integration.test.jsx`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/features/hud/RumorAlert.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { MISSION_CARGO_TYPES } from '@game/constants.js';

function hasIllegalCargo(cargo) {
  return (cargo || []).some(
    (item) => item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)
  );
}

export function RumorAlert() {
  const location = useGameEvent('locationChanged');
  const cargo = useGameEvent('cargoChanged');
  const [visible, setVisible] = useState(false);
  const prevLocationRef = useRef(location);

  useEffect(() => {
    if (location !== null && location !== prevLocationRef.current) {
      prevLocationRef.current = location;
      if (hasIllegalCargo(cargo)) {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [location, cargo]);

  if (!visible) return null;

  return (
    <div className="rumor-alert">
      Word of your illicit cargo is spreading...
    </div>
  );
}
```

Add CSS to `css/hud.css`:

```css
.rumor-alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-danger);
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--border-danger);
  padding: 8px 16px;
  font-size: var(--font-size-small);
  font-family: var(--font-family-mono);
  z-index: var(--z-modal);
  pointer-events: none;
}
```

Add `<RumorAlert />` to `src/App.jsx` in the HUD area (near other HUD components that render during ORBIT/STATION modes). Import at top and add alongside `<ActiveMissions />`.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/rumor-alert.integration.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/features/hud/RumorAlert.jsx css/hud.css src/App.jsx tests/integration/rumor-alert.integration.test.jsx
git commit -m "feat: show rumor notification on jump arrival with illegal cargo"
```

---

### Task 5: Fix encounter panel dismiss bug — close button triggers flee

**Files:**
- Modify: `src/features/danger/PirateEncounterPanel.jsx` (line 89)
- Modify: `src/features/danger/InspectionPanel.jsx` (line 67)
- Modify: `src/features/danger/DistressCallPanel.jsx` (line 58)
- Modify: `src/features/danger/CombatPanel.jsx` (line 84)
- Modify: `src/features/danger/NegotiationPanel.jsx` (line 68)
- Create: `tests/unit/encounter-dismiss-flee.test.js`

**Step 1: Write the failing tests**

Create `tests/unit/encounter-dismiss-flee.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';
import { InspectionPanel } from '../../src/features/danger/InspectionPanel.jsx';
import { DistressCallPanel } from '../../src/features/danger/DistressCallPanel.jsx';
import { CombatPanel } from '../../src/features/danger/CombatPanel.jsx';
import { NegotiationPanel } from '../../src/features/danger/NegotiationPanel.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({}),
}));

describe('Encounter Panel Dismiss Triggers Flee', () => {
  let onChoice;
  let onClose;

  beforeEach(() => {
    onChoice = vi.fn();
    onClose = vi.fn();
    vi.clearAllMocks();
  });

  it('PirateEncounterPanel close button triggers flee', () => {
    const { container } = render(
      <PirateEncounterPanel
        encounter={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('InspectionPanel close button triggers flee', () => {
    const { container } = render(
      <InspectionPanel
        inspection={{ securityLevel: 'standard' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('DistressCallPanel close button triggers ignore', () => {
    const { container } = render(
      <DistressCallPanel
        distressCall={{ description: 'Help!', type: 'stranded' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('ignore');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('CombatPanel close button triggers flee', () => {
    const { container } = render(
      <CombatPanel
        combat={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('NegotiationPanel close button triggers flee', () => {
    const { container } = render(
      <NegotiationPanel
        encounter={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/encounter-dismiss-flee.test.js`
Expected: FAIL — `onClose` is called instead of `onChoice`

**Step 3: Write minimal implementation**

In each file, change the close button `onClick` from `onClose` to `() => onChoice('flee')` (or `'ignore'` for DistressCallPanel):

**`src/features/danger/PirateEncounterPanel.jsx` line 89:**
```jsx
<button className="close-btn" onClick={() => onChoice('flee')}>
```

**`src/features/danger/InspectionPanel.jsx` line 67:**
```jsx
<button className="close-btn" onClick={() => onChoice('flee')}>
```

**`src/features/danger/DistressCallPanel.jsx` line 58:**
```jsx
<button className="close-btn" onClick={() => onChoice('ignore')}>
```

**`src/features/danger/CombatPanel.jsx` line 84:**
```jsx
<button className="close-btn" onClick={() => onChoice('flee')}>
```

**`src/features/danger/NegotiationPanel.jsx` line 68:**
```jsx
<button className="close-btn" onClick={() => onChoice('flee')}>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/encounter-dismiss-flee.test.js`
Expected: PASS (5 tests)

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add src/features/danger/PirateEncounterPanel.jsx src/features/danger/InspectionPanel.jsx src/features/danger/DistressCallPanel.jsx src/features/danger/CombatPanel.jsx src/features/danger/NegotiationPanel.jsx tests/unit/encounter-dismiss-flee.test.js
git commit -m "fix: encounter close button triggers flee instead of dismissing"
```

---

### Task 6: Final verification and cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run clean`
Expected: No errors

**Step 3: Verify no regressions**

Run: `npm run all`
Expected: All clean
