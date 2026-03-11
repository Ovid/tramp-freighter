import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { EVENT_STATE_MAP } from '../game/constants.js';

/**
 * Custom hook for subscribing to GameCoordinator events.
 *
 * This hook implements the Bridge Pattern by connecting React's declarative
 * component model to the imperative GameCoordinator event system.
 *
 * The hook:
 * 1. Subscribes to the specified event on mount
 * 2. Updates local state when the event fires
 * 3. Triggers re-render of the component
 * 4. Automatically unsubscribes on unmount
 *
 * React Migration Spec: Requirements 5.2, 5.3, 5.4, 34.1, 34.2, 34.3, 34.4, 34.5
 *
 * @param {string} eventName - Event name from GameCoordinator.subscribers
 * @returns {any} Current state value from the event
 *
 * @example
 * function ResourceBar() {
 *   const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
 *   const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
 *   return <div>Credits: {credits}, Fuel: {fuel}</div>;
 * }
 */
export function useGameEvent(eventName) {
  const game = useGame();

  // Initialize with current state value
  const [state, setState] = useState(() => {
    const currentState = game.getState();
    return extractStateForEvent(eventName, currentState);
  });

  // Memoized callback to prevent unnecessary re-subscriptions
  const callback = useCallback((data) => {
    setState(data);
  }, []);

  useEffect(() => {
    game.subscribe(eventName, callback);

    // Cleanup: unsubscribe on unmount
    return () => {
      game.unsubscribe(eventName, callback);
    };
  }, [game, eventName, callback]);

  return state;
}

/**
 * Extract state value for a specific event from full game state.
 *
 * Maps event names to their corresponding state extraction logic.
 * This ensures components receive the correct data structure for each event.
 *
 * Returns null if state is not yet initialized (e.g., during title screen).
 * Once game is initialized, fails loudly if state is incomplete to expose bugs.
 *
 * @param {string} eventName - Event name
 * @param {Object} state - Full game state
 * @returns {any} Extracted state value for the event, or null if not initialized
 * @throws {Error} If state is initialized but missing required properties
 * @private
 */
function extractStateForEvent(eventName, state) {
  if (!state) return null;
  if (!state.player)
    throw new Error('Invalid game state: player object missing');
  if (!state.ship) throw new Error('Invalid game state: ship object missing');
  if (!state.world) throw new Error('Invalid game state: world object missing');
  if (!state.dialogue)
    throw new Error('Invalid game state: dialogue object missing');

  const extractor = EVENT_STATE_MAP[eventName];
  if (extractor) return extractor(state);
  return null; // Direct-data events (encounter, narrative, etc.)
}
