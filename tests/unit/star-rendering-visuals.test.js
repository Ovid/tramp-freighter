import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { createStarSystems } from '../../src/game/engine/stars.js';
import { getStarVisuals } from '../../src/game/utils/star-visuals.js';

describe('Star Rendering with Visual Properties', () => {
  let scene;
  let consoleLogSpy;

  beforeEach(() => {
    scene = new THREE.Scene();
    // Suppress console.log output during tests
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up scene
    while (scene.children.length > 0) {
      const child = scene.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
      scene.remove(child);
    }
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  describe('Star Color Integration', () => {
    it('should apply correct color for G-type stars', () => {
      const starData = [{ id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 }];

      const stars = createStarSystems(scene, starData);

      expect(stars).toHaveLength(1);
      const visuals = getStarVisuals('G2');
      const expectedColor = parseInt(visuals.color.substring(1), 16);
      expect(stars[0].originalColor).toBe(expectedColor);
    });

    it('should apply correct color for M-type stars', () => {
      const starData = [
        { id: 1, name: 'Proxima', type: 'M5.5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('M5.5');
      const expectedColor = parseInt(visuals.color.substring(1), 16);
      expect(stars[0].originalColor).toBe(expectedColor);
    });

    it('should apply correct color for A-type stars', () => {
      const starData = [
        { id: 2, name: 'Sirius', type: 'A1V', x: 20, y: 20, z: 20 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('A1V');
      const expectedColor = parseInt(visuals.color.substring(1), 16);
      expect(stars[0].originalColor).toBe(expectedColor);
    });

    it('should apply correct color for white dwarfs', () => {
      const starData = [
        { id: 3, name: 'Sirius B', type: 'DA2', x: 30, y: 30, z: 30 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('DA2');
      const expectedColor = parseInt(visuals.color.substring(1), 16);
      expect(stars[0].originalColor).toBe(expectedColor);
    });

    it('should apply correct color for brown dwarfs', () => {
      const starData = [
        { id: 4, name: 'Brown Dwarf', type: 'L5', x: 40, y: 40, z: 40 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('L5');
      const expectedColor = parseInt(visuals.color.substring(1), 16);
      expect(stars[0].originalColor).toBe(expectedColor);
    });
  });

  describe('Star Size Integration', () => {
    it('should apply correct size for G-type stars (solar radius)', () => {
      const starData = [{ id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 }];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('G2');
      expect(visuals.radius).toBe(1.0);

      // Sprite size should be base size (30) * radius (1.0) = 30
      expect(stars[0].sprite.scale.x).toBe(30);
      expect(stars[0].sprite.scale.y).toBe(30);
    });

    it('should apply larger size for O-type stars', () => {
      const starData = [
        { id: 1, name: 'Hot Star', type: 'O5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('O5');
      expect(visuals.radius).toBe(3.0);

      // Sprite size should be base size (30) * radius (3.0) = 90
      expect(stars[0].sprite.scale.x).toBe(90);
      expect(stars[0].sprite.scale.y).toBe(90);
    });

    it('should apply smaller size for M-type stars', () => {
      const starData = [
        { id: 2, name: 'Red Dwarf', type: 'M5', x: 20, y: 20, z: 20 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('M5');
      expect(visuals.radius).toBe(0.5);

      // Sprite size should be base size (30) * radius (0.5) = 15
      expect(stars[0].sprite.scale.x).toBe(15);
      expect(stars[0].sprite.scale.y).toBe(15);
    });

    it('should apply visibility-boosted size for white dwarfs', () => {
      const starData = [
        { id: 3, name: 'White Dwarf', type: 'DA2', x: 30, y: 30, z: 30 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('DA2');
      expect(visuals.radius).toBe(0.35);

      // Sprite size should be base size (30) * radius (0.35) = 10.5
      expect(stars[0].sprite.scale.x).toBe(10.5);
      expect(stars[0].sprite.scale.y).toBe(10.5);
    });

    it('should apply visibility-boosted size for brown dwarfs', () => {
      const starData = [
        { id: 4, name: 'Brown Dwarf', type: 'L5', x: 40, y: 40, z: 40 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('L5');
      expect(visuals.radius).toBe(0.3);

      // Sprite size should be base size (30) * radius (0.3) = 9
      expect(stars[0].sprite.scale.x).toBe(9);
      expect(stars[0].sprite.scale.y).toBe(9);
    });
  });

  describe('Relative Size Comparison', () => {
    it('should render O-type stars larger than G-type stars', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Hot Star', type: 'O5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const gTypeStar = stars.find((s) => s.data.type === 'G2');
      const oTypeStar = stars.find((s) => s.data.type === 'O5');

      expect(oTypeStar.sprite.scale.x).toBeGreaterThan(
        gTypeStar.sprite.scale.x
      );
    });

    it('should render M-type stars smaller than G-type stars', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Red Dwarf', type: 'M5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const gTypeStar = stars.find((s) => s.data.type === 'G2');
      const mTypeStar = stars.find((s) => s.data.type === 'M5');

      expect(mTypeStar.sprite.scale.x).toBeLessThan(gTypeStar.sprite.scale.x);
    });

    it('should render white dwarfs smaller than main sequence stars', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'White Dwarf', type: 'DA2', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const gTypeStar = stars.find((s) => s.data.type === 'G2');
      const whiteDwarf = stars.find((s) => s.data.type === 'DA2');

      expect(whiteDwarf.sprite.scale.x).toBeLessThan(gTypeStar.sprite.scale.x);
    });

    it('should maintain size progression from hot to cool stars', () => {
      const starData = [
        { id: 0, name: 'O Star', type: 'O5', x: 0, y: 0, z: 0 },
        { id: 1, name: 'B Star', type: 'B3', x: 10, y: 0, z: 0 },
        { id: 2, name: 'A Star', type: 'A2', x: 20, y: 0, z: 0 },
        { id: 3, name: 'F Star', type: 'F5', x: 30, y: 0, z: 0 },
        { id: 4, name: 'G Star', type: 'G2', x: 40, y: 0, z: 0 },
        { id: 5, name: 'K Star', type: 'K5', x: 50, y: 0, z: 0 },
        { id: 6, name: 'M Star', type: 'M5', x: 60, y: 0, z: 0 },
      ];

      const stars = createStarSystems(scene, starData);

      const sizes = [
        stars.find((s) => s.data.type === 'O5').sprite.scale.x,
        stars.find((s) => s.data.type === 'B3').sprite.scale.x,
        stars.find((s) => s.data.type === 'A2').sprite.scale.x,
        stars.find((s) => s.data.type === 'F5').sprite.scale.x,
        stars.find((s) => s.data.type === 'G2').sprite.scale.x,
        stars.find((s) => s.data.type === 'K5').sprite.scale.x,
        stars.find((s) => s.data.type === 'M5').sprite.scale.x,
      ];

      // Verify descending order (hot stars are larger)
      for (let i = 0; i < sizes.length - 1; i++) {
        expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i + 1]);
      }
    });
  });

  describe('Visual Properties Storage', () => {
    it('should store visual properties in star object', () => {
      const starData = [{ id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 }];

      const stars = createStarSystems(scene, starData);

      expect(stars[0]).toHaveProperty('visualProperties');
      expect(stars[0].visualProperties).toHaveProperty('color');
      expect(stars[0].visualProperties).toHaveProperty('radius');
    });

    it('should store correct visual properties for each star', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Proxima', type: 'M5.5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const solVisuals = getStarVisuals('G2');
      const proximaVisuals = getStarVisuals('M5.5');

      expect(stars[0].visualProperties.color).toBe(solVisuals.color);
      expect(stars[0].visualProperties.radius).toBe(solVisuals.radius);

      expect(stars[1].visualProperties.color).toBe(proximaVisuals.color);
      expect(stars[1].visualProperties.radius).toBe(proximaVisuals.radius);
    });
  });

  describe('Scene Integration', () => {
    it('should add stars to the scene', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Proxima', type: 'M5.5', x: 10, y: 10, z: 10 },
      ];

      const initialChildCount = scene.children.length;
      createStarSystems(scene, starData);

      // Each star adds 2 children: sprite + label
      expect(scene.children.length).toBe(
        initialChildCount + starData.length * 2
      );
    });

    it('should position stars at correct coordinates', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 100, y: 200, z: 300 },
      ];

      const stars = createStarSystems(scene, starData);

      expect(stars[0].sprite.position.x).toBe(100);
      expect(stars[0].sprite.position.y).toBe(200);
      expect(stars[0].sprite.position.z).toBe(300);
    });

    it('should create labels for all stars', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Proxima', type: 'M5.5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      stars.forEach((star) => {
        expect(star.label).toBeDefined();
        expect(star.label).toBeInstanceOf(THREE.Sprite);
      });
    });
  });

  describe('Material Caching', () => {
    it('should reuse materials for stars with same spectral class', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Alpha Centauri A', type: 'G2V', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      // Both G-type stars should share the same material instance
      expect(stars[0].sprite.material).toBe(stars[1].sprite.material);
    });

    it('should create different materials for different spectral classes', () => {
      const starData = [
        { id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Proxima', type: 'M5.5', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      // Different spectral classes should have different materials
      expect(stars[0].sprite.material).not.toBe(stars[1].sprite.material);
    });
  });

  describe('Real Star Examples', () => {
    it('should render Sol with correct properties', () => {
      const starData = [{ id: 0, name: 'Sol', type: 'G2V', x: 0, y: 0, z: 0 }];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('G2V');
      expect(stars[0].visualProperties.color).toBe(visuals.color);
      expect(stars[0].visualProperties.radius).toBe(1.0);
      expect(stars[0].sprite.scale.x).toBe(30); // Base size * 1.0
    });

    it('should render Sirius A with correct properties', () => {
      const starData = [
        { id: 1, name: 'Sirius A', type: 'A1V', x: 10, y: 10, z: 10 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('A1V');
      expect(stars[0].visualProperties.color).toBe(visuals.color);
      expect(stars[0].visualProperties.radius).toBe(1.8);
      expect(stars[0].sprite.scale.x).toBe(54); // Base size * 1.8
    });

    it('should render Proxima Centauri with correct properties', () => {
      const starData = [
        {
          id: 2,
          name: 'Proxima Centauri',
          type: 'M5.5Ve',
          x: 20,
          y: 20,
          z: 20,
        },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('M5.5Ve');
      expect(stars[0].visualProperties.color).toBe(visuals.color);
      expect(stars[0].visualProperties.radius).toBe(0.5);
      expect(stars[0].sprite.scale.x).toBe(15); // Base size * 0.5
    });

    it('should render Sirius B (white dwarf) with correct properties', () => {
      const starData = [
        { id: 3, name: 'Sirius B', type: 'DA2', x: 30, y: 30, z: 30 },
      ];

      const stars = createStarSystems(scene, starData);

      const visuals = getStarVisuals('DA2');
      expect(stars[0].visualProperties.color).toBe(visuals.color);
      expect(stars[0].visualProperties.radius).toBe(0.35);
      expect(stars[0].sprite.scale.x).toBe(10.5); // Base size * 0.35
    });
  });

  describe('Multiple Stars', () => {
    it('should handle multiple stars with different properties', () => {
      const starData = [
        { id: 0, name: 'O Star', type: 'O5', x: 0, y: 0, z: 0 },
        { id: 1, name: 'G Star', type: 'G2', x: 10, y: 0, z: 0 },
        { id: 2, name: 'M Star', type: 'M5', x: 20, y: 0, z: 0 },
        { id: 3, name: 'White Dwarf', type: 'DA2', x: 30, y: 0, z: 0 },
      ];

      const stars = createStarSystems(scene, starData);

      expect(stars).toHaveLength(4);

      // Verify each star has correct properties
      stars.forEach((star) => {
        expect(star.visualProperties).toBeDefined();
        expect(star.sprite.scale.x).toBeGreaterThan(0);
        expect(star.originalColor).toBeGreaterThan(0);
      });
    });

    it('should create visually distinct stars', () => {
      const starData = [
        { id: 0, name: 'Blue Star', type: 'B3', x: 0, y: 0, z: 0 },
        { id: 1, name: 'Yellow Star', type: 'G2', x: 10, y: 0, z: 0 },
        { id: 2, name: 'Red Star', type: 'M5', x: 20, y: 0, z: 0 },
      ];

      const stars = createStarSystems(scene, starData);

      // All stars should have different colors
      const colors = stars.map((s) => s.originalColor);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(3);

      // All stars should have different sizes
      const sizes = stars.map((s) => s.sprite.scale.x);
      const uniqueSizes = new Set(sizes);
      expect(uniqueSizes.size).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty star data', () => {
      const starData = [];

      const stars = createStarSystems(scene, starData);

      expect(stars).toHaveLength(0);
    });

    it('should handle stars at origin', () => {
      const starData = [{ id: 0, name: 'Sol', type: 'G2', x: 0, y: 0, z: 0 }];

      const stars = createStarSystems(scene, starData);

      expect(stars[0].sprite.position.x).toBe(0);
      expect(stars[0].sprite.position.y).toBe(0);
      expect(stars[0].sprite.position.z).toBe(0);
    });

    it('should handle stars with negative coordinates', () => {
      const starData = [
        { id: 0, name: 'Star', type: 'G2', x: -100, y: -200, z: -300 },
      ];

      const stars = createStarSystems(scene, starData);

      expect(stars[0].sprite.position.x).toBe(-100);
      expect(stars[0].sprite.position.y).toBe(-200);
      expect(stars[0].sprite.position.z).toBe(-300);
    });
  });
});
