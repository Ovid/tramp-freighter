import {
  INSPECTION_CONFIG,
  RESTRICTED_GOODS_CONFIG,
  MISSION_CARGO_TYPES,
} from '../../game/constants.js';

/**
 * Check if a good is restricted in a specific zone.
 *
 * Matches the backend logic in DangerManager.countRestrictedGoods() by also
 * checking whether the cargo item is illegal mission cargo (has a missionId
 * and the good type is in MISSION_CARGO_TYPES.illegal).
 *
 * @param {string} goodType - Commodity type
 * @param {string} dangerZone - Danger zone classification
 * @param {number} systemId - System ID
 * @param {Object} [cargoItem] - Full cargo item (optional, for mission cargo check)
 * @returns {boolean} Whether the good is restricted
 */
export function isGoodRestrictedInZone(goodType, dangerZone, systemId, cargoItem) {
  // Check zone-based restrictions
  const zoneRestricted =
    RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[dangerZone]?.includes(goodType) ||
    false;

  // Check core system restrictions
  const coreSystemRestricted =
    (systemId === 0 || systemId === 1) &&
    RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);

  // Check illegal mission cargo
  const illegalMissionCargo = Boolean(
    cargoItem?.missionId &&
    MISSION_CARGO_TYPES.illegal.includes(goodType)
  );

  return zoneRestricted || coreSystemRestricted || illegalMissionCargo;
}

/**
 * Determine danger zone for a system (simplified version for UI).
 * This should match the logic in DangerManager.getDangerZone().
 *
 * @param {number} systemId - System ID
 * @returns {string} Danger zone classification
 */
export function getDangerZoneForSystem(systemId) {
  // Safe systems
  if ([0, 1, 4].includes(systemId)) {
    return 'safe';
  }

  // Contested systems
  if ([7, 10].includes(systemId)) {
    return 'contested';
  }

  // For now, assume other systems are dangerous
  return 'dangerous';
}

/**
 * Calculate inspection analysis including restricted goods and discovery chances.
 *
 * @param {Object} inspection - The inspection encounter
 * @param {Array} cargo - Current regular cargo
 * @param {Array} hiddenCargo - Current hidden cargo
 * @param {number} currentSystem - Current system ID
 * @param {number} credits - Current credits
 * @returns {Object} Analysis of the inspection situation
 */
export function calculateInspectionAnalysis(
  inspection,
  cargo = [],
  _hiddenCargo = [],
  currentSystem = 0,
  credits = 0
) {
  // Determine danger zone for the current system
  const dangerZone = getDangerZoneForSystem(currentSystem);

  // Find restricted items in regular cargo, passing the full cargo item
  // so illegal mission cargo is detected
  const restrictedItems = cargo
    .filter((item) =>
      isGoodRestrictedInZone(item.good, dangerZone, currentSystem, item)
    )
    .map((item) => item.good);

  // Calculate security level and hidden cargo discovery chance
  let securityMultiplier;
  if (currentSystem === 0 || currentSystem === 1) {
    // Core systems (Sol, Alpha Centauri)
    securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
  } else {
    // Use zone-based multiplier
    securityMultiplier =
      INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[dangerZone];
  }

  const hiddenCargoDiscoveryChance =
    INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

  return {
    restrictedItems,
    hiddenCargoDiscoveryChance,
    securityLevel: securityMultiplier,
    dangerZone,
    canAffordBribe: credits >= INSPECTION_CONFIG.BRIBE.COST,
  };
}
