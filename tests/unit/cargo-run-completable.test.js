import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getCompletableMissions – new cargo runs', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { currentSystem: 5, daysElapsed: 10 },
      ship: { cargo: [] },
      missions: { active: [], board: [], completed: [], failed: [] },
      world: { visitedSystems: [] },
    };

    const mockGSM = {
      state,
      getState: () => state,
      emit: vi.fn(),
    };

    const {
      MissionManager,
    } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
  });

  it('should include delivery mission when mission cargo is in hold at destination', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('cargo_run_123');
  });

  it('should not include delivery mission when mission cargo was lost', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = []; // cargo lost
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should not include delivery mission when not at destination', () => {
    state.player.currentSystem = 3; // wrong system
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'registered_freight', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });
});
