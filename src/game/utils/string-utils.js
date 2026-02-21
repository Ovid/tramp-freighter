/**
 * String utility functions for text formatting and display
 *
 * Centralizes common string operations used across UI components to ensure
 * consistent formatting and avoid duplication.
 */

import { UI_CONFIG } from '../constants';

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
 * Format a raw map coordinate to display light-years.
 *
 * @param {number} value - Raw coordinate value (map units)
 * @returns {string} Scaled coordinate string with 2 decimal places
 */
export function formatCoordinate(value) {
  return (value / UI_CONFIG.COORDINATE_SCALE_FACTOR).toFixed(2);
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
 * @returns {string} Display name (e.g., 'Sealed Containers')
 */
export function formatCargoDisplayName(id) {
  if (!id || typeof id !== 'string') return '';
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
