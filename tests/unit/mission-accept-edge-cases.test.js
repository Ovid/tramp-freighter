import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('MissionManager acceptMission edge cases', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects passenger mission when insufficient cargo space', () => {
    vi.spyOn(gsm.stateManager, 'getCargoRemaining').mockReturnValue(0);
    const mission = {
      id: 'p1',
      type: 'passenger',
      requirements: { cargoSpace: 5, destination: 4, deadline: 10 },
      rewards: { credits: 500 },
    };
    const result = gsm.missionManager.acceptMission(mission);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo space');
  });

  it('rejects mission with missionCargo when insufficient cargo space', () => {
    vi.spyOn(gsm.stateManager, 'getCargoRemaining').mockReturnValue(2);
    const mission = {
      id: 'm1',
      type: 'delivery',
      missionCargo: { good: 'ore', quantity: 10 },
      requirements: { destination: 4, deadline: 10 },
      rewards: { credits: 500 },
    };
    const result = gsm.missionManager.acceptMission(mission);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo space');
  });

  it('places mission cargo in hold on acceptance', () => {
    vi.spyOn(gsm.stateManager, 'getCargoRemaining').mockReturnValue(100);
    const mission = {
      id: 'm1',
      type: 'delivery',
      missionCargo: { good: 'ore', quantity: 5 },
      requirements: { destination: 4, deadline: 10 },
      rewards: { credits: 500 },
    };
    gsm.state.ship.cargo = [];
    gsm.state.missions.board = [mission];
    const result = gsm.missionManager.acceptMission(mission);
    expect(result.success).toBe(true);
    expect(gsm.state.ship.cargo).toHaveLength(1);
    expect(gsm.state.ship.cargo[0].good).toBe('ore');
    expect(gsm.state.ship.cargo[0].qty).toBe(5);
    expect(gsm.state.ship.cargo[0].buyPrice).toBe(0);
    expect(gsm.state.ship.cargo[0].missionId).toBe('m1');
  });

  it('emits cargoChanged when mission cargo is placed', () => {
    vi.spyOn(gsm.stateManager, 'getCargoRemaining').mockReturnValue(100);
    const emitSpy = vi.spyOn(gsm, 'emit');
    const mission = {
      id: 'm1',
      type: 'delivery',
      missionCargo: { good: 'ore', quantity: 5 },
      requirements: { destination: 4, deadline: 10 },
      rewards: { credits: 500 },
    };
    gsm.state.ship.cargo = [];
    gsm.state.missions.board = [mission];
    gsm.missionManager.acceptMission(mission);
    const cargoChangedCalls = emitSpy.mock.calls.filter(
      (call) => call[0] === 'cargoChanged'
    );
    expect(cargoChangedCalls.length).toBeGreaterThan(0);
  });
});
