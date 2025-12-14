import { useState, useEffect } from 'react';
import { useGameState } from '../context/GameContext.jsx';

/**
 * Custom hook for subscribing to GameStateManager events.
 *
 * This hook implements the Bridge Pattern by connecting React's declarative
 * component model to the imperative GameStateManager event system.
 *
 * The hook:
 * 1. Subscribes to the specified event on mount
 * 2. Updates local state when the event fires
 * 3. Triggers re-render of the component
 * 4. Automatically unsubscribes on unmount
 *
 * React Migration Spec: Requirements 5.2, 5.3, 5.4, 34.1, 34.2, 34.3, 34.4, 34.5
 *
 * @param {string} eventName - Event name from GameStateManager.subscribers
 * @returns {any} Current state value from the event
 *
 * @example
 * function ResourceBar() {
 *   const credits = useGameEvent('creditsChanged');
 *   const fuel = useGameEvent('fuelChanged');
 *   return <div>Credits: {credits}, Fuel: {fuel}</div>;
 * }
 */
export function useGameEvent(eventName) {
  const gameStateManager = useGameState();

  // Initialize with current state value
  const [state, setState] = useState(() => {
    const currentState = gameStateManager.getState();
    return extractStateForEvent(eventName, currentState);
  });

  useEffect(() => {
    // Subscribe to event
    const callback = (data) => {
      setState(data);
    };

    gameStateManager.subscribe(eventName, callback);

    // Cleanup: unsubscribe on unmount
    return () => {
      gameStateManager.unsubscribe(eventName, callback);
    };
  }, [gameStateManager, eventName]);

  return state;
}

/**
 * Extract state value for a specific event from full game state.
 *
 * Maps event names to their corresponding state extraction logic.
 * This ensures components receive the correct data structure for each event.
 *
 * Fails loudly if state is incomplete to expose initialization bugs early.
 * GameStateManager should always provide complete state after initialization.
 *
 * @param {string} eventName - Event name
 * @param {Object} state - Full game state
 * @returns {any} Extracted state value for the event
 * @throws {Error} If state is null or missing required properties
 * @private
 */
function extractStateForEvent(eventName, state) {
  if (!state) {
    throw new Error(
      'extractStateForEvent called with null state - GameStateManager not initialized'
    );
  }

  if (!state.player) {
    throw new Error('Invalid game state: player object missing');
  }

  if (!state.ship) {
    throw new Error('Invalid game state: ship object missing');
  }

  if (!state.world) {
    throw new Error('Invalid game state: world object missing');
  }

  // Map event names to state extraction logic
  // No optional chaining - properties MUST exist after initialization
  const eventStateMap = {
    creditsChanged: state.player.credits,
    debtChanged: state.player.debt,
    fuelChanged: state.ship.fuel,
    locationChanged: state.player.currentSystem,
    timeChanged: state.player.daysElapsed,
    cargoChanged: state.ship.cargo,
    shipConditionChanged: {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport,
    },
    priceKnowledgeChanged: state.world.priceKnowledge,
    activeEventsChanged: state.world.activeEvents,
    shipNameChanged: state.ship.name,
    upgradesChanged: state.ship.upgrades,
    quirksChanged: state.ship.quirks,
    conditionWarning: null, // Warnings are passed directly in event data
  };

  return eventStateMap[eventName] ?? null;
}
