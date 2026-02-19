import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Completable Mission Detection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return completable delivery mission at destination with cargo', () => {
    manager.acceptMission({
      id: 'completable_delivery',
      type: 'delivery',
      title: 'Grain to Sol',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 0,
        deadline: 10,
      },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('completable_delivery');
  });

  it('should not return missions for wrong destination', () => {
    manager.acceptMission({
      id: 'wrong_dest',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 4,
        deadline: 10,
      },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should not return missions with insufficient cargo', () => {
    manager.acceptMission({
      id: 'not_enough',
      type: 'delivery',
      requirements: {
        cargo: 'medicine',
        quantity: 10,
        destination: 0,
        deadline: 10,
      },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should return completable fetch mission at giver system', () => {
    manager.acceptMission({
      id: 'fetch_complete',
      type: 'fetch',
      giverSystem: 0,
      requirements: { cargo: 'grain', quantity: 5, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable intel mission when all targets visited', () => {
    manager.acceptMission({
      id: 'intel_complete',
      type: 'intel',
      giverSystem: 0,
      requirements: { targets: [0], deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable passenger mission at destination', () => {
    manager.acceptMission({
      id: 'passenger_complete',
      type: 'passenger',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 50 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });
});
