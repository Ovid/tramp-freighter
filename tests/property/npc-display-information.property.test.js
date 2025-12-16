/**
 * Property-based tests for NPC display information completeness
 *
 * Feature: npc-foundation, Property 2: NPC display information completeness
 * Validates: Requirements 1.2, 2.1
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { renderNPCListItem } from '../../src/game/game-npcs.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('NPC Display Information Properties', () => {
  it('should include NPC name, role, and reputation tier in rendered output', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          // Create mock NPC state with the test reputation
          const npcState = { rep: reputation };
          
          // Render the NPC list item
          const rendered = renderNPCListItem(npc, npcState, gameStateManager.getRepTier.bind(gameStateManager));
          
          // Get the expected tier name
          const tier = gameStateManager.getRepTier(reputation);
          
          // Verify all required information is present
          const containsName = rendered.includes(npc.name);
          const containsRole = rendered.includes(npc.role);
          const containsTier = rendered.includes(tier.name);
          
          return containsName && containsRole && containsTier;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use initial reputation when NPC state is null', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
        // Render with null NPC state
        const rendered = renderNPCListItem(npc, null, gameStateManager.getRepTier.bind(gameStateManager));
        
        // Get the expected tier name from initial reputation
        const expectedTier = gameStateManager.getRepTier(npc.initialRep);
        
        // Verify all required information is present
        const containsName = rendered.includes(npc.name);
        const containsRole = rendered.includes(npc.role);
        const containsTier = rendered.includes(expectedTier.name);
        
        return containsName && containsRole && containsTier;
      }),
      { numRuns: 100 }
    );
  });

  it('should produce consistent output for the same inputs', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          const npcState = { rep: reputation };
          
          const rendered1 = renderNPCListItem(npc, npcState, gameStateManager.getRepTier.bind(gameStateManager));
          const rendered2 = renderNPCListItem(npc, npcState, gameStateManager.getRepTier.bind(gameStateManager));
          
          return rendered1 === rendered2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format output in expected pattern: "Name (Role) [Tier]"', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          const npcState = { rep: reputation };
          const rendered = renderNPCListItem(npc, npcState, gameStateManager.getRepTier.bind(gameStateManager));
          const tier = gameStateManager.getRepTier(reputation);
          
          // Expected format: "Name (Role) [Tier]"
          const expectedPattern = `${npc.name} (${npc.role}) [${tier.name}]`;
          
          return rendered === expectedPattern;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle different reputation tiers correctly', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    // Test with specific reputation values that map to different tiers
    const testCases = [
      { rep: -75, expectedTier: 'Hostile' },
      { rep: -25, expectedTier: 'Cold' },
      { rep: 0, expectedTier: 'Neutral' },
      { rep: 20, expectedTier: 'Warm' },
      { rep: 45, expectedTier: 'Friendly' },
      { rep: 75, expectedTier: 'Trusted' },
      { rep: 95, expectedTier: 'Family' },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.constantFrom(...testCases),
        (npc, testCase) => {
          const npcState = { rep: testCase.rep };
          const rendered = renderNPCListItem(npc, npcState, gameStateManager.getRepTier.bind(gameStateManager));
          
          return rendered.includes(testCase.expectedTier);
        }
      ),
      { numRuns: 100 }
    );
  });
});