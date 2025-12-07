/**
 * Property-Based Tests for Visited Systems Tracking
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 12: Visited Systems Tracking', () => {
  let navSystem;
  let gameStateManager;

  beforeEach(() => {
    navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  /**
   * Feature: tramp-freighter-core-loop, Property 12: Visited Systems Tracking
   *
   * For any jump to a previously unvisited system, that system's ID should be added
   * to the visited systems list.
   */
  it('should add unvisited systems to visited list after jump', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid wormhole connection
        fc.constantFrom(...TEST_WORMHOLE_DATA),
        async (connection) => {
          const [systemId1, systemId2] = connection;

          // Set up game state at first system
          gameStateManager.updateLocation(systemId1);
          gameStateManager.updateFuel(100);

          // Clear visited systems except current
          const state = gameStateManager.getState();
          state.world.visitedSystems = [systemId1];

          // Verify target is not visited yet
          expect(gameStateManager.isSystemVisited(systemId2)).toBe(false);

          // Execute jump
          const result = await navSystem.executeJump(
            gameStateManager,
            systemId2
          );

          // Should succeed
          expect(result.success).toBe(true);

          // Target system should now be in visited list
          expect(gameStateManager.isSystemVisited(systemId2)).toBe(true);

          // Visited systems should contain both systems
          const visitedSystems =
            gameStateManager.getState().world.visitedSystems;
          expect(visitedSystems).toContain(systemId1);
          expect(visitedSystems).toContain(systemId2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not duplicate systems in visited list', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid wormhole connection
        fc.constantFrom(...TEST_WORMHOLE_DATA),
        async (connection) => {
          const [systemId1, systemId2] = connection;

          // Set up game state
          gameStateManager.updateLocation(systemId1);
          gameStateManager.updateFuel(100);

          // Make first jump to systemId2
          await navSystem.executeJump(gameStateManager, systemId2);

          const visitedAfterFirstJump = [
            ...gameStateManager.getState().world.visitedSystems,
          ];

          // Make return jump to systemId1 (already visited)
          gameStateManager.updateFuel(100); // Refuel
          await navSystem.executeJump(gameStateManager, systemId1);

          const visitedAfterSecondJump =
            gameStateManager.getState().world.visitedSystems;

          // Count occurrences of systemId1 in visited list
          const countSystemId1 = visitedAfterSecondJump.filter(
            (id) => id === systemId1
          ).length;

          // Should only appear once
          expect(countSystemId1).toBe(1);

          // Visited list should not have grown (both systems already visited)
          expect(visitedAfterSecondJump.length).toBe(
            visitedAfterFirstJump.length
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track multiple unique systems across a journey', async () => {
    // Create a journey through multiple connected systems
    // Sol (0) -> Alpha Centauri (1) -> Epsilon Eridani (13)

    // Start at Sol
    gameStateManager.updateLocation(0);
    gameStateManager.updateFuel(100);

    // Initial state: only Sol visited
    expect(gameStateManager.getState().world.visitedSystems).toEqual([0]);

    // Jump to Alpha Centauri
    await navSystem.executeJump(gameStateManager, 1);

    // Should have Sol and Alpha Centauri
    let visited = gameStateManager.getState().world.visitedSystems;
    expect(visited).toContain(0);
    expect(visited).toContain(1);
    expect(visited.length).toBe(2);

    // Jump to Epsilon Eridani
    gameStateManager.updateFuel(100);
    await navSystem.executeJump(gameStateManager, 13);

    // Should have all three systems
    visited = gameStateManager.getState().world.visitedSystems;
    expect(visited).toContain(0);
    expect(visited).toContain(1);
    expect(visited).toContain(13);
    expect(visited.length).toBe(3);
  });

  it('should preserve visited systems list when jump fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate two random system IDs (may not be connected)
        fc.constantFrom(...TEST_STAR_DATA.map((s) => s.id)),
        fc.constantFrom(...TEST_STAR_DATA.map((s) => s.id)),
        async (systemId1, systemId2) => {
          // Skip if same system
          if (systemId1 === systemId2) return true;

          // Set up game state with low fuel to potentially cause failure
          gameStateManager.updateLocation(systemId1);
          gameStateManager.updateFuel(5); // Very low fuel

          const initialVisited = [
            ...gameStateManager.getState().world.visitedSystems,
          ];

          // Attempt jump (may fail)
          const result = await navSystem.executeJump(
            gameStateManager,
            systemId2
          );

          if (!result.success) {
            // If jump failed, visited list should be unchanged
            const finalVisited =
              gameStateManager.getState().world.visitedSystems;
            expect(finalVisited).toEqual(initialVisited);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
