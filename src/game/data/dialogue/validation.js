/**
 * @fileoverview Dialogue Tree Validation Functions
 * 
 * Provides validation utilities for dialogue tree structure integrity.
 * Used during game initialization to catch configuration errors early.
 * 
 * @module dialogue/validation
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

/**
 * Validates that all required constants are properly defined
 * Call this during game initialization to catch configuration errors early
 * @throws {Error} If any required constants are missing or invalid
 */
export function validateRequiredConstants() {
  const requiredBounds = [
    'MIN',
    'MAX',
    'HOSTILE_MAX',
    'COLD_MIN',
    'COLD_MAX',
    'NEUTRAL_MIN',
    'NEUTRAL_MAX',
    'WARM_MIN',
    'WARM_MAX',
    'FRIENDLY_MIN',
    'FRIENDLY_MAX',
    'TRUSTED_MIN',
    'TRUSTED_MAX',
    'FAMILY_MIN',
  ];

  if (!REPUTATION_BOUNDS || typeof REPUTATION_BOUNDS !== 'object') {
    throw new Error(
      'REPUTATION_BOUNDS must be defined as an object in constants.js'
    );
  }

  for (const bound of requiredBounds) {
    if (!(bound in REPUTATION_BOUNDS)) {
      throw new Error(
        `Missing required reputation bound: REPUTATION_BOUNDS.${bound}`
      );
    }
    if (typeof REPUTATION_BOUNDS[bound] !== 'number') {
      throw new Error(
        `REPUTATION_BOUNDS.${bound} must be a number, got ${typeof REPUTATION_BOUNDS[bound]}`
      );
    }
  }

  // Validate bounds are in logical order for tier minimums
  const tierMins = [
    REPUTATION_BOUNDS.MIN,
    REPUTATION_BOUNDS.COLD_MIN,
    REPUTATION_BOUNDS.NEUTRAL_MIN,
    REPUTATION_BOUNDS.WARM_MIN,
    REPUTATION_BOUNDS.FRIENDLY_MIN,
    REPUTATION_BOUNDS.TRUSTED_MIN,
    REPUTATION_BOUNDS.FAMILY_MIN,
  ];

  for (let i = 1; i < tierMins.length; i++) {
    if (tierMins[i] <= tierMins[i - 1]) {
      throw new Error(
        `Reputation tier minimums must be in ascending order. ${tierMins[i]} <= ${tierMins[i - 1]}`
      );
    }
  }

  // Validate that MAX is greater than all other bounds
  if (REPUTATION_BOUNDS.MAX <= REPUTATION_BOUNDS.FAMILY_MIN) {
    throw new Error(
      `REPUTATION_BOUNDS.MAX (${REPUTATION_BOUNDS.MAX}) must be greater than FAMILY_MIN (${REPUTATION_BOUNDS.FAMILY_MIN})`
    );
  }
}

/**
 * Validates that a dialogue tree has the required structure
 * @param {Object} tree - Dialogue tree to validate
 * @throws {Error} If tree structure is invalid
 */
export function validateDialogueTree(tree) {
  if (!tree || typeof tree !== 'object') {
    throw new Error('Dialogue tree must be an object');
  }

  if (!tree.greeting) {
    throw new Error('Dialogue tree must have a greeting node');
  }

  // Validate each node in the tree
  for (const [nodeId, node] of Object.entries(tree)) {
    validateDialogueNode(nodeId, node);
  }
}

/**
 * Validates that a dialogue node has the required structure
 * @param {string} nodeId - Node identifier for error messages
 * @param {Object} node - Dialogue node to validate
 * @throws {Error} If node structure is invalid
 */
export function validateDialogueNode(nodeId, node) {
  if (!node || typeof node !== 'object') {
    throw new Error(`Dialogue node '${nodeId}' must be an object`);
  }

  if (!node.text) {
    throw new Error(`Dialogue node '${nodeId}' must have text property`);
  }

  if (typeof node.text !== 'string' && typeof node.text !== 'function') {
    throw new Error(
      `Dialogue node '${nodeId}' text must be string or function`
    );
  }

  if (!Array.isArray(node.choices)) {
    throw new Error(`Dialogue node '${nodeId}' must have choices array`);
  }

  // Validate each choice
  node.choices.forEach((choice, index) => {
    validateDialogueChoice(nodeId, index, choice);
  });
}

/**
 * Validates that a dialogue choice has the required structure
 * @param {string} nodeId - Node identifier for error messages
 * @param {number} choiceIndex - Choice index for error messages
 * @param {Object} choice - Dialogue choice to validate
 * @throws {Error} If choice structure is invalid
 */
export function validateDialogueChoice(nodeId, choiceIndex, choice) {
  if (!choice || typeof choice !== 'object') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' must be an object`
    );
  }

  if (!choice.text || typeof choice.text !== 'string') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' must have text string`
    );
  }

  // next can be string or null
  if (choice.next !== null && typeof choice.next !== 'string') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' next must be string or null`
    );
  }

  // repGain is optional but must be number if present
  if (choice.repGain !== undefined && typeof choice.repGain !== 'number') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' repGain must be number`
    );
  }

  // condition is optional but must be function if present
  if (
    choice.condition !== undefined &&
    typeof choice.condition !== 'function'
  ) {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' condition must be function`
    );
  }

  // action is optional but must be function if present
  if (choice.action !== undefined && typeof choice.action !== 'function') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' action must be function`
    );
  }
}