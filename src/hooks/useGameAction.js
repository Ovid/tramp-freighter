import { useMemo } from 'react';
import { useGameState } from '../context/GameContext.jsx';

/**
 * Custom hook for triggering game actions through GameStateManager.
 *
 * This hook provides a stable interface for components to trigger game actions
 * without directly accessing GameStateManager methods. All actions delegate to
 * the corresponding GameStateManager methods, which handle state updates and
 * event emissions.
 *
 * React Migration Spec: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 *
 * @returns {Object} Object containing action methods
 *
 * @example
 * function TradePanel() {
 *   const { buyGood, sellGood } = useGameAction();
 *
 *   const handleBuy = () => {
 *     buyGood('electronics', 10, 150);
 *   };
 *
 *   return <button onClick={handleBuy}>Buy Electronics</button>;
 * }
 */
export function useGameAction() {
  const gameStateManager = useGameState();

  // Use useMemo to ensure stable function references across re-renders
  // This prevents unnecessary re-renders of components that receive these functions as props
  const actions = useMemo(
    () => ({
      /**
       * Jump to a target system
       * @param {number} targetSystemId - Target system ID
       * @returns {Object} { success: boolean, reason: string }
       */
      jump: (targetSystemId) => {
        return gameStateManager.navigationSystem.jump(targetSystemId);
      },

      /**
       * Purchase a good
       * @param {string} goodType - Commodity type
       * @param {number} quantity - Quantity to purchase
       * @param {number} price - Price per unit
       * @returns {Object} { success: boolean, reason: string }
       */
      buyGood: (goodType, quantity, price) => {
        return gameStateManager.buyGood(goodType, quantity, price);
      },

      /**
       * Sell a good from a cargo stack
       * @param {number} stackIndex - Index of cargo stack
       * @param {number} quantity - Quantity to sell
       * @param {number} salePrice - Sale price per unit
       * @returns {Object} { success: boolean, reason: string, profitMargin: number }
       */
      sellGood: (stackIndex, quantity, salePrice) => {
        return gameStateManager.sellGood(stackIndex, quantity, salePrice);
      },

      /**
       * Refuel the ship
       * @param {number} amount - Amount to refuel (percentage points)
       * @returns {Object} { success: boolean, reason: string }
       */
      refuel: (amount) => {
        return gameStateManager.refuel(amount);
      },

      /**
       * Repair a ship system
       * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
       * @param {number} amount - Percentage points to restore
       * @returns {Object} { success: boolean, reason: string }
       */
      repair: (systemType, amount) => {
        return gameStateManager.repairShipSystem(systemType, amount);
      },

      /**
       * Purchase an upgrade
       * @param {string} upgradeId - Upgrade identifier
       * @returns {Object} { success: boolean, reason: string }
       */
      purchaseUpgrade: (upgradeId) => {
        return gameStateManager.purchaseUpgrade(upgradeId);
      },

      /**
       * Purchase market intelligence
       * @param {number} systemId - Target system ID
       * @returns {Object} { success: boolean, reason: string }
       */
      purchaseIntelligence: (systemId) => {
        return gameStateManager.purchaseIntelligence(systemId);
      },

      /**
       * Dock at current system's station
       * @returns {Object} { success: boolean }
       */
      dock: () => {
        return gameStateManager.dock();
      },

      /**
       * Undock from current system's station
       * @returns {Object} { success: boolean }
       */
      undock: () => {
        return gameStateManager.undock();
      },

      /**
       * Save the game
       * @returns {boolean} Success status
       */
      saveGame: () => {
        return gameStateManager.saveGame();
      },

      /**
       * Start a new game
       * @returns {Object} New game state
       */
      newGame: () => {
        return gameStateManager.initNewGame();
      },

      /**
       * Update ship name
       * @param {string} newName - New ship name
       */
      updateShipName: (newName) => {
        gameStateManager.updateShipName(newName);
      },

      /**
       * Move cargo to hidden compartment
       * @param {string} good - Commodity type
       * @param {number} qty - Quantity to move
       * @returns {Object} { success: boolean, reason: string }
       */
      moveToHiddenCargo: (good, qty) => {
        return gameStateManager.moveToHiddenCargo(good, qty);
      },

      /**
       * Move cargo from hidden compartment to regular cargo
       * @param {string} good - Commodity type
       * @param {number} qty - Quantity to move
       * @returns {Object} { success: boolean, reason: string }
       */
      moveToRegularCargo: (good, qty) => {
        return gameStateManager.moveToRegularCargo(good, qty);
      },
    }),
    [gameStateManager]
  );

  return actions;
}
