import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('NPCManager.modifyRepRaw', () => {
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies the exact amount without trust modifier', () => {
    // chen_barnards has trust: 0.3 — modifyRep would reduce +10 to +3
    const startRep = manager.getNPCState('chen_barnards').rep;
    manager.modifyRepRaw('chen_barnards', 10, 'test');
    expect(manager.getNPCState('chen_barnards').rep).toBe(startRep + 10);
  });

  it('does not apply smooth_talker quirk bonus', () => {
    manager.state.ship.quirks.push('smooth_talker');
    const startRep = manager.getNPCState('chen_barnards').rep;
    manager.modifyRepRaw('chen_barnards', 10, 'test');
    // With smooth_talker, modifyRep would give 10 * 0.3 * 1.05 = 3.15 → 3
    // modifyRepRaw should give exactly 10
    expect(manager.getNPCState('chen_barnards').rep).toBe(startRep + 10);
  });

  it('updates lastInteraction', () => {
    manager.state.player.daysElapsed = 42;
    manager.modifyRepRaw('chen_barnards', 5, 'test');
    expect(manager.getNPCState('chen_barnards').lastInteraction).toBe(42);
  });

  it('increments interactions count', () => {
    const startInteractions =
      manager.getNPCState('chen_barnards').interactions;
    manager.modifyRepRaw('chen_barnards', 5, 'test');
    expect(manager.getNPCState('chen_barnards').interactions).toBe(
      startInteractions + 1
    );
  });

  it('emits NPCS_CHANGED event', () => {
    const handler = vi.fn();
    manager.subscribe(EVENT_NAMES.NPCS_CHANGED, handler);
    manager.modifyRepRaw('chen_barnards', 5, 'test');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('triggers achievement check', () => {
    const spy = vi.spyOn(
      manager.achievementsManager,
      'checkAchievements'
    );
    manager.modifyRepRaw('chen_barnards', 5, 'test');
    expect(spy).toHaveBeenCalled();
  });

  it('clamps reputation to 100', () => {
    manager.modifyRepRaw('chen_barnards', 200, 'test');
    expect(manager.getNPCState('chen_barnards').rep).toBe(100);
  });

  it('clamps reputation to -100', () => {
    manager.modifyRepRaw('chen_barnards', -300, 'test');
    expect(manager.getNPCState('chen_barnards').rep).toBe(-100);
  });

  it('rounds the result', () => {
    manager.modifyRepRaw('chen_barnards', 7.7, 'test');
    const rep = manager.getNPCState('chen_barnards').rep;
    expect(rep).toBe(Math.round(rep));
  });

  it('throws for unknown NPC ID', () => {
    expect(() =>
      manager.modifyRepRaw('nonexistent_npc', 10, 'test')
    ).toThrow('Unknown NPC ID');
  });

  it('marks dirty via GameStateManager delegation', () => {
    const dirtySpy = vi.spyOn(manager, 'markDirty');
    manager.modifyRepRaw('chen_barnards', 5, 'test');
    expect(dirtySpy).toHaveBeenCalled();
  });
});

describe('modifyRep delegates to modifyRepRaw', () => {
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('modifyRep calls modifyRepRaw with trust-modified amount', () => {
    const spy = vi.spyOn(manager.npcManager, 'modifyRepRaw');
    manager.modifyRep('chen_barnards', 10, 'test');
    expect(spy).toHaveBeenCalledTimes(1);
    // chen_barnards trust is 0.3, so 10 * 0.3 = 3
    expect(spy).toHaveBeenCalledWith('chen_barnards', 3, 'test');
  });
});
