import { describe, it, expect } from 'vitest';
import { isWormholeConnected } from '../../src/game/utils/wormhole-graph.js';

describe('isWormholeConnected', () => {
  it('is true only for systems with at least one lane', () => {
    expect(isWormholeConnected(0)).toBe(true); // Sol
    expect(isWormholeConnected(8)).toBe(false); // Sirius B (companion)
    expect(isWormholeConnected(104)).toBe(false); // Ross 882 (no lanes)
    expect(isWormholeConnected(115)).toBe(false); // Delta Pavonis
  });
});
