import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;

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

  describe('storeCargo', () => {
    const hold = () => game.getState().ship.cargo;

    beforeEach(() => {
      game.updateCargo([
        { good: 'grain', qty: 5, buyPrice: 10 },
        { good: 'ore', qty: 4, buyPrice: 20 },
        { good: 'grain', qty: 3, buyPrice: 12 },
      ]);
    });

    it('stores exactly the selected quantities', () => {
      const result = game.storeCargo(NPC_ID, [
        { stackIndex: 0, qty: 2 },
        { stackIndex: 1, qty: 1 },
      ]);
      expect(result.success).toBe(true);
      expect(result.stored).toBe(3);
      expect(hold().map((s) => s.qty)).toEqual([3, 3, 3]);
      expect(npcState.storedCargo).toEqual([
        { good: 'grain', qty: 2, buyPrice: 10 },
        { good: 'ore', qty: 1, buyPrice: 20 },
      ]);
    });

    it('removes stacks that reach 0', () => {
      game.storeCargo(NPC_ID, [{ stackIndex: 1, qty: 4 }]);
      expect(hold().map((s) => s.good)).toEqual(['grain', 'grain']);
    });

    it('changes the right stacks when an earlier stack reaches 0', () => {
      game.storeCargo(NPC_ID, [
        { stackIndex: 0, qty: 5 },
        { stackIndex: 2, qty: 1 },
      ]);
      expect(hold()).toEqual([
        { good: 'ore', qty: 4, buyPrice: 20 },
        { good: 'grain', qty: 2, buyPrice: 12 },
      ]);
    });

    it('merges a second store of the same good and price into one stack', () => {
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      npcState.lastFavorDay = null;
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(npcState.storedCargo).toEqual([
        { good: 'grain', qty: 3, buyPrice: 10 },
      ]);
    });

    it('sets the favor cooldown and marks dirty', () => {
      const spy = vi.spyOn(game, 'markDirty');
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(npcState.lastFavorDay).toBe(game.getState().player.daysElapsed);
      expect(spy).toHaveBeenCalled();
    });

    it('returns a pluralized message with the NPC name', () => {
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).message).toBe(
        `Stored 1 unit with ${NPC_NAME}`
      );
      npcState.lastFavorDay = null;
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 3 }]).message).toBe(
        `Stored 3 units with ${NPC_NAME}`
      );
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', []],
      ['a missing index', [{ stackIndex: 9, qty: 1 }]],
      ['a negative index', [{ stackIndex: -1, qty: 1 }]],
      ['a string index', [{ stackIndex: '0', qty: 1 }]],
      ['a fractional index', [{ stackIndex: 0.5, qty: 1 }]],
      [
        'duplicate indexes',
        [
          { stackIndex: 0, qty: 1 },
          { stackIndex: 0, qty: 1 },
        ],
      ],
      [
        "'0' alongside 0",
        [
          { stackIndex: 0, qty: 1 },
          { stackIndex: '0', qty: 1 },
        ],
      ],
      ['zero quantity', [{ stackIndex: 0, qty: 0 }]],
      ['negative quantity', [{ stackIndex: 0, qty: -1 }]],
      ['fractional quantity', [{ stackIndex: 0, qty: 1.5 }]],
      ['more than the stack holds', [{ stackIndex: 1, qty: 5 }]],
      [
        'a total over the cap',
        [
          { stackIndex: 0, qty: 5 },
          { stackIndex: 1, qty: 4 },
          { stackIndex: 2, qty: 2 },
        ],
      ],
    ])('refuses %s and changes nothing', (_label, selections) => {
      const holdBefore = structuredClone(hold());
      const result = game.storeCargo(NPC_ID, selections);
      expect(result.success).toBe(false);
      expect(typeof result.message).toBe('string');
      expect(hold()).toEqual(holdBefore);
      expect(npcState.storedCargo).toEqual([]);
      expect(npcState.lastFavorDay).toBeNull();
    });

    it('refuses mission cargo', () => {
      game.updateCargo([
        { good: 'sealed_containers', qty: 3, buyPrice: 0, missionId: 'm1' },
      ]);
      const result = game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(result).toMatchObject({
        success: false,
        message: 'Mission cargo cannot be stored',
      });
      expect(npcState.storedCargo).toEqual([]);
    });

    it('caps the total against what is already stored', () => {
      npcState.storedCargo = [{ good: 'tritium', qty: LIMIT - 2, buyPrice: 5 }];
      expect(
        game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 3 }])
      ).toMatchObject({
        success: false,
        message: 'Only 2 units of storage left',
      });
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]).success).toBe(
        true
      );
    });

    it('refuses when storage is already over the cap', () => {
      npcState.storedCargo = [{ good: 'tritium', qty: 15, buyPrice: 5 }];
      expect(
        game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }])
      ).toMatchObject({
        success: false,
        message: 'Storage full',
      });
    });

    it('still throws for a missing npcId', () => {
      expect(() => game.storeCargo(null, [])).toThrow('Invalid npcId');
    });
  });

  describe('retrieveCargo', () => {
    const hold = () => game.getState().ship.cargo;

    beforeEach(() => {
      game.updateCargo([]);
      npcState.storedCargo = [
        { good: 'grain', qty: 4, buyPrice: 10 },
        { good: 'ore', qty: 3, buyPrice: 20 },
        { good: 'tritium', qty: 2, buyPrice: 30 },
      ];
    });

    it('takes the selected stacks', () => {
      const result = game.retrieveCargo(NPC_ID, [{ stackIndex: 1, qty: 2 }]);
      expect(result.success).toBe(true);
      expect(result.retrieved).toBe(2);
      expect(hold()).toEqual([{ good: 'ore', qty: 2, buyPrice: 20 }]);
      expect(npcState.storedCargo.map((s) => s.qty)).toEqual([4, 1, 2]);
    });

    it('changes the right stacks when an earlier stack reaches 0', () => {
      game.retrieveCargo(NPC_ID, [
        { stackIndex: 0, qty: 4 },
        { stackIndex: 2, qty: 1 },
      ]);
      expect(npcState.storedCargo).toEqual([
        { good: 'ore', qty: 3, buyPrice: 20 },
        { good: 'tritium', qty: 1, buyPrice: 30 },
      ]);
    });

    it('merges into a matching hold stack', () => {
      game.updateCargo([{ good: 'grain', qty: 1, buyPrice: 10 }]);
      game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(hold()).toEqual([{ good: 'grain', qty: 3, buyPrice: 10 }]);
    });

    it('does not start the favor cooldown', () => {
      game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(npcState.lastFavorDay).toBeNull();
    });

    it('works below the Friendly tier', () => {
      npcState.rep = 0;
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).success
      ).toBe(true);
    });

    it('returns a pluralized message with the NPC name', () => {
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).message
      ).toBe(`Retrieved 1 unit from ${NPC_NAME}`);
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 1, qty: 3 }]).message
      ).toBe(`Retrieved 3 units from ${NPC_NAME}`);
    });

    it('refuses a total over the free hold space', () => {
      const space = game.getCargoRemaining();
      game.updateCargo([{ good: 'medicine', qty: space - 1, buyPrice: 5 }]);
      const result = game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(result).toMatchObject({
        success: false,
        message: 'Not enough cargo space',
      });
      expect(npcState.storedCargo[0].qty).toBe(4);
    });

    it('counts passenger space against the hold', () => {
      const capacity = game.getState().ship.cargoCapacity;
      game.updateCargo([{ good: 'medicine', qty: capacity - 3, buyPrice: 5 }]);
      game.getState().missions.active.push({
        id: 'p1',
        type: 'passenger',
        requirements: { cargoSpace: 2 },
      });
      // 3 units fit capacity minus cargo, but only 1 fits once the passenger counts
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]).success
      ).toBe(false);
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).success
      ).toBe(true);
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', []],
      ['a missing index', [{ stackIndex: 7, qty: 1 }]],
      [
        'duplicate indexes',
        [
          { stackIndex: 0, qty: 1 },
          { stackIndex: 0, qty: 1 },
        ],
      ],
      [
        "'0' alongside 0",
        [
          { stackIndex: 0, qty: 1 },
          { stackIndex: '0', qty: 1 },
        ],
      ],
      ['zero quantity', [{ stackIndex: 0, qty: 0 }]],
      ['fractional quantity', [{ stackIndex: 0, qty: 0.5 }]],
      ['more than the stack holds', [{ stackIndex: 2, qty: 3 }]],
    ])('refuses %s and changes nothing', (_label, selections) => {
      const storedBefore = structuredClone(npcState.storedCargo);
      const result = game.retrieveCargo(NPC_ID, selections);
      expect(result.success).toBe(false);
      expect(npcState.storedCargo).toEqual(storedBefore);
      expect(hold()).toEqual([]);
    });
  });
});
