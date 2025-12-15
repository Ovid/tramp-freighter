import { describe, it, expect } from 'vitest';
import { getStarVisuals } from '../../src/game/utils/star-visuals.js';

describe('getStarVisuals', () => {
  describe('Main Sequence Stars', () => {
    it('should return blue color and large radius for O-type stars', () => {
      const result = getStarVisuals('O5');
      expect(result.color).toBe('#9bb0ff');
      expect(result.radius).toBe(3.0);
    });

    it('should return blue-white color and large radius for B-type stars', () => {
      const result = getStarVisuals('B3');
      expect(result.color).toBe('#aabfff');
      expect(result.radius).toBe(2.2);
    });

    it('should return white color and medium-large radius for A-type stars', () => {
      const result = getStarVisuals('A2');
      expect(result.color).toBe('#cad7ff');
      expect(result.radius).toBe(1.8);
    });

    it('should return yellow-white color and medium radius for F-type stars', () => {
      const result = getStarVisuals('F5');
      expect(result.color).toBe('#f8f7ff');
      expect(result.radius).toBe(1.4);
    });

    it('should return yellow color and solar radius for G-type stars', () => {
      const result = getStarVisuals('G2');
      expect(result.color).toBe('#fff4e8');
      expect(result.radius).toBe(1.0);
    });

    it('should return orange color and small-medium radius for K-type stars', () => {
      const result = getStarVisuals('K5');
      expect(result.color).toBe('#ffd2a1');
      expect(result.radius).toBe(0.8);
    });

    it('should return red-orange color and small radius for M-type stars', () => {
      const result = getStarVisuals('M5');
      expect(result.color).toBe('#ff4500');
      expect(result.radius).toBe(0.5);
    });
  });

  describe('White Dwarfs', () => {
    it('should return blue-white color and visibility-boosted radius for D-type stars', () => {
      const result = getStarVisuals('DA2');
      expect(result.color).toBe('#e0f0ff');
      expect(result.radius).toBe(0.35);
    });

    it('should handle different white dwarf subtypes', () => {
      const types = ['DA', 'DB', 'DC', 'DZ', 'DQ'];
      types.forEach((type) => {
        const result = getStarVisuals(type);
        expect(result.color).toBe('#e0f0ff');
        expect(result.radius).toBe(0.35);
      });
    });
  });

  describe('Brown Dwarfs', () => {
    it('should return dark red color and visibility-boosted radius for L-type brown dwarfs', () => {
      const result = getStarVisuals('L5');
      expect(result.color).toBe('#9e2626');
      expect(result.radius).toBe(0.3);
    });

    it('should return dark red color and visibility-boosted radius for T-type brown dwarfs', () => {
      const result = getStarVisuals('T8');
      expect(result.color).toBe('#9e2626');
      expect(result.radius).toBe(0.3);
    });

    it('should return dark red color and visibility-boosted radius for Y-type brown dwarfs', () => {
      const result = getStarVisuals('Y2');
      expect(result.color).toBe('#9e2626');
      expect(result.radius).toBe(0.3);
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle lowercase spectral types', () => {
      const result = getStarVisuals('g2');
      expect(result.color).toBe('#fff4e8');
      expect(result.radius).toBe(1.0);
    });

    it('should handle mixed case spectral types', () => {
      const result = getStarVisuals('m5');
      expect(result.color).toBe('#ff4500');
      expect(result.radius).toBe(0.5);
    });
  });

  describe('Spectral Subtypes', () => {
    it('should handle spectral types with decimal subtypes', () => {
      const result = getStarVisuals('M5.5');
      expect(result.color).toBe('#ff4500');
      expect(result.radius).toBe(0.5);
    });

    it('should handle spectral types with single digit subtypes', () => {
      const result = getStarVisuals('G2');
      expect(result.color).toBe('#fff4e8');
      expect(result.radius).toBe(1.0);
    });

    it('should handle spectral types without subtypes', () => {
      const result = getStarVisuals('K');
      expect(result.color).toBe('#ffd2a1');
      expect(result.radius).toBe(0.8);
    });
  });

  describe('Unknown Types', () => {
    it('should return default white color and solar radius for unknown spectral types', () => {
      const result = getStarVisuals('X9');
      expect(result.color).toBe('#ffffff');
      expect(result.radius).toBe(1.0);
    });

    it('should return default values for numeric-only types', () => {
      const result = getStarVisuals('123');
      expect(result.color).toBe('#ffffff');
      expect(result.radius).toBe(1.0);
    });

    it('should return default values for special characters', () => {
      const result = getStarVisuals('!@#');
      expect(result.color).toBe('#ffffff');
      expect(result.radius).toBe(1.0);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for null input', () => {
      expect(() => getStarVisuals(null)).toThrow(
        'Star type must be a non-empty string'
      );
    });

    it('should throw error for undefined input', () => {
      expect(() => getStarVisuals(undefined)).toThrow(
        'Star type must be a non-empty string'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => getStarVisuals('')).toThrow(
        'Star type must be a non-empty string'
      );
    });

    it('should throw error for non-string input', () => {
      expect(() => getStarVisuals(123)).toThrow(
        'Star type must be a non-empty string'
      );
    });

    it('should throw error for object input', () => {
      expect(() => getStarVisuals({ type: 'G2' })).toThrow(
        'Star type must be a non-empty string'
      );
    });

    it('should throw error for array input', () => {
      expect(() => getStarVisuals(['G2'])).toThrow(
        'Star type must be a non-empty string'
      );
    });
  });

  describe('Return Value Structure', () => {
    it('should return object with color and radius properties', () => {
      const result = getStarVisuals('G2');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('radius');
    });

    it('should return color as string', () => {
      const result = getStarVisuals('G2');
      expect(typeof result.color).toBe('string');
    });

    it('should return radius as number', () => {
      const result = getStarVisuals('G2');
      expect(typeof result.radius).toBe('number');
    });

    it('should return color in hex format', () => {
      const result = getStarVisuals('G2');
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should return positive radius', () => {
      const result = getStarVisuals('G2');
      expect(result.radius).toBeGreaterThan(0);
    });
  });

  describe('Realistic Astronomical Properties', () => {
    it('should have O-type stars larger than G-type stars', () => {
      const oType = getStarVisuals('O5');
      const gType = getStarVisuals('G2');
      expect(oType.radius).toBeGreaterThan(gType.radius);
    });

    it('should have M-type stars smaller than G-type stars', () => {
      const mType = getStarVisuals('M5');
      const gType = getStarVisuals('G2');
      expect(mType.radius).toBeLessThan(gType.radius);
    });

    it('should have white dwarfs smaller than main sequence stars', () => {
      const whiteDwarf = getStarVisuals('DA2');
      const mainSequence = getStarVisuals('G2');
      expect(whiteDwarf.radius).toBeLessThan(mainSequence.radius);
    });

    it('should have brown dwarfs smaller than main sequence stars', () => {
      const brownDwarf = getStarVisuals('L5');
      const mainSequence = getStarVisuals('G2');
      expect(brownDwarf.radius).toBeLessThan(mainSequence.radius);
    });

    it('should have size progression from hot to cool stars', () => {
      const sizes = [
        getStarVisuals('O5').radius,
        getStarVisuals('B3').radius,
        getStarVisuals('A2').radius,
        getStarVisuals('F5').radius,
        getStarVisuals('G2').radius,
        getStarVisuals('K5').radius,
        getStarVisuals('M5').radius,
      ];

      // Verify descending order (hot stars are larger)
      for (let i = 0; i < sizes.length - 1; i++) {
        expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i + 1]);
      }
    });
  });

  describe('Visibility Boost for Small Stars', () => {
    it('should boost white dwarf size above realistic scale for visibility', () => {
      const whiteDwarf = getStarVisuals('DA2');
      // Real white dwarfs are ~0.01 solar radii (Earth-sized)
      // Game boosts to 0.35 for visibility
      expect(whiteDwarf.radius).toBe(0.35);
      expect(whiteDwarf.radius).toBeGreaterThan(0.01);
    });

    it('should boost brown dwarf size above realistic scale for visibility', () => {
      const brownDwarf = getStarVisuals('L5');
      // Real brown dwarfs are ~0.1 solar radii (Jupiter-sized)
      // Game boosts to 0.3 for visibility
      expect(brownDwarf.radius).toBe(0.3);
      expect(brownDwarf.radius).toBeGreaterThan(0.1);
    });
  });

  describe('Real Star Examples', () => {
    it('should handle Sol (G2V)', () => {
      const result = getStarVisuals('G2V');
      expect(result.color).toBe('#fff4e8');
      expect(result.radius).toBe(1.0);
    });

    it('should handle Sirius A (A1V)', () => {
      const result = getStarVisuals('A1V');
      expect(result.color).toBe('#cad7ff');
      expect(result.radius).toBe(1.8);
    });

    it('should handle Proxima Centauri (M5.5Ve)', () => {
      const result = getStarVisuals('M5.5Ve');
      expect(result.color).toBe('#ff4500');
      expect(result.radius).toBe(0.5);
    });

    it('should handle Procyon A (F5IV-V)', () => {
      const result = getStarVisuals('F5IV-V');
      expect(result.color).toBe('#f8f7ff');
      expect(result.radius).toBe(1.4);
    });

    it('should handle Sirius B (DA2)', () => {
      const result = getStarVisuals('DA2');
      expect(result.color).toBe('#e0f0ff');
      expect(result.radius).toBe(0.35);
    });
  });
});
