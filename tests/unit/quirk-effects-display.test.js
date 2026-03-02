import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Quirk Effects Display (#66/100)', () => {
  it('every quirk should have an effectLabel', () => {
    Object.entries(SHIP_CONFIG.QUIRKS).forEach(([id, quirk]) => {
      expect(quirk.effectLabel, `Quirk ${id} missing effectLabel`).toBeDefined();
      expect(typeof quirk.effectLabel).toBe('string');
      expect(quirk.effectLabel.length).toBeGreaterThan(0);
    });
  });

  it('effectLabel should describe mechanical effect in plain language', () => {
    // Spot-check specific quirks
    expect(SHIP_CONFIG.QUIRKS.fuel_sipper.effectLabel).toContain('-15%');
    expect(SHIP_CONFIG.QUIRKS.hot_thruster.effectLabel).toContain('+5%');
    expect(SHIP_CONFIG.QUIRKS.leaky_seals.effectLabel).toContain('+50%');
  });

  it('ShipStatusPanel should render effectLabel in quirk display', () => {
    const source = readFileSync(
      'src/features/ship-status/ShipStatusPanel.jsx',
      'utf-8'
    );
    // Verify renderQuirk outputs name, description, effectLabel, and flavor
    expect(source).toContain('quirk.name');
    expect(source).toContain('quirk.description');
    expect(source).toContain('quirk.effectLabel');
    expect(source).toContain('quirk.flavor');
    // Verify it uses a quirk-effect CSS class for the effect label
    expect(source).toContain('quirk-effect');
  });
});
