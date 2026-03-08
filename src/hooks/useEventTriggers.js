import { useEffect, useCallback, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useGameEvent } from './useGameEvent.js';
import { EVENT_NAMES, PIRATE_CREDIT_DEMAND_CONFIG } from '../game/constants.js';
import { SeededRandom } from '../game/utils/seeded-random.js';
import {
  determineThreatLevel,
  determineInspectionSeverity,
} from '../game/utils/calculators.js';

/**
 * Unified event trigger hook.
 *
 * Replaces useJumpEncounters. Listens for locationChanged (jump),
 * docked, and timeChanged events, then queries the EventEngine
 * for eligible events. Danger events emit encounterTriggered;
 * narrative events emit narrativeEventTriggered.
 *
 * For jump events, computes dynamic danger probabilities from
 * DangerManager before querying the engine.
 */
export function useEventTriggers() {
  const game = useGame();
  const currentSystem = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  /**
   * Build context with dynamic danger chances for jump events.
   */
  const buildJumpContext = useCallback(
    (systemId, gameState) => {
      // Compute dynamic chances from manager methods
      const pirateChance = game.calculatePirateEncounterChance(
        systemId,
        gameState
      );
      const inspectionChance = game.calculateInspectionChance(
        systemId,
        gameState
      );

      // Mechanical failure and distress call use internal seeded RNG.
      // We pre-check and convert to a 0/1 chance for the engine.
      const mechanicalResult = game.checkMechanicalFailure(gameState);
      const distressResult = game.checkDistressCall();

      return {
        system: systemId,
        chances: {
          pirate_chance: pirateChance,
          inspection_chance: inspectionChance,
          // If DangerManager says yes, set chance to 1 so engine passes it through
          mechanical_chance: mechanicalResult ? 1.0 : 0,
          distress_chance: distressResult ? 1.0 : 0,
        },
        // Stash results for encounter generation
        _mechanicalResult: mechanicalResult,
        _distressResult: distressResult,
      };
    },
    [game]
  );

  /**
   * Generate encounter data for danger events, matching the structure
   * that existing danger panels expect.
   */
  const generateDangerEncounterData = useCallback(
    (event, context, gameState) => {
      const systemId = context.system;

      switch (event.encounter.generator) {
        case 'pirate':
          return {
            type: 'pirate',
            encounter: {
              id: `pirate_jump_${Date.now()}`,
              type: 'pirate',
              systemId,
              threatLevel: determineThreatLevel(gameState),
              demandPercent: PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT,
            },
          };
        case 'inspection':
          return {
            type: 'inspection',
            encounter: {
              id: `inspection_jump_${Date.now()}`,
              type: 'inspection',
              systemId,
              severity: determineInspectionSeverity(gameState),
            },
          };
        case 'mechanical_failure': {
          const failure = context._mechanicalResult;
          return {
            type: 'mechanical_failure',
            encounter: {
              id: `failure_jump_${Date.now()}`,
              type: failure.type,
              systemId,
              severity: failure.severity,
            },
          };
        }
        case 'distress_call':
          return {
            type: 'distress_call',
            encounter: context._distressResult,
          };
        default:
          return null;
      }
    },
    []
  );

  /**
   * Emit a narrative event for display.
   * Uses a separate event channel so narrative events overlay
   * the current view instead of hijacking it into ENCOUNTER mode.
   */
  const emitNarrativeEvent = useCallback(
    (event) => {
      let emitted = { ...event };

      // If event has generateContent, produce dynamic text from game state
      if (typeof event.generateContent === 'function') {
        const state = game.getState();
        const dynamicContent = event.generateContent(state, game.starData);
        emitted = {
          ...emitted,
          content: { ...emitted.content, ...dynamicContent },
        };
      }

      // Spread to create a fresh reference so React detects the update
      // and App.jsx de-dupe guard allows repeatable events to re-fire
      game.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, emitted);
    },
    [game]
  );

  /**
   * Handle a trigger event: query engine, emit if event found.
   */
  const handleTrigger = useCallback(
    (eventType, context) => {
      if (!game) return;

      const state = game.getState();
      if (!state) return;
      const day = Math.floor(state.player.daysElapsed);
      const system = state.player.currentSystem;
      const rng = new SeededRandom(`event-${eventType}-${day}-${system}`);
      const rngFn = () => rng.next();

      const event = game.checkEvents(eventType, context, rngFn);

      if (!event) {
        // Also check condition events as fallback
        if (eventType !== 'condition') {
          const condRng = new SeededRandom(`event-condition-${day}-${system}`);
          const condEvent = game.checkEvents('condition', context, () =>
            condRng.next()
          );
          if (condEvent) {
            emitNarrativeEvent(condEvent);
          }
        }
        return;
      }

      if (event.category === 'danger') {
        const gameState = game.getState();
        const encounterData = generateDangerEncounterData(
          event,
          context,
          gameState
        );
        if (encounterData) {
          game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, encounterData);
        }
      } else if (event.category === 'narrative') {
        emitNarrativeEvent(event);
      }
    },
    [game, generateDangerEncounterData, emitNarrativeEvent]
  );

  // Track last system to distinguish real jumps from initial state emission
  const lastSystemRef = useRef(null);

  // Listen for jump completion (locationChanged)
  useEffect(() => {
    if (!game) return;

    const handleJumpComplete = (data) => {
      const gameState = game.getState();
      if (!gameState) return;

      const systemId = typeof data === 'number' ? data : currentSystem;
      if (systemId == null) return;

      // Skip the initial locationChanged emission during game init —
      // it's not a real jump, just state sync
      if (lastSystemRef.current === null) {
        lastSystemRef.current = systemId;
        return;
      }

      // Skip duplicate emissions for the same system
      if (systemId === lastSystemRef.current) return;

      lastSystemRef.current = systemId;
      const context = buildJumpContext(systemId, gameState);
      handleTrigger('jump', context);
    };

    game.subscribe(EVENT_NAMES.LOCATION_CHANGED, handleJumpComplete);
    return () =>
      game.unsubscribe(EVENT_NAMES.LOCATION_CHANGED, handleJumpComplete);
  }, [game, buildJumpContext, handleTrigger, currentSystem]);

  // Listen for docking
  useEffect(() => {
    if (!game) return;

    const handleDocked = (data) => {
      const systemId = data?.systemId;
      if (systemId == null) return;
      handleTrigger('dock', { system: systemId });
    };

    game.subscribe(EVENT_NAMES.DOCKED, handleDocked);
    return () => game.unsubscribe(EVENT_NAMES.DOCKED, handleDocked);
  }, [game, handleTrigger]);

  // Listen for time changes
  useEffect(() => {
    if (!game) return;

    const handleTimeChanged = () => {
      const gameState = game.getState();
      if (!gameState) return;
      handleTrigger('time', { system: gameState.player.currentSystem });
    };

    game.subscribe(EVENT_NAMES.TIME_CHANGED, handleTimeChanged);
    return () => game.unsubscribe(EVENT_NAMES.TIME_CHANGED, handleTimeChanged);
  }, [game, handleTrigger]);

  // Listen for debt clearance to immediately show the narrative popup
  useEffect(() => {
    if (!game) return;

    const handleDebtCleared = () => {
      const event = game.getEventById('cond_debt_free');
      if (!event) return;

      // Respect once-only guard so the event doesn't replay on reload
      const { fired } = game.getState().world.narrativeEvents;
      if (event.once && fired.includes(event.id)) return;

      emitNarrativeEvent(event);
    };

    game.subscribe(EVENT_NAMES.DEBT_CLEARED, handleDebtCleared);
    return () => game.unsubscribe(EVENT_NAMES.DEBT_CLEARED, handleDebtCleared);
  }, [game, emitNarrativeEvent]);
}
