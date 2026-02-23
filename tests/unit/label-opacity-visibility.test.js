import { describe, it, expect } from 'vitest';
import { LABEL_CONFIG, VISUAL_CONFIG } from '../../src/game/constants.js';

describe('Label Opacity Visibility', () => {
  it('should define minOpacity in LABEL_CONFIG', () => {
    expect(LABEL_CONFIG.minOpacity).toBeGreaterThanOrEqual(0);
    expect(LABEL_CONFIG.minOpacity).toBeLessThanOrEqual(1);
  });

  it('should set minOpacity higher than 0.1 for better visibility', () => {
    // Original value was 0.1, which made distant labels too faint
    expect(LABEL_CONFIG.minOpacity).toBeGreaterThan(0.1);
  });

  it('should set minOpacity to 0.3 for improved distant label visibility', () => {
    expect(LABEL_CONFIG.minOpacity).toBe(0.3);
  });

  it('should keep maxOpacity at full visibility', () => {
    expect(LABEL_CONFIG.maxOpacity).toBe(1.0);
  });

  it('should maintain opacity range between 0 and 1', () => {
    expect(LABEL_CONFIG.minOpacity).toBeGreaterThanOrEqual(0);
    expect(LABEL_CONFIG.minOpacity).toBeLessThanOrEqual(1);
    expect(LABEL_CONFIG.maxOpacity).toBeGreaterThanOrEqual(0);
    expect(LABEL_CONFIG.maxOpacity).toBeLessThanOrEqual(1);
  });

  it('should have minOpacity less than maxOpacity', () => {
    expect(LABEL_CONFIG.minOpacity).toBeLessThan(LABEL_CONFIG.maxOpacity);
  });

  it.each([
    [
      'initial camera distance',
      VISUAL_CONFIG.initialCameraDistance,
      LABEL_CONFIG.minOpacity,
    ],
    ['near distance', LABEL_CONFIG.nearDistance, LABEL_CONFIG.maxOpacity],
    ['far distance', LABEL_CONFIG.farDistance, LABEL_CONFIG.minOpacity],
    [
      'mid-range distance',
      (LABEL_CONFIG.nearDistance + LABEL_CONFIG.farDistance) / 2,
      (LABEL_CONFIG.maxOpacity + LABEL_CONFIG.minOpacity) / 2,
    ],
  ])(
    'should calculate opacity correctly at %s',
    (label, distance, expectedOpacity) => {
      const clampedDistance = Math.max(
        LABEL_CONFIG.nearDistance,
        Math.min(distance, LABEL_CONFIG.farDistance)
      );

      const t =
        (clampedDistance - LABEL_CONFIG.nearDistance) /
        (LABEL_CONFIG.farDistance - LABEL_CONFIG.nearDistance);

      const opacity =
        LABEL_CONFIG.maxOpacity -
        (LABEL_CONFIG.maxOpacity - LABEL_CONFIG.minOpacity) * t;

      expect(opacity).toBeCloseTo(expectedOpacity, 2);
      expect(opacity).toBeGreaterThanOrEqual(LABEL_CONFIG.minOpacity);
      expect(opacity).toBeLessThanOrEqual(LABEL_CONFIG.maxOpacity);
    }
  );

  it('should provide better visibility at far distance compared to old minOpacity', () => {
    // New minOpacity should be significantly higher than the original 0.1
    // to improve visibility of distant labels
    expect(LABEL_CONFIG.minOpacity).toBeGreaterThan(0.1);

    // Should be at least 2x the original value for noticeable improvement
    expect(LABEL_CONFIG.minOpacity).toBeGreaterThanOrEqual(0.2);
  });

  it('should maintain sufficient opacity gradient for depth perception', () => {
    // The difference between min and max opacity should be significant
    // enough to provide depth cues
    const opacityRange = LABEL_CONFIG.maxOpacity - LABEL_CONFIG.minOpacity;

    // Range should be at least 0.5 for noticeable depth effect
    expect(opacityRange).toBeGreaterThanOrEqual(0.5);

    // But not too large that distant labels disappear
    expect(opacityRange).toBeLessThanOrEqual(0.9);
  });
});
