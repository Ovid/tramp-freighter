import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Custom hook for triggering game actions through GameCoordinator.
 *
 * This hook provides a stable interface for components to trigger game actions
 * without directly accessing GameCoordinator methods. All actions delegate to
 * the corresponding GameCoordinator methods, which handle state updates and
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
  const game = useGame();

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
        return await game.navigationSystem.executeJump(
          game,
          targetSystemId,
          game.animationSystem
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
        return game.buyGood(goodType, quantity, price);
      },

      /**
       * Sell a good from a cargo stack
       * @param {number} stackIndex - Index of cargo stack
       * @param {number} quantity - Quantity to sell
       * @param {number} salePrice - Sale price per unit
       * @returns {Object} { success: boolean, reason: string, profitMargin: number }
       */
      sellGood: (stackIndex, quantity, salePrice) => {
        return game.sellGood(stackIndex, quantity, salePrice);
      },

      /**
       * Refuel the ship
       * @param {number} amount - Amount to refuel (percentage points)
       * @param {number} discount - NPC discount fraction (0-1)
       * @returns {Object} { success: boolean, reason: string }
       */
      refuel: (amount, discount) => {
        return game.refuel(amount, discount);
      },

      /**
       * Repair a ship system
       * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
       * @param {number} amount - Percentage points to restore
       * @param {number} discount - NPC discount fraction (0-1)
       * @returns {Object} { success: boolean, reason: string }
       */
      repair: (systemType, amount, discount) => {
        return game.repairShipSystem(systemType, amount, discount);
      },

      /**
       * Apply emergency patch to a critically damaged system
       * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
       * @returns {Object} { success: boolean, reason: string | null }
       */
      applyEmergencyPatch: (systemType) => {
        return game.applyEmergencyPatch(systemType);
      },

      /**
       * Cannibalize donor systems to repair a critically damaged target
       * @param {string} targetType - Target system type
       * @param {Array<{system: string, amount: number}>} donations - Donor allocations
       * @returns {Object} { success: boolean, reason: string | null }
       */
      cannibalizeSystem: (targetType, donations) => {
        return game.cannibalizeSystem(targetType, donations);
      },

      /**
       * Purchase an upgrade
       * @param {string} upgradeId - Upgrade identifier
       * @returns {Object} { success: boolean, reason: string }
       */
      purchaseUpgrade: (upgradeId) => {
        return game.purchaseUpgrade(upgradeId);
      },

      /**
       * Purchase market intelligence
       * @param {number} systemId - Target system ID
       * @param {number} discount - NPC discount fraction (0-1)
       * @returns {Object} { success: boolean, reason: string }
       */
      purchaseIntelligence: (systemId, discount) => {
        return game.purchaseIntelligence(systemId, discount);
      },

      /**
       * Dock at current system's station
       * @returns {Object} { success: boolean }
       */
      dock: () => {
        return game.dock();
      },

      /**
       * Undock from current system's station
       * @returns {Object} { success: boolean }
       */
      undock: () => {
        return game.undock();
      },

      /**
       * Save the game
       * @returns {boolean} Success status
       */
      saveGame: () => {
        return game.saveGame();
      },

      /**
       * Start a new game
       * @returns {Object} New game state
       */
      newGame: () => {
        return game.initNewGame();
      },

      /**
       * Update ship name
       * @param {string} newName - New ship name
       */
      updateShipName: (newName) => {
        game.updateShipName(newName);
      },

      /**
       * Move cargo to hidden compartment
       * @param {string} good - Commodity type
       * @param {number} qty - Quantity to move
       * @returns {Object} { success: boolean, reason: string }
       */
      moveToHiddenCargo: (good, qty) => {
        return game.moveToHiddenCargo(good, qty);
      },

      /**
       * Move cargo from hidden compartment to regular cargo
       * @param {string} good - Commodity type
       * @param {number} qty - Quantity to move
       * @returns {Object} { success: boolean, reason: string }
       */
      moveToRegularCargo: (good, qty) => {
        return game.moveToRegularCargo(good, qty);
      },

      /**
       * Check if NPC can provide free repair
       * @param {string} npcId - NPC identifier
       * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
       */
      canGetFreeRepair: (npcId) => {
        return game.canGetFreeRepair(npcId);
      },

      /**
       * Apply free repair from NPC
       * @param {string} npcId - NPC identifier
       * @param {number} hullDamagePercent - Hull damage percentage to repair
       * @returns {Object} { success: boolean, repairedPercent: number, message: string }
       */
      getFreeRepair: (npcId, hullDamagePercent) => {
        return game.getFreeRepair(npcId, hullDamagePercent);
      },

      /**
       * Update player credits
       * @param {number} newCredits - New credit amount
       */
      updateCredits: (newCredits) => {
        game.updateCredits(newCredits);
      },

      /**
       * Generate a market rumor
       * @returns {string} Generated rumor text
       */
      generateRumor: () => {
        return game.generateRumor();
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
        return game.validateRefuel(currentFuel, amount, credits, fuelPrice);
      },

      /**
       * Record visited prices for current system
       */
      recordVisitedPrices: () => {
        game.recordVisitedPrices();
      },

      /**
       * Get current system prices (locked to prevent arbitrage)
       * @returns {Object} Price data for current system
       */
      getCurrentSystemPrices: () => {
        return game.getCurrentSystemPrices();
      },

      getQuestStage: (questId) => game.getQuestStage(questId),
      advanceQuest: (questId) => game.advanceQuest(questId),
      isQuestComplete: (questId) => game.isQuestComplete(questId),
      getQuestState: (questId) => game.getQuestState(questId),
      canStartQuestStage: (questId, stage) =>
        game.canStartQuestStage(questId, stage),
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
