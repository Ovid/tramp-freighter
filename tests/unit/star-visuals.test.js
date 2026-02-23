import { describe, it, expect } from 'vitest';
import { getStarVisuals } from '../../src/game/utils/star-visuals.js';

describe('getStarVisuals', () => {
  describe('Main Sequence Stars', () => {
    it.each([
      ['O-type', 'O5', '#9bb0ff', 3.0],
      ['B-type', 'B3', '#aabfff', 2.2],
      ['A-type', 'A2', '#cad7ff', 1.8],
      ['F-type', 'F5', '#f8f7ff', 1.4],
      ['G-type', 'G2', '#fff4e8', 1.0],
      ['K-type', 'K5', '#ffd2a1', 0.8],
      ['M-type', 'M5', '#ff4500', 0.5],
    ])(
      'should return correct color and radius for %s stars',
      (label, spectralType, expectedColor, expectedRadius) => {
        const result = getStarVisuals(spectralType);
        expect(result.color).toBe(expectedColor);
        expect(result.radius).toBe(expectedRadius);
      }
    );
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
    it.each([
      ['L-type', 'L5'],
      ['T-type', 'T8'],
      ['Y-type', 'Y2'],
    ])(
      'should return dark red color and visibility-boosted radius for %s brown dwarfs',
      (label, spectralType) => {
        const result = getStarVisuals(spectralType);
        expect(result.color).toBe('#9e2626');
        expect(result.radius).toBe(0.3);
      }
    );
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
    it.each([
      ['unknown spectral type', 'X9'],
      ['numeric-only type', '123'],
      ['special characters', '!@#'],
    ])(
      'should return default white color and solar radius for %s',
      (label, input) => {
        const result = getStarVisuals(input);
        expect(result.color).toBe('#ffffff');
        expect(result.radius).toBe(1.0);
      }
    );
  });

  describe('Input Validation', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty string', ''],
      ['number', 123],
      ['object', { type: 'G2' }],
      ['array', ['G2']],
    ])('should throw error for %s input', (label, input) => {
      expect(() => getStarVisuals(input)).toThrow(
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
    it.each([
      ['Sol', 'G2V', '#fff4e8', 1.0],
      ['Sirius A', 'A1V', '#cad7ff', 1.8],
      ['Proxima Centauri', 'M5.5Ve', '#ff4500', 0.5],
      ['Procyon A', 'F5IV-V', '#f8f7ff', 1.4],
      ['Sirius B', 'DA2', '#e0f0ff', 0.35],
    ])(
      'should handle %s (%s)',
      (starName, spectralType, expectedColor, expectedRadius) => {
        const result = getStarVisuals(spectralType);
        expect(result.color).toBe(expectedColor);
        expect(result.radius).toBe(expectedRadius);
      }
    );
  });
});
