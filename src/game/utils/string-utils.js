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
