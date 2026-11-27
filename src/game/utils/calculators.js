import {
  COMMODITY_TYPES,
  THREAT_LEVEL_CONFIG,
  THREAT_ESCALATION,
  THREAT_ESCALATION_DEFAULT,
  NEGOTIATION_CONFIG,
  INSPECTION_SEVERITY_CONFIG,
} from '../constants.js';
import { EconomicEventsSystem } from '../game-events.js';
import { TradingSystem } from '../game-trading.js';

/**
 * Calculate prices for all commodities at a given system.
 * Pure function extracted from NavigationManager.dock() and updateLocation().
 *
 * @param {Object} system - Star system object with id, x, y, z properties
 * @param {number} currentDay - Current game day for temporal price modifiers
 * @param {Array} activeEvents - Active economic events affecting prices
 * @param {Object} marketConditions - Market condition modifiers per system
 * @returns {Object} Map of commodity type to integer price
 */
export function calculateSystemPrices(
  system,
  currentDay,
  activeEvents,
  marketConditions
) {
  const prices = {};
  for (const goodType of COMMODITY_TYPES) {
    prices[goodType] = TradingSystem.calculatePrice(
      goodType,
      system,
      currentDay,
      activeEvents,
      marketConditions
    );
  }
  return prices;
}

/**
 * Partition active missions into expired and remaining.
 * Pure function extracted from MissionManager.checkMissionDeadlines().
 *
 * @param {Array} activeMissions - Active mission objects
 * @param {number} currentDay - Current game day
 * @returns {{ expired: Array, remaining: Array }}
 */
export function partitionExpiredMissions(activeMissions, currentDay) {
  const expired = [];
  const remaining = [];

  for (const mission of activeMissions) {
    if (mission.deadlineDay !== undefined && currentDay > mission.deadlineDay) {
      expired.push(mission);
    } else {
      remaining.push(mission);
    }
  }

  return { expired, remaining };
}

/**
 * Calculate updated economic events based on current state.
 * Pure wrapper around EconomicEventsSystem.updateEvents().
 *
 * @param {Object} state - Game state with player.daysElapsed and world.activeEvents
 * @param {Array} starData - Star system data
 * @returns {Array} Updated active events array
 */
export function calculateUpdatedEvents(state, starData) {
  return EconomicEventsSystem.updateEvents(state, starData);
}

/**
 * Determine pirate threat level based on game state.
 * Pure function used by EncounterTriggerManager.
 *
 * @param {Object} gameState - Game state with ship.cargo, ship.hull, player.factions.outlaws
 * @returns {string} 'dangerous' | 'strong' | 'moderate' | 'weak'
 */
export function determineThreatLevel(gameState) {
  const cargoValue = gameState.ship.cargo.reduce(
    (total, item) => total + item.qty * item.buyPrice,
    0
  );
  const hullCondition = gameState.ship.hull;
  const outlawRep = gameState.player.factions.outlaws;

  if (cargoValue > THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS)
    return 'dangerous';
  if (cargoValue > THREAT_LEVEL_CONFIG.CARGO_VALUE_STRONG) return 'strong';
  if (hullCondition < THREAT_LEVEL_CONFIG.HULL_CRITICAL) return 'strong';
  if (hullCondition < THREAT_LEVEL_CONFIG.HULL_WARNING) return 'moderate';
  if (outlawRep > THREAT_LEVEL_CONFIG.OUTLAW_REP_STRONG) return 'strong';
  if (outlawRep < -THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK) return 'weak';
  return 'moderate';
}

/**
 * Returns a copy of a pirate encounter one threat tier stronger, carrying the
 * failed-negotiation strength modifier. The original is not modified.
 *
 * @param {Object} encounter - Pirate encounter with optional threatLevel
 * @returns {Object}
 */
export function escalateEncounter(encounter) {
  const current = encounter.threatLevel || THREAT_ESCALATION_DEFAULT;
  return {
    ...encounter,
    threatLevel:
      THREAT_ESCALATION[current] ??
      THREAT_ESCALATION[THREAT_ESCALATION_DEFAULT],
    strengthModifier:
      NEGOTIATION_CONFIG.OUTCOME_VALUES
        .COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE,
  };
}

/**
 * Determine inspection severity based on game state.
 * Pure function used by EncounterTriggerManager.
 *
 * @param {Object} gameState - Game state with ship.cargo, ship.hiddenCargo, player.factions.authorities
 * @returns {string} 'thorough' | 'routine'
 */
export function determineInspectionSeverity(gameState) {
  const hasRestrictedGoods = gameState.ship.cargo.length > 0;
  const hasHiddenCargo =
    gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
  const authorityRep = gameState.player.factions.authorities;

  if (hasRestrictedGoods && hasHiddenCargo) return 'thorough';
  if (authorityRep < INSPECTION_SEVERITY_CONFIG.AUTHORITY_REP_THOROUGH)
    return 'thorough';
  return 'routine';
}
