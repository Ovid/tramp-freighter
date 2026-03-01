import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('removeRestrictedCargo', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
    // Default system is Sol (ID 0): 'safe' zone → restricts 'electronics'
    // Core system restrictions → restricts 'parts'
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes restricted goods from cargo at current system', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'electronics')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes core-system-restricted goods (parts) at Sol', () => {
    gsm.updateCargo([
      { good: 'parts', qty: 3, buyPrice: 150 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'parts')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes illegal mission cargo', () => {
    gsm.updateCargo([
      { good: 'unmarked_crates', qty: 2, buyPrice: 0, missionId: 'mission_1' },
      { good: 'food', qty: 5, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.missionId === 'mission_1')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(5);
  });

  it('keeps cargo when nothing is restricted', () => {
    gsm.updateCargo([
      { good: 'food', qty: 10, buyPrice: 20 },
      { good: 'water', qty: 8, buyPrice: 15 },
    ]);

    gsm.removeRestrictedCargo();

    expect(gsm.getState().ship.cargo).toHaveLength(2);
  });
});

describe('applyEncounterOutcome: restrictedGoodsConfiscated', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('removes restricted goods when restrictedGoodsConfiscated is true', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    applyEncounterOutcome(gsm, {
      costs: { restrictedGoodsConfiscated: true },
    });

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'electronics')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('fails missions with illegal mission cargo when confiscated', () => {
    const mission = {
      id: 'test_illegal_mission',
      type: 'delivery',
      title: 'Cargo Run: Unmarked Crates to Tau Ceti',
      destination: { systemId: 4, name: 'Tau Ceti' },
      requirements: { destination: 4, deadline: 20 },
      rewards: { credits: 500 },
      penalties: {},
      missionCargo: { good: 'unmarked_crates', quantity: 2, isIllegal: true },
    };
    gsm.acceptMission(mission);

    applyEncounterOutcome(gsm, {
      costs: { restrictedGoodsConfiscated: true },
    });

    const state = gsm.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('test_illegal_mission');
  });

  it('does not remove cargo when restrictedGoodsConfiscated is absent', () => {
    gsm.updateCargo([{ good: 'electronics', qty: 5, buyPrice: 100 }]);

    applyEncounterOutcome(gsm, {
      costs: { credits: 100 },
    });

    expect(gsm.getState().ship.cargo).toHaveLength(1);
  });
});
