import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Unit tests for NPC benefits save/load migration
 *
 * Tests migration from v4.0.0 to v4.1.0 with NPC benefits fields
 * Validates that old saves load with default benefit fields
 * Validates that new saves preserve all benefit state
 * Requirements: 2.2, 3.5, 3.6, 3.7
 */

describe('NPC Benefits Migration Unit Tests', () => {
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

  it('should migrate v4.0.0 save to v4.1.0 with default NPC benefit fields', () => {
    // Create a mock v4.0.0 save state (without NPC benefits fields)
    const v4_0_0State = {
      player: {
        credits: 1500,
        debt: 800,
        currentSystem: 2,
        daysElapsed: 15,
      },
      ship: {
        name: 'Benefits Test',
        fuel: 85,
        hull: 95,
        engine: 90,
        lifeSupport: 88,
        cargoCapacity: 50,
        cargo: [],
        quirks: [],
        upgrades: [],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0, 1, 2],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
      npcs: {
        wei_chen_sol: {
          rep: 25,
          lastInteraction: 10,
          flags: ['met_before'],
          interactions: 3,
          // Missing NPC benefits fields: lastTipDay, lastFavorDay, loanAmount, loanDay, storedCargo, lastFreeRepairDay
        },
        marcus_cole_sol: {
          rep: -15,
          lastInteraction: 8,
          flags: [],
          interactions: 2,
          // Missing NPC benefits fields
        },
      },
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
      meta: {
        version: '4.0.0',
        timestamp: Date.now() - 2000,
      },
    };

    // Try to load the v4.0.0 state - should trigger migration to v4.1.0
    global.localStorage = {
      getItem: () => JSON.stringify(v4_0_0State),
      setItem: () => {},
      removeItem: () => {},
    };

    const loadedState = gameStateManager.loadGame();

    // Verify migration occurred
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('5.0.0');

    // Verify existing NPC data is preserved
    expect(loadedState.npcs.wei_chen_sol.rep).toBe(25);
    expect(loadedState.npcs.wei_chen_sol.lastInteraction).toBe(10);
    expect(loadedState.npcs.wei_chen_sol.flags).toEqual(['met_before']);
    expect(loadedState.npcs.wei_chen_sol.interactions).toBe(3);

    // Verify NPC benefits fields are added with defaults
    expect(loadedState.npcs.wei_chen_sol.lastTipDay).toBeNull();
    expect(loadedState.npcs.wei_chen_sol.lastFavorDay).toBeNull();
    expect(loadedState.npcs.wei_chen_sol.loanAmount).toBeNull();
    expect(loadedState.npcs.wei_chen_sol.loanDay).toBeNull();
    expect(loadedState.npcs.wei_chen_sol.storedCargo).toEqual([]);
    expect(loadedState.npcs.wei_chen_sol.lastFreeRepairDay).toBeNull();

    // Verify second NPC also has benefits fields
    expect(loadedState.npcs.marcus_cole_sol.lastTipDay).toBeNull();
    expect(loadedState.npcs.marcus_cole_sol.lastFavorDay).toBeNull();
    expect(loadedState.npcs.marcus_cole_sol.loanAmount).toBeNull();
    expect(loadedState.npcs.marcus_cole_sol.loanDay).toBeNull();
    expect(loadedState.npcs.marcus_cole_sol.storedCargo).toEqual([]);
    expect(loadedState.npcs.marcus_cole_sol.lastFreeRepairDay).toBeNull();
  });

  it('should preserve existing NPC benefit state in v4.1.0 saves', () => {
    // Create a mock v4.1.0 save state (with NPC benefits fields)
    const v4_1_0State = {
      player: {
        credits: 2000,
        debt: 500,
        currentSystem: 1,
        daysElapsed: 30,
      },
      ship: {
        name: 'Benefits Complete',
        fuel: 75,
        hull: 80,
        engine: 85,
        lifeSupport: 90,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 15,
            buyPrice: 12,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 25,
          },
        ],
        quirks: [],
        upgrades: [],
        hiddenCargo: [],
        hiddenCargoCapacity: 0,
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
      npcs: {
        wei_chen_sol: {
          rep: 45,
          lastInteraction: 28,
          flags: ['met_before', 'helped_with_cargo'],
          interactions: 8,
          // NPC benefits fields with actual data
          lastTipDay: 25,
          lastFavorDay: 20,
          loanAmount: null,
          loanDay: null,
          storedCargo: [
            {
              good: 'electronics',
              qty: 5,
              buyPrice: 35,
              buySystem: 1,
              buySystemName: 'Alpha Centauri',
              buyDate: 18,
            },
          ],
          lastFreeRepairDay: 28,
        },
        marcus_cole_sol: {
          rep: 65,
          lastInteraction: 29,
          flags: ['loan_granted'],
          interactions: 12,
          // NPC benefits fields with loan data
          lastTipDay: 22,
          lastFavorDay: 15,
          loanAmount: 500,
          loanDay: 15,
          storedCargo: [],
          lastFreeRepairDay: null,
        },
      },
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
      meta: {
        version: '4.1.0',
        timestamp: Date.now() - 1000,
      },
    };

    // Mock localStorage to return the v4.1.0 save
    global.localStorage = {
      getItem: () => JSON.stringify(v4_1_0State),
      setItem: () => {},
      removeItem: () => {},
    };

    // Load the game (should load without migration)
    const loadedState = gameStateManager.loadGame();

    // Verify state was loaded correctly
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('5.0.0');

    // Verify NPC benefits state is preserved exactly
    const weiChen = loadedState.npcs.wei_chen_sol;
    expect(weiChen.lastTipDay).toBe(25);
    expect(weiChen.lastFavorDay).toBe(20);
    expect(weiChen.loanAmount).toBeNull();
    expect(weiChen.loanDay).toBeNull();
    expect(weiChen.storedCargo).toHaveLength(1);
    expect(weiChen.storedCargo[0].good).toBe('electronics');
    expect(weiChen.storedCargo[0].qty).toBe(5);
    expect(weiChen.lastFreeRepairDay).toBe(28);

    const marcusCole = loadedState.npcs.marcus_cole_sol;
    expect(marcusCole.lastTipDay).toBe(22);
    expect(marcusCole.lastFavorDay).toBe(15);
    expect(marcusCole.loanAmount).toBe(500);
    expect(marcusCole.loanDay).toBe(15);
    expect(marcusCole.storedCargo).toEqual([]);
    expect(marcusCole.lastFreeRepairDay).toBeNull();

    // Verify other data is preserved
    expect(loadedState.player.credits).toBe(2000);
    expect(loadedState.ship.name).toBe('Benefits Complete');
    expect(loadedState.ship.cargo).toHaveLength(1);
  });

  it('should handle empty NPC state during migration', () => {
    // Create a v4.0.0 save with empty NPCs object
    const v4_0_0StateEmpty = {
      player: {
        credits: 1000,
        debt: 500,
        currentSystem: 0,
        daysElapsed: 5,
      },
      ship: {
        name: 'Empty Test',
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
      npcs: {}, // Empty NPCs object
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
      meta: {
        version: '4.0.0',
        timestamp: Date.now() - 3000,
      },
    };

    // This should also fail initially (RED phase)
    global.localStorage = {
      getItem: () => JSON.stringify(v4_0_0StateEmpty),
      setItem: () => {},
      removeItem: () => {},
    };

    const loadedState = gameStateManager.loadGame();

    // Verify migration occurred
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('5.0.0');

    // Verify empty NPCs object is preserved
    expect(loadedState.npcs).toEqual({});
  });
});
