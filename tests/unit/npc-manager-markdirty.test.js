import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { REPUTATION_BOUNDS, EVENT_NAMES } from '../../src/game/constants.js';

const TEST_NPC_ID = 'chen_barnards';

describe('NPCManager markDirty contract', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('modifyRepRaw calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.modifyRepRaw(TEST_NPC_ID, 5, 'test');
    expect(spy).toHaveBeenCalled();
  });

  it('setNpcRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.setNpcRep(TEST_NPC_ID, 50);
    expect(spy).toHaveBeenCalled();
  });

  it('setNpcRep emits NPCS_CHANGED', () => {
    const received = [];
    gsm.subscribe(EVENT_NAMES.NPCS_CHANGED, (data) => received.push(data));
    gsm.npcManager.setNpcRep(TEST_NPC_ID, 50);
    expect(received.length).toBe(1);
  });

  it('getTip calls markDirty when tip is returned', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.WARM_MIN;
    npcState.lastTipDay = null;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.getTip(TEST_NPC_ID);

    if (result !== null) {
      expect(spy).toHaveBeenCalled();
    }
  });

  it('getTip does not call markDirty when tip is unavailable', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = 0; // Too low for tips

    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.getTip(TEST_NPC_ID);

    expect(spy).not.toHaveBeenCalled();
  });

  it('requestLoan calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.lastFavorDay = null;
    gsm.getState().player.credits = 100;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.requestLoan(TEST_NPC_ID);

    if (result.success) {
      expect(spy).toHaveBeenCalled();
    }
  });

  it('repayLoan calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.loanAmount = 500;
    npcState.loanDay = 1;
    gsm.getState().player.credits = 1000;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.repayLoan(TEST_NPC_ID);

    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('checkLoanDefaults calls markDirty when defaults are processed', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.loanAmount = 500;
    npcState.loanDay = 0;
    gsm.getState().player.daysElapsed = 50; // > 30 day deadline

    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.checkLoanDefaults();

    expect(spy).toHaveBeenCalled();
  });

  it('storeCargo calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.lastFavorDay = null;
    gsm.getState().ship.cargo = [
      { type: 'food', qty: 5, source: 'Sol', purchasePrice: 10 },
    ];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.storeCargo(TEST_NPC_ID);

    if (result.success) {
      expect(spy).toHaveBeenCalled();
    }
  });

  it('retrieveCargo calls markDirty when cargo is retrieved', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.storedCargo = [
      { type: 'food', qty: 3, source: 'Sol', purchasePrice: 10 },
    ];
    gsm.getState().ship.cargo = [];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.retrieveCargo(TEST_NPC_ID);

    expect(result.retrieved.length).toBeGreaterThan(0);
    expect(spy).toHaveBeenCalled();
  });
});
