import { SeededRandom } from './seeded-random.js';

/**
 * EconomicEventsSystem - Manages random economic events that affect commodity prices
 *
 * Events are temporary market conditions that create trading opportunities and challenges.
 * Each event type has specific triggers, duration, and price modifiers.
 */
export class EconomicEventsSystem {
  /**
   * Event type definitions with triggers, durations, and modifiers
   */
  static EVENT_TYPES = {
    mining_strike: {
      name: 'Mining Strike',
      description: 'Workers demand better conditions',
      duration: [5, 10], // Min/max days
      modifiers: {
        ore: 1.5,
        tritium: 1.3,
      },
      chance: 0.05, // 5% per day per eligible system
      targetSystems: 'mining', // Systems with ore production advantage
    },
    medical_emergency: {
      name: 'Medical Emergency',
      description: 'Outbreak requires urgent supplies',
      duration: [3, 5],
      modifiers: {
        medicine: 2.0,
        grain: 0.9,
        ore: 0.9,
      },
      chance: 0.03,
      targetSystems: 'any',
    },
    festival: {
      name: 'Cultural Festival',
      description: 'Celebration drives luxury demand',
      duration: [2, 4],
      modifiers: {
        electronics: 1.75,
        grain: 1.2,
      },
      chance: 0.04,
      targetSystems: 'core', // Sol Sphere systems
    },
    supply_glut: {
      name: 'Supply Glut',
      description: 'Oversupply crashes prices',
      duration: [3, 7],
      modifiers: {
        // Random good at 0.6 (40% reduction) - determined at event creation
      },
      chance: 0.06,
      targetSystems: 'any',
    },
  };

  /**
   * Core system IDs (Sol and Alpha Centauri)
   */
  static CORE_SYSTEM_IDS = [0, 1];

  /**
   * Spectral classes that indicate mining systems (high ore production)
   */
  static MINING_SPECTRAL_CLASSES = ['M', 'L', 'T'];

  /**
   * All commodity types for supply glut random selection
   */
  static COMMODITY_TYPES = [
    'grain',
    'ore',
    'tritium',
    'parts',
    'medicine',
    'electronics',
  ];

  /**
   * Update events for new day - trigger new events and remove expired ones
   *
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   * @returns {Array} Updated active events array
   */
  static updateEvents(gameState, starData) {
    if (!gameState || !starData) {
      return [];
    }

    const currentDay = gameState.player?.daysElapsed || 0;
    let activeEvents = gameState.world?.activeEvents || [];

    // Remove expired events
    activeEvents = EconomicEventsSystem.removeExpiredEvents(
      activeEvents,
      currentDay
    );

    // Try to trigger new events
    for (const eventTypeKey in EconomicEventsSystem.EVENT_TYPES) {
      const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];

      // Check each system for potential event trigger
      for (const system of starData) {
        // Skip if system already has an active event
        if (activeEvents.some((event) => event.systemId === system.id)) {
          continue;
        }

        // Check if system is eligible for this event type
        if (!EconomicEventsSystem.isSystemEligible(system, eventType)) {
          continue;
        }

        // Roll for event trigger using seeded random
        const seed = `event_${eventTypeKey}_${system.id}_${currentDay}`;
        const rng = new SeededRandom(seed);
        const roll = rng.next();

        if (roll < eventType.chance) {
          // Event triggered!
          const newEvent = EconomicEventsSystem.createEvent(
            eventTypeKey,
            system.id,
            currentDay
          );
          activeEvents.push(newEvent);

          // Only one event per system, so break after creating one
          break;
        }
      }
    }

    return activeEvents;
  }

  /**
   * Check if system is eligible for event type based on target criteria
   *
   * @param {Object} system - Star system data
   * @param {Object} eventType - Event type definition
   * @returns {boolean} True if eligible
   */
  static isSystemEligible(system, eventType) {
    if (!system || !eventType) {
      return false;
    }

    const targetSystems = eventType.targetSystems;

    if (targetSystems === 'any') {
      return true;
    }

    if (targetSystems === 'core') {
      return EconomicEventsSystem.CORE_SYSTEM_IDS.includes(system.id);
    }

    if (targetSystems === 'mining') {
      const spectralLetter = system.type?.charAt(0).toUpperCase();
      return EconomicEventsSystem.MINING_SPECTRAL_CLASSES.includes(
        spectralLetter
      );
    }

    return false;
  }

  /**
   * Create new event instance with unique ID and randomized duration
   *
   * @param {string} eventTypeKey - Event type identifier
   * @param {number} systemId - Target system ID
   * @param {number} currentDay - Current game day
   * @returns {Object} Event instance
   */
  static createEvent(eventTypeKey, systemId, currentDay) {
    const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];

    if (!eventType) {
      throw new Error(`Unknown event type: ${eventTypeKey}`);
    }

    // Generate unique event ID
    const id = `${eventTypeKey}_${systemId}_${currentDay}`;

    // Randomize duration within range using seeded random
    const seed = `duration_${id}`;
    const rng = new SeededRandom(seed);
    const [minDuration, maxDuration] = eventType.duration;
    const duration =
      minDuration + Math.floor(rng.next() * (maxDuration - minDuration + 1));

    // Calculate end day
    const endDay = currentDay + duration;

    // Handle supply_glut special case - pick random commodity
    let modifiers = { ...eventType.modifiers };
    if (eventTypeKey === 'supply_glut') {
      const commoditySeed = `commodity_${id}`;
      const commodityRng = new SeededRandom(commoditySeed);
      const commodityIndex = Math.floor(
        commodityRng.next() * EconomicEventsSystem.COMMODITY_TYPES.length
      );
      const randomCommodity =
        EconomicEventsSystem.COMMODITY_TYPES[commodityIndex];
      modifiers = { [randomCommodity]: 0.6 };
    }

    return {
      id,
      type: eventTypeKey,
      systemId,
      startDay: currentDay,
      endDay,
      modifiers,
    };
  }

  /**
   * Remove expired events where currentDay > endDay
   *
   * @param {Array} activeEvents - Current active events
   * @param {number} currentDay - Current game day
   * @returns {Array} Filtered active events
   */
  static removeExpiredEvents(activeEvents, currentDay) {
    if (!Array.isArray(activeEvents)) {
      return [];
    }

    return activeEvents.filter((event) => {
      return event.endDay >= currentDay;
    });
  }

  /**
   * Get active event for a specific system
   *
   * @param {number} systemId - System identifier
   * @param {Array} activeEvents - Active events list
   * @returns {Object|null} Active event or null
   */
  static getActiveEventForSystem(systemId, activeEvents) {
    if (!Array.isArray(activeEvents)) {
      return null;
    }

    return activeEvents.find((event) => event.systemId === systemId) || null;
  }
}
