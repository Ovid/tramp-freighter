import { BaseManager } from './base-manager.js';
import { evaluateCondition } from '../../event-conditions.js';

/**
 * EventEngineManager — generic event trigger/eligibility/priority engine.
 *
 * Handles registration, eligibility checking, and priority sorting for
 * all event types (narrative, danger, future types). Does NOT handle
 * resolution logic or UI rendering — those are dispatched by category.
 */
export class EventEngineManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.events = [];
  }

  /**
   * Register a single event definition.
   * @param {Object} event - Event definition object
   */
  registerEvent(event) {
    this.events.push(event);
  }

  /**
   * Register an array of event definitions.
   * @param {Array} events - Array of event definition objects
   */
  registerEvents(events) {
    events.forEach((e) => this.registerEvent(e));
  }

  /**
   * Look up an event by ID (used for chain resolution).
   * @param {string} id - Event ID
   * @returns {Object|null} Event definition or null
   */
  getEventById(id) {
    return this.events.find((e) => e.id === id) || null;
  }

  /**
   * Check for eligible events of the given type.
   *
   * Filters by type, evaluates conditions, checks once/cooldown,
   * rolls chance, sorts by priority, and returns the winner.
   *
   * @param {string} eventType - 'dock' | 'jump' | 'time' | 'condition'
   * @param {Object} context - { system, chances, ... }
   * @param {number} rng - Random number 0-1 for chance rolls (defaults to Math.random())
   * @returns {Object|null} Winning event or null
   */
  checkEvents(eventType, context = {}, rng = Math.random()) {
    const state = this.getState();
    const { narrativeEvents } = state.world;

    const eligible = this.events.filter((event) => {
      // Type match
      if (event.type !== eventType) return false;

      // System match (if specified)
      if (
        event.trigger.system != null &&
        event.trigger.system !== context.system
      ) {
        return false;
      }

      // Once-only check
      if (event.once && narrativeEvents.fired.includes(event.id)) return false;

      // Cooldown check
      if (event.cooldown && narrativeEvents.cooldowns[event.id] != null) {
        if (state.player.daysElapsed < narrativeEvents.cooldowns[event.id]) {
          return false;
        }
      }

      // Condition check
      if (event.trigger.condition) {
        if (!evaluateCondition(event.trigger.condition, state, context)) {
          return false;
        }
      }

      // Chance roll — supports static number or dynamic string lookup
      let chance = event.trigger.chance;
      if (typeof chance === 'string') {
        chance = context.chances?.[chance] ?? 0;
      }
      if (rng >= chance) return false;

      return true;
    });

    if (eligible.length === 0) return null;

    // Sort by priority (descending) — highest priority wins
    eligible.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return eligible[0];
  }

  /**
   * Mark an event as fired (for once-only tracking).
   * @param {string} eventId
   */
  markFired(eventId) {
    const { fired } = this.getState().world.narrativeEvents;
    if (!fired.includes(eventId)) {
      fired.push(eventId);
    }
  }

  /**
   * Set cooldown for an event.
   * @param {string} eventId
   * @param {number} cooldownDays
   */
  setCooldown(eventId, cooldownDays) {
    const state = this.getState();
    state.world.narrativeEvents.cooldowns[eventId] =
      state.player.daysElapsed + cooldownDays;
  }

  /**
   * Set a narrative flag (for condition checks).
   * @param {string} flagName
   */
  setFlag(flagName) {
    this.getState().world.narrativeEvents.flags[flagName] = true;
  }
}
