import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('getCompletableMissions – new cargo runs', () => {
  let game;
  let manager;
  let state;

  beforeEach(() => {
    game = createTestGame();
    state = game.state;
    manager = game.missionManager;
    state.player.currentSystem = 5;
    state.player.daysElapsed = 10;
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];
    state.missions.active = [];
    state.world.visitedSystems = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  // Issue #50: smuggled mission cargo still counts as delivered
  it('should include delivery mission when mission cargo is in the hidden compartment', () => {
    state.player.currentSystem = 5;
    state.ship.hiddenCargo = [
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

    expect(manager.getCompletableMissions()).toHaveLength(1);
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
