import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Mission Completion Paths — fetch and intel types', () => {
  let gsm;
  let state;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = createTestGameStateManager();
    state = gsm.getState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper: push an active mission directly into state
  function addActiveMission(mission) {
    state.missions.active.push({
      ...mission,
      acceptedDay: 0,
      deadlineDay: 30,
    });
  }

  // Helper: set cargo in ship hold
  function setCargo(entries) {
    state.ship.cargo = entries.map((e) => ({
      good: e.good,
      qty: e.qty,
      buyPrice: 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // completeMission — fetch type
  // ---------------------------------------------------------------------------
  describe('completeMission — fetch type', () => {
    const fetchMission = {
      id: 'fetch-1',
      type: 'fetch',
      title: 'Fetch Ore',
      giverSystem: 0,
      requirements: { cargo: 'ore', quantity: 5, deadline: 30 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };

    it('succeeds when at giverSystem with required cargo', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 5 }]);

      const result = gsm.completeMission('fetch-1');

      expect(result.success).toBe(true);
      expect(result.rewards).toEqual({ credits: 500 });
    });

    it('fails when not at giverSystem', () => {
      addActiveMission({ ...fetchMission, giverSystem: 4 });
      setCargo([{ good: 'ore', qty: 5 }]);

      const result = gsm.completeMission('fetch-1');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('not at the mission destination');
    });

    it('fails when insufficient cargo quantity', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 2 }]);

      const result = gsm.completeMission('fetch-1');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not enough ore');
    });

    it('succeeds when giverSystem is undefined (no location check)', () => {
      const noGiverMission = { ...fetchMission, giverSystem: undefined };
      delete noGiverMission.giverSystem;
      addActiveMission(noGiverMission);
      setCargo([{ good: 'ore', qty: 5 }]);

      // Player is at Sol (0) but giverSystem is undefined, so location is not checked
      state.player.currentSystem = 7; // Sirius A — different system
      const result = gsm.completeMission('fetch-1');

      expect(result.success).toBe(true);
    });

    it('removes cargo from hold on success', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 10 }]);

      gsm.completeMission('fetch-1');

      // removeCargoForMission removes the required quantity from the hold
      const oreRemaining = state.ship.cargo
        .filter((c) => c.good === 'ore')
        .reduce((sum, c) => sum + c.qty, 0);
      expect(oreRemaining).toBe(5);
    });

    it('awards credits on success minus withholding', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 5 }]);
      const creditsBefore = state.player.credits;

      const result = gsm.completeMission('fetch-1');

      const net = 500 - result.withheld;
      expect(state.player.credits).toBe(creditsBefore + net);
    });

    it('awards rep rewards on success', () => {
      const missionWithRep = {
        ...fetchMission,
        rewards: { credits: 500, rep: { cole_sol: 10 } },
      };
      addActiveMission(missionWithRep);
      setCargo([{ good: 'ore', qty: 5 }]);
      const repBefore = gsm.getNPCState('cole_sol').rep;

      gsm.completeMission('fetch-1');

      expect(gsm.getNPCState('cole_sol').rep).toBeGreaterThan(repBefore);
    });
  });

  // ---------------------------------------------------------------------------
  // completeMission — intel type
  // ---------------------------------------------------------------------------
  describe('completeMission — intel type', () => {
    const intelMission = {
      id: 'intel-1',
      type: 'intel',
      title: 'Scout Systems',
      giverSystem: 0,
      requirements: { targets: [1, 4], deadline: 30 },
      rewards: { credits: 300 },
      penalties: { failure: {} },
    };

    it('succeeds when at giverSystem and all targets visited', () => {
      addActiveMission(intelMission);
      state.world.visitedSystems = [0, 1, 4];

      const result = gsm.completeMission('intel-1');

      expect(result.success).toBe(true);
      expect(result.rewards).toEqual({ credits: 300 });
    });

    it('fails when not at giverSystem', () => {
      addActiveMission({ ...intelMission, giverSystem: 4 });
      state.world.visitedSystems = [0, 1, 4];

      const result = gsm.completeMission('intel-1');

      expect(result.success).toBe(false);
      expect(result.reason).toContain('not at the mission destination');
    });

    it('fails when not all targets have been visited', () => {
      addActiveMission(intelMission);
      // Only visited system 1, not system 4
      state.world.visitedSystems = [0, 1];

      const result = gsm.completeMission('intel-1');

      expect(result.success).toBe(false);
      expect(result.reason).toContain(
        'Not all target systems have been visited'
      );
    });

    it('succeeds when giverSystem is undefined (no location check)', () => {
      const noGiverMission = { ...intelMission, giverSystem: undefined };
      delete noGiverMission.giverSystem;
      addActiveMission(noGiverMission);
      state.world.visitedSystems = [0, 1, 4];
      state.player.currentSystem = 13; // Epsilon Eridani — different system

      const result = gsm.completeMission('intel-1');

      expect(result.success).toBe(true);
    });

    it('awards credits on success minus withholding', () => {
      addActiveMission(intelMission);
      state.world.visitedSystems = [0, 1, 4];
      const creditsBefore = state.player.credits;

      const result = gsm.completeMission('intel-1');

      const net = 300 - result.withheld;
      expect(state.player.credits).toBe(creditsBefore + net);
    });

    it('awards rep rewards on success', () => {
      const missionWithRep = {
        ...intelMission,
        rewards: { credits: 300, rep: { cole_sol: 5 } },
      };
      addActiveMission(missionWithRep);
      state.world.visitedSystems = [0, 1, 4];
      const repBefore = gsm.getNPCState('cole_sol').rep;

      gsm.completeMission('intel-1');

      expect(gsm.getNPCState('cole_sol').rep).toBeGreaterThan(repBefore);
    });
  });

  // ---------------------------------------------------------------------------
  // getCompletableMissions — fetch
  // ---------------------------------------------------------------------------
  describe('getCompletableMissions — fetch', () => {
    const fetchMission = {
      id: 'fetch-1',
      type: 'fetch',
      title: 'Fetch Ore',
      giverSystem: 0,
      requirements: { cargo: 'ore', quantity: 5, deadline: 30 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };

    it('returns fetch mission when at giverSystem with enough cargo', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 5 }]);

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(1);
      expect(completable[0].id).toBe('fetch-1');
    });

    it('excludes fetch mission when not at giverSystem', () => {
      addActiveMission({ ...fetchMission, giverSystem: 4 });
      setCargo([{ good: 'ore', qty: 5 }]);

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(0);
    });

    it('excludes fetch mission when cargo insufficient', () => {
      addActiveMission(fetchMission);
      setCargo([{ good: 'ore', qty: 2 }]);

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(0);
    });

    it('returns fetch mission with no cargo requirement when at giverSystem', () => {
      const noCargo = {
        ...fetchMission,
        id: 'fetch-nocargo',
        requirements: { deadline: 30 },
      };
      addActiveMission(noCargo);

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(1);
      expect(completable[0].id).toBe('fetch-nocargo');
    });
  });

  // ---------------------------------------------------------------------------
  // getCompletableMissions — intel
  // ---------------------------------------------------------------------------
  describe('getCompletableMissions — intel', () => {
    const intelMission = {
      id: 'intel-1',
      type: 'intel',
      title: 'Scout Systems',
      giverSystem: 0,
      requirements: { targets: [1, 4], deadline: 30 },
      rewards: { credits: 300 },
      penalties: { failure: {} },
    };

    it('returns intel mission when at giverSystem and all targets visited', () => {
      addActiveMission(intelMission);
      state.world.visitedSystems = [0, 1, 4];

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(1);
      expect(completable[0].id).toBe('intel-1');
    });

    it('excludes intel mission when not at giverSystem', () => {
      addActiveMission({ ...intelMission, giverSystem: 4 });
      state.world.visitedSystems = [0, 1, 4];

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(0);
    });

    it('excludes intel mission when targets not all visited', () => {
      addActiveMission(intelMission);
      // Only system 1 visited, not system 4
      state.world.visitedSystems = [0, 1];

      const completable = gsm.getCompletableMissions();

      expect(completable).toHaveLength(0);
    });
  });
});
