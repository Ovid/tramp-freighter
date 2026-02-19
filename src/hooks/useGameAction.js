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
       * Execute jump to a target system with animation
       * @param {number} targetSystemId - Target system ID
       * @returns {Promise<Object>} { success: boolean, error: string|null }
       */
      executeJump: async (targetSystemId) => {
        return await gameStateManager.navigationSystem.executeJump(
          gameStateManager,
          targetSystemId,
          gameStateManager.animationSystem
        );
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
       * Apply emergency patch to a critically damaged system
       * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
       * @returns {Object} { success: boolean, reason: string | null }
       */
      applyEmergencyPatch: (systemType) => {
        return gameStateManager.applyEmergencyPatch(systemType);
      },

      /**
       * Cannibalize donor systems to repair a critically damaged target
       * @param {string} targetType - Target system type
       * @param {Array<{system: string, amount: number}>} donations - Donor allocations
       * @returns {Object} { success: boolean, reason: string | null }
       */
      cannibalizeSystem: (targetType, donations) => {
        return gameStateManager.cannibalizeSystem(targetType, donations);
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

      /**
       * Check if NPC can provide free repair
       * @param {string} npcId - NPC identifier
       * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
       */
      canGetFreeRepair: (npcId) => {
        return gameStateManager.canGetFreeRepair(npcId);
      },

      /**
       * Apply free repair from NPC
       * @param {string} npcId - NPC identifier
       * @param {number} hullDamagePercent - Hull damage percentage to repair
       * @returns {Object} { success: boolean, repairedPercent: number, message: string }
       */
      getFreeRepair: (npcId, hullDamagePercent) => {
        return gameStateManager.getFreeRepair(npcId, hullDamagePercent);
      },

      /**
       * Update player credits
       * @param {number} newCredits - New credit amount
       */
      updateCredits: (newCredits) => {
        gameStateManager.updateCredits(newCredits);
      },

      /**
       * Generate a market rumor
       * @returns {string} Generated rumor text
       */
      generateRumor: () => {
        return gameStateManager.generateRumor();
      },

      /**
       * Validate refuel transaction
       * @param {number} currentFuel - Current fuel percentage
       * @param {number} amount - Amount to refuel
       * @param {number} credits - Player credits
       * @param {number} fuelPrice - Price per fuel unit
       * @returns {Object} { valid: boolean, reason: string }
       */
      validateRefuel: (currentFuel, amount, credits, fuelPrice) => {
        return gameStateManager.validateRefuel(
          currentFuel,
          amount,
          credits,
          fuelPrice
        );
      },

      /**
       * Record visited prices for current system
       */
      recordVisitedPrices: () => {
        gameStateManager.recordVisitedPrices();
      },

      /**
       * Get current system prices (locked to prevent arbitrage)
       * @returns {Object} Price data for current system
       */
      getCurrentSystemPrices: () => {
        return gameStateManager.getCurrentSystemPrices();
      },

      acceptMission: (mission) => gameStateManager.acceptMission(mission),
      completeMission: (missionId) => gameStateManager.completeMission(missionId),
      abandonMission: (missionId) => gameStateManager.abandonMission(missionId),
      refreshMissionBoard: () => gameStateManager.refreshMissionBoard(),
      getActiveMissions: () => gameStateManager.getActiveMissions(),
      getCompletableMissions: () => gameStateManager.getCompletableMissions(),
    }),
    [gameStateManager]
  );

  return actions;
}
