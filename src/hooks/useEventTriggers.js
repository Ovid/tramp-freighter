import { useEffect, useCallback, useRef } from 'react';
import { useGameState } from '../context/GameContext.jsx';
import { useGameEvent } from './useGameEvent.js';

/**
 * Unified event trigger hook.
 *
 * Replaces useJumpEncounters. Listens for locationChanged (jump),
 * docked, and timeChanged events, then queries the EventEngine
 * for eligible events. If an event is found, emits encounterTriggered.
 *
 * For jump events, computes dynamic danger probabilities from
 * DangerManager before querying the engine.
 */
export function useEventTriggers() {
  const gameStateManager = useGameState();
  const currentSystem = useGameEvent('locationChanged');

  /**
   * Build context with dynamic danger chances for jump events.
   */
  const buildJumpContext = useCallback(
    (systemId, gameState) => {
      const dm = gameStateManager.dangerManager;

      // Compute dynamic chances from DangerManager methods
      const pirateChance = dm.calculatePirateEncounterChance(
        systemId,
        gameState
      );
      const inspectionChance = dm.calculateInspectionChance(
        systemId,
        gameState
      );

      // Mechanical failure and distress call need RNG-based checks.
      // We pre-roll and convert to a 0/1 chance for the engine.
      const mechanicalRng = Math.random();
      const mechanicalResult = dm.checkMechanicalFailure(
        gameState,
        mechanicalRng
      );
      const distressRng = Math.random();
      const distressResult = dm.checkDistressCall(distressRng);

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
    [gameStateManager]
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
              demandPercent: 20,
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
      gameStateManager.emit('narrativeEventTriggered', event);
    },
    [gameStateManager]
  );

  /**
   * Handle a trigger event: query engine, emit if event found.
   */
  const handleTrigger = useCallback(
    (eventType, context) => {
      if (!gameStateManager) return;

      const event = gameStateManager.checkEvents(eventType, context);

      if (!event) {
        // Also check condition events as fallback
        if (eventType !== 'condition') {
          const condEvent = gameStateManager.checkEvents('condition', context);
          if (condEvent) {
            emitNarrativeEvent(condEvent);
          }
        }
        return;
      }

      if (event.category === 'danger') {
        const gameState = gameStateManager.getState();
        const encounterData = generateDangerEncounterData(
          event,
          context,
          gameState
        );
        if (encounterData) {
          gameStateManager.emit('encounterTriggered', encounterData);
        }
      } else if (event.category === 'narrative') {
        emitNarrativeEvent(event);
      }
    },
    [gameStateManager, generateDangerEncounterData, emitNarrativeEvent]
  );

  // Track last system to distinguish real jumps from initial state emission
  const lastSystemRef = useRef(null);

  // Listen for jump completion (locationChanged)
  useEffect(() => {
    if (!gameStateManager) return;

    const handleJumpComplete = (data) => {
      const gameState = gameStateManager.getState();
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

    gameStateManager.subscribe('locationChanged', handleJumpComplete);
    return () =>
      gameStateManager.unsubscribe('locationChanged', handleJumpComplete);
  }, [gameStateManager, buildJumpContext, handleTrigger, currentSystem]);

  // Listen for docking
  useEffect(() => {
    if (!gameStateManager) return;

    const handleDocked = (data) => {
      const systemId = data?.systemId;
      if (systemId == null) return;
      handleTrigger('dock', { system: systemId });
    };

    gameStateManager.subscribe('docked', handleDocked);
    return () => gameStateManager.unsubscribe('docked', handleDocked);
  }, [gameStateManager, handleTrigger]);

  // Listen for time changes
  useEffect(() => {
    if (!gameStateManager) return;

    const handleTimeChanged = () => {
      const gameState = gameStateManager.getState();
      if (!gameState) return;
      handleTrigger('time', { system: gameState.player.currentSystem });
    };

    gameStateManager.subscribe('timeChanged', handleTimeChanged);
    return () => gameStateManager.unsubscribe('timeChanged', handleTimeChanged);
  }, [gameStateManager, handleTrigger]);
}

/**
 * Determine pirate threat level based on game state.
 * (Moved from useJumpEncounters — identical logic)
 */
function determineThreatLevel(gameState) {
  const cargoValue = gameState.ship.cargo.reduce(
    (total, item) => total + item.qty * item.buyPrice,
    0
  );
  const hullCondition = gameState.ship.hull;
  const outlawRep = gameState.player.factions.outlaws;

  if (cargoValue > 10000) return 'dangerous';
  if (cargoValue > 5000) return 'strong';
  if (hullCondition < 30) return 'strong';
  if (hullCondition < 60) return 'moderate';
  if (outlawRep > 50) return 'strong';
  if (outlawRep < -50) return 'weak';
  return 'moderate';
}

/**
 * Determine inspection severity based on game state.
 * (Moved from useJumpEncounters — identical logic)
 */
function determineInspectionSeverity(gameState) {
  const hasRestrictedGoods = gameState.ship.cargo.length > 0;
  const hasHiddenCargo =
    gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
  const authorityRep = gameState.player.factions.authorities;

  if (hasRestrictedGoods && hasHiddenCargo) return 'thorough';
  if (authorityRep < -25) return 'thorough';
  return 'routine';
}
