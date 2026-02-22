/**
 * Seeded Random Number Generator
 *
 * Uses a Linear Congruential Generator (LCG) with parameters chosen for
 * fast computation and adequate distribution for game price fluctuations.
 * NOT cryptographically secure - designed for deterministic game mechanics.
 */

export class SeededRandom {
  /**
   * @param {string} seed - Seed string for deterministic generation
   */
  constructor(seed) {
    this.hash = this._stringToHash(seed);
  }

  /**
   * djb2 hash variant - fast string hashing with good distribution.
   * Formula: hash = ((hash << 5) - hash) + charCode
   * @param {string} str - Seed string
   * @returns {number} Hash value
   * @private
   */
  _stringToHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * LCG parameters from Numerical Recipes - adequate period for game use.
   * Formula: hash = (hash × 9301 + 49297) % 233280
   * Math.abs needed because hash can be negative from djb2 overflow.
   * @returns {number} Random value between 0 and 1
   */
  next() {
    this.hash = (this.hash * 9301 + 49297) % 233280;
    return Math.abs(this.hash) / 233280;
  }

  /**
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer
   */
  nextInt(min, max) {
    const range = max - min + 1;
    return Math.floor(this.next() * range) + min;
  }

  /**
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float
   */
  nextFloat(min, max) {
    const range = max - min;
    return this.next() * range + min;
  }

  /**
   * Pick a random element from an array.
   *
   * @param {Array} array - Non-empty array to pick from
   * @returns {*} A random element
   */
  pickRandom(array) {
    return array[this.nextInt(0, array.length - 1)];
  }
}

/**
 * Pick a random element from an array using a plain rng function.
 *
 * Standalone version for call sites that use dependency-injected rng
 * functions rather than SeededRandom instances.
 *
 * @param {Array} array - Non-empty array to pick from
 * @param {Function} rngFn - Function returning a number in [0, 1)
 * @returns {*} A random element
 */
/**
 * Build a deterministic seed string from game context.
 * Same day + system + type always produces same RNG sequence.
 *
 * @param {number} gameDay - Current game day (daysElapsed)
 * @param {number} systemId - Current star system ID
 * @param {string} encounterType - Type identifier (e.g., 'combat', 'negotiation')
 * @returns {string} Seed string for SeededRandom constructor
 */
export function buildEncounterSeed(gameDay, systemId, encounterType) {
  return `${gameDay}_${systemId}_${encounterType}`;
}

export function pickRandomFrom(array, rngFn) {
  const index = Math.min(Math.floor(rngFn() * array.length), array.length - 1);
  return array[index];
}
