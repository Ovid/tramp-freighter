import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from '../../vendor/three/build/three.module.js';
import {
  createWormholeLines,
  determineConnectionColor,
  updateConnectionColors,
  clearWormholeConnections,
} from '../../src/game/engine/wormholes';

describe('Wormhole Rendering', () => {
  let scene;
  let starObjects;
  let connections;
  let consoleLogSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Clear wormhole connections before each test
    clearWormholeConnections();

    // Mock console methods to suppress output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    scene = new THREE.Scene();

    // Create mock star objects
    starObjects = [
      {
        data: { id: 0, x: 0, y: 0, z: 0, name: 'Sol', r: 1 },
        position: { x: 0, y: 0, z: 0 },
      },
      {
        data: { id: 1, x: 10, y: 0, z: 0, name: 'Alpha Centauri', r: 1 },
        position: { x: 100, y: 0, z: 0 },
      },
      {
        data: { id: 2, x: 0, y: 10, z: 0, name: 'Barnard', r: 1 },
        position: { x: 0, y: 100, z: 0 },
      },
    ];

    connections = [
      [0, 1],
      [0, 2],
    ];
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('createWormholeLines', () => {
    it('should create line segments for each connection', () => {
      const wormholes = createWormholeLines(scene, connections, starObjects);

      expect(wormholes).toHaveLength(2);
      expect(scene.children.length).toBeGreaterThan(0);
    });

    it('should store connection data with pre-calculated distance and fuel cost', () => {
      const wormholes = createWormholeLines(scene, connections, starObjects);

      wormholes.forEach((conn) => {
        expect(conn).toHaveProperty('systemId1');
        expect(conn).toHaveProperty('systemId2');
        expect(conn).toHaveProperty('line');
        expect(conn).toHaveProperty('distance');
        expect(conn).toHaveProperty('fuelCost');
        expect(conn.distance).toBeGreaterThan(0);
        expect(conn.fuelCost).toBeGreaterThan(0);
      });
    });

    it('should skip connections with non-existent star IDs', () => {
      const invalidConnections = [
        [0, 1],
        [0, 999], // Invalid ID
      ];

      const wormholes = createWormholeLines(
        scene,
        invalidConnections,
        starObjects
      );

      expect(wormholes).toHaveLength(1);
    });

    it('should skip connections with unreachable stars', () => {
      const unreachableStars = [
        ...starObjects,
        {
          data: { id: 3, x: 20, y: 0, z: 0, name: 'Unreachable', r: 0 },
          position: { x: 200, y: 0, z: 0 },
        },
      ];

      const connectionsWithUnreachable = [
        [0, 1],
        [0, 3], // Unreachable
      ];

      const wormholes = createWormholeLines(
        scene,
        connectionsWithUnreachable,
        unreachableStars
      );

      expect(wormholes).toHaveLength(1);
    });

    it('should create LineSegments with correct geometry', () => {
      const wormholes = createWormholeLines(scene, connections, starObjects);

      wormholes.forEach((conn) => {
        expect(conn.line).toBeInstanceOf(THREE.LineSegments);
        expect(conn.line.geometry).toBeInstanceOf(THREE.BufferGeometry);
        expect(conn.line.material).toBeInstanceOf(THREE.LineBasicMaterial);
      });
    });
  });

  describe('determineConnectionColor', () => {
    it('should return "insufficient" when fuel is less than cost', () => {
      const result = determineConnectionColor(30, 50);
      expect(result).toBe('insufficient');
    });

    it('should return "warning" when remaining fuel is between 10-20%', () => {
      const result = determineConnectionColor(65, 50);
      expect(result).toBe('warning');
    });

    it('should return "sufficient" when remaining fuel is above 20%', () => {
      const result = determineConnectionColor(80, 50);
      expect(result).toBe('sufficient');
    });

    it('should return "sufficient" when remaining fuel is below 10%', () => {
      const result = determineConnectionColor(55, 50);
      expect(result).toBe('sufficient');
    });
  });

  describe('updateConnectionColors', () => {
    it('should update connection colors based on current fuel', () => {
      const wormholes = createWormholeLines(scene, connections, starObjects);

      const mockGameStateManager = {
        state: {
          player: { currentSystem: 0 },
          ship: { fuel: 50 },
        },
      };

      updateConnectionColors(mockGameStateManager);

      // Verify that materials were updated (colors should be set)
      wormholes.forEach((conn) => {
        expect(conn.line.material.color).toBeDefined();
        expect(conn.line.material.opacity).toBeDefined();
      });
    });

    it('should set default color for connections not from current system', () => {
      const wormholes = createWormholeLines(scene, connections, starObjects);

      const mockGameStateManager = {
        state: {
          player: { currentSystem: 5 }, // Different system
          ship: { fuel: 50 },
        },
      };

      updateConnectionColors(mockGameStateManager);

      // All connections should have default color
      wormholes.forEach((conn) => {
        expect(conn.line.material.opacity).toBeLessThan(1);
      });
    });

    it('should handle missing gameStateManager gracefully', () => {
      createWormholeLines(scene, connections, starObjects);

      expect(() => {
        updateConnectionColors(null);
      }).not.toThrow();

      expect(() => {
        updateConnectionColors({});
      }).not.toThrow();
    });
  });
});
