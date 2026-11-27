import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounterOrchestration } from '../../src/hooks/useEncounterOrchestration.js';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { NEGOTIATION_CONFIG } from '../../src/game/constants.js';

/**
 * Pins the threat escalation applied when a pirate negotiation escalates to
 * combat: the encounter the panels see afterwards carries the next threat
 * tier and the escalation strength modifier, whichever layer applies it.
 *
 * Feature: danger-system, negotiation escalation
 */

const ESCALATION = [
  ['weak', 'moderate'],
  ['moderate', 'strong'],
  ['strong', 'dangerous'],
  ['dangerous', 'dangerous'],
  [undefined, 'strong'],
];

describe('Encounter escalation safety net', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    vi.spyOn(game, 'resolveNegotiation').mockReturnValue({
      escalate: true,
      description: 'The pirates are angered by your counter-proposal!',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  for (const [from, to] of ESCALATION) {
    it(`escalating a ${from ?? 'tierless'} pirate encounter shows ${to} with the escalation modifier`, () => {
      const { result } = renderHook(() =>
        useEncounterOrchestration(
          game,
          { showInfo: vi.fn(), showError: vi.fn() },
          null
        )
      );
      act(() => {
        result.current.registerSetViewMode(vi.fn());
      });
      const encounter = {
        type: 'pirate',
        encounter: {
          id: 'pirate_test',
          type: 'pirate',
          systemId: 0,
          ...(from ? { threatLevel: from } : {}),
        },
      };

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
      expect(result.current.currentEncounter.encounter.threatLevel).toBe(to);
      expect(result.current.currentEncounter.encounter.strengthModifier).toBe(
        NEGOTIATION_CONFIG.OUTCOME_VALUES
          .COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE
      );
    });
  }
});
