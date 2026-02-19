import { DEV_MODE } from '../constants.js';

/**
 * Log to console only when DEV_MODE is enabled (.dev file present).
 * Drop-in replacement for console.log in production-facing code.
 *
 * @param {...*} args - Arguments forwarded to console.log
 */
export function devLog(...args) {
  if (DEV_MODE) {
    console.log(...args);
  }
}

/**
 * Warn to console only when DEV_MODE is enabled (.dev file present).
 * For informational warnings only — use console.warn directly for
 * genuine error conditions that should always be visible.
 *
 * @param {...*} args - Arguments forwarded to console.warn
 */
export function devWarn(...args) {
  if (DEV_MODE) {
    console.warn(...args);
  }
}
