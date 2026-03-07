import { DEV_MODE } from '../constants.js';

/**
 * Log to console only when DEV_MODE is enabled (.dev file present).
 * Drop-in replacement for console.log in production-facing code.
 *
 * Not all code uses this wrapper — BaseManager provides its own log/warn/error
 * methods with class-name prefixing, and some low-level code (Three.js engine,
 * event-system) uses console.warn directly for errors that should always surface.
 * This mixed approach is intentional: devLog for optional debug output,
 * console.warn/error for conditions that indicate real problems.
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
