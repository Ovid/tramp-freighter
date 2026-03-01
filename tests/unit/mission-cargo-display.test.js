import { describe, it, expect } from 'vitest';
import { formatCargoDisplayName } from '../../src/game/utils/string-utils.js';

describe('Mission Cargo Display Names', () => {
  describe('formatCargoDisplayName', () => {
    it('converts underscored mission cargo IDs to title case', () => {
      expect(formatCargoDisplayName('registered_freight')).toBe(
        'Registered Freight'
      );
    });

    it('converts multi-word illegal cargo IDs to title case', () => {
      expect(formatCargoDisplayName('black_market_goods')).toBe(
        'Black Market Goods'
      );
    });

    it('handles single-word goods by capitalizing first letter', () => {
      expect(formatCargoDisplayName('grain')).toBe('Grain');
    });

    it('handles empty or null input gracefully', () => {
      expect(formatCargoDisplayName('')).toBe('');
      expect(formatCargoDisplayName(null)).toBe('');
      expect(formatCargoDisplayName(undefined)).toBe('');
    });

    it('formats underscored commodity names used in inspections', () => {
      expect(formatCargoDisplayName('unmarked_crates')).toBe('Unmarked Crates');
      expect(formatCargoDisplayName('alien_artifacts')).toBe('Alien Artifacts');
    });

    it('formats a list of restricted item IDs for display', () => {
      const restrictedItems = ['unmarked_crates', 'alien_artifacts'];
      const formatted = restrictedItems.map(formatCargoDisplayName).join(', ');
      expect(formatted).toBe('Unmarked Crates, Alien Artifacts');
    });
  });
});
