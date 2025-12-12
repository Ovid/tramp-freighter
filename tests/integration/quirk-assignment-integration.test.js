import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_CONFIG } from '../../js/game-constants.js';

// Mock star data for testing
const mockStarData = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 1, st: 1, r: 1 },
  {
    id: 1,
    name: 'Alpha Centauri',
    x: 10,
    y: 0,
    z: 0,
    type: 'G',
    wh: 1,
    st: 1,
    r: 1,
  },
];

// Mock wormhole data
const mockWormholeData = [[0, 1]];

describe('Quirk Assignment Integration', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(mockStarData, mockWormholeData);
  });

  it('should assign quirks during new game initialization', () => {
    // Initialize a new game
    const state = gameStateManager.initNewGame();

    // Verify quirks were assigned
    expect(state.ship.quirks).toBeDefined();
    expect(Array.isArray(state.ship.quirks)).toBe(true);
    expect(state.ship.quirks.length).toBeGreaterThanOrEqual(2);
    expect(state.ship.quirks.length).toBeLessThanOrEqual(3);

    // Verify no duplicates
    const uniqueQuirks = new Set(state.ship.quirks);
    expect(uniqueQuirks.size).toBe(state.ship.quirks.length);

    // Verify all quirks exist in SHIP_QUIRKS
    for (const quirkId of state.ship.quirks) {
      expect(SHIP_CONFIG.QUIRKS[quirkId]).toBeDefined();
    }
  });

  it('should assign different quirks across multiple game initializations', () => {
    // Initialize multiple games and collect quirk combinations
    const quirkCombinations = new Set();

    for (let i = 0; i < 20; i++) {
      const state = gameStateManager.initNewGame();
      const quirkCombo = state.ship.quirks.sort().join(',');
      quirkCombinations.add(quirkCombo);
    }

    // With 8 quirks and 2-3 selections, we should see multiple different combinations
    // This is a probabilistic test, but with 20 runs we should see at least 2 different combinations
    expect(quirkCombinations.size).toBeGreaterThanOrEqual(2);
  });

  it('should persist quirks in game state', () => {
    // Initialize a new game
    const state = gameStateManager.initNewGame();
    const assignedQuirks = [...state.ship.quirks];

    // Get the state again
    const retrievedState = gameStateManager.getState();

    // Verify quirks are still there
    expect(retrievedState.ship.quirks).toEqual(assignedQuirks);
  });
});
