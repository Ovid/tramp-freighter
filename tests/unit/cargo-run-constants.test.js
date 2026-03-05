import { describe, it, expect } from 'vitest';
import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
} from '../../src/game/constants.js';

describe('Cargo Run Constants', () => {
  describe('MISSION_CONFIG cargo run fields', () => {
    it('should have base fee constants for legal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_BASE_FEE).toBe(250);
    });

    it('should have base fee constants for illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE).toBe(400);
    });

    it('should have quantity ranges for legal and illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY).toEqual({
        MIN: 5,
        MAX: 15,
      });
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY).toEqual({
        MIN: 5,
        MAX: 10,
      });
    });

    it('should have zone-based illegal cargo chance', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE).toEqual({
        safe: 0.15,
        contested: 0.5,
        dangerous: 0.75,
      });
    });
  });

  describe('MISSION_CARGO_TYPES', () => {
    it('should define legal cargo types', () => {
      expect(MISSION_CARGO_TYPES.legal).toEqual([
        'registered_freight',
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
      const overlap = MISSION_CARGO_TYPES.legal.filter((t) =>
        MISSION_CARGO_TYPES.illegal.includes(t)
      );
      expect(overlap).toEqual([]);
    });
  });
});
