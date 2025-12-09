'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import { createShipReticle } from '../../js/game-animation.js';
import { ANIMATION_CONFIG } from '../../js/game-constants.js';
import { setupThreeMock } from '../setup-three-mock.js';

describe('Ship Reticle', () => {
  beforeEach(() => {
    setupThreeMock();
  });

  it('should create a reticle with correct properties', () => {
    const reticle = createShipReticle();

    expect(reticle).toBeDefined();
    expect(reticle.geometry).toBeDefined();
    expect(reticle.material).toBeDefined();
    expect(reticle.visible).toBe(false); // Initially hidden
  });

  it('should have correct material properties', () => {
    const reticle = createShipReticle();

    expect(reticle.material.color).toBe(ANIMATION_CONFIG.RETICLE_COLOR);
    expect(reticle.material.transparent).toBe(true);
    expect(reticle.material.opacity).toBe(0.8);
    expect(reticle.material.linewidth).toBe(
      ANIMATION_CONFIG.RETICLE_LINE_WIDTH
    );
  });

  it('should create circle with correct number of segments', () => {
    const reticle = createShipReticle();

    // Check that geometry has points
    expect(reticle.geometry.points).toBeDefined();
    expect(reticle.geometry.points.length).toBe(
      ANIMATION_CONFIG.RETICLE_SEGMENTS
    );
  });

  it('should create circle with correct radius', () => {
    const reticle = createShipReticle();

    // Check that all points are at the correct radius
    const expectedRadius = ANIMATION_CONFIG.RETICLE_SIZE;

    reticle.geometry.points.forEach((point) => {
      const distance = Math.sqrt(point.x * point.x + point.y * point.y);
      expect(distance).toBeCloseTo(expectedRadius, 5);
    });
  });

  it('should have position at origin initially', () => {
    const reticle = createShipReticle();

    expect(reticle.position.x).toBe(0);
    expect(reticle.position.y).toBe(0);
    expect(reticle.position.z).toBe(0);
  });
});
