# Information Broker - Connected Systems Filter Fix

## Problem

The Information Broker was showing intelligence purchase options for ALL systems in the sector, not just systems the player could jump to from their current location. This allowed players to purchase intelligence for systems they couldn't reach, which doesn't make sense from a gameplay perspective.

## Solution

Modified the `InformationBroker.listAvailableIntelligence()` method to filter systems based on wormhole connectivity:

1. **Updated `InformationBroker.listAvailableIntelligence()`**:
   - Added `currentSystemId` parameter
   - Added `navigationSystem` parameter
   - Uses `navigationSystem.getConnectedSystems()` to get only reachable systems
   - Filters star data to only include connected systems

2. **Updated `GameStateManager.listAvailableIntelligence()`**:
   - Passes current system ID from game state
   - Passes navigation system instance
   - Added `navigationSystem` property to GameStateManager constructor (optional parameter)

3. **Updated main game initialization** (starmap.js):
   - Already sets `gameStateManager.navigationSystem` after construction
   - No changes needed

4. **Updated tests**:
   - Modified property tests to create wormhole connections and navigation systems
   - Updated integration tests to set navigationSystem on GameStateManager
   - Added new unit test to verify filtering behavior

## Files Changed

- `js/game-information-broker.js` - Updated listAvailableIntelligence method signature
- `js/game-state.js` - Added navigationSystem parameter to constructor, updated wrapper method
- `tests/property/information-broker-system-listing.property.test.js` - Updated to use NavigationSystem
- `tests/integration/trade-panel-animation-hide.integration.test.js` - Set navigationSystem on GameStateManager
- `tests/unit/info-broker-connected-systems.test.js` - New test file

## Behavior

**Before**: Information Broker showed all 117 systems in the sector

**After**: Information Broker only shows systems connected to the current system via wormholes

This makes the Information Broker more strategic - players can only purchase intelligence for systems they can actually jump to, making the information immediately actionable.

## Testing

All 520 tests pass, including:
- 3 new unit tests for connected systems filtering
- Updated property tests for system listing
- Updated integration tests for panel animation

The fix maintains backward compatibility by making the navigationSystem parameter optional in the GameStateManager constructor.
