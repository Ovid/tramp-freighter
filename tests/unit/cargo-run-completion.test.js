import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { createDefaultMissionState } from '@game/state/state-validators.js';

describe('Cargo Run Mission Completion', () => {
  let game;
  let manager;
  let state;

  beforeEach(() => {
    game = createTestGame();
    state = game.state;
    manager = game.missionManager;
    // No lien, so the full reward is paid
    Object.assign(state.player, {
      credits: 500,
      debt: 0,
      daysElapsed: 10,
      currentSystem: 5,
    });
    state.ship.cargo = [
      {
        good: 'registered_freight',
        qty: 10,
        buyPrice: 0,
        missionId: 'cargo_run_123',
      },
    ];
    state.ship.hiddenCargo = [];
    state.missions = {
      ...createDefaultMissionState(),
      active: [
        {
          id: 'cargo_run_123',
          type: 'delivery',
          requirements: { destination: 5, deadline: 20 },
          deadlineDay: 20,
          missionCargo: {
            good: 'registered_freight',
            quantity: 10,
            isIllegal: false,
          },
          rewards: { credits: 200, faction: { traders: 2 } },
          penalties: { failure: { faction: { traders: -2 } } },
        },
      ],
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove mission cargo by missionId on completion', () => {
    const result = manager.completeMission('cargo_run_123');

    expect(result.success).toBe(true);
    const missionCargo = state.ship.cargo.find(
      (c) => c.missionId === 'cargo_run_123'
    );
    expect(missionCargo).toBeUndefined();
  });

  it('should award credits on completion', () => {
    manager.completeMission('cargo_run_123');
    expect(state.player.credits).toBe(700);
  });

  it('should award faction rep on completion', () => {
    const before = game.getFactionRep('traders');
    manager.completeMission('cargo_run_123');
    expect(game.getFactionRep('traders')).toBe(before + 2);
  });

  it('should fail if mission cargo is not in hold', () => {
    state.ship.cargo = []; // remove the mission cargo

    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cargo/i);
  });

  // Issue #50: smuggled mission cargo completes and leaves the hidden hold
  it('should complete and remove mission cargo from the hidden compartment', () => {
    state.ship.hiddenCargo = state.ship.cargo;
    state.ship.cargo = [];

    const result = manager.completeMission('cargo_run_123');

    expect(result.success).toBe(true);
    expect(state.ship.hiddenCargo).toEqual([]);
  });

  it('should not require old-style cargo field for new cargo runs', () => {
    // Ensure we don't check mission.requirements.cargo for new-style missions
    const removeByGood = vi.spyOn(game.shipManager, 'removeCargoForMission');
    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(true);
    // removeCargoForMission should NOT be called for new-style missions
    expect(removeByGood).not.toHaveBeenCalled();
  });
});
