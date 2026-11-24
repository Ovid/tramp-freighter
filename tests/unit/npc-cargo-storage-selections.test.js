import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';

const NPC_ID = 'rodriguez_procyon';
const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;

describe('NPC cargo storage with selections', () => {
  let game;
  let npcState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canRequestFavor storage', () => {
    it('is unavailable below the Friendly tier', () => {
      npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN - 1;
      const result = game.canRequestFavor(NPC_ID, 'storage');
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/Friendly/);
    });

    it('reports Storage full at the cap', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage')).toEqual({
        available: false,
        reason: 'Storage full',
      });
    });

    it('reports Storage full over the cap (older saves)', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT + 5, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage').reason).toBe(
        'Storage full'
      );
    });

    it('is available under the cap', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT - 1, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage').available).toBe(true);
    });

    it('does not report Storage full for loans', () => {
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'loan').available).toBe(true);
    });
  });
});
