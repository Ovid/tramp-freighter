/**
 * Unit tests for dialogue engine edge cases
 *
 * Tests specific edge cases and error conditions for the dialogue system.
 * Validates: Requirements 2.5, 5.2, 10.1, 10.5
 */

import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Engine Edge Cases', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  describe('Dialogue ending when choice has no next node', () => {
    it('should return null when selecting a choice with next: null', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 0;

      // Show initial dialogue
      const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Find the ending choice (should have next: null)
      const endingChoice = initialDialogue.choices.find(
        (choice) => choice.next === null
      );
      expect(endingChoice).toBeDefined();
      expect(endingChoice.text).toBe('Nothing right now. Take care.');

      // Select the ending choice
      const result = selectChoice(npcId, endingChoice.index, gameStateManager);

      // Should return null to end dialogue
      expect(result).toBeNull();
    });

    it('should return null for all NPCs when selecting ending choices', () => {
      const npcIds = ['chen_barnards', 'cole_sol', 'okonkwo_ross154'];

      for (const npcId of npcIds) {
        // Set up NPC state
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = 0;

        // Show initial dialogue
        const initialDialogue = showDialogue(
          npcId,
          'greeting',
          gameStateManager
        );

        // Find ending choices
        const endingChoices = initialDialogue.choices.filter(
          (choice) => choice.next === null
        );
        expect(endingChoices.length).toBeGreaterThan(0);

        // Test each ending choice
        for (const choice of endingChoices) {
          // Reset dialogue state
          showDialogue(npcId, 'greeting', gameStateManager);

          const result = selectChoice(npcId, choice.index, gameStateManager);
          expect(result).toBeNull();
        }
      }
    });
  });

  describe('Greeting node is displayed by default', () => {
    it('should show greeting node when no specific node is requested', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 0;

      // Show dialogue without specifying node (should default to greeting)
      const dialogue = showDialogue(npcId, undefined, gameStateManager);

      // Should display greeting content
      expect(dialogue.text).toBe(
        'Another trader. Docking fees paid? Good. What you need?'
      );
      expect(dialogue.choices.length).toBeGreaterThan(0);
    });

    it('should show greeting node when explicitly requesting greeting', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 0;

      // Show greeting dialogue explicitly
      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Should display greeting content
      expect(dialogue.text).toBe(
        'Another trader. Docking fees paid? Good. What you need?'
      );
      expect(dialogue.choices.length).toBeGreaterThan(0);
    });

    it('should show greeting for all NPCs by default', () => {
      const npcIds = ['chen_barnards', 'cole_sol', 'okonkwo_ross154'];

      for (const npcId of npcIds) {
        // Set up NPC state
        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = 0;

        // Show dialogue (should default to greeting)
        const dialogue = showDialogue(npcId, undefined, gameStateManager);

        // Should have valid dialogue content
        expect(typeof dialogue.text).toBe('string');
        expect(dialogue.text.length).toBeGreaterThan(0);
        expect(Array.isArray(dialogue.choices)).toBe(true);
        expect(dialogue.choices.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Uninitialized NPC uses initialRep for dialogue display', () => {
    it('should use Wei Chen initialRep (0) for uninitialized NPC', () => {
      const npcId = 'chen_barnards';

      // Don't initialize NPC state - should use initialRep from NPC data
      // Wei Chen has initialRep: 0, which should show neutral greeting

      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Should show neutral greeting (rep 0 is in neutral range)
      expect(dialogue.text).toBe(
        'Another trader. Docking fees paid? Good. What you need?'
      );
      expect(dialogue.reputationTier.name).toBe('Neutral');
    });

    it('should use Marcus Cole initialRep (-20) for uninitialized NPC', () => {
      const npcId = 'cole_sol';

      // Don't initialize NPC state - should use initialRep from NPC data
      // Marcus Cole has initialRep: -20, which should show cold greeting

      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Should show cold greeting (rep -20 is in cold range)
      expect(dialogue.text).toBe(
        'Your debt remains outstanding. I trust you have good news for me.'
      );
      expect(dialogue.reputationTier.name).toBe('Cold');
    });

    it('should use Father Okonkwo initialRep (10) for uninitialized NPC', () => {
      const npcId = 'okonkwo_ross154';

      // Don't initialize NPC state - should use initialRep from NPC data
      // Father Okonkwo has initialRep: 10, which should show warm greeting

      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Should show warm greeting (rep 10 is in warm range)
      expect(dialogue.text).toBe(
        "Welcome back, child. It does my heart good to see you safe. The void between stars can be lonely - you're always welcome here."
      );
      expect(dialogue.reputationTier.name).toBe('Warm');
    });

    it('should transition from initialRep to actual rep after first interaction', () => {
      const npcId = 'chen_barnards';

      // Show dialogue with uninitialized NPC (should use initialRep: 0)
      const initialDialogue = showDialogue(npcId, 'greeting', gameStateManager);
      expect(initialDialogue.reputationTier.name).toBe('Neutral');

      // Now the NPC state should be initialized
      const npcState = gameStateManager.getNPCState(npcId);
      expect(npcState.rep).toBe(0); // Should be initialized to 0

      // Modify reputation
      npcState.rep = 50; // Set to friendly range

      // Show dialogue again - should now use actual rep
      const updatedDialogue = showDialogue(npcId, 'greeting', gameStateManager);
      expect(updatedDialogue.reputationTier.name).toBe('Friendly');
      expect(updatedDialogue.text).toBe(
        'Hey there, friend! Good to see you again. Ship treating you well?'
      );
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown NPC ID in showDialogue', () => {
      expect(() => {
        showDialogue('unknown_npc', 'greeting', gameStateManager);
      }).toThrow('Unknown NPC ID: unknown_npc');
    });

    it('should throw error for unknown NPC ID in selectChoice', () => {
      expect(() => {
        selectChoice('unknown_npc', 0, gameStateManager);
      }).toThrow('Unknown NPC ID: unknown_npc');
    });

    it('should throw error for unknown dialogue node', () => {
      const npcId = 'chen_barnards';

      expect(() => {
        showDialogue(npcId, 'nonexistent_node', gameStateManager);
      }).toThrow(
        'Unknown dialogue node: nonexistent_node for NPC: chen_barnards'
      );
    });

    it('should throw error for invalid choice index', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 0;

      // Show dialogue to establish state
      showDialogue(npcId, 'greeting', gameStateManager);

      // Try to select invalid choice index
      expect(() => {
        selectChoice(npcId, 999, gameStateManager);
      }).toThrow(
        'Invalid choice index: 999 for node greeting in NPC chen_barnards'
      );

      expect(() => {
        selectChoice(npcId, -1, gameStateManager);
      }).toThrow(
        'Invalid choice index: -1 for node greeting in NPC chen_barnards'
      );
    });
  });

  describe('Dialogue state consistency', () => {
    it('should maintain consistent NPC information across dialogue interactions', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 25; // Warm tier

      // Show initial dialogue
      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);

      // Verify NPC information is correct
      expect(dialogue.npcId).toBe('chen_barnards');
      expect(dialogue.npcName).toBe('Wei Chen');
      expect(dialogue.npcRole).toBe('Dock Worker');
      expect(dialogue.npcStation).toBe('Bore Station 7');
      expect(dialogue.reputationTier.name).toBe('Warm');

      // Select a choice that advances dialogue
      const choice = dialogue.choices.find((c) => c.next === 'small_talk');
      expect(choice).toBeDefined();

      const nextDialogue = selectChoice(npcId, choice.index, gameStateManager);

      // NPC information should remain consistent
      expect(nextDialogue.npcId).toBe('chen_barnards');
      expect(nextDialogue.npcName).toBe('Wei Chen');
      expect(nextDialogue.npcRole).toBe('Dock Worker');
      expect(nextDialogue.npcStation).toBe('Bore Station 7');
    });

    it('should handle reputation changes during dialogue correctly', () => {
      const npcId = 'chen_barnards';

      // Set up NPC state
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 0;

      // Show initial dialogue
      const dialogue = showDialogue(npcId, 'greeting', gameStateManager);
      expect(dialogue.reputationTier.name).toBe('Neutral');

      // Select a choice that gives reputation gain
      const choice = dialogue.choices.find((c) => c.next === 'small_talk');
      const nextDialogue = selectChoice(npcId, choice.index, gameStateManager);

      // Find a choice with reputation gain in the small_talk node
      const repGainChoice = nextDialogue.choices.find(
        (c) => c.repGain && c.repGain > 0
      );
      if (repGainChoice) {
        const finalDialogue = selectChoice(
          npcId,
          repGainChoice.index,
          gameStateManager
        );

        // Reputation tier should be updated in the final dialogue
        const finalRep = gameStateManager.getNPCState(npcId).rep;
        const expectedTier = gameStateManager.getRepTier(finalRep);
        expect(finalDialogue.reputationTier.name).toBe(expectedTier.name);
      }
    });
  });
});
