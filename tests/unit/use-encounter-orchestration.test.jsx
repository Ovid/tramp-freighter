import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounterOrchestration } from '../../src/hooks/useEncounterOrchestration.js';

// Suppress console.error from expected error paths
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockGame() {
  const subscribers = {};
  return {
    resolveCombatChoice: vi.fn(),
    resolveNegotiation: vi.fn(),
    resolveEncounter: vi.fn(),
    getState: vi.fn(() => ({
      ship: {
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargo: [],
        cargoCapacity: 50,
      },
      player: { credits: 1000, daysElapsed: 10, currentSystem: 0, debt: 0 },
    })),
    updateFuel: vi.fn(),
    updateShipCondition: vi.fn(),
    updateCredits: vi.fn(),
    updateCargo: vi.fn(),
    updateTime: vi.fn(),
    updateDebt: vi.fn(),
    clearHiddenCargo: vi.fn(),
    removeRestrictedCargo: vi.fn(),
    modifyKarma: vi.fn(),
    modifyFactionRep: vi.fn(),
    modifyAllPassengerSatisfaction: vi.fn(),
    abandonMission: vi.fn(),
    failMissionsDueToCargoLoss: vi.fn(),
    markDirty: vi.fn(),
    subscribe: vi.fn((event, handler) => {
      if (!subscribers[event]) subscribers[event] = [];
      subscribers[event].push(handler);
    }),
    unsubscribe: vi.fn((event, handler) => {
      if (subscribers[event]) {
        subscribers[event] = subscribers[event].filter((h) => h !== handler);
      }
    }),
    _emit: (event, data) => {
      if (subscribers[event]) {
        subscribers[event].forEach((h) => h(data));
      }
    },
  };
}

function createMockNotificationCtx() {
  return {
    showInfo: vi.fn(),
    showError: vi.fn(),
  };
}

function makePirateEncounter(threatLevel = 'moderate') {
  return {
    type: 'pirate',
    encounter: { threatLevel, strengthModifier: 0 },
  };
}

function makeInspectionEncounter() {
  return {
    type: 'inspection',
    encounter: { severity: 'routine' },
  };
}

describe('useEncounterOrchestration', () => {
  let mockGame;
  let mockNotification;
  let setViewMode;

  beforeEach(() => {
    mockGame = createMockGame();
    mockNotification = createMockNotificationCtx();
    setViewMode = vi.fn();
  });

  function renderOrchestrationHook(encounterEvent = null) {
    const hookResult = renderHook(
      ({ encounterEvent: ee }) =>
        useEncounterOrchestration(mockGame, mockNotification, ee),
      { initialProps: { encounterEvent } }
    );
    // Register setViewMode so the hook can drive view transitions
    act(() => {
      hookResult.result.current.registerSetViewMode(setViewMode);
    });
    return hookResult;
  }

  describe('initial state', () => {
    it('has correct default values', () => {
      const { result } = renderOrchestrationHook();
      expect(result.current.currentEncounter).toBeNull();
      expect(result.current.encounterOutcome).toBeNull();
      expect(result.current.encounterPhase).toBe('initial');
      expect(result.current.combatContext).toBeNull();
      expect(result.current.isEncounterActive).toBe(false);
      expect(result.current.jumpInProgressRef.current).toBe(false);
    });
  });

  describe('handleEncounterTriggered', () => {
    it('sets encounter state and requests ENCOUNTER view mode', () => {
      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      expect(result.current.currentEncounter).toBe(encounter);
      expect(result.current.encounterPhase).toBe('initial');
      expect(result.current.isEncounterActive).toBe(true);
      expect(setViewMode).toHaveBeenCalledWith('ENCOUNTER');
    });
  });

  describe('handleEncounterChoice — pirate flee', () => {
    it('shows outcome on successful flee', () => {
      mockGame.resolveCombatChoice.mockReturnValue({
        success: true,
        costs: {},
        rewards: {},
        description: 'You escaped!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('flee');
      });

      expect(mockGame.resolveCombatChoice).toHaveBeenCalledWith(
        encounter.encounter,
        'evasive'
      );
      expect(result.current.encounterOutcome).not.toBeNull();
      expect(result.current.encounterOutcome.success).toBe(true);
      expect(result.current.encounterOutcome.choiceMade).toBe('flee');
    });

    it('transitions to combat phase on failed flee', () => {
      mockGame.resolveCombatChoice.mockReturnValue({
        success: false,
        costs: { hull: 10 },
        rewards: {},
        description: 'They caught you!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('flee');
      });

      expect(result.current.encounterPhase).toBe('combat');
      expect(result.current.combatContext).toEqual({
        fleeAttemptFailed: true,
        hullDamage: 10,
        description: 'They caught you!',
      });
      expect(result.current.encounterOutcome).toBeNull();
    });
  });

  describe('handleEncounterChoice — route to sub-panels', () => {
    it('routes fight to combat phase', () => {
      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('fight');
      });

      expect(result.current.encounterPhase).toBe('combat');
    });

    it('routes negotiate to negotiation phase', () => {
      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('negotiate');
      });

      expect(result.current.encounterPhase).toBe('negotiation');
    });
  });

  describe('handleEncounterChoice — combat sub-choice resolution', () => {
    it('resolves combat sub-choice and shows outcome', () => {
      mockGame.resolveCombatChoice.mockReturnValue({
        success: true,
        costs: {},
        rewards: { credits: 50 },
        description: 'You won the fight!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      // Route to combat phase first
      act(() => {
        result.current.handleEncounterChoice('fight');
      });

      // Make combat sub-choice
      act(() => {
        result.current.handleEncounterChoice('return_fire');
      });

      expect(mockGame.resolveCombatChoice).toHaveBeenCalledWith(
        encounter.encounter,
        'return_fire'
      );
      expect(result.current.encounterOutcome).not.toBeNull();
      expect(result.current.encounterOutcome.success).toBe(true);
    });
  });

  describe('handleEncounterChoice — negotiation with escalation', () => {
    it('escalates to combat on failed counter-proposal', () => {
      mockGame.resolveNegotiation.mockReturnValue({
        escalate: true,
        description: 'The pirates are angered by your counter-proposal!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('negotiate');
      });

      act(() => {
        result.current.handleEncounterChoice('counter_proposal');
      });

      expect(result.current.encounterPhase).toBe('escalated_combat');
      expect(result.current.encounterOutcome).not.toBeNull();
      // Threat level should be bumped
      expect(encounter.encounter.threatLevel).toBe('strong');
      expect(encounter.encounter.strengthModifier).toBe(0.1);
    });
  });

  describe('handleEncounterClose', () => {
    it('clears all encounter state and returns to orbit', () => {
      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterClose();
      });

      expect(result.current.currentEncounter).toBeNull();
      expect(result.current.encounterPhase).toBe('initial');
      expect(result.current.combatContext).toBeNull();
      expect(result.current.isEncounterActive).toBe(false);
      expect(setViewMode).toHaveBeenCalledWith('ORBIT');
    });
  });

  describe('handleOutcomeContinue', () => {
    it('returns to initial phase with escalated context from escalated_combat', () => {
      mockGame.resolveNegotiation.mockReturnValue({
        escalate: true,
        description: 'Pirates angered!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('negotiate');
      });

      act(() => {
        result.current.handleEncounterChoice('counter_proposal');
      });

      // Now in escalated_combat phase with an outcome
      expect(result.current.encounterPhase).toBe('escalated_combat');

      act(() => {
        result.current.handleOutcomeContinue();
      });

      // Should return to initial with escalated context, not clear everything
      expect(result.current.encounterPhase).toBe('initial');
      expect(result.current.encounterOutcome).toBeNull();
      expect(result.current.combatContext).toEqual({ escalated: true });
      expect(result.current.currentEncounter).not.toBeNull();
    });

    it('clears everything on normal outcome continue', () => {
      mockGame.resolveCombatChoice.mockReturnValue({
        success: true,
        costs: {},
        rewards: {},
        description: 'You escaped!',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('flee');
      });

      // Should have an outcome now
      expect(result.current.encounterOutcome).not.toBeNull();

      act(() => {
        result.current.handleOutcomeContinue();
      });

      expect(result.current.currentEncounter).toBeNull();
      expect(result.current.encounterOutcome).toBeNull();
      expect(result.current.encounterPhase).toBe('initial');
      expect(result.current.combatContext).toBeNull();
      expect(setViewMode).toHaveBeenCalledWith('ORBIT');
    });
  });

  describe('jump buffering', () => {
    it('buffers encounter during jump and reveals on complete', () => {
      const encounter = makePirateEncounter();
      const { result, rerender } = renderOrchestrationHook(null);

      // Start a jump
      act(() => {
        result.current.handleJumpStart();
      });

      expect(result.current.jumpInProgressRef.current).toBe(true);

      // Trigger encounter event during jump
      rerender({ encounterEvent: encounter });

      // Should be buffered, not active
      expect(result.current.currentEncounter).toBeNull();

      // Complete the jump
      act(() => {
        result.current.handleJumpComplete();
      });

      expect(result.current.jumpInProgressRef.current).toBe(false);
      expect(result.current.currentEncounter).toBe(encounter);
      expect(setViewMode).toHaveBeenCalledWith('ENCOUNTER');
    });

    it('reveals buffered encounter on JUMP_ANIMATION_NEAR_END event', () => {
      const encounter = makePirateEncounter();
      const { result, rerender } = renderOrchestrationHook(null);

      // Start a jump
      act(() => {
        result.current.handleJumpStart();
      });

      // Trigger encounter event during jump
      rerender({ encounterEvent: encounter });

      // Should be buffered
      expect(result.current.currentEncounter).toBeNull();

      // Simulate the near-end event
      act(() => {
        mockGame._emit('jumpAnimationNearEnd');
      });

      expect(result.current.currentEncounter).toBe(encounter);
      expect(setViewMode).toHaveBeenCalledWith('ENCOUNTER');
    });
  });

  describe('error handling', () => {
    it('returns to orbit on flee resolution error', () => {
      mockGame.resolveCombatChoice.mockImplementation(() => {
        throw new Error('Combat engine failure');
      });

      const { result } = renderOrchestrationHook();
      const encounter = makePirateEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      // Clear the ENCOUNTER setViewMode call
      setViewMode.mockClear();

      act(() => {
        result.current.handleEncounterChoice('flee');
      });

      expect(result.current.currentEncounter).toBeNull();
      expect(result.current.encounterOutcome).toBeNull();
      expect(result.current.encounterPhase).toBe('initial');
      expect(setViewMode).toHaveBeenCalledWith('ORBIT');
    });

    it('returns to orbit on general encounter resolution error', () => {
      mockGame.resolveEncounter.mockImplementation(() => {
        throw new Error('Resolution failure');
      });

      const { result } = renderOrchestrationHook();
      const encounter = makeInspectionEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      setViewMode.mockClear();

      act(() => {
        result.current.handleEncounterChoice('cooperate');
      });

      expect(result.current.currentEncounter).toBeNull();
      expect(result.current.encounterOutcome).toBeNull();
      expect(result.current.encounterPhase).toBe('initial');
      expect(setViewMode).toHaveBeenCalledWith('ORBIT');
    });

    it('does nothing when handleEncounterChoice called with no encounter', () => {
      const { result } = renderOrchestrationHook();

      act(() => {
        result.current.handleEncounterChoice('flee');
      });

      // Should not throw, state unchanged
      expect(result.current.currentEncounter).toBeNull();
      expect(mockGame.resolveCombatChoice).not.toHaveBeenCalled();
    });
  });

  describe('non-pirate encounter resolution', () => {
    it('resolves inspection encounter via resolveEncounter', () => {
      mockGame.resolveEncounter.mockReturnValue({
        success: true,
        costs: {},
        rewards: {},
        description: 'Inspection passed.',
      });

      const { result } = renderOrchestrationHook();
      const encounter = makeInspectionEncounter();

      act(() => {
        result.current.handleEncounterTriggered(encounter);
      });

      act(() => {
        result.current.handleEncounterChoice('cooperate');
      });

      expect(mockGame.resolveEncounter).toHaveBeenCalledWith(
        encounter,
        'cooperate'
      );
      expect(result.current.encounterOutcome).not.toBeNull();
      expect(result.current.encounterOutcome.success).toBe(true);
    });
  });
});
