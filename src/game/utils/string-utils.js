'use strict';

/**
 * String utility functions for text formatting and display
 *
 * Centralizes common string operations used across UI components to ensure
 * consistent formatting and avoid duplication.
 */

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
