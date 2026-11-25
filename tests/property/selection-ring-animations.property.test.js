// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import {
  selectStar,
  deselectStar,
  updateSelectionRingAnimations,
  updateCurrentSystemIndicator,
  getCurrentSystemIndicator,
  _resetState,
} from '../../src/game/engine/interaction.js';
import { VISUAL_CONFIG, STARMAP_CONFIG } from '../../src/game/constants.js';

const UNITS_PER_PX = 0.002;
const RING_BASE = STARMAP_CONFIG.RETICLE_SIZE_PX * UNITS_PER_PX;
const RING_MIN = RING_BASE * (1 - VISUAL_CONFIG.selectionRingScaleAmplitude);
const RING_MAX = RING_BASE * (1 + VISUAL_CONFIG.selectionRingScaleAmplitude);

describe('Selection Ring Animations - Property Tests', () => {
  let scene, camera, star;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 100);

    star = {
      data: { id: 1, name: 'Sol', x: 0, y: 0, z: 0 },
      sprite: new THREE.Sprite(new THREE.SpriteMaterial({ color: 0xffffff })),
      label: new THREE.Sprite(new THREE.SpriteMaterial()),
      position: new THREE.Vector3(0, 0, 0),
      originalColor: 0xffffff,
      selectionRing: null,
    };

    scene.add(star.sprite);
    scene.add(star.label);
  });

  afterEach(() => {
    deselectStar();
    _resetState();
    scene.clear();
  });

  describe('Selection Ring Scale Animation', () => {
    it('should always keep scale within reasonable bounds', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateSelectionRingAnimations(time, false, UNITS_PER_PX);

          const scale = star.selectionRing.scale.x;

          // Scale stays within the base size ± the pulse amplitude
          expect(scale).toBeGreaterThanOrEqual(RING_MIN - 1e-12);
          expect(scale).toBeLessThanOrEqual(RING_MAX + 1e-12);
        })
      );
    });

    it('should produce same scale for same time value', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const scale1 = star.selectionRing.scale.x;

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const scale2 = star.selectionRing.scale.x;

          expect(scale1).toBe(scale2);
        })
      );
    });

    it('should produce periodic animation', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          // Calculate period based on pulse speed
          const period = (2 * Math.PI) / VISUAL_CONFIG.selectionRingPulseSpeed;

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const scale1 = star.selectionRing.scale.x;

          updateSelectionRingAnimations(time + period, false, UNITS_PER_PX);
          const scale2 = star.selectionRing.scale.x;

          // Should be approximately equal (within floating point precision)
          expect(Math.abs(scale1 - scale2)).toBeLessThan(0.001);
        })
      );
    });
  });

  describe('Selection Ring Opacity Animation', () => {
    it('should always keep opacity within valid range', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateSelectionRingAnimations(time, false, UNITS_PER_PX);

          const opacity = star.selectionRing.material.opacity;

          // Opacity should be between 0.5 and 1.0 (0.75 ± 0.25)
          expect(opacity).toBeGreaterThanOrEqual(0.5);
          expect(opacity).toBeLessThanOrEqual(1.0);
        })
      );
    });

    it('should produce same opacity for same time value', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const opacity1 = star.selectionRing.material.opacity;

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const opacity2 = star.selectionRing.material.opacity;

          expect(opacity1).toBe(opacity2);
        })
      );
    });
  });

  describe('Selection Ring Rotation Animation', () => {
    // material.rotation is a float32 shader uniform; the caller passes
    // Date.now()/1000 (~1.8e9), and sin/cos of an unwrapped angle that large
    // made the reticle and current-system marker vanish on the GPU
    it('should keep ring and marker rotation within [0, 2π) for wall-clock times', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 4e9, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateCurrentSystemIndicator(scene, camera, [star], star.data.id);
          updateSelectionRingAnimations(time, false, UNITS_PER_PX);

          for (const rotation of [
            star.selectionRing.material.rotation,
            getCurrentSystemIndicator().material.rotation,
          ]) {
            expect(rotation).toBeGreaterThanOrEqual(0);
            expect(rotation).toBeLessThan(2 * Math.PI);
          }
        })
      );
    });

    it('should produce same rotation for same time value', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const rotation1 = star.selectionRing.material.rotation;

          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          const rotation2 = star.selectionRing.material.rotation;

          expect(rotation1).toBe(rotation2);
        })
      );
    });

    it('should rotate at constant speed', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          (time, delta) => {
            selectStar(star, scene, camera);

            updateSelectionRingAnimations(time, false, UNITS_PER_PX);
            const rotation1 = star.selectionRing.material.rotation;

            updateSelectionRingAnimations(time + delta, false, UNITS_PER_PX);
            const rotation2 = star.selectionRing.material.rotation;

            // Rotation wraps at 2π, so compare angles modulo a full turn
            const TWO_PI = 2 * Math.PI;
            const turned =
              (((rotation2 - rotation1) % TWO_PI) + TWO_PI) % TWO_PI;
            const expected = (0.2 * delta) % TWO_PI;
            const diff = Math.abs(turned - expected);

            // 0.2 radians per second
            expect(Math.min(diff, TWO_PI - diff)).toBeLessThan(0.001);
          }
        )
      );
    });
  });

  describe('Animation Consistency', () => {
    it('should not throw for any time value', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000, max: 1000, noNaN: true }),
          (time) => {
            selectStar(star, scene, camera);
            expect(() =>
              updateSelectionRingAnimations(time, false, UNITS_PER_PX)
            ).not.toThrow();
          }
        )
      );
    });

    it('should handle rapid time changes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.double({ min: 0, max: 1000, noNaN: true }), {
            minLength: 10,
            maxLength: 100,
          }),
          (times) => {
            selectStar(star, scene, camera);

            times.forEach((time) => {
              expect(() =>
                updateSelectionRingAnimations(time, false, UNITS_PER_PX)
              ).not.toThrow();

              // Verify values are still valid
              const scale = star.selectionRing.scale.x;
              const opacity = star.selectionRing.material.opacity;

              expect(scale).toBeGreaterThanOrEqual(RING_MIN - 1e-12);
              expect(scale).toBeLessThanOrEqual(RING_MAX + 1e-12);
              expect(opacity).toBeGreaterThanOrEqual(0.5);
              expect(opacity).toBeLessThanOrEqual(1.0);
            });
          }
        )
      );
    });
  });

  describe('Selection Ring Position', () => {
    it('should always position ring at star position', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          fc.double({ min: -100, max: 100, noNaN: true }),
          (x, y, z) => {
            star.position.set(x, y, z);
            star.sprite.position.set(x, y, z);

            selectStar(star, scene, camera);

            // Use closeTo for floating point comparison
            expect(star.selectionRing.position.x).toBeCloseTo(x, 10);
            expect(star.selectionRing.position.y).toBeCloseTo(y, 10);
            expect(star.selectionRing.position.z).toBeCloseTo(z, 10);
          }
        )
      );
    });
  });

  describe('Selection Ring Visibility', () => {
    it('should be visible when star is selected', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateSelectionRingAnimations(time, false, UNITS_PER_PX);

          expect(star.selectionRing.visible).toBe(true);
        })
      );
    });

    it('should be hidden when star is deselected', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateSelectionRingAnimations(time, false, UNITS_PER_PX);
          deselectStar();

          expect(star.selectionRing.visible).toBe(false);
        })
      );
    });
  });
});
