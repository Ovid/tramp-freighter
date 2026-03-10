import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('Mission Completion', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGame();
  });

  describe('completing a delivery mission when at destination with cargo', () => {
    let result;
    let creditsBefore;

    beforeEach(() => {
      const mission = {
        id: 'test_delivery',
        type: 'delivery',
        title: 'Test Delivery',
        requirements: {
          cargo: 'grain',
          quantity: 10,
          destination: 0,
          deadline: 7,
        },
        rewards: { credits: 500 },
        penalties: { failure: {} },
      };
      manager.acceptMission(mission);
      creditsBefore = manager.getState().player.credits;
      result = manager.completeMission('test_delivery');
    });

    it('should return success when completing a valid mission', () => {
      expect(result.success).toBe(true);
      expect(result.rewards).toEqual({ credits: 500 });
    });

    it('should remove mission from active list on completion', () => {
      expect(manager.getState().missions.active).toHaveLength(0);
    });

    it('should add mission ID to completed list', () => {
      expect(manager.getState().missions.completed).toContain('test_delivery');
    });

    it('should award credits on completion minus withholding', () => {
      // 5% lien at low heat: ceil(500 * 0.05) = 25 withheld
      expect(manager.getState().player.credits).toBe(creditsBefore + 475);
    });
  });

  it('should reject completion if not at destination', () => {
    const mission = {
      id: 'test_wrong_dest',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 4,
        deadline: 7,
      },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_wrong_dest');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('destination');
  });

  it('should reject completion if cargo requirements not met', () => {
    const mission = {
      id: 'test_no_cargo',
      type: 'delivery',
      requirements: {
        cargo: 'medicine',
        quantity: 10,
        destination: 0,
        deadline: 7,
      },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_no_cargo');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo');
  });

  it('should complete a fetch mission at giver system with cargo', () => {
    const mission = {
      id: 'test_fetch',
      type: 'fetch',
      title: 'Fetch Grain',
      giverSystem: 0,
      requirements: { cargo: 'grain', quantity: 5, deadline: 10 },
      rewards: { credits: 300 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_fetch');
    expect(result.success).toBe(true);
  });

  it('should complete an intel mission when all targets visited and at giver system', () => {
    const mission = {
      id: 'test_intel',
      type: 'intel',
      title: 'Scout Systems',
      giverSystem: 0,
      requirements: { targets: [0], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_intel');
    expect(result.success).toBe(true);
  });

  it('should reject intel mission if not all targets visited', () => {
    const mission = {
      id: 'test_intel_fail',
      type: 'intel',
      giverSystem: 0,
      requirements: { targets: [0, 4, 7], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_intel_fail');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('visited');
  });

  it('should complete a passenger mission at destination', () => {
    const mission = {
      id: 'test_passenger',
      type: 'passenger',
      title: 'Transport Passenger',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 50 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_passenger');
    expect(result.success).toBe(true);
  });

  it('should apply faction reputation rewards on completion', () => {
    const mission = {
      id: 'test_faction_rep',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 0,
        deadline: 7,
      },
      rewards: { credits: 500, faction: { civilians: 5 } },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('test_faction_rep');
    expect(manager.getFactionRep('civilians')).toBe(5);
  });

  it('should apply NPC rep rewards on completion', () => {
    const mission = {
      id: 'test_npc_rep',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 0,
        deadline: 7,
      },
      rewards: { credits: 500, rep: { cole_sol: 10 } },
      penalties: { failure: {} },
    };
    const repBefore = manager.getNPCState('cole_sol').rep;
    manager.acceptMission(mission);
    manager.completeMission('test_npc_rep');
    expect(manager.getNPCState('cole_sol').rep).toBeGreaterThan(repBefore);
  });

  it('should apply karma rewards on completion', () => {
    const mission = {
      id: 'test_karma',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 0,
        deadline: 7,
      },
      rewards: { credits: 500, karma: 2 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('test_karma');
    expect(manager.getKarma()).toBe(2);
  });

  it('should return not found for unknown mission id', () => {
    const result = manager.completeMission('nonexistent');
    expect(result.success).toBe(false);
  });

  describe('Cole withholding on mission rewards', () => {
    it('should apply withholding to delivery mission credit rewards', () => {
      const mission = {
        id: 'test_withholding',
        type: 'delivery',
        title: 'Test Withholding',
        requirements: {
          cargo: 'grain',
          quantity: 10,
          destination: 0,
          deadline: 7,
        },
        rewards: { credits: 500 },
        penalties: { failure: {} },
      };
      manager.acceptMission(mission);
      const debtBefore = manager.getState().player.debt;
      const creditsBefore = manager.getState().player.credits;
      const result = manager.completeMission('test_withholding');

      // 5% lien at low heat: ceil(500 * 0.05) = 25
      expect(result.withheld).toBe(25);
      expect(manager.getState().player.credits).toBe(creditsBefore + 475);
      // Cole's cut is a pure penalty — debt unchanged
      expect(manager.getState().player.debt).toBe(debtBefore);
    });

    it('should not withhold when debt is zero', () => {
      manager.getState().player.debt = 0;
      const mission = {
        id: 'test_no_withholding',
        type: 'delivery',
        title: 'No Debt',
        requirements: {
          cargo: 'grain',
          quantity: 10,
          destination: 0,
          deadline: 7,
        },
        rewards: { credits: 500 },
        penalties: { failure: {} },
      };
      manager.acceptMission(mission);
      const creditsBefore = manager.getState().player.credits;
      const result = manager.completeMission('test_no_withholding');

      expect(result.withheld).toBe(0);
      expect(manager.getState().player.credits).toBe(creditsBefore + 500);
    });

    it('should apply withholding to passenger payment', () => {
      const mission = {
        id: 'test_passenger_wh',
        type: 'passenger',
        title: 'Passenger Withholding',
        requirements: { destination: 0, deadline: 10 },
        passenger: { type: 'business', satisfaction: 80 },
        rewards: { credits: 800 },
        penalties: { failure: {} },
      };
      manager.acceptMission(mission);
      const debtBefore = manager.getState().player.debt;
      const result = manager.completeMission('test_passenger_wh');

      expect(result.withheld).toBeGreaterThan(0);
      // Cole's cut is a pure penalty — debt unchanged
      expect(manager.getState().player.debt).toBe(debtBefore);
    });
  });
});
