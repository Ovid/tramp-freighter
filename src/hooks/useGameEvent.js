import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameContext.jsx';
import { EVENT_NAMES } from '../game/constants.js';

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

  // Memoized callback to prevent unnecessary re-subscriptions
  const callback = useCallback((data) => {
    setState(data);
  }, []);

  useEffect(() => {
    gameStateManager.subscribe(eventName, callback);

    // Cleanup: unsubscribe on unmount
    return () => {
      gameStateManager.unsubscribe(eventName, callback);
    };
  }, [gameStateManager, eventName, callback]);

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
  // Return null if state not yet initialized (e.g., title screen)
  if (!state) {
    return null;
  }

  // Once state exists, it must be complete - fail loudly if not
  if (!state.player) {
    throw new Error('Invalid game state: player object missing');
  }

  if (!state.ship) {
    throw new Error('Invalid game state: ship object missing');
  }

  if (!state.world) {
    throw new Error('Invalid game state: world object missing');
  }

  if (!state.dialogue) {
    throw new Error('Invalid game state: dialogue object missing');
  }

  // Map event names to state extraction logic
  // No optional chaining - properties MUST exist after initialization
  const eventStateMap = {
    [EVENT_NAMES.CREDITS_CHANGED]: state.player.credits,
    [EVENT_NAMES.DEBT_CHANGED]: state.player.debt,
    [EVENT_NAMES.FUEL_CHANGED]: state.ship.fuel,
    [EVENT_NAMES.LOCATION_CHANGED]: state.player.currentSystem,
    [EVENT_NAMES.TIME_CHANGED]: state.player.daysElapsed,
    [EVENT_NAMES.CARGO_CHANGED]: state.ship.cargo,
    [EVENT_NAMES.CARGO_CAPACITY_CHANGED]: state.ship.cargoCapacity,
    [EVENT_NAMES.HIDDEN_CARGO_CHANGED]: state.ship.hiddenCargo,
    [EVENT_NAMES.SHIP_CONDITION_CHANGED]: {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport,
    },
    [EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED]: state.world.priceKnowledge,
    [EVENT_NAMES.ACTIVE_EVENTS_CHANGED]: state.world.activeEvents,
    [EVENT_NAMES.SHIP_NAME_CHANGED]: state.ship.name,
    [EVENT_NAMES.UPGRADES_CHANGED]: state.ship.upgrades,
    [EVENT_NAMES.QUIRKS_CHANGED]: state.ship.quirks,
    [EVENT_NAMES.CONDITION_WARNING]: null, // Warnings are passed directly in event data
    [EVENT_NAMES.DIALOGUE_CHANGED]: state.dialogue, // Dialogue state object
    [EVENT_NAMES.ENCOUNTER_TRIGGERED]: null, // Encounter data is passed directly in event
    [EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED]: null, // Narrative event data is passed directly
    [EVENT_NAMES.HULL_CHANGED]: state.ship.hull,
    [EVENT_NAMES.ENGINE_CHANGED]: state.ship.engine,
    [EVENT_NAMES.LIFE_SUPPORT_CHANGED]: state.ship.lifeSupport,
    [EVENT_NAMES.KARMA_CHANGED]: state.player.karma || 0,
    [EVENT_NAMES.INTELLIGENCE_CHANGED]: state.world.intelligence || {},
    [EVENT_NAMES.CURRENT_SYSTEM_CHANGED]: state.player.currentSystem,
    [EVENT_NAMES.FACTION_REP_CHANGED]: state.player.factions || {},
    [EVENT_NAMES.MISSIONS_CHANGED]: state.missions || {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    },
    [EVENT_NAMES.QUEST_CHANGED]: state.quests || {},
    [EVENT_NAMES.FINANCE_CHANGED]: state.player.finance || null,
  };

  return eventStateMap[eventName] ?? null;
}
