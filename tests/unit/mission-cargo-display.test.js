import { describe, it, expect } from 'vitest';
import { formatCargoDisplayName } from '../../src/game/utils/string-utils.js';

describe('Mission Cargo Display Names', () => {
  describe('formatCargoDisplayName', () => {
    it('converts underscored mission cargo IDs to title case', () => {
      expect(formatCargoDisplayName('sealed_containers')).toBe(
        'Sealed Containers'
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
  });
});
