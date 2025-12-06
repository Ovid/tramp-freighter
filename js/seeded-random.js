/**
 * Seeded Random Number Generator
 * 
 * Provides deterministic random number generation using a seed value.
 * The same seed will always produce the same sequence of random numbers,
 * enabling reproducible price calculations and testing.
 */

/**
 * SeededRandom class for deterministic random number generation
 */
export class SeededRandom {
    /**
     * Create a seeded random number generator
     * @param {string} seed - Seed string for deterministic generation
     */
    constructor(seed) {
        this.hash = this._stringToHash(seed);
    }
    
    /**
     * Convert string seed to numeric hash
     * Uses formula: hash = ((hash << 5) - hash) + charCode
     * @param {string} str - Seed string
     * @returns {number} Hash value
     * @private
     */
    _stringToHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    
    /**
     * Generate next random number in sequence
     * Uses formula: hash = (hash × 9301 + 49297) % 233280
     * @returns {number} Random value between 0 and 1
     */
    next() {
        this.hash = (this.hash * 9301 + 49297) % 233280;
        // Ensure positive value by using Math.abs
        return Math.abs(this.hash) / 233280;
    }
    
    /**
     * Generate random integer in range [min, max] inclusive
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {number} Random integer
     */
    nextInt(min, max) {
        const range = max - min + 1;
        return Math.floor(this.next() * range) + min;
    }
    
    /**
     * Generate random float in range [min, max)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float
     */
    nextFloat(min, max) {
        const range = max - min;
        return this.next() * range + min;
    }
}

/**
 * Static utility function to create a seeded random generator
 * @param {string} seed - Seed string
 * @returns {SeededRandom} New seeded random generator
 */
export function seededRandom(seed) {
    return new SeededRandom(seed);
}
