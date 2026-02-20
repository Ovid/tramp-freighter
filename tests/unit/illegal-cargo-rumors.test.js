import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Illegal Cargo Rumors - Detection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return false when cargo is empty', () => {
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return false when cargo has only legal goods', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'grain', qty: 5, buyPrice: 10 },
      { good: 'parts', qty: 3, buyPrice: 20 },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return false for legal mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      {
        good: 'sealed_containers',
        qty: 5,
        buyPrice: 0,
        missionId: 'mission_1',
      },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });

  it('should return true for illegal mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return true for prohibited_tech mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      { good: 'prohibited_tech', qty: 3, buyPrice: 0, missionId: 'mission_2' },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return true for black_market_goods mission cargo', () => {
    const state = manager.getState();
    state.ship.cargo = [
      {
        good: 'black_market_goods',
        qty: 2,
        buyPrice: 0,
        missionId: 'mission_3',
      },
    ];
    expect(manager.hasIllegalMissionCargo()).toBe(true);
  });

  it('should return false for illegal goods without a missionId', () => {
    const state = manager.getState();
    state.ship.cargo = [{ good: 'unmarked_crates', qty: 5, buyPrice: 10 }];
    expect(manager.hasIllegalMissionCargo()).toBe(false);
  });
});

describe('Illegal Cargo Rumors - Pirate Probability', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should increase pirate encounter chance when carrying illegal mission cargo', () => {
    const state = manager.getState();
    const gameState = {
      ship: { cargo: [], engine: 100, upgrades: [] },
      player: { factions: { outlaws: 0, authorities: 0 } },
    };
    const baseChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    gameState.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'mission_1' },
    ];
    const rumorChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    expect(rumorChance).toBeGreaterThan(baseChance);
  });

  it('should not increase pirate chance for legal mission cargo', () => {
    const state = manager.getState();
    const gameState = {
      ship: { cargo: [], engine: 100, upgrades: [] },
      player: { factions: { outlaws: 0, authorities: 0 } },
    };
    const baseChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    gameState.ship.cargo = [
      {
        good: 'sealed_containers',
        qty: 5,
        buyPrice: 0,
        missionId: 'mission_1',
      },
    ];
    const legalChance = manager.calculatePirateEncounterChance(
      state.player.currentSystem,
      gameState
    );

    expect(legalChance).toBe(baseChance);
  });
});
