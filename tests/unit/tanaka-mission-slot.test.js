import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { MISSION_CONFIG } from '@game/constants.js';

describe('Tanaka quest mission slot', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isTanakaQuestActive should return false when quest not started', () => {
    expect(game.isTanakaQuestActive()).toBe(false);
  });

  it('isTanakaQuestActive should return true when quest is at stage 1+', () => {
    const state = game.getState();
    state.quests.tanaka = {
      stage: 1,
      data: { _rewardsClaimedStage: 0 },
      startedDay: 0,
      completedDay: null,
    };
    expect(game.isTanakaQuestActive()).toBe(true);
  });

  it('isTanakaQuestActive should return false when stage 5 rewards claimed', () => {
    const state = game.getState();
    state.quests.tanaka = {
      stage: 5,
      data: { _rewardsClaimedStage: 5 },
      startedDay: 0,
      completedDay: null,
    };
    expect(game.isTanakaQuestActive()).toBe(false);
  });

  it('should count Tanaka quest as occupying a mission slot', () => {
    expect(game.getEffectiveMissionCount()).toBe(0);

    const state = game.getState();
    state.quests.tanaka = {
      stage: 1,
      data: { _rewardsClaimedStage: 0 },
      startedDay: 0,
      completedDay: null,
    };
    expect(game.getEffectiveMissionCount()).toBe(1);
  });

  it('should reject mission acceptance when Tanaka + regular missions fill all slots', () => {
    const state = game.getState();
    state.quests.tanaka = {
      stage: 1,
      data: { _rewardsClaimedStage: 0 },
      startedDay: 0,
      completedDay: null,
    };

    // Add 2 regular missions (fills remaining 2 of 3 slots)
    state.missions.active = [
      {
        id: 'test1',
        type: 'delivery',
        title: 'Test 1',
        requirements: { deadline: 10, destination: 5 },
        destination: { systemId: 5, name: 'Wolf 359' },
        rewards: { credits: 100 },
      },
      {
        id: 'test2',
        type: 'delivery',
        title: 'Test 2',
        requirements: { deadline: 10, destination: 5 },
        destination: { systemId: 5, name: 'Wolf 359' },
        rewards: { credits: 100 },
      },
    ];

    const result = game.acceptMission({
      id: 'test3',
      type: 'delivery',
      title: 'Test 3',
      requirements: { deadline: 10, destination: 5 },
      destination: { systemId: 5, name: 'Wolf 359' },
      rewards: { credits: 100 },
    });
    expect(result.success).toBe(false);
  });
});
