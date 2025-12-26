import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { migrateFromV2_1ToV4 } from '../../src/game/state/state-validators.js';

/**
 * Unit tests for NPC save/load migration
 *
 * Tests version 3 save migrates to version 4 with empty npcs object
 * Tests version 4 save includes npcs field in schema
 * Requirements: 8.1, 8.3, 8.5
 */

describe('NPC Save/Load Migration Unit Tests', () => {
  let gameStateManager;
  let originalLocalStorage;

  beforeEach(() => {
    // Mock localStorage for testing
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  it('should migrate version 2.1.0 save to version 4.0.0 with empty npcs object', () => {
    // Create a mock v2.1.0 save state
    const v2_1_0State = {
      player: {
        credits: 1000,
        debt: 500,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Test Ship',
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [],
        quirks: [],
        upgrades: [],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
      meta: {
        version: '2.1.0',
        timestamp: Date.now(),
      },
    };

    // Migrate the state
    const migratedState = migrateFromV2_1ToV4(v2_1_0State, true);

    // Verify migration results
    expect(migratedState.meta.version).toBe('4.0.0');
    expect(migratedState.npcs).toBeDefined();
    expect(migratedState.npcs).toEqual({});
    expect(migratedState.dialogue).toBeDefined();
    expect(migratedState.dialogue).toEqual({
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    });

    // Verify original data is preserved
    expect(migratedState.player).toEqual(v2_1_0State.player);
    expect(migratedState.ship).toEqual(v2_1_0State.ship);
    expect(migratedState.world).toEqual(v2_1_0State.world);
  });

  it('should load version 2.1.0 save and migrate to version 4.0.0', () => {
    // Create a mock v2.1.0 save in localStorage
    const v2_1_0SaveData = {
      player: {
        credits: 2000,
        debt: 1000,
        currentSystem: 1,
        daysElapsed: 25,
      },
      ship: {
        name: 'Migration Test',
        fuel: 75,
        hull: 90,
        engine: 85,
        lifeSupport: 95,
        cargoCapacity: 60,
        cargo: [
          {
            good: 'electronics',
            qty: 10,
            buyPrice: 150,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 20,
          },
        ],
        quirks: ['efficient_engines'],
        upgrades: ['extended_fuel_tank'],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {
          0: {
            lastVisit: 5,
            prices: { electronics: 150, grain: 50 },
            source: 'visited',
          },
        },
        activeEvents: [],
        marketConditions: {
          0: { electronics: -5 },
        },
        currentSystemPrices: { electronics: 160, grain: 55 },
      },
      meta: {
        version: '2.1.0',
        timestamp: Date.now() - 1000,
      },
    };

    // Mock localStorage to return the v2.1.0 save
    global.localStorage = {
      getItem: () => JSON.stringify(v2_1_0SaveData),
      setItem: () => {},
      removeItem: () => {},
    };

    // Load the game (should trigger migration)
    const loadedState = gameStateManager.loadGame();

    // Verify state was loaded and migrated
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('4.0.0');

    // Verify NPC fields were added
    expect(loadedState.npcs).toBeDefined();
    expect(loadedState.npcs).toEqual({});
    expect(loadedState.dialogue).toBeDefined();
    expect(loadedState.dialogue.currentNpcId).toBeNull();
    expect(loadedState.dialogue.currentNodeId).toBeNull();
    expect(loadedState.dialogue.isActive).toBe(false);
    expect(loadedState.dialogue.display).toBeNull();

    // Verify original data is preserved
    expect(loadedState.player.credits).toBe(2000);
    expect(loadedState.ship.name).toBe('Migration Test');
    expect(loadedState.ship.cargo).toHaveLength(1);
    expect(loadedState.ship.cargo[0].good).toBe('electronics');
    expect(loadedState.world.visitedSystems).toEqual([0, 1]);
  });

  it('should include npcs field in version 4.0.0 save schema', () => {
    // Initialize new game (creates v4.0.0 state)
    gameStateManager.initNewGame();

    // Verify the state includes NPC fields
    expect(gameStateManager.state.meta.version).toBe('4.0.0');
    expect(gameStateManager.state.npcs).toBeDefined();
    expect(gameStateManager.state.npcs).toEqual({});
    expect(gameStateManager.state.dialogue).toBeDefined();
    expect(gameStateManager.state.dialogue).toEqual({
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    });

    // Add some NPC state
    gameStateManager.state.npcs['test_npc'] = {
      rep: 25,
      lastInteraction: 5,
      flags: ['met_before'],
      interactions: 3,
    };

    // Mock localStorage to capture save data
    let savedData = null;
    global.localStorage = {
      getItem: () => savedData,
      setItem: (key, value) => {
        savedData = value;
      },
      removeItem: () => {
        savedData = null;
      },
    };

    // Save the game
    gameStateManager.saveGame();

    // Verify save data includes NPC fields
    expect(savedData).not.toBeNull();
    const parsedSaveData = JSON.parse(savedData);
    expect(parsedSaveData.meta.version).toBe('4.0.0');
    expect(parsedSaveData.npcs).toBeDefined();
    expect(parsedSaveData.npcs.test_npc).toBeDefined();
    expect(parsedSaveData.npcs.test_npc.rep).toBe(25);
    expect(parsedSaveData.npcs.test_npc.flags).toEqual(['met_before']);
    expect(parsedSaveData.dialogue).toBeDefined();
  });

  it('should handle corrupted NPC data during load', () => {
    // Create save data with corrupted NPC structure
    const corruptedSaveData = {
      player: {
        credits: 1000,
        debt: 500,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Test Ship',
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [],
        quirks: [],
        upgrades: [],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
      npcs: 'invalid_npc_data', // This should be an object, not a string
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
      meta: {
        version: '4.0.0',
        timestamp: Date.now(),
      },
    };

    // Mock localStorage to return corrupted data
    global.localStorage = {
      getItem: () => JSON.stringify(corruptedSaveData),
      setItem: () => {},
      removeItem: () => {},
    };

    // Attempt to load (should fail validation and return null)
    const loadedState = gameStateManager.loadGame();

    // Verify load failed due to corrupted data
    expect(loadedState).toBeNull();
  });

  it('should preserve existing NPC data during migration', () => {
    // Create a v2.1.0 state that already has some NPC data (edge case)
    const v2_1_0StateWithNPCs = {
      player: {
        credits: 1000,
        debt: 500,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Test Ship',
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [],
        quirks: [],
        upgrades: [],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
      npcs: {
        existing_npc: {
          rep: 50,
          lastInteraction: 8,
          flags: ['important_flag'],
          interactions: 5,
        },
      },
      meta: {
        version: '2.1.0',
        timestamp: Date.now(),
      },
    };

    // Migrate the state
    const migratedState = migrateFromV2_1ToV4(v2_1_0StateWithNPCs, true);

    // Verify existing NPC data is preserved
    expect(migratedState.meta.version).toBe('4.0.0');
    expect(migratedState.npcs).toBeDefined();
    expect(migratedState.npcs.existing_npc).toBeDefined();
    expect(migratedState.npcs.existing_npc.rep).toBe(50);
    expect(migratedState.npcs.existing_npc.flags).toEqual(['important_flag']);

    // Verify dialogue state is still added
    expect(migratedState.dialogue).toBeDefined();
    expect(migratedState.dialogue).toEqual({
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    });
  });
});
