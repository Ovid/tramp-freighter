import { describe, it, expect } from 'vitest';
import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
} from '../../src/game/constants.js';

describe('Cargo Run Constants', () => {
  describe('MISSION_CONFIG cargo run fields', () => {
    it('should have distance-based fee constants for legal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_BASE_FEE).toBe(75);
      expect(MISSION_CONFIG.CARGO_RUN_PER_LY_RATE).toBe(25);
    });

    it('should have distance-based fee constants for illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE).toBe(150);
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_PER_LY_RATE).toBe(40);
    });

    it('should have quantity ranges for legal and illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY).toEqual({ MIN: 5, MAX: 15 });
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY).toEqual({ MIN: 5, MAX: 10 });
    });

    it('should have zone-based illegal cargo chance', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE).toEqual({
        safe: 0.15,
        contested: 0.50,
        dangerous: 0.75,
      });
    });
  });

  describe('MISSION_CARGO_TYPES', () => {
    it('should define legal cargo types', () => {
      expect(MISSION_CARGO_TYPES.legal).toEqual([
        'sealed_containers',
        'diplomatic_pouches',
        'scientific_samples',
      ]);
    });

    it('should define illegal cargo types', () => {
      expect(MISSION_CARGO_TYPES.illegal).toEqual([
        'unmarked_crates',
        'prohibited_tech',
        'black_market_goods',
      ]);
    });

    it('should have no overlap between legal and illegal types', () => {
      const overlap = MISSION_CARGO_TYPES.legal.filter(
        (t) => MISSION_CARGO_TYPES.illegal.includes(t)
      );
      expect(overlap).toEqual([]);
    });
  });
});
