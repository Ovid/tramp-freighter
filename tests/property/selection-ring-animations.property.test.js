import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import {
  selectStar,
  deselectStar,
  updateSelectionRingAnimations,
  _resetState,
} from '../../src/game/engine/interaction.js';
import { VISUAL_CONFIG } from '../../src/game/constants.js';

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
          updateSelectionRingAnimations(time);

          const scale = star.selectionRing.scale.x;

          // Scale should be between 0.92 and 1.08 (1.0 ± 0.08)
          expect(scale).toBeGreaterThanOrEqual(0.92);
          expect(scale).toBeLessThanOrEqual(1.08);
        })
      );
    });

    it('should produce same scale for same time value', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          updateSelectionRingAnimations(time);
          const scale1 = star.selectionRing.scale.x;

          updateSelectionRingAnimations(time);
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

          updateSelectionRingAnimations(time);
          const scale1 = star.selectionRing.scale.x;

          updateSelectionRingAnimations(time + period);
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
          updateSelectionRingAnimations(time);

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

          updateSelectionRingAnimations(time);
          const opacity1 = star.selectionRing.material.opacity;

          updateSelectionRingAnimations(time);
          const opacity2 = star.selectionRing.material.opacity;

          expect(opacity1).toBe(opacity2);
        })
      );
    });
  });

  describe('Selection Ring Rotation Animation', () => {
    it('should always increase rotation over time', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0.1, max: 10, noNaN: true }),
          (time, delta) => {
            selectStar(star, scene, camera);

            updateSelectionRingAnimations(time);
            const rotation1 = star.selectionRing.rotation.z;

            updateSelectionRingAnimations(time + delta);
            const rotation2 = star.selectionRing.rotation.z;

            expect(rotation2).toBeGreaterThan(rotation1);
          }
        )
      );
    });

    it('should produce same rotation for same time value', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);

          updateSelectionRingAnimations(time);
          const rotation1 = star.selectionRing.rotation.z;

          updateSelectionRingAnimations(time);
          const rotation2 = star.selectionRing.rotation.z;

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

            updateSelectionRingAnimations(time);
            const rotation1 = star.selectionRing.rotation.z;

            updateSelectionRingAnimations(time + delta);
            const rotation2 = star.selectionRing.rotation.z;

            const rotationSpeed = (rotation2 - rotation1) / delta;

            // Rotation speed should be 0.2 radians per second
            expect(Math.abs(rotationSpeed - 0.2)).toBeLessThan(0.001);
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
            expect(() => updateSelectionRingAnimations(time)).not.toThrow();
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
              expect(() => updateSelectionRingAnimations(time)).not.toThrow();

              // Verify values are still valid
              const scale = star.selectionRing.scale.x;
              const opacity = star.selectionRing.material.opacity;

              expect(scale).toBeGreaterThanOrEqual(0.92);
              expect(scale).toBeLessThanOrEqual(1.08);
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
          updateSelectionRingAnimations(time);

          expect(star.selectionRing.visible).toBe(true);
        })
      );
    });

    it('should be hidden when star is deselected', () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 1000, noNaN: true }), (time) => {
          selectStar(star, scene, camera);
          updateSelectionRingAnimations(time);
          deselectStar();

          expect(star.selectionRing.visible).toBe(false);
        })
      );
    });
  });
});
