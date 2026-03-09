import { describe, it, expect, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('NPCManager.setNpcRep', () => {
  function createGame() {
    const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    return gsm;
  }

  it('should set NPC reputation to the exact value provided', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 75);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(75);
  });

  it('should clamp values above 100 to 100', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 150);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(100);
  });

  it('should clamp values below -100 to -100', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', -200);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(-100);
  });

  it('should round floating-point values', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 42.7);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(43);
  });

  it('should NOT update lastInteraction or interactions count', () => {
    const gsm = createGame();
    const npcState = gsm.getNPCState('chen_barnards');
    const originalLastInteraction = npcState.lastInteraction;
    const originalInteractions = npcState.interactions;

    gsm.setNpcRep('chen_barnards', 50);

    expect(npcState.lastInteraction).toBe(originalLastInteraction);
    expect(npcState.interactions).toBe(originalInteractions);
  });

  it('should bypass trust multiplier (set exact value regardless of NPC personality)', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 60);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(60);
  });

  it('should emit npcsChanged event', () => {
    const gsm = createGame();
    const handler = vi.fn();
    gsm.subscribe('npcsChanged', handler);

    gsm.setNpcRep('chen_barnards', 50);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should throw for unknown NPC ID', () => {
    const gsm = createGame();
    expect(() => gsm.setNpcRep('nonexistent_npc', 50)).toThrow(
      'Unknown NPC ID'
    );
  });

  it('should mark dirty after setting rep', () => {
    const gsm = createGame();
    const dirtySpy = vi.spyOn(gsm, 'markDirty');

    gsm.setNpcRep('chen_barnards', 50);

    expect(dirtySpy).toHaveBeenCalled();
  });
});
