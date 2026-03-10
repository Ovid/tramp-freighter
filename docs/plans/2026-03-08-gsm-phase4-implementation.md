# Phase 4: Update React Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Swap the React integration layer from GameStateManager (thin wrapper) to GameCoordinator (the real implementation), so the React app no longer depends on the GSM wrapper.

**Architecture:** GameCoordinator already exposes the identical public API as GameStateManager (the wrapper binds all coordinator methods onto itself). This means the migration is mechanical: change what gets instantiated, what gets passed to context, and rename variables. No behavioral changes. The existing test suite is the safety net.

**Tech Stack:** React 18, Vite, vitest

**Key constraint:** Tests still instantiate GameStateManager directly (225 test files). Test migration is Phase 5 scope. To avoid breaking tests, GameProvider must accept both `game` and `gameStateManager` props during Phase 4, and `react-test-utils.jsx` keeps using the old prop name until Phase 5.

---

### Task 1: Add backward-compatible `game` prop to GameProvider

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Read the file**

Read `src/context/GameContext.jsx` to confirm current state.

**Step 2: Update GameProvider to accept both prop names**

Update `GameProvider` to accept either `game` or `gameStateManager` prop (preferring `game`). Add a `useGame()` export alongside the existing `useGameState()` — both return the same context value.

```jsx
import { createContext, useContext } from 'react';

const GameContext = createContext(null);

/**
 * Provider component that makes the game coordinator available to all child components.
 *
 * Accepts either `game` (preferred) or `gameStateManager` (backward compat for tests).
 *
 * @param {Object} props
 * @param {GameCoordinator} props.game - Game coordinator instance (preferred)
 * @param {GameStateManager} props.gameStateManager - Legacy prop (backward compat)
 * @param {React.ReactNode} props.children - Child components
 */
export function GameProvider({ game, gameStateManager, children }) {
  const instance = game || gameStateManager;

  if (!instance) {
    return (
      <div className="game-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={instance}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook to access the game coordinator from context.
 *
 * @returns {GameCoordinator} The game coordinator instance
 * @throws {Error} If used outside GameProvider
 */
export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }

  return context;
}

/**
 * @deprecated Use useGame() instead. Will be removed in Phase 5.
 */
export const useGameState = useGame;
```

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass (backward compat preserved via `useGameState` re-export and `gameStateManager` prop fallback).

**Step 4: Commit**

```
git add src/context/GameContext.jsx
git commit -m "Add useGame() hook and game prop to GameProvider for Phase 4 migration"
```

---

### Task 2: Update main.jsx to instantiate GameCoordinator directly

**Files:**
- Modify: `src/main.jsx`

**Step 1: Read the file**

Read `src/main.jsx` to confirm current state.

**Step 2: Update imports and instantiation**

Replace GameStateManager with GameCoordinator. The coordinator has the same constructor signature `(starData, wormholeData, navigationSystem)` and same methods (`loadGame`, `initNewGame`, `flushSave`).

Changes:
1. Import `GameCoordinator` from `./game/state/game-coordinator` instead of `GameStateManager` from `./game/state/game-state-manager`
2. Rename function from `initializeGameStateManager` to `initializeGame`
3. Use `new GameCoordinator(...)` instead of `new GameStateManager(...)`
4. Rename local variable from `gameStateManager` to `game`
5. Pass `game={game}` prop to `GameProvider` instead of `gameStateManager={gameStateManager}`

```jsx
// 1. External libraries
import React from 'react';
import ReactDOM from 'react-dom/client';

// 2. Internal modules (game logic, state management)
import { GameCoordinator } from './game/state/game-coordinator';
import { NavigationSystem } from './game/game-navigation';

// 3. Components
import App from './App';
import { GameProvider } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';

// 4. Data/constants
import { STAR_DATA } from './game/data/star-data';
import { WORMHOLE_DATA } from './game/data/wormhole-data';
import { initDevMode } from './game/constants';
import { devLog } from './game/utils/dev-logger';

// 5. Styles (CSS imports)
// ... (unchanged)

/**
 * Initialize game coordinator with either saved game or new game.
 *
 * @returns {GameCoordinator} Initialized game coordinator
 * @throws {Error} If initialization fails
 */
function initializeGame() {
  const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);

  const game = new GameCoordinator(
    STAR_DATA,
    WORMHOLE_DATA,
    navigationSystem
  );

  const loaded = game.loadGame();

  if (loaded) {
    devLog('Game loaded from save');
  } else {
    game.initNewGame();
    devLog('New game initialized');
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      game.flushSave();
    });
  }

  return game;
}

// ... renderErrorUI unchanged ...

async function initializeApp() {
  const isDevMode = await initDevMode();

  let game;
  try {
    game = initializeGame();
  } catch (error) {
    renderErrorUI(error);
    throw error;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GameProvider game={game}>
        <NotificationProvider>
          <App devMode={isDevMode} />
        </NotificationProvider>
      </GameProvider>
    </React.StrictMode>
  );
}

initializeApp();
```

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass. Tests don't import main.jsx, so this change is isolated.

**Step 4: Manual smoke test**

Run: `npm run dev`
Open browser, verify game loads and basic interactions work (navigate starmap, open station, trade).

**Step 5: Commit**

```
git add src/main.jsx
git commit -m "Switch main.jsx from GameStateManager to GameCoordinator"
```

---

### Task 3: Migrate core hooks to useGame()

**Files:**
- Modify: `src/hooks/useGameEvent.js`
- Modify: `src/hooks/useGameAction.js`

**Step 1: Read both files**

Read `src/hooks/useGameEvent.js` and `src/hooks/useGameAction.js`.

**Step 2: Update useGameEvent.js**

Change import from `useGameState` to `useGame`. Rename local variable from `gameStateManager` to `game`. The methods called (`getState`, `subscribe`, `unsubscribe`) are unchanged on the coordinator.

```js
import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { EVENT_NAMES } from '../game/constants.js';

export function useGameEvent(eventName) {
  const game = useGame();

  const [state, setState] = useState(() => {
    const currentState = game.getState();
    return extractStateForEvent(eventName, currentState);
  });

  const callback = useCallback((data) => {
    setState(data);
  }, []);

  useEffect(() => {
    game.subscribe(eventName, callback);
    return () => {
      game.unsubscribe(eventName, callback);
    };
  }, [game, eventName, callback]);

  return state;
}

// extractStateForEvent function unchanged
```

**Step 3: Update useGameAction.js**

Change import from `useGameState` to `useGame`. Rename local variable from `gameStateManager` to `game`. Update all method references from `gameStateManager.X` to `game.X`.

```js
import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

export function useGameAction() {
  const game = useGame();

  const actions = useMemo(
    () => ({
      executeJump: async (targetSystemId) => {
        return await game.navigationSystem.executeJump(
          game,
          targetSystemId,
          game.animationSystem
        );
      },
      buyGood: (goodType, quantity, price) => {
        return game.buyGood(goodType, quantity, price);
      },
      sellGood: (stackIndex, quantity, salePrice) => {
        return game.sellGood(stackIndex, quantity, salePrice);
      },
      // ... all other methods follow same pattern: gameStateManager → game
      refuel: (amount, discount) => game.refuel(amount, discount),
      repair: (systemType, amount, discount) => game.repairShipSystem(systemType, amount, discount),
      applyEmergencyPatch: (systemType) => game.applyEmergencyPatch(systemType),
      cannibalizeSystem: (targetType, donations) => game.cannibalizeSystem(targetType, donations),
      purchaseUpgrade: (upgradeId) => game.purchaseUpgrade(upgradeId),
      purchaseIntelligence: (systemId, discount) => game.purchaseIntelligence(systemId, discount),
      dock: () => game.dock(),
      undock: () => game.undock(),
      saveGame: () => game.saveGame(),
      newGame: () => game.initNewGame(),
      updateShipName: (newName) => game.updateShipName(newName),
      moveToHiddenCargo: (good, qty) => game.moveToHiddenCargo(good, qty),
      moveToRegularCargo: (good, qty) => game.moveToRegularCargo(good, qty),
      canGetFreeRepair: (npcId) => game.canGetFreeRepair(npcId),
      getFreeRepair: (npcId, hullDamagePercent) => game.getFreeRepair(npcId, hullDamagePercent),
      updateCredits: (newCredits) => game.updateCredits(newCredits),
      generateRumor: () => game.generateRumor(),
      validateRefuel: (currentFuel, amount, credits, fuelPrice) =>
        game.validateRefuel(currentFuel, amount, credits, fuelPrice),
      recordVisitedPrices: () => game.recordVisitedPrices(),
      getCurrentSystemPrices: () => game.getCurrentSystemPrices(),
      getQuestStage: (questId) => game.getQuestStage(questId),
      advanceQuest: (questId) => game.advanceQuest(questId),
      isQuestComplete: (questId) => game.isQuestComplete(questId),
      getQuestState: (questId) => game.getQuestState(questId),
      canStartQuestStage: (questId, stage) => game.canStartQuestStage(questId, stage),
      checkQuestObjectives: (questId) => game.checkQuestObjectives(questId),
      getNarrativeFlags: () => game.getNarrativeFlags(),
      getEpilogueData: () => game.getEpilogueData(),
      getEpilogueStats: () => game.getEpilogueStats(),
      getDebtInfo: () => game.getDebtInfo(),
      borrowFromCole: (amount) => game.borrowFromCole(amount),
      makeDebtPayment: (amount) => game.makeDebtPayment(amount),
      acceptMission: (mission) => game.acceptMission(mission),
      completeMission: (missionId) => game.completeMission(missionId),
      abandonMission: (missionId) => game.abandonMission(missionId),
      refreshMissionBoard: () => game.refreshMissionBoard(),
      getActiveMissions: () => game.getActiveMissions(),
      getCompletableMissions: () => game.getCompletableMissions(),
      updatePassengerSatisfaction: (missionId, event) =>
        game.updatePassengerSatisfaction(missionId, event),
      dismissMissionFailureNotice: (missionId) =>
        game.dismissMissionFailureNotice(missionId),
      calculateTradeWithholding: (amount) =>
        game.calculateTradeWithholding(amount),
      getFuelPrice: (systemId) => game.getFuelPrice(systemId),
      getServiceDiscount: (npcId, serviceType) =>
        game.getServiceDiscount(npcId, serviceType),
    }),
    [game]
  );

  return actions;
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. Tests that use `useGameAction` and `useGameEvent` via `createWrapper(gameStateManager)` still work because `GameProvider` falls back to the `gameStateManager` prop.

**Step 5: Commit**

```
git add src/hooks/useGameEvent.js src/hooks/useGameAction.js
git commit -m "Migrate useGameEvent and useGameAction to useGame() hook"
```

---

### Task 4: Migrate domain-specific hooks

**Files:**
- Modify: `src/hooks/useDialogue.js`
- Modify: `src/hooks/useDangerZone.js`
- Modify: `src/hooks/useEncounterProbabilities.js`
- Modify: `src/hooks/useAnimationLock.js`
- Modify: `src/hooks/useEventTriggers.js`
- Modify: `src/hooks/useJumpValidation.js`
- Modify: `src/hooks/useStarData.js`

**Step 1: Read all 7 hook files**

Read each file to confirm current state.

**Step 2: Apply the same pattern to each hook**

For each file:
1. Change import: `import { useGameState } from '../context/GameContext.jsx'` → `import { useGame } from '../context/GameContext.jsx'`
2. Rename variable: `const gameStateManager = useGameState()` → `const game = useGame()`
3. Update all references: `gameStateManager.X` → `game.X`

The hooks access these coordinator properties/methods (all present on coordinator):
- `useDialogue.js`: `startDialogue`, `selectDialogueChoice`, `clearDialogueState`
- `useDangerZone.js`: `dangerManager.getDangerZone(systemId)`
- `useEncounterProbabilities.js`: `dangerManager.calculatePirateEncounterChance`, `dangerManager.calculateInspectionChance`
- `useAnimationLock.js`: `animationSystem`
- `useEventTriggers.js`: `calculatePirateEncounterChance`, `calculateInspectionChance`, `checkMechanicalFailure`, `checkDistressCall`, `getState`, `emit`, `subscribe`, `unsubscribe`, `checkEvents`, `getEventById`, `starData`
- `useJumpValidation.js`: `calculateShipCapabilities`, `navigationSystem.validateJump`, `applyQuirkModifiers`
- `useStarData.js`: `starData`

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Commit**

```
git add src/hooks/useDialogue.js src/hooks/useDangerZone.js src/hooks/useEncounterProbabilities.js src/hooks/useAnimationLock.js src/hooks/useEventTriggers.js src/hooks/useJumpValidation.js src/hooks/useStarData.js
git commit -m "Migrate 7 domain-specific hooks to useGame()"
```

---

### Task 5: Migrate components — App.jsx and navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/features/navigation/StarMapCanvas.jsx`
- Modify: `src/features/navigation/CameraControls.jsx`
- Modify: `src/features/navigation/SystemPanel.jsx`

**Step 1: Read each file**

Read the relevant sections of each file.

**Step 2: Apply the same rename pattern**

For each file:
1. Change import: `useGameState` → `useGame`
2. Rename variable: `const gameStateManager = useGameState()` → `const game = useGame()`
3. Update all `gameStateManager.` references to `game.`

**App.jsx specifics** (heaviest usage — ~30 references):
- `game.getNarrativeFlags()`, `game.initNewGame()`, `game.loadGame()`
- `game.getNPCState(...)`, `game.markDirty()`, `game.updateShipName(...)`
- `game.dock()`, `game.undock()`, `game.saveGame()`
- `game.resolveCombatChoice(...)`, `game.resolveEncounter(...)`, `game.resolveNegotiation(...)`
- `game.subscribe(...)`, `game.unsubscribe(...)`
- `game.markVictory()`, `game.setNarrativeFlag(...)`, `game.devTeleport(...)`

**StarMapCanvas.jsx specifics:**
- `game.setAnimationSystem(animationSystem)`
- Passes `game` to Three.js engine functions (currently passes `gameStateManager`)

**SystemPanel.jsx specifics:**
- `game.calculateShipCapabilities()`
- `game.navigationSystem.getConnectedSystems(...)`
- `game.navigationSystem.calculateDistanceBetween(...)`
- `game.navigationSystem.calculateFuelCostWithCondition(...)`
- `game.applyQuirkModifiers.bind(game)` — note: bind target must also be renamed
- `game.getActiveEventForSystem(...)`, `game.getEventType(...)`

**CameraControls.jsx specifics:**
- `game.setPreference(...)`

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Commit**

```
git add src/App.jsx src/features/navigation/StarMapCanvas.jsx src/features/navigation/CameraControls.jsx src/features/navigation/SystemPanel.jsx
git commit -m "Migrate App.jsx and navigation components to useGame()"
```

---

### Task 6: Migrate remaining feature components

**Files:**
- Modify: `src/features/station/StationMenu.jsx`
- Modify: `src/features/danger/InspectionPanel.jsx`
- Modify: `src/features/danger/applyEncounterOutcome.js`
- Modify: `src/features/narrative/NarrativeEventPanel.jsx`
- Modify: `src/features/dev-admin/DevAdminPanel.jsx`
- Modify: `src/features/achievements/AchievementsList.jsx`
- Modify: `src/features/achievements/AchievementToast.jsx`
- Modify: `src/features/achievements/StatsSection.jsx`
- Modify: `src/features/ship-status/ShipStatusPanel.jsx`
- Modify: `src/features/missions/MissionBoardPanel.jsx`
- Modify: `src/features/info-broker/InfoBrokerPanel.jsx`
- Modify: `src/features/endgame/PavonisRun.jsx`
- Modify: `src/features/endgame/EndCredits.jsx`
- Modify: `src/features/endgame/PostCreditsStation.jsx`
- Modify: `src/features/title-screen/TitleScreen.jsx`

**Step 1: Read each file**

Read relevant sections of each file.

**Step 2: Apply the same rename pattern**

For each file:
1. Change import: `useGameState` → `useGame`
2. Rename variable: `const gameStateManager = useGameState()` → `const game = useGame()`
3. Update all `gameStateManager.` references to `game.`

**applyEncounterOutcome.js** is special — it's not a component, it's a utility function that receives `gameStateManager` as a parameter. The parameter name should be renamed to `game` in the function signature and all internal references:
```js
// Before:
export function applyEncounterOutcome(gameStateManager, outcome) {
  const state = gameStateManager.getState();
  // ...
}
// After:
export function applyEncounterOutcome(game, outcome) {
  const state = game.getState();
  // ...
}
```
All callers of this function (App.jsx, which was already updated in Task 5) must pass the renamed variable.

**DevAdminPanel.jsx** has the most references (~60 calls to `gameStateManager.X`). All follow the same mechanical rename.

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Commit**

```
git add src/features/station/StationMenu.jsx src/features/danger/InspectionPanel.jsx src/features/danger/applyEncounterOutcome.js src/features/narrative/NarrativeEventPanel.jsx src/features/dev-admin/DevAdminPanel.jsx src/features/achievements/AchievementsList.jsx src/features/achievements/AchievementToast.jsx src/features/achievements/StatsSection.jsx src/features/ship-status/ShipStatusPanel.jsx src/features/missions/MissionBoardPanel.jsx src/features/info-broker/InfoBrokerPanel.jsx src/features/endgame/PavonisRun.jsx src/features/endgame/EndCredits.jsx src/features/endgame/PostCreditsStation.jsx src/features/title-screen/TitleScreen.jsx
git commit -m "Migrate remaining feature components to useGame()"
```

---

### Task 7: Verify no remaining useGameState() calls in production code

**Files:**
- Search: `src/` directory

**Step 1: Search for remaining useGameState references in production code**

Run: `grep -r "useGameState" src/`
Expected: Only `src/context/GameContext.jsx` should reference `useGameState` (the deprecated re-export). No other file in `src/` should import or call `useGameState()`.

If any files still reference it, update them.

**Step 2: Search for remaining `gameStateManager` variable names in production code**

Run: `grep -r "gameStateManager" src/`
Expected: No results. All production code should use `game` variable name.

If any files still reference it, update them.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 4: Run lint and format**

Run: `npm run clean`
Expected: No lint errors, all files formatted.

**Step 5: Commit if any stragglers were found**

```
git add -A
git commit -m "Clean up remaining gameStateManager references in production code"
```

---

### Task 8: Update design doc

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`

**Step 1: Mark Phase 4 as complete in the design doc**

Update the implementation status table:
```
| Phase 4 | `2026-03-08-gsm-phase4-implementation.md` | Complete |
```

**Step 2: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 4 complete in design doc"
```

---

## Summary of changes

| Area | Files | Nature of change |
|---|---|---|
| Context | `GameContext.jsx` | Add `useGame()` export, `game` prop |
| Entry point | `main.jsx` | Instantiate GameCoordinator directly |
| Core hooks | `useGameEvent.js`, `useGameAction.js` | `useGameState()` → `useGame()`, rename variable |
| Domain hooks | 7 hook files | Same rename pattern |
| Components | ~15 component/utility files | Same rename pattern |
| Design doc | 1 file | Status update |

**What does NOT change in Phase 4:**
- `game-state-manager.js` — stays for test backward compat (removed in Phase 5)
- `tests/test-utils.js` — keeps `createTestGameStateManager()` (Phase 5)
- `tests/react-test-utils.jsx` — keeps `gameStateManager` prop (Phase 5, works via fallback)
- 225 test files — keep using GSM (Phase 5)
- `game-coordinator.js` — no changes needed
- Manager files — no changes needed

**Estimated total: ~350 lines changed across ~25 files. Zero behavioral changes.**
