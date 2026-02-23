import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Critical Damage Delegation', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gsm.initNewGame();

    // Set up a critically damaged hull (at or below threshold) with 0 credits
    // so emergency patch is available
    gsm.state.ship.hull = 5;
    gsm.state.ship.engine = 80;
    gsm.state.ship.lifeSupport = 90;
    gsm.state.player.credits = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GameStateManager should delegate applyEmergencyPatch to RepairManager', () => {
    const result = gsm.applyEmergencyPatch('hull');

    expect(result).toEqual({ success: true, reason: null });
    expect(gsm.state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
  });

  it('GameStateManager should delegate cannibalizeSystem to RepairManager', () => {
    const amountNeeded =
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - gsm.state.ship.hull;
    const donationRequired =
      amountNeeded * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: donationRequired },
    ]);

    expect(result).toEqual({ success: true, reason: null });
    expect(gsm.state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
  });
});
