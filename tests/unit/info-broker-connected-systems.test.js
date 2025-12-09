'use strict';

import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Unit tests for Information Broker filtering to connected systems only
 */
describe('Information Broker - Connected Systems Filter', () => {
  it('should only list systems connected to current system', () => {
    // Create test data with 4 systems
    const starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
      { id: 3, name: 'Wolf 359', x: 0, y: 0, z: 10, type: 'M6V', st: 0 },
    ];

    // Sol connects to Alpha Centauri and Barnard, but NOT Wolf 359
    const wormholeData = [
      [0, 1], // Sol <-> Alpha Centauri
      [0, 2], // Sol <-> Barnard
    ];

    const navigationSystem = new NavigationSystem(starData, wormholeData);
    const gameStateManager = new GameStateManager(
      starData,
      wormholeData,
      navigationSystem
    );
    gameStateManager.initNewGame();

    // Get available intelligence
    const available = gameStateManager.listAvailableIntelligence();

    // Should only show connected systems (Alpha Centauri and Barnard)
    expect(available.length).toBe(2);

    const systemNames = available.map((opt) => opt.systemName);
    expect(systemNames).toContain('Alpha Centauri');
    expect(systemNames).toContain('Barnard');
    expect(systemNames).not.toContain('Wolf 359');
    expect(systemNames).not.toContain('Sol'); // Current system should not be in list
  });

  it('should update available systems when player moves to different system', () => {
    const starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
      { id: 3, name: 'Wolf 359', x: 0, y: 0, z: 10, type: 'M6V', st: 0 },
    ];

    // Sol -> Alpha Centauri -> Wolf 359
    // Sol -> Barnard
    const wormholeData = [
      [0, 1], // Sol <-> Alpha Centauri
      [0, 2], // Sol <-> Barnard
      [1, 3], // Alpha Centauri <-> Wolf 359
    ];

    const navigationSystem = new NavigationSystem(starData, wormholeData);
    const gameStateManager = new GameStateManager(
      starData,
      wormholeData,
      navigationSystem
    );
    gameStateManager.initNewGame();

    // At Sol: should see Alpha Centauri and Barnard
    let available = gameStateManager.listAvailableIntelligence();
    expect(available.length).toBe(2);
    let systemNames = available.map((opt) => opt.systemName);
    expect(systemNames).toContain('Alpha Centauri');
    expect(systemNames).toContain('Barnard');

    // Move to Alpha Centauri
    gameStateManager.updateLocation(1);

    // At Alpha Centauri: should see Sol and Wolf 359
    available = gameStateManager.listAvailableIntelligence();
    expect(available.length).toBe(2);
    systemNames = available.map((opt) => opt.systemName);
    expect(systemNames).toContain('Sol');
    expect(systemNames).toContain('Wolf 359');
    expect(systemNames).not.toContain('Barnard'); // Not connected to Alpha Centauri
  });

  it('should return empty list if current system has no connections', () => {
    const starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
    ];

    // No wormhole connections
    const wormholeData = [];

    const navigationSystem = new NavigationSystem(starData, wormholeData);
    const gameStateManager = new GameStateManager(
      starData,
      wormholeData,
      navigationSystem
    );
    gameStateManager.initNewGame();

    const available = gameStateManager.listAvailableIntelligence();
    expect(available.length).toBe(0);
  });
});
