import { useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameContext.jsx';
import { useGameEvent } from './useGameEvent.js';

/**
 * Custom hook for handling danger encounters during jumps.
 *
 * This hook listens for jump completion events and checks for various
 * encounter types (pirate encounters, inspections, mechanical failures,
 * distress calls) based on the destination system and game state.
 *
 * When encounters occur, it triggers the appropriate panel display
 * through the game state manager's event system.
 *
 * Requirements: 2.1, 5.1, 6.1, 7.1
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onEncounter - Callback when encounter occurs
 * @returns {Object} Hook interface with encounter checking methods
 */
export function useJumpEncounters({ onEncounter } = {}) {
  const gameStateManager = useGameState();
  const currentSystem = useGameEvent('locationChanged');

  /**
   * Check for all possible encounters after a jump
   *
   * This method is called after a successful jump to determine if any
   * encounters should occur. It checks in order:
   * 1. Pirate encounters (based on danger zone and modifiers)
   * 2. Customs inspections (based on cargo and system)
   * 3. Mechanical failures (based on ship condition)
   * 4. Distress calls (random chance)
   *
   * Only one encounter can occur per jump to avoid overwhelming the player.
   *
   * @param {number} destinationSystemId - The system the player jumped to
   * @param {Object} gameState - Current game state from Bridge Pattern
   */
  const checkForEncounters = useCallback(
    (destinationSystemId, gameState) => {
      if (!gameStateManager || !destinationSystemId || !gameState) {
        return;
      }

      // Generate random numbers for all encounter checks
      // Using separate RNG calls to ensure deterministic behavior
      const pirateRng = Math.random();
      const inspectionRng = Math.random();
      const failureRng = Math.random();
      const distressRng = Math.random();

      // Check for pirate encounters first (highest priority)
      const pirateChance =
        gameStateManager.dangerManager.calculatePirateEncounterChance(
          destinationSystemId,
          gameState
        );

      if (pirateRng < pirateChance) {
        const encounterData = {
          type: 'pirate',
          encounter: {
            id: `pirate_jump_${Date.now()}`,
            type: 'pirate',
            systemId: destinationSystemId,
            threatLevel: determineThreatLevel(gameState),
            demandPercent: 20,
          },
        };

        gameStateManager.emit('encounterTriggered', encounterData);
        if (onEncounter) {
          onEncounter(encounterData);
        }
        return; // Only one encounter per jump
      }

      // Check for customs inspections
      const inspectionChance =
        gameStateManager.dangerManager.calculateInspectionChance(
          destinationSystemId,
          gameState
        );

      if (inspectionRng < inspectionChance) {
        const encounterData = {
          type: 'inspection',
          encounter: {
            id: `inspection_jump_${Date.now()}`,
            type: 'inspection',
            systemId: destinationSystemId,
            severity: determineInspectionSeverity(gameState),
          },
        };

        gameStateManager.emit('encounterTriggered', encounterData);
        if (onEncounter) {
          onEncounter(encounterData);
        }
        return; // Only one encounter per jump
      }

      // Check for mechanical failures
      const failure = gameStateManager.dangerManager.checkMechanicalFailure(
        gameState,
        failureRng
      );

      if (failure) {
        const encounterData = {
          type: 'mechanical_failure',
          encounter: {
            id: `failure_jump_${Date.now()}`,
            type: failure.type,
            systemId: destinationSystemId,
            severity: failure.severity,
          },
        };

        gameStateManager.emit('encounterTriggered', encounterData);
        if (onEncounter) {
          onEncounter(encounterData);
        }
        return; // Only one encounter per jump
      }

      // Check for distress calls
      const distressCall =
        gameStateManager.dangerManager.checkDistressCall(distressRng);

      if (distressCall) {
        const encounterData = {
          type: 'distress_call',
          encounter: distressCall,
        };

        gameStateManager.emit('encounterTriggered', encounterData);
        if (onEncounter) {
          onEncounter(encounterData);
        }
        return; // Only one encounter per jump
      }

      // No encounters occurred
    },
    [gameStateManager, onEncounter]
  );

  /**
   * Handle jump completion events
   *
   * This effect listens for successful jump completions and triggers
   * encounter checks for the destination system.
   */
  useEffect(() => {
    if (!gameStateManager) {
      return;
    }

    const handleJumpComplete = (data) => {
      // The locationChanged event fires after a successful jump
      // Check for encounters at the new location
      // Note: Calling component must provide current gameState via Bridge Pattern
      const currentGameState = gameStateManager.getState();
      if (!currentGameState) {
        return;
      }

      if (data && typeof data === 'number') {
        // data is the new system ID
        checkForEncounters(data, currentGameState);
      } else if (currentSystem) {
        // Fallback to current system from state
        checkForEncounters(currentSystem, currentGameState);
      }
    };

    // Subscribe to location changes (which occur after successful jumps)
    gameStateManager.subscribe('locationChanged', handleJumpComplete);

    return () => {
      gameStateManager.unsubscribe('locationChanged', handleJumpComplete);
    };
  }, [gameStateManager, checkForEncounters, currentSystem]);

  return {
    checkForEncounters,
  };
}

/**
 * Determine pirate threat level based on game state
 *
 * Threat level affects the difficulty and rewards of pirate encounters.
 * Based on cargo value, ship condition, and player reputation.
 *
 * @param {Object} gameState - Current game state
 * @returns {string} Threat level: 'weak', 'moderate', 'strong', 'dangerous'
 */
function determineThreatLevel(gameState) {
  const cargoValue = gameState.ship.cargo.reduce(
    (total, item) => total + item.qty * item.buyPrice,
    0
  );
  const hullCondition = gameState.ship.hull;
  const outlawRep = gameState.player.factions.outlaws;

  // High-value cargo attracts stronger pirates
  if (cargoValue > 10000) {
    return 'dangerous';
  } else if (cargoValue > 5000) {
    return 'strong';
  }

  // Damaged ships attract opportunistic pirates
  if (hullCondition < 30) {
    return 'strong';
  } else if (hullCondition < 60) {
    return 'moderate';
  }

  // High outlaw reputation means facing rival pirates
  if (outlawRep > 50) {
    return 'strong';
  } else if (outlawRep < -50) {
    return 'weak'; // Pirates underestimate law-abiding players
  }

  return 'moderate';
}

/**
 * Determine inspection severity based on game state
 *
 * Inspection severity affects the thoroughness of the search and
 * the chance of discovering hidden cargo.
 *
 * @param {Object} gameState - Current game state
 * @returns {string} Severity: 'routine', 'thorough'
 */
function determineInspectionSeverity(gameState) {
  const hasRestrictedGoods = gameState.ship.cargo.length > 0;
  const hasHiddenCargo =
    gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
  const authorityRep = gameState.player.factions.authorities;

  // Thorough inspections for suspicious circumstances
  if (hasRestrictedGoods && hasHiddenCargo) {
    return 'thorough';
  }

  // Low authority reputation triggers thorough inspections
  if (authorityRep < -25) {
    return 'thorough';
  }

  return 'routine';
}
