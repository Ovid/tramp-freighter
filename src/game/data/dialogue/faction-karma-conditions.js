/**
 * @fileoverview Faction Reputation and Karma Dialogue Conditions
 *
 * Helper functions for dialogue conditions that check faction reputation and karma.
 * These functions can be used in dialogue choice conditions to unlock/lock options
 * based on the player's standing with different factions and moral alignment.
 *
 * All functions that need game state accept a context object with:
 * - karma {number} - Player's current karma value
 * - factionReps {object} - Faction reputation values keyed by faction name
 *   (authorities, traders, outlaws, civilians)
 *
 * @module dialogue/faction-karma-conditions
 */

import { FACTION_CONFIG, KARMA_CONFIG } from '../../constants.js';

/**
 * Check if player has minimum faction reputation
 *
 * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
 * @param {number} minRep - Minimum reputation required
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @param {object} context.factionReps - Faction reputation values keyed by faction name
 * @returns {boolean} True if player meets minimum faction reputation
 */
export function hasFactionRep(faction, minRep, context) {
  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    console.warn(`Invalid faction in dialogue condition: ${faction}`);
    return false;
  }

  const factionRep = context.factionReps[faction] || 0;
  return factionRep >= minRep;
}

/**
 * Check if player has minimum karma level
 *
 * @param {number} minKarma - Minimum karma required
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @returns {boolean} True if player meets minimum karma level
 */
export function hasKarma(minKarma, context) {
  return context.karma >= minKarma;
}

/**
 * Check if player has maximum karma level (for negative karma checks)
 *
 * @param {number} maxKarma - Maximum karma allowed
 * @param {object} context - Context object with karma and factionReps
 * @param {number} context.karma - Player's current karma
 * @returns {boolean} True if player is at or below maximum karma level
 */
export function hasMaxKarma(maxKarma, context) {
  return context.karma <= maxKarma;
}

/**
 * Check if player is trusted by authorities (high authority reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high authority reputation (>=50)
 */
export function isTrustedByAuthorities(context) {
  return hasFactionRep(
    'authorities',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player is known to outlaws (high outlaw reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high outlaw reputation (>=50)
 */
export function isKnownToOutlaws(context) {
  return hasFactionRep(
    'outlaws',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player is a friend to civilians (high civilian reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high civilian reputation (>=50)
 */
export function isFriendToCivilians(context) {
  return hasFactionRep(
    'civilians',
    FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH,
    context
  );
}

/**
 * Check if player has good karma (positive moral alignment)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has good karma (>=25)
 */
export function hasGoodKarma(context) {
  return hasKarma(KARMA_CONFIG.THRESHOLDS.GOOD, context);
}

/**
 * Check if player has bad karma (negative moral alignment)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has bad karma (<=-25)
 */
export function hasBadKarma(context) {
  return hasMaxKarma(KARMA_CONFIG.THRESHOLDS.BAD, context);
}

/**
 * Check if player is wanted by authorities (low authority reputation)
 *
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has low authority reputation (<=-25)
 */
export function isWantedByAuthorities(context) {
  const authorityRep = context.factionReps.authorities || 0;
  return authorityRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.LOW;
}

/**
 * Check if player has mixed reputation (high with one faction, low with opposing faction)
 *
 * @param {string} highFaction - Faction that should have high reputation
 * @param {string} lowFaction - Faction that should have low reputation
 * @param {object} context - Context object with karma and factionReps
 * @returns {boolean} True if player has high rep with one faction and low with the other
 */
export function hasMixedReputation(highFaction, lowFaction, context) {
  const highRep = context.factionReps[highFaction] || 0;
  const lowRep = context.factionReps[lowFaction] || 0;
  return (
    highRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.MODERATE &&
    lowRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.LOW
  );
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
  if (karma >= KARMA_CONFIG.THRESHOLDS.VERY_GOOD) {
    // Very good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' You have an honest look about you.';
      case 'chaotic':
        return ' You seem... too clean for these parts.';
      default:
        return ' You have a trustworthy air about you.';
    }
  } else if (karma >= KARMA_CONFIG.THRESHOLDS.GOOD) {
    // Good karma
    switch (npcPersonality) {
      case 'lawful':
        return ' You seem like a decent sort.';
      case 'chaotic':
        return ' You look like you follow the rules.';
      default:
        return ' You seem reliable.';
    }
  } else if (karma <= KARMA_CONFIG.THRESHOLDS.VERY_BAD) {
    // Very bad karma
    switch (npcPersonality) {
      case 'lawful':
        return ' I can see trouble in your eyes.';
      case 'chaotic':
        return " Now here's someone who knows how the sector really works.";
      default:
        return ' You have a dangerous look about you.';
    }
  } else if (karma <= KARMA_CONFIG.THRESHOLDS.BAD) {
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
 * @param {object} context - Context object with karma and factionReps
 * @returns {string} Text modifier to append to dialogue
 */
export function getFactionAttitudeModifier(npcFaction, context) {
  const factionRep = context.factionReps[npcFaction] || 0;

  if (factionRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_HIGH) {
    return " You're a true friend to our cause.";
  } else if (factionRep >= FACTION_CONFIG.REPUTATION_THRESHOLDS.HIGH) {
    return ' We appreciate your support.';
  } else if (factionRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.EXTREME_LOW) {
    return " Your reputation precedes you, and it's not good.";
  } else if (factionRep <= FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_LOW) {
    return ' We have... concerns about your activities.';
  }

  return '';
}
