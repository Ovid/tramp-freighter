import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('MissionManager.acceptMission – cargo run cargo placement', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should place mission cargo in hold on accept', () => {
    const mission = {
      id: 'cargo_run_123',
      type: 'delivery',
      requirements: { destination: 5, deadline: 10 },
      missionCargo: { good: 'sealed_containers', quantity: 10, isIllegal: false },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(true);
    const state = manager.getState();
    const cargoEntry = state.ship.cargo.find(
      (c) => c.good === 'sealed_containers' && c.missionId === 'cargo_run_123'
    );
    expect(cargoEntry).toBeDefined();
    expect(cargoEntry.qty).toBe(10);
    expect(cargoEntry.missionId).toBe('cargo_run_123');
    expect(cargoEntry.buyPrice).toBe(0);
  });

  it('should fail if not enough cargo space for mission cargo', () => {
    const state = manager.getState();
    // Fill cargo to leave only 5 remaining
    state.ship.cargo = [{ good: 'ore', qty: state.ship.cargoCapacity - 5, buyPrice: 15 }];

    const mission = {
      id: 'cargo_run_456',
      type: 'delivery',
      requirements: { destination: 5, deadline: 10 },
      missionCargo: { good: 'sealed_containers', quantity: 10, isIllegal: false },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cargo space/i);
  });

  it('should not place cargo for non-cargo-run missions', () => {
    const state = manager.getState();
    const cargoBefore = state.ship.cargo.length;

    const mission = {
      id: 'intel_123',
      type: 'intel',
      requirements: { targets: [5], deadline: 10 },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(true);
    expect(state.ship.cargo).toHaveLength(cargoBefore);
  });
});
