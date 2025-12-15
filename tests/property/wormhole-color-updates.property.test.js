import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import {
  createWormholeLines,
  determineConnectionColor,
  updateConnectionColors,
  clearWormholeConnections,
} from '../../src/game/engine/wormholes';

describe('Property: Wormhole Color Updates', () => {
  let scene;
  let starObjects;
  let connections;
  let consoleLogSpy;

  beforeEach(() => {
    // Clear wormhole connections before each test
    clearWormholeConnections();

    // Mock console.log to suppress output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    scene = new THREE.Scene();

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
      [1, 2],
    ];
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it('should always return one of three color states', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }),
        fc.float({ min: 0, max: 100 }),
        (currentFuel, fuelCost) => {
          const result = determineConnectionColor(currentFuel, fuelCost);
          expect(['insufficient', 'warning', 'sufficient']).toContain(result);
        }
      )
    );
  });

  it('should return "insufficient" when fuel is less than cost', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }),
        fc.float({ min: 0, max: 100 }),
        (currentFuel, fuelCost) => {
          fc.pre(currentFuel < fuelCost);
          const result = determineConnectionColor(currentFuel, fuelCost);
          expect(result).toBe('insufficient');
        }
      )
    );
  });

  it('should return "warning" when remaining fuel is exactly in 10-20% range', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 20, max: 100 }),
        fc.float({ min: 0, max: 80 }),
        (currentFuel, fuelCost) => {
          fc.pre(currentFuel >= fuelCost);
          const remaining = currentFuel - fuelCost;
          fc.pre(remaining >= 10 && remaining <= 20);
          const result = determineConnectionColor(currentFuel, fuelCost);
          expect(result).toBe('warning');
        }
      )
    );
  });

  it('should return "sufficient" when remaining fuel is above 20%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 30, max: 100 }),
        fc.float({ min: 0, max: 70 }),
        (currentFuel, fuelCost) => {
          fc.pre(currentFuel >= fuelCost);
          const remaining = currentFuel - fuelCost;
          fc.pre(remaining > 20);
          const result = determineConnectionColor(currentFuel, fuelCost);
          expect(result).toBe('sufficient');
        }
      )
    );
  });

  it('should update all connection colors when fuel changes', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 100 }), (fuel) => {
        const wormholes = createWormholeLines(scene, connections, starObjects);

        const mockGameStateManager = {
          state: {
            player: { currentSystem: 0 },
            ship: { fuel },
          },
        };

        updateConnectionColors(mockGameStateManager);

        // All connections should have their colors updated
        wormholes.forEach((conn) => {
          expect(conn.line.material.color).toBeDefined();
          expect(conn.line.material.opacity).toBeGreaterThan(0);
        });
      })
    );
  });

  it('should set higher opacity for connections from current system', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.float({ min: 0, max: 100 }),
        (currentSystem, fuel) => {
          const wormholes = createWormholeLines(
            scene,
            connections,
            starObjects
          );

          const mockGameStateManager = {
            state: {
              player: { currentSystem },
              ship: { fuel },
            },
          };

          updateConnectionColors(mockGameStateManager);

          // Connections from current system should have higher opacity
          const currentSystemConnections = wormholes.filter(
            (conn) =>
              conn.systemId1 === currentSystem ||
              conn.systemId2 === currentSystem
          );

          const otherConnections = wormholes.filter(
            (conn) =>
              conn.systemId1 !== currentSystem &&
              conn.systemId2 !== currentSystem
          );

          if (
            currentSystemConnections.length > 0 &&
            otherConnections.length > 0
          ) {
            const currentOpacity =
              currentSystemConnections[0].line.material.opacity;
            const otherOpacity = otherConnections[0].line.material.opacity;
            expect(currentOpacity).toBeGreaterThanOrEqual(otherOpacity);
          }
        }
      )
    );
  });

  it('should handle system changes without errors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 0, max: 2 }),
        fc.float({ min: 0, max: 100 }),
        (system1, system2, fuel) => {
          const wormholes = createWormholeLines(
            scene,
            connections,
            starObjects
          );

          const mockGameStateManager = {
            state: {
              player: { currentSystem: system1 },
              ship: { fuel },
            },
          };

          updateConnectionColors(mockGameStateManager);

          // Change system
          mockGameStateManager.state.player.currentSystem = system2;
          updateConnectionColors(mockGameStateManager);

          // Should not throw and all connections should still be valid
          wormholes.forEach((conn) => {
            expect(conn.line.material.color).toBeDefined();
            expect(conn.line.material.opacity).toBeGreaterThan(0);
          });
        }
      )
    );
  });
});
