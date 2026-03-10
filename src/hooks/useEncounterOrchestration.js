import { useState, useRef, useEffect } from 'react';
import { transformOutcomeForDisplay } from '../features/danger/transformOutcome';
import { applyEncounterOutcome } from '../features/danger/applyEncounterOutcome';
import { EVENT_NAMES, NEGOTIATION_CONFIG } from '../game/constants.js';

/**
 * View mode constants used by the encounter orchestration.
 * Must match the VIEW_MODES values in App.jsx.
 */
const VIEW_MODES = {
  ORBIT: 'ORBIT',
  ENCOUNTER: 'ENCOUNTER',
};

/**
 * Orchestrates encounter state machine, buffering, and resolution logic.
 *
 * Extracted from App.jsx to isolate encounter concerns. Manages the full
 * encounter lifecycle: triggering, phase routing (initial/combat/negotiation),
 * outcome display, jump buffering, and cleanup.
 *
 * @param {Object} game - GameCoordinator instance
 * @param {Object} notificationCtx - Notification context with showInfo()
 * @param {Object} encounterEvent - Latest encounter event from useGameEvent
 * @returns {Object} Encounter state, handlers, and jump coordination
 */
export function useEncounterOrchestration(
  game,
  notificationCtx,
  encounterEvent
) {
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [encounterOutcome, setEncounterOutcome] = useState(null);
  const [encounterPhase, setEncounterPhase] = useState('initial');
  const [combatContext, setCombatContext] = useState(null);

  const lastHandledEncounter = useRef(null);
  const jumpInProgressRef = useRef(false);
  const pendingEncounterRef = useRef(null);

  // App.jsx registers its setViewMode via this ref so the hook can
  // request ENCOUNTER/ORBIT transitions without owning viewMode state.
  const setViewModeRef = useRef(null);

  const setViewMode = (mode) => {
    if (setViewModeRef.current) {
      setViewModeRef.current(mode);
    }
  };

  /**
   * Register App.jsx's setViewMode so the hook can drive view transitions.
   * Call once from App.jsx after creating the hook.
   */
  const registerSetViewMode = (fn) => {
    setViewModeRef.current = fn;
  };

  const handleEncounterTriggered = (encounterData) => {
    setCurrentEncounter(encounterData);
    setEncounterPhase('initial');
    setViewMode(VIEW_MODES.ENCOUNTER);
  };

  const handleApplyOutcome = (outcome) => {
    const result = applyEncounterOutcome(game, outcome);
    if (result.salvageMessages.length > 0 && notificationCtx) {
      result.salvageMessages.forEach((msg) => notificationCtx.showInfo(msg));
    }
  };

  const handleEncounterChoice = (choice) => {
    if (!currentEncounter) return;

    // Flee from initial panel resolves immediately via evasive maneuvers
    if (
      currentEncounter.type === 'pirate' &&
      encounterPhase === 'initial' &&
      choice === 'flee'
    ) {
      try {
        const outcome = game.resolveCombatChoice(
          currentEncounter.encounter,
          'evasive'
        );
        handleApplyOutcome(outcome);
        if (outcome.success) {
          const displayOutcome = transformOutcomeForDisplay(
            outcome,
            'pirate',
            'flee'
          );
          setEncounterOutcome(displayOutcome);
        } else {
          setCombatContext({
            fleeAttemptFailed: true,
            hullDamage: outcome.costs?.hull ?? 0,
            description: outcome.description,
          });
          setEncounterPhase('combat');
        }
      } catch (error) {
        console.error('Flee resolution failed:', error);
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setEncounterPhase('initial');
        setViewMode(VIEW_MODES.ORBIT);
      }
      return;
    }

    // Two-step pirate encounter: route to sub-panels
    if (currentEncounter.type === 'pirate' && encounterPhase === 'initial') {
      if (choice === 'fight') {
        setEncounterPhase('combat');
        return;
      }
      if (choice === 'negotiate') {
        setEncounterPhase('negotiation');
        return;
      }
      // Surrender resolves immediately (falls through)
    }

    if (game.resolveEncounter) {
      try {
        // Route combat/negotiation sub-choices to their specific resolvers
        let outcome;
        if (encounterPhase === 'combat') {
          // 'flee' from combat/negotiation sub-panels maps to evasive maneuvers
          const combatChoice = choice === 'flee' ? 'evasive' : choice;
          outcome = game.resolveCombatChoice(
            currentEncounter.encounter,
            combatChoice
          );
        } else if (encounterPhase === 'negotiation') {
          if (choice === 'flee') {
            // Breaking off negotiation to flee triggers evasive maneuvers
            outcome = game.resolveCombatChoice(
              currentEncounter.encounter,
              'evasive'
            );
          } else {
            outcome = game.resolveNegotiation(
              currentEncounter.encounter,
              choice
            );
          }
        } else {
          outcome = game.resolveEncounter(currentEncounter, choice);
        }

        // Failed negotiation escalates to combat — skip applying empty outcome
        if (outcome.escalate) {
          // Bump threat tier for display and apply strength modifier for combat
          const THREAT_ESCALATION = {
            weak: 'moderate',
            moderate: 'strong',
            strong: 'dangerous',
            dangerous: 'dangerous',
          };
          const current = currentEncounter.encounter.threatLevel || 'moderate';
          currentEncounter.encounter.threatLevel =
            THREAT_ESCALATION[current] || 'strong';
          currentEncounter.encounter.strengthModifier =
            NEGOTIATION_CONFIG.OUTCOME_VALUES.COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE;

          const displayOutcome = transformOutcomeForDisplay(
            outcome,
            currentEncounter.type,
            choice
          );
          setEncounterOutcome(displayOutcome);
          setEncounterPhase('escalated_combat');
          return;
        }

        // Apply the resolution outcome to game state
        handleApplyOutcome(outcome);

        // Transform for OutcomePanel display
        const displayOutcome = transformOutcomeForDisplay(
          outcome,
          currentEncounter.type,
          choice
        );

        // Show OutcomePanel (stay in ENCOUNTER mode)
        setEncounterOutcome(displayOutcome);
        setEncounterPhase('initial');
      } catch (error) {
        console.error('Encounter resolution failed:', error);
        // On error, return to orbit
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setEncounterPhase('initial');
        setViewMode(VIEW_MODES.ORBIT);
      }
    }
  };

  const handleEncounterClose = () => {
    setCurrentEncounter(null);
    setEncounterPhase('initial');
    setCombatContext(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleOutcomeContinue = () => {
    if (encounterPhase === 'escalated_combat') {
      // Transition from negotiation failure to encounter panel with negotiate disabled
      setEncounterOutcome(null);
      setEncounterPhase('initial');
      setCombatContext({ escalated: true });
      return;
    }
    setCurrentEncounter(null);
    setEncounterOutcome(null);
    setEncounterPhase('initial');
    setCombatContext(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  // Jump coordination (encounter-related only)
  const handleJumpStart = () => {
    jumpInProgressRef.current = true;
  };

  const handleJumpComplete = () => {
    jumpInProgressRef.current = false;
    // Safety fallback: show any encounter that wasn't revealed by near-end event
    if (pendingEncounterRef.current) {
      handleEncounterTriggered(pendingEncounterRef.current);
      pendingEncounterRef.current = null;
    }
  };

  // Listen for encounter events (only process each event once)
  // During jump animations, buffer the encounter and wait for the near-end signal
  useEffect(() => {
    if (
      encounterEvent &&
      !currentEncounter &&
      encounterEvent !== lastHandledEncounter.current
    ) {
      lastHandledEncounter.current = encounterEvent;
      if (jumpInProgressRef.current) {
        // Buffer encounter — will be shown when animation nears completion
        pendingEncounterRef.current = encounterEvent;
      } else {
        handleEncounterTriggered(encounterEvent);
      }
    }
    // handleEncounterTriggered is stable within each render; the effect only
    // needs to re-run when the event or current encounter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterEvent, currentEncounter]);

  // Reveal buffered encounter when jump animation nears completion
  useEffect(() => {
    if (!game) return;

    const handleAnimationNearEnd = () => {
      if (pendingEncounterRef.current) {
        handleEncounterTriggered(pendingEncounterRef.current);
        pendingEncounterRef.current = null;
      }
    };

    game.subscribe(EVENT_NAMES.JUMP_ANIMATION_NEAR_END, handleAnimationNearEnd);
    return () =>
      game.unsubscribe(
        EVENT_NAMES.JUMP_ANIMATION_NEAR_END,
        handleAnimationNearEnd
      );
    // handleEncounterTriggered is defined in the hook body and only sets state;
    // adding it would cause unnecessary resubscriptions on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  return {
    // State
    currentEncounter,
    encounterOutcome,
    encounterPhase,
    combatContext,
    // Handlers
    handleEncounterTriggered,
    handleEncounterChoice,
    handleEncounterClose,
    handleOutcomeContinue,
    // Jump coordination
    handleJumpStart,
    handleJumpComplete,
    jumpInProgressRef,
    // Derived
    isEncounterActive: currentEncounter !== null,
    // View mode integration (App.jsx registers its setViewMode here)
    registerSetViewMode,
  };
}
