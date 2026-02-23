import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Cargo Run Mission Completion', () => {
  let manager;
  let state;
  let mockGSM;

  beforeEach(() => {
    state = {
      player: { credits: 500, daysElapsed: 10, currentSystem: 5 },
      ship: {
        cargo: [
          {
            good: 'registered_freight',
            qty: 10,
            buyPrice: 0,
            missionId: 'cargo_run_123',
          },
        ],
      },
      missions: {
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
        completed: [],
        failed: [],
        board: [],
      },
    };

    mockGSM = {
      state,
      getState: () => state,
      saveGame: vi.fn(),
      markDirty: vi.fn(),
      modifyFactionRep: vi.fn(),
      modifyRep: vi.fn(),
      modifyKarma: vi.fn(),
      removeCargoForMission: vi.fn(() => ({ success: true })),
      emit: vi.fn(),
    };

    const {
      MissionManager,
    } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
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
    manager.completeMission('cargo_run_123');
    expect(mockGSM.modifyFactionRep).toHaveBeenCalledWith(
      'traders',
      2,
      'mission'
    );
  });

  it('should fail if mission cargo is not in hold', () => {
    state.ship.cargo = []; // remove the mission cargo

    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cargo/i);
  });

  it('should not require old-style cargo field for new cargo runs', () => {
    // Ensure we don't check mission.requirements.cargo for new-style missions
    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(true);
    // removeCargoForMission should NOT be called for new-style missions
    expect(mockGSM.removeCargoForMission).not.toHaveBeenCalled();
  });
});
