# Miscellaneous Nits Design

Date: 2026-03-12

## 1. "Visited but never docked" visit tracking

### Problem

Two parallel visit tracking systems can get out of sync:

- `visitedSystems[]` updates on **jump** (used for stats)
- `priceKnowledge` updates on **dock** (used for Info Broker display)

If a player jumps to a system but doesn't dock, the Info Broker shows "Never
visited" — which is factually wrong.

### Design

**On jump** (in `NavigationManager.updateLocation()`):

- If the system has no `priceKnowledge` entry, create one with:
  - `lastVisit: 0`
  - `prices: null` (no price data)
  - `source: 'orbit'`
- If the system already has a `priceKnowledge` entry (from a prior dock or intel
  purchase), do not overwrite it.

**On dock** (existing behavior, unchanged):

- Update `priceKnowledge` with `lastVisit: 0`, current prices, `source: 'visited'`.
- This overwrites any prior `'orbit'` entry.

**Display changes** (`infoBrokerUtils.js` `formatVisitInfo()`):

- `source === 'orbit'` and no prices → "Visited but never docked"
- `source === 'visited'` → "Last visited X days ago" (existing)
- `source === 'intelligence_broker'` → existing behavior
- No entry at all → "Never visited" (existing)

**Intel cost**: Orbit-only entries use the "never visited" rate (100 credits)
since the player has no price data.

**Staleness**: Orbit-only entries age normally via
`incrementPriceKnowledgeStaleness()`. The "Visited but never docked" label
persists regardless of age — the key info is the dock status, not timing.

### Files to modify

- `src/game/state/managers/navigation.js` — create priceKnowledge entry on jump
- `src/features/info-broker/infoBrokerUtils.js` — add "Visited but never docked" format
- `src/game/game-information-broker.js` — ensure orbit-only entries use 100-credit cost
- Tests for the new behavior

---

## 2. Exotic matter in HUD — DROPPED

Superseded by item 4. The Tanaka quest mission entry in the active missions list
will show exotic matter collection progress ("Tanaka: Rare Materials — 2/5
samples"), making a separate HUD cargo line redundant.

---

## 3. Cole early repayment fee

### Problem

Players can borrow from Cole and immediately repay with zero consequences. The
heat gained from borrowing (+8) is wiped when debt reaches 0 (heat resets to 0).
This makes Cole's credit line a free, risk-free cash advance.

### Design

**New constant** in `COLE_DEBT_CONFIG`:

```javascript
EARLY_REPAYMENT_FEE_RATE: 0.10,    // 10% surcharge
EARLY_REPAYMENT_WINDOW: 20,        // days after borrowing
```

**Tracking**: Add `lastBorrowDay` to debt state, updated each time the player
borrows. This records the game day of the most recent borrow.

**In `makePayment()`**:

1. Check if `currentDay - lastBorrowDay < EARLY_REPAYMENT_WINDOW`
2. If within window, calculate fee: `ceil(paymentAmount * EARLY_REPAYMENT_FEE_RATE)`
3. Total deducted from credits: `paymentAmount + fee`
4. Debt reduced by: `paymentAmount` (fee goes to Cole, not toward debt)
5. Display fee in the payment UI so the player knows the cost

**UI changes**:

- Payment buttons in the Finance panel should show the fee when applicable, e.g.
  "Pay ₡500 (+₡50 fee)" during the early repayment window
- After 20 days, buttons show normal amounts with no fee

**Edge case**: If the player can't afford payment + fee, cap the payment so
total deduction doesn't exceed available credits.

### Files to modify

- `src/game/constants.js` — add early repayment constants
- `src/game/state/managers/debt.js` — track lastBorrowDay, apply fee in makePayment()
- `src/game/state/managers/initialization.js` — initialize lastBorrowDay in debt state
- `src/game/state/state-validators.js` — add lastBorrowDay to state validation/migration
- Finance panel UI component — show fee amounts on payment buttons
- Tests for fee calculation and window behavior

---

## 4. Tanaka quest in mission system

### Problem

The Tanaka quest and mission system are completely separate. Tanaka's quest
doesn't consume a mission slot, so players can run 3 full missions plus the
Tanaka quest simultaneously. The quest also has no presence in the missions UI.

### Design

**Slot consumption**:

- The Tanaka quest occupies 1 of the 3 mission slots
- Slot is consumed when the player **starts stage 1** (accepts the quest)
- Slot is freed when **stage 5 rewards are claimed** (quest complete)
- Mission board enforces reduced availability: if Tanaka quest is active, max
  regular missions = 2

**Implementation approach**:

Rather than literally inserting into `state.missions.active[]` (which would
require restructuring the quest data to match mission schema), add a check in
the mission acceptance logic:

```javascript
getEffectiveActiveMissionCount() {
  const regularMissions = state.missions.active.length;
  const tanakaActive = isTanakaQuestActive(); // stage 1-5, rewards not all claimed
  return regularMissions + (tanakaActive ? 1 : 0);
}
```

Mission board uses `getEffectiveActiveMissionCount()` instead of
`state.missions.active.length` when checking against `MAX_ACTIVE`.

**HUD display** (ActiveMissions component):

- Tanaka quest appears in the active missions list alongside regular missions
- Visually distinct: different color/border/label to indicate it's a quest
- Entry updates per stage:
  - Stage 1: "Tanaka: Field Test — 1/3 jumps"
  - Stage 2: "Tanaka: Rare Materials — 2/5 samples"
  - Stage 3: "Tanaka: The Prototype" (no counter, passive stage)
  - Stage 4: "Tanaka: Deliver Message"
  - Stage 5: "Tanaka: Final Preparations"
- Not abandonable (no abandon button)

**Stage progress data mapping**:

| Stage | Title | Progress format |
|-------|-------|----------------|
| 1 | Field Test | `{jumpsCompleted}/3 jumps` |
| 2 | Rare Materials | `{exoticMaterials}/5 samples` |
| 3 | The Prototype | No progress counter |
| 4 | Deliver Message | Destination shown, no counter |
| 5 | Final Preparations | Requirements checklist or no counter |

### Files to modify

- `src/game/state/managers/mission.js` — add effective count check, Tanaka-aware slot logic
- `src/game/state/managers/quest-manager.js` — expose helper for quest active status
- `src/features/hud/ActiveMissions.jsx` — render Tanaka quest entry with distinct styling
- `src/features/missions/MissionBoardPanel.jsx` — use effective count for slot display
- `src/game/constants.js` — stage title/progress format config if needed
- Tests for slot counting, mission board limits, and HUD display

---

## 5. Star finder dropdown in settings

### Problem

With 117 star systems, it's hard to locate a specific star on the 3D map. No
search or lookup mechanism exists.

### Design

**Location**: Added to the CameraControls settings panel (gear icon on starmap).

**Dropdown contents**:

- All 117 star systems
- Sorted by distance from Sol (nearest to farthest)
- Distance used for sort order only, not displayed
- Each entry shows: `[checkmark if visited] Star Name`
- Visited stars get a checkmark AND color coding (e.g., green text or
  background)
- Unvisited stars have no checkmark and default/dimmed color
- Visit status based on `visitedSystems[]` array (jumped to = visited)

**Accessibility**:

- Checkmark is the primary visited indicator (not color alone)
- Color coding supplements the checkmark for quick scanning
- Standard `<select>` or custom dropdown with ARIA attributes
- Keyboard navigable

**Behavior on selection**:

- Calls `selectStarById(systemId)` via StarmapContext
- Star highlights on the map with selection ring
- Camera moves to center on the selected star

**Styling**: Consistent with existing CameraControls panel elements.

### Files to modify

- `src/features/navigation/CameraControls.jsx` — add dropdown component
- `src/game/data/star-data.js` — may need distance-from-Sol pre-calculated or calculate on render
- `src/context/StarmapContext.jsx` — verify selectStarById is exposed
- CSS/styling for dropdown and visited/unvisited states
- Tests for sort order and selection behavior
