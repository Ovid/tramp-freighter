/**
 * Transform a raw DangerManager outcome into the shape OutcomePanel expects.
 *
 * DangerManager returns: { success, costs, rewards, description }
 * OutcomePanel expects: { success, encounterType, choiceMade, explanation,
 *   modifiers, consequences, karmaChanges, reputationChanges, resourceChanges }
 *
 * @param {Object} rawOutcome - Raw outcome from DangerManager resolution
 * @param {string} encounterType - Encounter type (pirate, inspection, etc.)
 * @param {string} choice - Player's choice string
 * @returns {Object} Transformed outcome for OutcomePanel
 */
export function transformOutcomeForDisplay(rawOutcome, encounterType, choice) {
  const resourceChanges = {};

  // Convert costs to negative resource changes
  const costs = rawOutcome.costs || {};
  if (costs.hull) resourceChanges.hull = -costs.hull;
  if (costs.engine) resourceChanges.engine = -costs.engine;
  if (costs.fuel) resourceChanges.fuel = -costs.fuel;
  if (costs.lifeSupport) resourceChanges.lifeSupport = -costs.lifeSupport;
  if (costs.days) resourceChanges.days = costs.days;

  // Cargo loss tracking
  if (costs.cargoLoss === true) {
    resourceChanges.cargo = -100;
  } else if (costs.cargoPercent) {
    resourceChanges.cargo = -costs.cargoPercent;
  }

  // Credit costs (negative)
  if (costs.credits) {
    resourceChanges.credits = (resourceChanges.credits || 0) - costs.credits;
  }

  // Credit rewards (positive)
  const rewards = rawOutcome.rewards || {};
  if (rewards.credits) {
    resourceChanges.credits = (resourceChanges.credits || 0) + rewards.credits;
  }

  // Extract karma changes
  const karmaChanges = [];
  if (rewards.karma) {
    karmaChanges.push({ amount: rewards.karma, reason: encounterType });
  }

  // Extract faction reputation changes
  const reputationChanges = [];
  if (rewards.factionRep) {
    Object.entries(rewards.factionRep).forEach(([faction, amount]) => {
      reputationChanges.push({ faction, amount, reason: encounterType });
    });
  }

  return {
    success: rawOutcome.success,
    encounterType,
    choiceMade: choice,
    explanation: rawOutcome.description,
    modifiers: [],
    consequences: {},
    karmaChanges,
    reputationChanges,
    resourceChanges,
  };
}
