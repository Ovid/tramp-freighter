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
import { REPUTATION_TIERS } from '../../src/game/constants.js';

// Create GameStateManager once to avoid repeated instantiation in tests
const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
// Create bound method once to avoid repeated binding in tests
const getRepTier = gameStateManager.getRepTier.bind(gameStateManager);

describe('NPC Display Information Properties', () => {
  it('should include NPC name, role, and reputation tier in rendered output', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          // Create mock NPC state with the test reputation
          const npcState = { rep: reputation };

          // Render the NPC list item
          const rendered = renderNPCListItem(npc, npcState, getRepTier);

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
    fc.assert(
      fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
        // Render with null NPC state
        const rendered = renderNPCListItem(npc, null, getRepTier);

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
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          const npcState = { rep: reputation };

          const rendered1 = renderNPCListItem(npc, npcState, getRepTier);
          const rendered2 = renderNPCListItem(npc, npcState, getRepTier);

          return rendered1 === rendered2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format output in expected pattern: "Name (Role) [Tier]"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.integer({ min: -100, max: 100 }),
        (npc, reputation) => {
          const npcState = { rep: reputation };
          const rendered = renderNPCListItem(npc, npcState, getRepTier);
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
    // Test with specific reputation values that map to different tiers
    const testCases = [
      { rep: -75, expectedTier: REPUTATION_TIERS.hostile.name },
      { rep: -25, expectedTier: REPUTATION_TIERS.cold.name },
      { rep: 0, expectedTier: REPUTATION_TIERS.neutral.name },
      { rep: 20, expectedTier: REPUTATION_TIERS.warm.name },
      { rep: 45, expectedTier: REPUTATION_TIERS.friendly.name },
      { rep: 75, expectedTier: REPUTATION_TIERS.trusted.name },
      { rep: 95, expectedTier: REPUTATION_TIERS.family.name },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.constantFrom(...testCases),
        (npc, testCase) => {
          const npcState = { rep: testCase.rep };
          const rendered = renderNPCListItem(npc, npcState, getRepTier);

          return rendered.includes(testCase.expectedTier);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary reputation values correctly', () => {
    // Test exact boundary values for reputation tiers
    const boundaryTestCases = [
      { rep: -100, expectedTier: REPUTATION_TIERS.hostile.name },
      { rep: -50, expectedTier: REPUTATION_TIERS.hostile.name },
      { rep: -49, expectedTier: REPUTATION_TIERS.cold.name },
      { rep: -10, expectedTier: REPUTATION_TIERS.cold.name },
      { rep: -9, expectedTier: REPUTATION_TIERS.neutral.name },
      { rep: 0, expectedTier: REPUTATION_TIERS.neutral.name },
      { rep: 9, expectedTier: REPUTATION_TIERS.neutral.name },
      { rep: 10, expectedTier: REPUTATION_TIERS.warm.name },
      { rep: 29, expectedTier: REPUTATION_TIERS.warm.name },
      { rep: 30, expectedTier: REPUTATION_TIERS.friendly.name },
      { rep: 59, expectedTier: REPUTATION_TIERS.friendly.name },
      { rep: 60, expectedTier: REPUTATION_TIERS.trusted.name },
      { rep: 89, expectedTier: REPUTATION_TIERS.trusted.name },
      { rep: 90, expectedTier: REPUTATION_TIERS.family.name },
      { rep: 100, expectedTier: REPUTATION_TIERS.family.name },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS),
        fc.constantFrom(...boundaryTestCases),
        (npc, testCase) => {
          const npcState = { rep: testCase.rep };
          const rendered = renderNPCListItem(npc, npcState, getRepTier);

          return rendered.includes(testCase.expectedTier);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalid inputs gracefully', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
        // Test with undefined NPC state (should use initialRep)
        const renderedUndefined = renderNPCListItem(npc, undefined, getRepTier);
        const expectedTier = gameStateManager.getRepTier(npc.initialRep);

        const containsName = renderedUndefined.includes(npc.name);
        const containsRole = renderedUndefined.includes(npc.role);
        const containsTier = renderedUndefined.includes(expectedTier.name);

        return containsName && containsRole && containsTier;
      }),
      { numRuns: 100 }
    );
  });
});
