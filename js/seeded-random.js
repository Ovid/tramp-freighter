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
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
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
}

