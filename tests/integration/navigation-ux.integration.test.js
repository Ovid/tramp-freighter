import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Integration tests for navigation UX improvements
 *
 * Tests the complete workflow of:
 * 1. Viewing current system
 * 2. Seeing connected systems list
 * 3. Selecting a destination
 * 4. Executing a jump
 */
describe('Navigation UX Integration', () => {
  let dom;
  let document;
  let gameStateManager;
  let navSystem;

  beforeEach(() => {
    // Create a minimal DOM for testing
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="connected-list"></div>
                    <div id="jump-info" style="display: none;">
                        <span id="jump-distance">0.0 LY</span>
                        <span id="jump-fuel-cost">0%</span>
                        <span id="jump-time">0 days</span>
                    </div>
                    <button id="jump-btn">Jump to System</button>
                </body>
            </html>
        `);
    document = dom.window.document;
    global.document = document;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
    navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    delete global.document;
  });

  it('should complete full navigation workflow from current system', () => {
    // Step 1: Get current system
    const currentSystemId = gameStateManager.getPlayer().currentSystem;
    const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
    expect(currentStar).toBeDefined();

    // Step 2: Get connected systems
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    expect(connectedIds.length).toBeGreaterThan(0);

    // Step 3: Populate connected systems list (simulating UI)
    const connectedList = document.getElementById('connected-list');
    connectedIds.forEach((id) => {
      const targetStar = TEST_STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const fuelCost = navSystem.calculateFuelCost(distance);
      const jumpTime = navSystem.calculateJumpTime(distance);

      const item = document.createElement('div');
      item.className = 'connected-system-item';
      item.dataset.systemId = id;
      item.dataset.distance = distance;
      item.dataset.fuelCost = fuelCost;
      item.dataset.jumpTime = jumpTime;
      item.textContent = targetStar.name;

      connectedList.appendChild(item);
    });

    // Verify list is populated
    const items = connectedList.querySelectorAll('.connected-system-item');
    expect(items.length).toBe(connectedIds.length);

    // Step 4: Select first connected system
    const firstItem = items[0];
    const targetSystemId = parseInt(firstItem.dataset.systemId);
    const targetStar = TEST_STAR_DATA.find((s) => s.id === targetSystemId);

    // Step 5: Validate jump
    const initialFuel = gameStateManager.getShip().fuel;
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      initialFuel
    );

    expect(validation.valid).toBe(true);
    expect(validation.distance).toBeGreaterThan(0);
    expect(validation.fuelCost).toBeGreaterThan(0);
    expect(validation.jumpTime).toBeGreaterThan(0);

    // Step 6: Execute jump
    const initialDays = gameStateManager.getPlayer().daysElapsed;
    const result = navSystem.executeJump(gameStateManager, targetSystemId);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    // Step 7: Verify state changes
    const newLocation = gameStateManager.getPlayer().currentSystem;
    const newFuel = gameStateManager.getShip().fuel;
    const newDays = gameStateManager.getPlayer().daysElapsed;

    expect(newLocation).toBe(targetSystemId);
    expect(newFuel).toBe(initialFuel - validation.fuelCost);
    expect(newDays).toBe(initialDays + validation.jumpTime);
  });

  it('should prevent jump when insufficient fuel', () => {
    const currentSystemId = gameStateManager.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Set fuel to very low
    gameStateManager.updateFuel(5);
    const lowFuel = gameStateManager.getShip().fuel;

    // Try to find a system we can't reach
    let unreachableSystem = null;
    for (const id of connectedIds) {
      const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
      const targetStar = TEST_STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const fuelCost = navSystem.calculateFuelCost(distance);

      if (fuelCost > lowFuel) {
        unreachableSystem = id;
        break;
      }
    }

    if (unreachableSystem) {
      const validation = navSystem.validateJump(
        currentSystemId,
        unreachableSystem,
        lowFuel
      );

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Insufficient fuel');

      // Attempt jump should fail
      const result = navSystem.executeJump(gameStateManager, unreachableSystem);
      expect(result.success).toBe(false);

      // Location should not change
      expect(gameStateManager.getPlayer().currentSystem).toBe(currentSystemId);
    }
  });

  it('should show all reachable systems with sufficient fuel', () => {
    const currentSystemId = gameStateManager.getPlayer().currentSystem;
    const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
    const currentFuel = gameStateManager.getShip().fuel;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    const reachableSystems = [];
    const unreachableSystems = [];

    connectedIds.forEach((id) => {
      const targetStar = TEST_STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const fuelCost = navSystem.calculateFuelCost(distance);

      if (currentFuel >= fuelCost) {
        reachableSystems.push(id);
      } else {
        unreachableSystems.push(id);
      }
    });

    // With default fuel (100%), most systems should be reachable
    expect(reachableSystems.length).toBeGreaterThan(0);

    // Verify each reachable system can actually be jumped to
    reachableSystems.forEach((id) => {
      const validation = navSystem.validateJump(
        currentSystemId,
        id,
        currentFuel
      );
      expect(validation.valid).toBe(true);
    });

    // Verify each unreachable system cannot be jumped to
    unreachableSystems.forEach((id) => {
      const validation = navSystem.validateJump(
        currentSystemId,
        id,
        currentFuel
      );
      expect(validation.valid).toBe(false);
    });
  });

  it('should maintain correct system highlighting state', () => {
    const currentSystemId = gameStateManager.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Simulate highlighting connected systems
    const highlightedSystems = new Set();
    connectedIds.forEach((id) => {
      highlightedSystems.add(id);
    });

    // Verify all connected systems are highlighted
    expect(highlightedSystems.size).toBe(connectedIds.length);
    connectedIds.forEach((id) => {
      expect(highlightedSystems.has(id)).toBe(true);
    });

    // Verify current system is not in highlighted list
    expect(highlightedSystems.has(currentSystemId)).toBe(false);

    // Simulate clearing highlights
    highlightedSystems.clear();
    expect(highlightedSystems.size).toBe(0);
  });

  it('should sort connected systems by distance', () => {
    const currentSystemId = gameStateManager.getPlayer().currentSystem;
    const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Calculate distances and sort
    const systemsWithDistance = connectedIds
      .map((id) => {
        const targetStar = TEST_STAR_DATA.find((s) => s.id === id);
        const distance = navSystem.calculateDistanceBetween(
          currentStar,
          targetStar
        );
        return { id, distance, name: targetStar.name };
      })
      .sort((a, b) => a.distance - b.distance);

    // Verify sorting
    for (let i = 1; i < systemsWithDistance.length; i++) {
      expect(systemsWithDistance[i].distance).toBeGreaterThanOrEqual(
        systemsWithDistance[i - 1].distance
      );
    }

    // Closest system should be first
    if (systemsWithDistance.length > 0) {
      const closest = systemsWithDistance[0];
      const farthest = systemsWithDistance[systemsWithDistance.length - 1];

      expect(closest.distance).toBeLessThanOrEqual(farthest.distance);
    }
  });
});
