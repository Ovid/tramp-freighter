import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('MissionManager.failMissionsDueToCargoLoss – faction penalties', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing when no active missions have missionCargo', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'intel_1',
        type: 'intel',
        requirements: { targets: [5], deadline: 10 },
        rewards: { credits: 100 },
        penalties: { failure: {} },
      },
    ];

    const modifySpy = vi.spyOn(gsm, 'modifyFactionRep');

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(1);
    expect(state.missions.failed).toHaveLength(0);
    expect(modifySpy).not.toHaveBeenCalled();
  });

  it('keeps missions whose cargo is still in the hold', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'cargo_run_1',
        type: 'delivery',
        missionCargo: { good: 'registered_freight', quantity: 5, isIllegal: false },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 200 },
        penalties: { failure: { faction: { traders: -2 } } },
      },
    ];
    state.ship.cargo = [
      { good: 'registered_freight', qty: 5, buyPrice: 0, missionId: 'cargo_run_1' },
    ];

    const modifySpy = vi.spyOn(gsm, 'modifyFactionRep');

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(1);
    expect(state.missions.active[0].id).toBe('cargo_run_1');
    expect(state.missions.failed).toHaveLength(0);
    expect(modifySpy).not.toHaveBeenCalled();
  });

  it('fails missions whose cargo is missing from the hold', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'cargo_run_2',
        type: 'delivery',
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 300 },
        penalties: { failure: { faction: { outlaws: -3 } } },
      },
    ];
    // Cargo hold is empty — mission cargo is missing
    state.ship.cargo = [];

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('cargo_run_2');
  });

  it('applies faction reputation penalties from mission.penalties.failure.faction', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'cargo_run_3',
        type: 'delivery',
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 300 },
        penalties: { failure: { faction: { traders: -2, outlaws: -5 } } },
      },
    ];
    state.ship.cargo = [];

    const modifySpy = vi.spyOn(gsm, 'modifyFactionRep');

    gsm.failMissionsDueToCargoLoss();

    expect(modifySpy).toHaveBeenCalledTimes(2);
    expect(modifySpy).toHaveBeenCalledWith(
      'traders',
      -2,
      'mission_cargo_confiscated'
    );
    expect(modifySpy).toHaveBeenCalledWith(
      'outlaws',
      -5,
      'mission_cargo_confiscated'
    );
  });

  it('does not crash when mission has no penalties object', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'cargo_run_4',
        type: 'delivery',
        missionCargo: { good: 'registered_freight', quantity: 3, isIllegal: false },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 100 },
        // No penalties property at all
      },
    ];
    state.ship.cargo = [];

    const modifySpy = vi.spyOn(gsm, 'modifyFactionRep');

    expect(() => gsm.failMissionsDueToCargoLoss()).not.toThrow();

    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('cargo_run_4');
    expect(modifySpy).not.toHaveBeenCalled();
  });

  it('handles mix of cargo and non-cargo missions correctly', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'cargo_run_5',
        type: 'delivery',
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 300 },
        penalties: { failure: { faction: { outlaws: -3 } } },
      },
      {
        id: 'intel_2',
        type: 'intel',
        requirements: { targets: [5], deadline: 10 },
        rewards: { credits: 100 },
        penalties: { failure: {} },
      },
      {
        id: 'cargo_run_6',
        type: 'delivery',
        missionCargo: { good: 'registered_freight', quantity: 3, isIllegal: false },
        requirements: { destination: 5, deadline: 10 },
        rewards: { credits: 200 },
        penalties: { failure: { faction: { traders: -1 } } },
      },
    ];
    // Only cargo_run_6 has its cargo in the hold; cargo_run_5 does not
    state.ship.cargo = [
      { good: 'registered_freight', qty: 3, buyPrice: 0, missionId: 'cargo_run_6' },
    ];

    const modifySpy = vi.spyOn(gsm, 'modifyFactionRep');

    gsm.failMissionsDueToCargoLoss();

    // cargo_run_5 should be failed (missing cargo)
    expect(state.missions.failed).toContain('cargo_run_5');
    // cargo_run_6 and intel_2 should remain active
    const activeIds = state.missions.active.map((m) => m.id);
    expect(activeIds).toContain('intel_2');
    expect(activeIds).toContain('cargo_run_6');
    expect(activeIds).not.toContain('cargo_run_5');
    expect(state.missions.active).toHaveLength(2);

    // Only cargo_run_5's penalties should be applied
    expect(modifySpy).toHaveBeenCalledTimes(1);
    expect(modifySpy).toHaveBeenCalledWith(
      'outlaws',
      -3,
      'mission_cargo_confiscated'
    );
  });
});
