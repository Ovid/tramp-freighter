import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ALL_NPCS,
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Cross-NPC validation tests for the NPC benefits system
 * Feature: npc-benefits
 *
 * **Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**
 *
 * Tests system-wide concerns like uniqueness and consistency across all NPCs.
 * Individual NPC validation is handled in separate test files.
 */
describe('Cross-NPC Data Validation', () => {
  // Array of all new NPCs for cross-validation testing
  const NEW_NPCS = [
    WHISPER,
    CAPTAIN_VASQUEZ,
    DR_SARAH_KIM,
    RUSTY_RODRIGUEZ,
    ZARA_OSMAN,
    STATION_MASTER_KOWALSKI,
    LUCKY_LIU,
  ];

  it('should have unique IDs across all new NPCs', () => {
    // This validates uniqueness constraint across all NPCs
    const ids = NEW_NPCS.map((npc) => npc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique system/station combinations across all new NPCs', () => {
    // Validates that no two NPCs are at the same station in the same system
    const locations = NEW_NPCS.map((npc) => `${npc.system}-${npc.station}`);
    const uniqueLocations = new Set(locations);
    expect(uniqueLocations.size).toBe(locations.length);
  });

  it('should have consistent discount service types across NPCs', () => {
    // Validates that discount services use consistent naming
    const discountServices = NEW_NPCS.map((npc) => npc.discountService).filter(
      (service) => service !== null
    );

    const validServices = [
      'intel',
      'repair',
      'trade',
      'docking',
      'refuel',
      'medical',
      'debt',
    ];

    discountServices.forEach((service) => {
      expect(validServices).toContain(service);
    });
  });

  it('should validate NPC structure correctly with generated data', () => {
    // Property-based test for NPC validation function itself
    const validNPCArb = fc.record({
      id: fc.string({ minLength: 1 }),
      name: fc.string({ minLength: 1 }),
      role: fc.string({ minLength: 1 }),
      system: fc.nat(),
      station: fc.string({ minLength: 1 }),
      personality: fc.record({
        trust: fc.float({ min: 0, max: 1 }),
        greed: fc.float({ min: 0, max: 1 }),
        loyalty: fc.float({ min: 0, max: 1 }),
        morality: fc.float({ min: 0, max: 1 }),
      }),
      speechStyle: fc.record({
        greeting: fc.string({ minLength: 1 }),
        vocabulary: fc.string({ minLength: 1 }),
        quirk: fc.string({ minLength: 1 }),
      }),
      description: fc.string({ minLength: 1 }),
      initialRep: fc.integer({
        min: REPUTATION_BOUNDS.MIN,
        max: REPUTATION_BOUNDS.MAX,
      }),
      tips: fc.array(fc.string({ minLength: 1 })),
      discountService: fc.oneof(fc.constant(null), fc.string({ minLength: 1 })),
      tierBenefits: fc.record({
        warm: fc.record({
          discount: fc.float({ min: 0, max: 1 }),
          benefit: fc.string({ minLength: 1 }),
        }),
        friendly: fc.record({
          discount: fc.float({ min: 0, max: 1 }),
          benefit: fc.string({ minLength: 1 }),
        }),
        trusted: fc.record({
          discount: fc.float({ min: 0, max: 1 }),
          benefit: fc.string({ minLength: 1 }),
        }),
        family: fc.record({
          discount: fc.float({ min: 0, max: 1 }),
          benefit: fc.string({ minLength: 1 }),
        }),
      }),
    });

    fc.assert(
      fc.property(validNPCArb, (npc) => {
        // For all valid NPC objects, validation should pass
        expect(() => validateNPCDefinition(npc)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid NPC objects with missing required fields', () => {
    // Property-based test for validation rejection
    const invalidNPCArb = fc.record({
      // Randomly omit some required fields
      id: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      name: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      // Always include some fields to make object partially valid
      role: fc.string({ minLength: 1 }),
      system: fc.nat(),
    });

    fc.assert(
      fc.property(invalidNPCArb, (npc) => {
        // For all invalid NPC objects, validation should throw
        if (!npc.id || !npc.name) {
          expect(() => validateNPCDefinition(npc)).toThrow(
            /Invalid NPC definition/
          );
        }
      }),
      { numRuns: 50 }
    );
  });
});

describe('NPC System Reachability', () => {
  const starById = new Map(STAR_DATA.map((s) => [s.id, s]));

  // BFS from Sol to find all systems reachable via wormhole network
  function computeReachableFromSol() {
    const adj = new Map();
    for (const [a, b] of WORMHOLE_DATA) {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push(b);
      adj.get(b).push(a);
    }
    const visited = new Set();
    const queue = [0]; // Sol
    visited.add(0);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return visited;
  }

  const reachableFromSol = computeReachableFromSol();

  it('should place all NPCs in systems marked reachable (r: 1)', () => {
    for (const npc of ALL_NPCS) {
      const star = starById.get(npc.system);
      expect(star, `NPC "${npc.name}" references unknown system ${npc.system}`).toBeDefined();
      expect(star.r, `NPC "${npc.name}" is in unreachable system "${star.name}" (id ${star.id})`).toBe(1);
    }
  });

  it('should place all NPCs in systems reachable from Sol via wormhole traversal', () => {
    for (const npc of ALL_NPCS) {
      const star = starById.get(npc.system);
      expect(
        reachableFromSol.has(npc.system),
        `NPC "${npc.name}" is in system "${star.name}" (id ${star.id}) which is not reachable from Sol via wormholes`
      ).toBe(true);
    }
  });

  it('should have r flag consistent with wormhole graph reachability for all systems', () => {
    for (const star of STAR_DATA) {
      const graphReachable = reachableFromSol.has(star.id);
      const flagReachable = star.r === 1;
      expect(
        flagReachable,
        `System "${star.name}" (id ${star.id}): r flag is ${star.r} but graph says ${graphReachable ? 'reachable' : 'unreachable'}`
      ).toBe(graphReachable);
    }
  });
});
