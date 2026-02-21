/**
 * @fileoverview Faction Reputation and Karma Dialogue Conditions
 *
 * Helper functions for dialogue conditions that check faction reputation and karma.
 * These functions can be used in dialogue choice conditions to unlock/lock options
 * based on the player's standing with different factions and moral alignment.
 *
 * @module dialogue/faction-karma-conditions
 */

import { FACTION_CONFIG } from '../../constants.js';

/**
 * Check if player has minimum faction reputation
 *
 * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
 * @param {number} minRep - Minimum reputation required
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player meets minimum faction reputation
 */
export function hasFactionRep(faction, minRep, gameStateManager) {
  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    console.warn(`Invalid faction in dialogue condition: ${faction}`);
    return false;
  }

  try {
    const factionRep = gameStateManager.getFactionRep(faction);
    return factionRep >= minRep;
  } catch (error) {
    console.warn(
      `Error checking faction reputation in dialogue: ${error.message}`
    );
    return false;
  }
}

/**
 * Check if player has minimum karma level
 *
 * @param {number} minKarma - Minimum karma required
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player meets minimum karma level
 */
function hasKarma(minKarma, gameStateManager) {
  try {
    const karma = gameStateManager.getKarma();
    return karma >= minKarma;
  } catch (error) {
    console.warn(`Error checking karma in dialogue: ${error.message}`);
    return false;
  }
}

/**
 * Check if player has maximum karma level (for negative karma checks)
 *
 * @param {number} maxKarma - Maximum karma allowed
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player is at or below maximum karma level
 */
function hasMaxKarma(maxKarma, gameStateManager) {
  try {
    const karma = gameStateManager.getKarma();
    return karma <= maxKarma;
  } catch (error) {
    console.warn(`Error checking karma in dialogue: ${error.message}`);
    return false;
  }
}

/**
 * Check if player is trusted by authorities (high authority reputation)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has high authority reputation (>=50)
 */
export function isTrustedByAuthorities(gameStateManager) {
  return hasFactionRep('authorities', 50, gameStateManager);
}

/**
 * Check if player is known to outlaws (high outlaw reputation)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has high outlaw reputation (>=50)
 */
export function isKnownToOutlaws(gameStateManager) {
  return hasFactionRep('outlaws', 50, gameStateManager);
}

/**
 * Check if player is a friend to civilians (high civilian reputation)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has high civilian reputation (>=50)
 */
export function isFriendToCivilians(gameStateManager) {
  return hasFactionRep('civilians', 50, gameStateManager);
}

/**
 * Check if player has good karma (positive moral alignment)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has good karma (>=25)
 */
export function hasGoodKarma(gameStateManager) {
  return hasKarma(25, gameStateManager);
}

/**
 * Check if player has bad karma (negative moral alignment)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has bad karma (<=-25)
 */
export function hasBadKarma(gameStateManager) {
  return hasMaxKarma(-25, gameStateManager);
}

/**
 * Check if player is wanted by authorities (low authority reputation)
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has low authority reputation (<=-25)
 */
export function isWantedByAuthorities(gameStateManager) {
  try {
    const authorityRep = gameStateManager.getFactionRep('authorities');
    return authorityRep <= -25;
  } catch (error) {
    console.warn(
      `Error checking authority reputation in dialogue: ${error.message}`
    );
    return false;
  }
}

/**
 * Check if player has mixed reputation (high with one faction, low with opposing faction)
 *
 * @param {string} highFaction - Faction that should have high reputation
 * @param {string} lowFaction - Faction that should have low reputation
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {boolean} True if player has high rep with one faction and low with the other
 */
export function hasMixedReputation(highFaction, lowFaction, gameStateManager) {
  try {
    const highRep = gameStateManager.getFactionRep(highFaction);
    const lowRep = gameStateManager.getFactionRep(lowFaction);
    return highRep >= 25 && lowRep <= -25;
  } catch (error) {
    console.warn(
      `Error checking mixed reputation in dialogue: ${error.message}`
    );
    return false;
  }
}

/**
 * Karma-based first impression modifier for NPC text
 *
 * Returns a modifier string that can be appended to NPC greeting text
 * to reflect the NPC's first impression based on the player's karma.
 *
 * @param {number} karma - Player's current karma
 * @param {string} npcPersonality - NPC personality type ('lawful', 'neutral', 'chaotic')
 * @returns {string} Text modifier to append to greeting
 */
export function getKarmaFirstImpression(karma, npcPersonality = 'neutral') {
  if (karma >= 50) {
    // Very good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' You have an honest look about you.';
      case 'chaotic':
        return ' You seem... too clean for these parts.';
      default:
        return ' You have a trustworthy air about you.';
    }
  } else if (karma >= 25) {
    // Good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' You seem like a decent sort.';
      case 'chaotic':
        return ' You look like you follow the rules.';
      default:
        return ' You seem reliable.';
    }
  } else if (karma <= -50) {
    // Very bad karma
    switch (npcPersonality) {
      case 'lawful':
        return ' I can see trouble in your eyes.';
      case 'chaotic':
        return " Now here's someone who knows how the sector really works.";
      default:
        return ' You have a dangerous look about you.';
    }
  } else if (karma <= -25) {
    // Bad karma
    switch (npcPersonality) {
      case 'lawful':
        return ' You look like someone I should be careful around.';
      case 'chaotic':
        return ' You look like you know how to bend the rules.';
      default:
        return " You seem like you've seen some rough times.";
    }
  }

  // Neutral karma - no modifier
  return '';
}

/**
 * Faction reputation-based attitude modifier for NPC text
 *
 * Returns a modifier string that can be appended to NPC text to reflect
 * their attitude based on the player's faction standing.
 *
 * @param {string} npcFaction - The faction this NPC belongs to or sympathizes with
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {string} Text modifier to append to dialogue
 */
export function getFactionAttitudeModifier(npcFaction, gameStateManager) {
  try {
    const factionRep = gameStateManager.getFactionRep(npcFaction);

    if (factionRep >= 75) {
      return " You're a true friend to our cause.";
    } else if (factionRep >= 50) {
      return ' We appreciate your support.';
    } else if (factionRep <= -75) {
      return " Your reputation precedes you, and it's not good.";
    } else if (factionRep <= -50) {
      return ' We have... concerns about your activities.';
    }

    return '';
  } catch (error) {
    console.warn(`Error getting faction attitude modifier: ${error.message}`);
    return '';
  }
}
