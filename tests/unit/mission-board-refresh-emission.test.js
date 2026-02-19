import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Verifies that refreshMissionBoard emits a new object reference
 * so React's useState detects the change and triggers a re-render.
 *
 * When the same object reference is emitted, React skips the re-render
 * because Object.is(oldState, newState) returns true.
 */
describe('Mission board refresh event emission', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should emit a new object reference when refreshing the board', () => {
    const emittedValues = [];
    gsm.subscribe('missionsChanged', (data) => {
      emittedValues.push(data);
    });

    const stateMissionsBefore = gsm.getState().missions;

    gsm.refreshMissionBoard();

    expect(emittedValues.length).toBe(1);
    expect(emittedValues[0]).not.toBe(stateMissionsBefore);
    expect(emittedValues[0].board.length).toBeGreaterThan(0);
  });
});
