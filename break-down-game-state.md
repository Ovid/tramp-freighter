# GameStateManager Refactoring Checklist

This document outlines the step-by-step refactoring of the monolithic `GameStateManager` (1864 lines) into focused, maintainable modules.

**STATUS: TASK 3.4 COMPLETE** - SaveLoadManager successfully extracted with comprehensive save/load functionality properly separated into focused methods.

**RECENT COMPLETION:**
- Created SaveLoadManager with focused methods for save/load operations:
  - `saveGame()` - Save with debouncing and error handling
  - `loadGame()` - Load with validation, migration, and recovery
  - `applyMigrations()` - Version migration handling
  - `emitLoadedStateEvents()` - UI synchronization after load
  - `handleLoadError()` - Error handling with NPC recovery
  - `attemptNPCRecovery()` - Recovery from corrupted NPC data
  - `hasSavedGame()` - Check for existing save
  - `clearSave()` - Clear save data
  - `getLastSaveTime()` / `setLastSaveTime()` - Debouncing support
- Updated GameStateManager to delegate to SaveLoadManager
- Added getter/setter properties for lastSaveTime to maintain test compatibility
- Removed save/load imports and methods from GameStateManager
- All tests pass (1011/1011) with no linting warnings

# Critical Components

- Code needing to access state should access the GameStateManager directly
  and use its delegation methods rather than calling `src/game/state/managers/*.js` classes
- All classes in `src/game/state/managers/*.js` should extend BaseManager
- After moving code to managers, the GameStateManager should be slimmed down to only include code that's not yet ported

## Current Issues (Still Need Fixing)

- **Event System**: ✅ COMPLETE - EventSystemManager extracted
- **State Updates**: ✅ COMPLETE - StateManager extracted with proper delegation
- **State Getters**: ✅ COMPLETE - StateManager extracted with proper delegation
- **Game Initialization**: `initNewGame()` is massive (100+ lines) and should be broken down
- **Save/Load Logic**: Still has save/load methods that should be in SaveLoadManager
- **Mixed Responsibilities**: Still contains business logic that belongs in domain managers

## Directory Structure

```
src/game/state/
├── game-state-manager.js          # Core coordinator (slimmed down)
├── save-load.js                   # Existing save/load utilities
├── state-validators.js            # Existing validation utilities
└── managers/                      # New subdirectory for focused managers
    ├── trading.js                 # Trading operations & market conditions
    ├── ship.js                    # Ship condition, quirks, upgrades, cargo
    ├── npc.js                     # NPC reputation, benefits, loans, storage
    ├── navigation.js              # Location, docking, fuel capacity
    ├── refuel.js                  # Refueling operations
    ├── repair.js                  # Ship repair operations
    ├── dialogue.js                # Dialogue state management
    ├── events.js                  # Economic events coordination
    └── info-broker.js             # Intelligence system
```

## Refactoring Tasks

### Phase 1: Setup and Foundation

#### Task 1.1: Create managers directory structure
- [x] Create `src/game/state/managers/` directory
- [x] Verify directory is recognized by build system
- [x] Update any relevant documentation

#### Task 1.2: Create base manager class (optional)
- [x] Consider creating `base-manager.js` with common patterns
- [x] Define standard constructor pattern for managers
- [x] Establish error handling conventions

### Phase 2: Extract Individual Managers (PARTIALLY COMPLETE)

#### Task 2.1: Extract Trading Manager
**File**: `src/game/state/managers/trading.js`

**Methods to move**:
- [x] `buyGood(goodType, quantity, price)`
- [x] `sellGood(stackIndex, quantity, salePrice)`
- [x] `getCurrentSystemPrices()`
- [x] `updateMarketConditions(systemId, goodType, quantityDelta)`
- [x] `applyMarketRecovery(daysPassed)`
- [x] `recordVisitedPrices()`
- [x] `updatePriceKnowledge(systemId, prices, lastVisit, source)`
- [x] `incrementPriceKnowledgeStaleness(days)`
- [x] `recalculatePricesForKnownSystems()`
- [x] `getPriceKnowledge()`
- [x] `getKnownPrices(systemId)`
- [x] `hasVisitedSystem(systemId)`

**Dependencies**:
- [x] Import `TradingSystem` from `../game-trading.js`
- [x] Import `COMMODITY_TYPES` from `../constants.js`
- [x] Access to state via constructor injection
- [x] Access to emit function for events

**Tests to update**:
- [x] Update trading-related tests to use new manager
- [x] Verify all trading operations still work

#### Task 2.2: Extract Ship Manager
**File**: `src/game/state/managers/ship.js`

**Methods to move**:
- [x] `assignShipQuirks(rng)`
- [x] `applyQuirkModifiers(baseValue, attribute, quirks)`
- [x] `getQuirkDefinition(quirkId)`
- [x] `getUpgradeDefinition(upgradeId)`
- [x] `updateShipName(newName)`
- [x] `sanitizeShipName(name)` (move to utils or keep here)
- [x] `updateShipCondition(hull, engine, lifeSupport)`
- [x] `getShipCondition()`
- [x] `checkConditionWarnings()`
- [x] `validateUpgradePurchase(upgradeId)`
- [x] `purchaseUpgrade(upgradeId)`
- [x] `calculateShipCapabilities()`
- [x] `getFuelCapacity()`
- [x] `moveToHiddenCargo(good, qty)`
- [x] `moveToRegularCargo(good, qty)`
- [x] `_addToCargoArray(cargoArray, sourceStack, qty)` (private helper)

**Dependencies**:
- [x] Import ship-related constants from `../constants.js`
- [x] Access to state and emit function

**Tests to update**:
- [x] Update ship condition tests
- [x] Update quirk system tests
- [x] Update upgrade system tests
- [x] Update hidden cargo tests

#### Task 2.3: Extract NPC Manager
**File**: `src/game/state/managers/npc.js`

**Methods to move**:
- [x] `_validateAndGetNPCData(npcId)` (private helper)
- [x] `getRepTier(rep)`
- [x] `getNPCState(npcId)`
- [x] `modifyRep(npcId, amount, reason)`
- [x] `canGetTip(npcId)`
- [x] `getTip(npcId)`
- [x] `getServiceDiscount(npcId, serviceType)`
- [x] `canRequestFavor(npcId, favorType)`
- [x] `requestLoan(npcId)`
- [x] `repayLoan(npcId)`
- [x] `checkLoanDefaults()`
- [x] `storeCargo(npcId)`
- [x] `retrieveCargo(npcId)`
- [x] `canGetFreeRepair(npcId, systemType)`
- [x] `getFreeRepair(npcId, systemType)`

**Dependencies**:
- [x] Import `ALL_NPCS` from `../data/npc-data.js`
- [x] Import reputation and NPC constants
- [x] Access to state and emit function

**Tests to update**:
- [x] Update NPC reputation tests
- [x] Update NPC benefits tests
- [x] Update loan system tests
- [x] Update cargo storage tests

#### Task 2.4: Extract Navigation Manager
**File**: `src/game/state/managers/navigation.js`

**Methods to move**:
- [x] `updateLocation(newSystemId)`
- [x] `dock()`
- [x] `undock()`
- [x] `isSystemVisited(systemId)`
- [x] `getCurrentSystem()`

**Dependencies**:
- [x] Access to starData
- [x] Import trading system for price calculations
- [x] Access to state and emit function

**Tests to update**:
- [x] Update navigation tests
- [x] Update docking tests

#### Task 2.5: Extract Refuel Manager
**File**: `src/game/state/managers/refuel.js`

**Methods to move**:
- [x] `getFuelPrice(systemId)`
- [x] `validateRefuel(currentFuel, amount, credits, pricePerPercent)`
- [x] `refuel(amount)`

**Dependencies**:
- [x] Import fuel pricing constants
- [x] Access to state and emit function

**Tests to update**:
- [x] Update refuel tests
- [x] Update fuel pricing tests

#### Task 2.6: Extract Repair Manager
**File**: `src/game/state/managers/repair.js`

**Methods to move**:
- [x] `getRepairCost(systemType, amount, currentCondition)`
- [x] `repairShipSystem(systemType, amount)`

**Dependencies**:
- [x] Import repair constants from `../constants.js`
- [x] Access to state and emit function
- [x] Integration with NPC manager for discounts

**Tests to update**:
- [x] Update repair system tests

#### Task 2.7: Extract Dialogue Manager
**File**: `src/game/state/managers/dialogue.js`

**Methods to move**:
- [x] `setDialogueState(npcId, nodeId)`
- [x] `getDialogueState()`
- [x] `clearDialogueState()`
- [x] `startDialogue(npcId, nodeId)`
- [x] `selectDialogueChoice(npcId, choiceIndex)`

**Dependencies**:
- [x] Dynamic import of dialogue system
- [x] Access to state and emit function

**Tests to update**:
- [x] Update dialogue tests

#### Task 2.8: Extract Events Manager
**File**: `src/game/state/managers/events.js`

**Methods to move**:
- [x] `getActiveEvents()`
- [x] `updateActiveEvents(newEvents)`
- [x] `getActiveEventForSystem(systemId)`
- [x] `getEventType(eventTypeKey)`
- [x] `updateTime(newDays)` (coordinate with other managers)

**Dependencies**:
- [x] Import `EconomicEventsSystem`
- [x] Import `InformationBroker` for cleanup
- [x] Access to state and emit function

**Tests to update**:
- [x] Update events system tests
- [x] Update time advancement tests

#### Task 2.9: Extract Information Broker Manager
**File**: `src/game/state/managers/info-broker.js`

**Methods to move**:
- [x] `getIntelligenceCost(systemId)`
- [x] `purchaseIntelligence(systemId)`
- [x] `generateRumor()`
- [x] `listAvailableIntelligence()`

**Dependencies**:
- [x] Import `InformationBroker` system
- [x] Access to state and emit function

**Tests to update**:
- [x] Update information broker tests

### Phase 3: Extract Remaining Core Systems

#### Task 3.1: Extract Event System Manager
**File**: `src/game/state/managers/event-system.js`

**Methods to move**:
- [x] `subscribe(eventType, callback)`
- [x] `unsubscribe(eventType, callback)`
- [x] `emit(eventType, data)`
- [x] Initialize `this.subscribers` object

**Dependencies**:
- [x] Move subscriber management logic
- [x] Maintain Bridge Pattern compatibility

**Tests to update**:
- [x] Update tests to use getter method for accessing subscribers
- [x] Verify all event system functionality still works

#### Task 3.2: Extract State Manager
**File**: `src/game/state/managers/state.js`

**Methods to move**:
- [x] `getState()`
- [x] `getPlayer()`
- [x] `getShip()`
- [x] `getCargoUsed()`
- [x] `getCargoRemaining()`
- [x] `updateCredits(newCredits)`
- [x] `updateDebt(newDebt)`
- [x] `updateFuel(newFuel)`
- [x] `updateCargo(newCargo)`
- [x] `setCredits(amount)`
- [x] `setDebt(amount)`
- [x] `setFuel(amount)`

**Dependencies**:
- [x] Core state access and mutation logic
- [x] Event emission for state changes

**Tests to update**:
- [x] All tests pass with new delegation pattern

#### Task 3.3: Extract Game Initialization Manager
**File**: `src/game/state/managers/initialization.js`

**Methods to move**:
- [x] `initNewGame()` (break into smaller methods)
- [x] `initializePlayerState()`
- [x] `initializeShipState()`
- [x] `initializeWorldState()`
- [x] `emitInitialEvents()`

**Dependencies**:
- [x] Access to all other managers for initialization
- [x] Constants and default values

#### Task 3.4: Extract Save/Load Manager
**File**: `src/game/state/managers/save-load.js`

**Methods to move**:
- [x] `saveGame()`
- [x] `loadGame(gameData)`
- [x] `hasSavedGame()`
- [x] `clearSave()`
- [x] Save debouncing logic

**Dependencies**:
- [x] Import save/load utilities
- [x] State validation and migration

### Phase 4: Update Core GameStateManager (READY TO START)

#### Task 4.1: Slim down GameStateManager
- [ ] Remove extracted methods from GameStateManager
- [ ] Add manager instances to constructor
- [ ] Create delegation methods that call manager methods
- [ ] Maintain existing public API for backward compatibility

#### Task 4.2: Update constructor and initialization
- [ ] Initialize all managers in constructor (including new ones)
- [ ] Pass required dependencies to each manager
- [ ] Ensure proper initialization order

#### Task 4.3: Update delegation methods
- [ ] Create simple delegation methods for each extracted method
- [ ] Ensure error handling is preserved
- [ ] Maintain event emission patterns

### Phase 5: Testing and Validation (NOT STARTED)

#### Task 5.1: Run full test suite
- [ ] Verify all existing tests pass
- [ ] Check for any broken imports
- [ ] Validate public API compatibility

#### Task 5.2: Integration testing
- [ ] Test manager interactions
- [ ] Verify state consistency across managers
- [ ] Test save/load with new structure

#### Task 5.3: Performance validation
- [ ] Ensure no performance regression
- [ ] Verify memory usage is similar
- [ ] Check initialization time

### Phase 6: Documentation and Cleanup (NOT STARTED)

#### Task 6.1: Update documentation
- [ ] Update AGENTS.md with new structure
- [ ] Update any architectural documentation
- [ ] Add JSDoc comments to manager classes

#### Task 6.2: Code cleanup
- [ ] Remove any unused imports
- [ ] Remove any methods moved to `src/game/state/managers`
- [ ] Remove any dead code in GameStateManager
- [ ] Standardize error messages
- [ ] Ensure consistent coding style

#### Task 6.3: Final validation
- [ ] Manual testing of all major features
- [ ] Verify save/load compatibility
- [ ] Test in development and production builds

## Success Criteria

- [ ] All existing tests pass
- [ ] Public API remains unchanged
- [ ] Each manager file is under 500 lines
- [ ] Core GameStateManager reduced to under 500 lines (currently 1176 lines, reduced from 1864 lines - 688 line reduction)
- [ ] No performance regression
- [ ] Save/load compatibility maintained
- [ ] AGENTS.md updated with new manager structure
- [ ] Single Responsibility Principle violations resolved

## Notes

- Each task should be completed and tested before moving to the next
- Maintain backward compatibility throughout the process
- Update tests incrementally as managers are extracted
- Keep the existing event system intact during refactoring