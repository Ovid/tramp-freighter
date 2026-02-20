import { CONDITION_TYPES } from './constants.js';

/**
 * Evaluate a trigger condition against game state.
 *
 * Uses enum+params pattern: each condition has a `type` string
 * and optional parameters. Returns true if the condition is met.
 *
 * @param {Object|Object[]|null} condition - { type, ...params }, array of conditions (AND), or null (always true)
 * @param {Object} gameState - Current game state
 * @param {Object} context - Trigger context (e.g., { system: 4 })
 * @returns {boolean} Whether the condition is met
 */
export function evaluateCondition(condition, gameState, context = {}) {
  if (!condition) return true;

  // Array of conditions: all must pass (AND logic)
  if (Array.isArray(condition)) {
    return condition.every((c) => evaluateCondition(c, gameState, context));
  }

  switch (condition.type) {
    case CONDITION_TYPES.FIRST_VISIT:
      return !gameState.world.visitedSystems.includes(context.system);

    case CONDITION_TYPES.FIRST_DOCK: {
      const dockedSystems = gameState.world.narrativeEvents.dockedSystems || [];
      return !dockedSystems.includes(context.system);
    }

    case CONDITION_TYPES.DEBT_ABOVE:
      return gameState.player.debt > condition.value;

    case CONDITION_TYPES.DEBT_BELOW:
      return gameState.player.debt < condition.value;

    case CONDITION_TYPES.KARMA_ABOVE:
      return gameState.player.karma > condition.value;

    case CONDITION_TYPES.KARMA_BELOW:
      return gameState.player.karma < condition.value;

    case CONDITION_TYPES.FUEL_BELOW:
      return gameState.ship.fuel < condition.value;

    case CONDITION_TYPES.HULL_BELOW:
      return gameState.ship.hull < condition.value;

    case CONDITION_TYPES.DAYS_PAST:
      return gameState.player.daysElapsed >= condition.value;

    case CONDITION_TYPES.HAS_VISITED:
      return gameState.world.visitedSystems.includes(condition.system);

    case CONDITION_TYPES.HAS_CARGO:
      return gameState.ship.cargo.some((item) => item.good === condition.good);

    case CONDITION_TYPES.FLAG_SET:
      return !!gameState.world.narrativeEvents.flags[condition.flag];

    case CONDITION_TYPES.HAS_PASSENGER:
      return gameState.missions.active.some((m) => m.type === 'passenger');

    case CONDITION_TYPES.HAS_WEALTHY_PASSENGER:
      return gameState.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger?.type === 'wealthy'
      );

    case CONDITION_TYPES.HAS_FAMILY_PASSENGER:
      return gameState.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger?.type === 'family'
      );

    default:
      return false;
  }
}
