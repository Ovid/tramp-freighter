/**
 * @fileoverview NPC Query Functions
 *
 * Provides functions for querying and displaying NPCs in the game.
 * These functions work with the static NPC data definitions and dynamic
 * NPC state managed by GameStateManager.
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
 * @returns {Array} Array of NPC definition objects at the specified system
 */
export function getNPCsAtSystem(systemId) {
  // Validate input
  if (typeof systemId !== 'number') {
    throw new Error('Invalid systemId: must be a number');
  }

  return ALL_NPCS.filter((npc) => npc.system === systemId);
}

/**
 * Render NPC list item for display in station menu
 *
 * Formats an NPC for display with name, role, and current reputation tier.
 * The NPC state contains the current reputation, which is used to determine
 * the relationship tier for display.
 *
 * @param {Object} npc - NPC definition object from npc-data.js
 * @param {Object} npcState - Current NPC state from GameStateManager
 * @param {function} getRepTier - Function to get reputation tier from reputation value
 * @returns {string} Formatted display string: "Name (Role) [Tier]"
 */
export function renderNPCListItem(npc, npcState, getRepTier) {
  // Validate inputs
  if (!npc || typeof npc !== 'object') {
    throw new Error('Invalid NPC: must be a non-null object');
  }
  if (!getRepTier || typeof getRepTier !== 'function') {
    throw new Error('Invalid getRepTier: must be a function');
  }
  if (!npc.name || !npc.role || typeof npc.initialRep !== 'number') {
    throw new Error(
      'Invalid NPC: missing required fields (name, role, initialRep)'
    );
  }

  // Use current reputation from state, or initial reputation if no state exists
  const currentRep = npcState ? npcState.rep : npc.initialRep;
  const tier = getRepTier(currentRep);

  return `${npc.name} (${npc.role}) [${tier.name}]`;
}
