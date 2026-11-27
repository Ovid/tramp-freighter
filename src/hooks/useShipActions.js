import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing ship-related game actions.
 *
 * @returns {Object} Ship action methods
 */
export function useShipActions() {
  const game = useGame();

  return useMemo(
    () => ({
      refuel: (amount, discount) => game.refuel(amount, discount),
      repair: (systemType, amount, discount) =>
        game.repairShipSystem(systemType, amount, discount),
      repairAll: (discount) => game.repairAll(discount),
      getRepairCost: (systemType, amount, currentCondition, discount) =>
        game.getRepairCost(systemType, amount, currentCondition, discount),
      getRepairAllCost: (discount) => game.getRepairAllCost(discount),
      canAffordStandardRepair: (systemType) =>
        game.canAffordStandardRepair(systemType),
      applyEmergencyPatch: (systemType) => game.applyEmergencyPatch(systemType),
      cannibalizeSystem: (targetType, donations) =>
        game.cannibalizeSystem(targetType, donations),
      purchaseUpgrade: (upgradeId) => game.purchaseUpgrade(upgradeId),
      updateShipName: (newName) => game.updateShipName(newName),
      moveToHiddenCargo: (index, qty) => game.moveToHiddenCargo(index, qty),
      moveToRegularCargo: (index, qty) => game.moveToRegularCargo(index, qty),
      validateRefuel: (currentFuel, amount, credits, fuelPrice) =>
        game.validateRefuel(currentFuel, amount, credits, fuelPrice),
      getFuelPrice: (systemId) => game.getFuelPrice(systemId),
    }),
    [game]
  );
}
