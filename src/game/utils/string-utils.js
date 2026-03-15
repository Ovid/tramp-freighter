/**
 * String utility functions for text formatting and display
 *
 * Centralizes common string operations used across UI components to ensure
 * consistent formatting and avoid duplication.
 */

import { SHIP_CONFIG } from '../constants.js';

/**
 * Sanitize ship name input
 *
 * Removes HTML tags, trims whitespace, and limits length to prevent display issues.
 * Returns default ship name if input is empty after sanitization.
 *
 * @param {string} name - User input for ship name
 * @returns {string} Sanitized name or default
 */
export function sanitizeShipName(name) {
  if (!name || name.trim().length === 0) {
    return SHIP_CONFIG.DEFAULT_NAME;
  }

  // Remove HTML tags, limit length, then trim (order matters for edge cases)
  const sanitized = name
    .replace(/<[^>]*>/g, '')
    .substring(0, SHIP_CONFIG.MAX_NAME_LENGTH)
    .trim();

  return sanitized || SHIP_CONFIG.DEFAULT_NAME;
}

/**
 * Capitalize first letter of a string for display purposes
 *
 * Used consistently across UI for commodity names, system types, and labels
 * to ensure uniform presentation.
 *
 * @param {string} str - String to capitalize
 * @returns {string} String with first letter capitalized
 */
export function capitalizeFirst(str) {
  if (!str || typeof str !== 'string') return String(str ?? '');
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a quantity with "unit" or "units" based on count
 *
 * @param {number} count - The quantity
 * @returns {string} Formatted string like "1 unit" or "3 units"
 */
export function pluralizeUnit(count) {
  return `${count} ${count === 1 ? 'unit' : 'units'}`;
}

/**
 * Convert an underscored cargo ID to a title-cased display name
 *
 * @param {string} id - Cargo type ID (e.g., 'registered_freight')
 * @returns {string} Display name (e.g., 'Registered Freight')
 */
export function formatCargoDisplayName(id) {
  if (!id || typeof id !== 'string') return '';
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Map a ship condition percentage to a CSS class name
 *
 * @param {number} condition - Condition percentage (0-100)
 * @returns {string} CSS class name: 'good', 'fair', 'poor', or 'critical'
 */
export function getConditionClass(condition) {
  const thresholds = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS;
  if (condition >= thresholds.EXCELLENT) return 'good';
  if (condition >= thresholds.FAIR) return 'fair';
  if (condition >= thresholds.POOR) return 'poor';
  return 'critical';
}
