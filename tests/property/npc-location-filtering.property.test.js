/**
 * Property-based tests for NPC location filtering
 *
 * Feature: npc-foundation, Property 1: NPC location filtering
 * Validates: Requirements 1.1
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getNPCsAtSystem } from '../../src/game/game-npcs.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

// Extract system IDs once to avoid repeated computation in tests
const systemIds = [...new Set(ALL_NPCS.map((npc) => npc.system))];
const npcSystemIds = new Set(ALL_NPCS.map((npc) => npc.system));

describe('NPC Location Filtering Properties', () => {
  it('should return only NPCs located at the specified system', () => {
    fc.assert(
      fc.property(fc.constantFrom(...systemIds), (systemId) => {
        const npcsAtSystem = getNPCsAtSystem(systemId);

        // All returned NPCs should be at the specified system
        npcsAtSystem.forEach((npc) => {
          expect(npc.system).toBe(systemId);
        });

        // No visible NPCs at the specified system should be omitted
        const expectedNPCs = ALL_NPCS.filter(
          (npc) => npc.system === systemId && !npc.hidden
        );
        expect(npcsAtSystem.length).toBe(expectedNPCs.length);

        // Verify all expected visible NPCs are included
        const returnedIds = npcsAtSystem.map((npc) => npc.id);
        expectedNPCs.forEach((expectedNpc) => {
          expect(returnedIds).toContain(expectedNpc.id);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array for systems with no NPCs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }).filter((id) => !npcSystemIds.has(id)),
        (systemId) => {
          const npcsAtSystem = getNPCsAtSystem(systemId);
          expect(Array.isArray(npcsAtSystem)).toBe(true);
          expect(npcsAtSystem.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent results for the same system ID', () => {
    fc.assert(
      fc.property(fc.constantFrom(...systemIds), (systemId) => {
        const result1 = getNPCsAtSystem(systemId);
        const result2 = getNPCsAtSystem(systemId);

        // Results should be identical
        expect(result1.length).toBe(result2.length);

        // Check that all NPCs in result1 are in result2 and vice versa
        const result1Ids = result1.map((npc) => npc.id).sort();
        const result2Ids = result2.map((npc) => npc.id).sort();

        expect(result1Ids).toEqual(result2Ids);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for invalid system ID inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object(),
          fc.array(fc.integer())
        ),
        (invalidSystemId) => {
          expect(() => getNPCsAtSystem(invalidSystemId)).toThrow(
            'Invalid systemId: must be a number'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
