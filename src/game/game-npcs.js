/**
 * @fileoverview NPC Query Functions
 *
 * Provides functions for querying and displaying NPCs in the game.
 * These functions work with the static NPC data definitions and dynamic
 * NPC state managed by GameCoordinator.
 *
 * @module NPCQueries
 */

import { ALL_NPCS } from './data/npc-data.js';

// Validate NPC data import
if (!ALL_NPCS || !Array.isArray(ALL_NPCS)) {
  throw new Error('Invalid NPC data: ALL_NPCS must be a non-empty array');
}

/**
 * Get all NPCs located at a specific star system
 *
 * Filters the complete NPC list to return only NPCs stationed at the
 * specified system. Used by station menus to show available NPCs.
 *
 * @param {number} systemId - Star system ID to filter by
 * @param {Object} [narrativeFlags={}] - Narrative event flags for revealing hidden NPCs
 * @returns {Array} Array of NPC definition objects at the specified system
 */
export function getNPCsAtSystem(systemId, narrativeFlags = {}) {
  // Validate input
  if (typeof systemId !== 'number') {
    throw new Error('Invalid systemId: must be a number');
  }

  return ALL_NPCS.filter((npc) => {
    if (npc.system !== systemId) return false;
    if (!npc.hidden) return true;
    if (npc.revealFlag) {
      return !!narrativeFlags[npc.revealFlag];
    }
    return false;
  });
}
