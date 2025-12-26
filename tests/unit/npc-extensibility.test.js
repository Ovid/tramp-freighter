import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ALL_NPCS,
  validateNPCDefinition,
  validateAllNPCs,
} from '../../src/game/data/npc-data.js';
import {
  ALL_DIALOGUE_TREES,
  validateDialogueTree,
  validateAllDialogueTrees,
} from '../../src/game/data/dialogue-trees.js';
import { getNPCsAtSystem, renderNPCListItem } from '../../src/game/game-npcs.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { ALPHA_CENTAURI_SYSTEM_ID } from '../../src/game/constants.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Unit tests for NPC system extensibility
 * Feature: npc-foundation
 *
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
 *
 * Tests that the NPC system can be extended with new NPCs without modifying
 * core systems. Validates that new NPCs integrate with existing query functions,
 * dialogue system, and save/load system.
 */
describe('NPC System Extensibility', () => {
  let originalAllNPCs;
  let originalAllDialogueTrees;
  let gameStateManager;

  // Test NPC definition using the same structure as main NPCs
  const TEST_NPC = {
    id: 'test_trader_alpha_centauri',
    name: 'Test Trader',
    role: 'Merchant',
    system: ALPHA_CENTAURI_SYSTEM_ID, // Alpha Centauri A
    station: 'Alpha Centauri Station',
    personality: {
      trust: 0.5,
      greed: 0.4,
      loyalty: 0.6,
      morality: 0.7,
    },
    speechStyle: {
      greeting: 'friendly',
      vocabulary: 'simple',
      quirk: 'uses trade jargon',
    },
    description: 'A friendly merchant who deals in common goods.',
    initialRep: 5,
  };

  // Test dialogue tree with minimal structure
  const TEST_DIALOGUE_TREE = {
    greeting: {
      text: 'Welcome to my shop! Looking for anything in particular?',
      choices: [
        {
          text: 'Just browsing, thanks.',
          next: null,
        },
        {
          text: 'Tell me about your goods.',
          next: 'goods_talk',
          repGain: 1,
        },
      ],
    },
    goods_talk: {
      text: 'I specialize in basic commodities - grain, ore, that sort of thing. Fair prices, honest dealing.',
      choices: [
        {
          text: 'Sounds good. Thanks for the info.',
          next: null,
          repGain: 1,
        },
      ],
    },
  };

  beforeEach(() => {
    // Store original arrays to restore after tests
    originalAllNPCs = [...ALL_NPCS];
    originalAllDialogueTrees = { ...ALL_DIALOGUE_TREES };

    // Create fresh GameStateManager for each test
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
  });

  afterEach(() => {
    // Clean up: remove test NPC from arrays
    const testNPCIndex = ALL_NPCS.findIndex(
      (npc) => npc.id === TEST_NPC.id
    );
    if (testNPCIndex !== -1) {
      ALL_NPCS.splice(testNPCIndex, 1);
    }

    if (ALL_DIALOGUE_TREES[TEST_NPC.id]) {
      delete ALL_DIALOGUE_TREES[TEST_NPC.id];
    }

    // Restore original arrays
    ALL_NPCS.length = 0;
    ALL_NPCS.push(...originalAllNPCs);
    Object.keys(ALL_DIALOGUE_TREES).forEach((key) => {
      delete ALL_DIALOGUE_TREES[key];
    });
    Object.assign(ALL_DIALOGUE_TREES, originalAllDialogueTrees);
  });

  describe('NPC Definition Creation', () => {
    it('should create new NPC definition with all required fields', () => {
      // Test that our test NPC has all required fields
      expect(() => validateNPCDefinition(TEST_NPC)).not.toThrow();

      // Verify all required fields are present
      expect(TEST_NPC.id).toBe('test_trader_alpha_centauri');
      expect(TEST_NPC.name).toBe('Test Trader');
      expect(TEST_NPC.role).toBe('Merchant');
      expect(TEST_NPC.system).toBe(ALPHA_CENTAURI_SYSTEM_ID);
      expect(TEST_NPC.station).toBe('Alpha Centauri Station');
      expect(TEST_NPC.description).toBe('A friendly merchant who deals in common goods.');
      expect(TEST_NPC.initialRep).toBe(5);

      // Verify personality traits
      expect(TEST_NPC.personality.trust).toBe(0.5);
      expect(TEST_NPC.personality.greed).toBe(0.4);
      expect(TEST_NPC.personality.loyalty).toBe(0.6);
      expect(TEST_NPC.personality.morality).toBe(0.7);

      // Verify speech style
      expect(TEST_NPC.speechStyle.greeting).toBe('friendly');
      expect(TEST_NPC.speechStyle.vocabulary).toBe('simple');
      expect(TEST_NPC.speechStyle.quirk).toBe('uses trade jargon');
    });

    it('should integrate new NPC with existing query functions', () => {
      // Add test NPC to the array
      ALL_NPCS.push(TEST_NPC);

      // Test that getNPCsAtSystem finds the new NPC
      const npcsAtAlphaCentauri = getNPCsAtSystem(ALPHA_CENTAURI_SYSTEM_ID);
      expect(npcsAtAlphaCentauri).toContain(TEST_NPC);

      // Test that renderNPCListItem works with the new NPC
      const mockGetRepTier = (rep) => ({ name: 'Warm' });
      const mockNPCState = { rep: 5 };
      
      const displayText = renderNPCListItem(TEST_NPC, mockNPCState, mockGetRepTier);
      expect(displayText).toBe('Test Trader (Merchant) [Warm]');

      // Test with no NPC state (should use initialRep)
      const displayTextNoState = renderNPCListItem(TEST_NPC, null, mockGetRepTier);
      expect(displayTextNoState).toBe('Test Trader (Merchant) [Warm]');
    });

    it('should validate all NPCs including new NPC without errors', () => {
      // Add test NPC to the array
      ALL_NPCS.push(TEST_NPC);

      // Should validate without throwing
      expect(() => validateAllNPCs()).not.toThrow();
    });
  });

  describe('Dialogue Tree Integration', () => {
    it('should create new dialogue tree following required structure', () => {
      // Test that our test dialogue tree validates
      expect(() => validateDialogueTree(TEST_DIALOGUE_TREE)).not.toThrow();

      // Verify required structure
      expect(TEST_DIALOGUE_TREE.greeting).toBeDefined();
      expect(TEST_DIALOGUE_TREE.greeting.text).toBe('Welcome to my shop! Looking for anything in particular?');
      expect(Array.isArray(TEST_DIALOGUE_TREE.greeting.choices)).toBe(true);
      expect(TEST_DIALOGUE_TREE.greeting.choices).toHaveLength(2);

      // Verify choice structure
      const firstChoice = TEST_DIALOGUE_TREE.greeting.choices[0];
      expect(firstChoice.text).toBe('Just browsing, thanks.');
      expect(firstChoice.next).toBe(null);

      const secondChoice = TEST_DIALOGUE_TREE.greeting.choices[1];
      expect(secondChoice.text).toBe('Tell me about your goods.');
      expect(secondChoice.next).toBe('goods_talk');
      expect(secondChoice.repGain).toBe(1);

      // Verify second node
      expect(TEST_DIALOGUE_TREE.goods_talk).toBeDefined();
      expect(TEST_DIALOGUE_TREE.goods_talk.text).toBe('I specialize in basic commodities - grain, ore, that sort of thing. Fair prices, honest dealing.');
    });

    it('should integrate new dialogue tree with validation system', () => {
      // Add test dialogue tree to the collection
      ALL_DIALOGUE_TREES[TEST_NPC.id] = TEST_DIALOGUE_TREE;

      // Should validate all dialogue trees without throwing
      expect(() => validateAllDialogueTrees()).not.toThrow();
    });
  });

  describe('Save/Load System Integration', () => {
    it('should persist new NPC state in save/load cycle', () => {
      // Add test NPC to the array
      ALL_NPCS.push(TEST_NPC);

      // Mock localStorage for testing
      let savedData = null;
      const originalLocalStorage = global.localStorage;
      global.localStorage = {
        getItem: () => savedData,
        setItem: (key, value) => {
          savedData = value;
        },
        removeItem: () => {
          savedData = null;
        },
      };

      try {
        // Initialize game state
        gameStateManager.initNewGame();

        // Modify reputation for the test NPC
        // Expected calculation: 10 * 0.5 (trust) = 5, so 5 + 5 = 10 total
        gameStateManager.modifyRep(TEST_NPC.id, 10, 'test interaction');

        // Get the NPC state
        const npcState = gameStateManager.getNPCState(TEST_NPC.id);
        expect(npcState.rep).toBe(10); // 5 initial + (10 * 0.5 trust) = 10
        expect(npcState.interactions).toBe(1);

        // Verify save data includes the test NPC
        expect(savedData).not.toBeNull();
        const parsedSaveData = JSON.parse(savedData);
        expect(parsedSaveData.npcs[TEST_NPC.id]).toBeDefined();
        expect(parsedSaveData.npcs[TEST_NPC.id].rep).toBe(10);
        expect(parsedSaveData.npcs[TEST_NPC.id].interactions).toBe(1);

        // Create new GameStateManager and load the save
        const newGameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        const loadedState = newGameStateManager.loadGame();

        // Verify NPC state was preserved
        expect(loadedState).not.toBeNull();
        const loadedNPCState = newGameStateManager.getNPCState(TEST_NPC.id);
        expect(loadedNPCState.rep).toBe(10);
        expect(loadedNPCState.interactions).toBe(1);
        expect(loadedNPCState.flags).toEqual([]);
      } finally {
        global.localStorage = originalLocalStorage;
      }
    });

    it('should handle new NPC without modifying core save/load systems', () => {
      // Add test NPC to the array
      ALL_NPCS.push(TEST_NPC);

      // Mock localStorage for testing
      let savedData = null;
      const originalLocalStorage = global.localStorage;
      global.localStorage = {
        getItem: () => savedData,
        setItem: (key, value) => {
          savedData = value;
        },
        removeItem: () => {
          savedData = null;
        },
      };

      try {
        // Initialize game state
        gameStateManager.initNewGame();

        // Interact with both existing and new NPCs
        // Chen: 5 * 0.3 (trust) = 1.5, rounded = 2, so 0 + 2 = 2
        gameStateManager.modifyRep('chen_barnards', 5, 'test');
        
        // Reset lastSaveTime to ensure save is not debounced
        gameStateManager.lastSaveTime = 0;
        
        // Test NPC: 8 * 0.5 (trust) = 4, so 5 + 4 = 9
        gameStateManager.modifyRep(TEST_NPC.id, 8, 'test');

        // Verify save data includes both NPCs
        expect(savedData).not.toBeNull();
        const parsedSaveData = JSON.parse(savedData);
        expect(parsedSaveData.npcs['chen_barnards']).toBeDefined();
        expect(parsedSaveData.npcs[TEST_NPC.id]).toBeDefined();

        // Load in new manager and verify both NPCs work
        const newGameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        const loadedState = newGameStateManager.loadGame();

        expect(loadedState).not.toBeNull();
        
        // Verify the loaded state has the NPC data
        expect(loadedState.npcs['chen_barnards']).toBeDefined();
        expect(loadedState.npcs[TEST_NPC.id]).toBeDefined();
        
        const chenState = newGameStateManager.getNPCState('chen_barnards');
        const testNPCState = newGameStateManager.getNPCState(TEST_NPC.id);

        expect(chenState.rep).toBe(2); // 0 initial + (5 * 0.3 trust) rounded = 2
        expect(testNPCState.rep).toBe(9); // 5 initial + (8 * 0.5 trust) = 9
      } finally {
        global.localStorage = originalLocalStorage;
      }
    });
  });

  describe('System Integration Without Core Modifications', () => {
    it('should work with existing systems without requiring core changes', () => {
      // Add test NPC and dialogue tree
      ALL_NPCS.push(TEST_NPC);
      ALL_DIALOGUE_TREES[TEST_NPC.id] = TEST_DIALOGUE_TREE;

      // Mock localStorage for testing
      let savedData = null;
      const originalLocalStorage = global.localStorage;
      global.localStorage = {
        getItem: () => savedData,
        setItem: (key, value) => {
          savedData = value;
        },
        removeItem: () => {
          savedData = null;
        },
      };

      try {
        // Initialize game
        gameStateManager.initNewGame();

        // Test that all existing functionality still works
        expect(() => validateAllNPCs()).not.toThrow();
        expect(() => validateAllDialogueTrees()).not.toThrow();

        // Test NPC queries work
        const npcsAtAlphaCentauri = getNPCsAtSystem(ALPHA_CENTAURI_SYSTEM_ID);
        expect(npcsAtAlphaCentauri).toContain(TEST_NPC);

        // Test reputation system works
        // Expected: 5 * 0.5 (trust) = 2.5, rounded = 3, so 5 + 3 = 8
        gameStateManager.modifyRep(TEST_NPC.id, 5, 'test');
        const npcState = gameStateManager.getNPCState(TEST_NPC.id);
        expect(npcState.rep).toBe(8); // 5 initial + (5 * 0.5 trust) rounded = 8

        // Test save/load works
        expect(savedData).not.toBeNull();
        const parsedSaveData = JSON.parse(savedData);
        expect(parsedSaveData.npcs[TEST_NPC.id]).toBeDefined();

        // Verify original NPCs still work
        // Expected: 3 * 0.3 (trust) = 0.9, rounded = 1, so 0 + 1 = 1
        gameStateManager.modifyRep('chen_barnards', 3, 'test');
        const chenState = gameStateManager.getNPCState('chen_barnards');
        expect(chenState.rep).toBe(1); // 0 initial + (3 * 0.3 trust) rounded = 1
      } finally {
        global.localStorage = originalLocalStorage;
      }
    });

    it('should maintain data integrity with mixed NPC operations', () => {
      // Add test NPC
      ALL_NPCS.push(TEST_NPC);

      // Mock localStorage for testing
      let savedData = null;
      const originalLocalStorage = global.localStorage;
      global.localStorage = {
        getItem: () => savedData,
        setItem: (key, value) => {
          savedData = value;
        },
        removeItem: () => {
          savedData = null;
        },
      };

      try {
        // Initialize game
        gameStateManager.initNewGame();

        // Perform operations on both existing and new NPCs
        // Chen: 10 * 0.3 (trust) = 3, so 0 + 3 = 3
        gameStateManager.modifyRep('chen_barnards', 10, 'test');
        
        // Reset lastSaveTime to ensure save is not debounced
        gameStateManager.lastSaveTime = 0;
        
        // Cole: -5 (negative, no trust modifier), so -20 + (-5) = -25
        gameStateManager.modifyRep('cole_sol', -5, 'test');
        
        // Reset lastSaveTime to ensure save is not debounced
        gameStateManager.lastSaveTime = 0;
        
        // Test NPC: 7 * 0.5 (trust) = 3.5, rounded = 4, so 5 + 4 = 9
        gameStateManager.modifyRep(TEST_NPC.id, 7, 'test');

        // Verify all states are correct
        const chenState = gameStateManager.getNPCState('chen_barnards');
        const coleState = gameStateManager.getNPCState('cole_sol');
        const testState = gameStateManager.getNPCState(TEST_NPC.id);

        expect(chenState.rep).toBe(3); // 0 initial + (10 * 0.3 trust) = 3
        expect(coleState.rep).toBe(-25); // -20 initial + (-5) = -25
        expect(testState.rep).toBe(9); // 5 initial + (7 * 0.5 trust) rounded = 9

        // Verify interaction counts
        expect(chenState.interactions).toBe(1);
        expect(coleState.interactions).toBe(1);
        expect(testState.interactions).toBe(1);

        // Test save/load preserves all states
        const newManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        const loadedState = newManager.loadGame();

        expect(loadedState).not.toBeNull();
        
        // Verify the loaded state has the NPC data
        expect(loadedState.npcs['chen_barnards']).toBeDefined();
        expect(loadedState.npcs['cole_sol']).toBeDefined();
        expect(loadedState.npcs[TEST_NPC.id]).toBeDefined();
        
        const loadedChenState = newManager.getNPCState('chen_barnards');
        const loadedColeState = newManager.getNPCState('cole_sol');
        const loadedTestState = newManager.getNPCState(TEST_NPC.id);

        expect(loadedChenState.rep).toBe(3);
        expect(loadedColeState.rep).toBe(-25);
        expect(loadedTestState.rep).toBe(9);
      } finally {
        global.localStorage = originalLocalStorage;
      }
    });
  });
});