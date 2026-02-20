import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { generatePassengerMission } from '../../src/game/mission-generator.js';

describe('Passenger Mission Lifecycle', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete full passenger lifecycle with satisfaction tracking', () => {
    // Generate a passenger mission from Sol
    const mission = generatePassengerMission(
      0,
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA,
      () => 0.5
    );

    // Accept the mission
    const acceptResult = manager.acceptMission(mission);
    expect(acceptResult.success).toBe(true);

    // Verify passenger is on the active mission
    const active = manager.getActiveMissions();
    expect(active).toHaveLength(1);
    expect(active[0].passenger).toBeDefined();
    const initialSatisfaction = active[0].passenger.satisfaction;
    expect(initialSatisfaction).toBe(PASSENGER_CONFIG.INITIAL_SATISFACTION);

    // Simulate a delay event — wealthy passenger has speed weight 0.3
    manager.updatePassengerSatisfaction(mission.id, 'delay');
    expect(active[0].passenger.satisfaction).toBeLessThan(initialSatisfaction);

    // Move player to destination
    manager.updateLocation(mission.requirements.destination);

    // Complete the mission
    const state = manager.getState();
    const creditsBefore = state.player.credits;
    const completeResult = manager.completeMission(mission.id);
    expect(completeResult.success).toBe(true);

    // Verify payment was applied
    const creditsEarned = state.player.credits - creditsBefore;
    expect(creditsEarned).toBeGreaterThan(0);

    // Verify mission is in completed list
    expect(state.missions.completed).toContain(mission.id);
    expect(state.missions.active).toHaveLength(0);
  });

  it('should reject passenger mission when cargo space is full', () => {
    const mission = generatePassengerMission(
      0,
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA,
      () => 0.5
    );

    // Fill cargo to capacity so no space remains for the passenger
    const state = manager.getState();
    state.ship.cargo = [{ good: 'grain', qty: 50, buyPrice: 10, buySystem: 0, buySystemName: 'Sol', buyDate: 0 }];

    const result = manager.acceptMission(mission);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo space');
  });

  it('should track multiple satisfaction events and affect final payment', () => {
    // Use rng=0.7 to generate a scientist passenger who has safety weight
    // so combat events actually reduce satisfaction
    const mission = generatePassengerMission(
      0,
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA,
      () => 0.7
    );

    manager.acceptMission(mission);
    const state = manager.getState();

    // Multiple negative events — scientist has speed:0.5, comfort:0.3, safety:0.2
    manager.updatePassengerSatisfaction(mission.id, 'delay');
    manager.updatePassengerSatisfaction(mission.id, 'delay');
    manager.updatePassengerSatisfaction(mission.id, 'combat');

    const satisfaction = state.missions.active[0].passenger.satisfaction;
    expect(satisfaction).toBeLessThan(PASSENGER_CONFIG.INITIAL_SATISFACTION);

    // Complete at destination
    manager.updateLocation(mission.requirements.destination);
    const creditsBefore = state.player.credits;
    manager.completeMission(mission.id);

    const creditsEarned = state.player.credits - creditsBefore;
    // With reduced satisfaction, payment should be less than base * 1.4 (max multiplier + on-time)
    expect(creditsEarned).toBeLessThan(
      Math.round(mission.rewards.credits * 1.4)
    );
    expect(creditsEarned).toBeGreaterThan(0);
  });
});
