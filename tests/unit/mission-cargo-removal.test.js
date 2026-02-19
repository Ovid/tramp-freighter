import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Cargo Removal', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should remove exact quantity from a single cargo stack', () => {
    const result = manager.removeCargoForMission('grain', 10);
    expect(result.success).toBe(true);

    const state = manager.getState();
    const grainTotal = state.ship.cargo
      .filter((c) => c.good === 'grain')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(grainTotal).toBe(10);
  });

  it('should fail if not enough cargo', () => {
    const result = manager.removeCargoForMission('grain', 100);
    expect(result.success).toBe(false);
  });

  it('should remove empty stacks after removal', () => {
    manager.removeCargoForMission('grain', 20);
    const state = manager.getState();
    const grainStacks = state.ship.cargo.filter((c) => c.good === 'grain');
    expect(grainStacks).toHaveLength(0);
  });

  it('should fail for cargo not present', () => {
    const result = manager.removeCargoForMission('medicine', 5);
    expect(result.success).toBe(false);
  });
});
