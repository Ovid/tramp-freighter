import { BaseManager } from './base-manager.js';
import { EVENT_NAMES, PIRATE_CREDIT_DEMAND_CONFIG } from '../../constants.js';
import { SeededRandom } from '../../utils/seeded-random.js';
import {
  determineThreatLevel,
  determineInspectionSeverity,
} from '../../utils/calculators.js';

/**
 * Decides when danger encounters and narrative events fire, and emits them
 * as ENCOUNTER_TRIGGERED / NARRATIVE_EVENT_TRIGGERED.
 *
 * Docking, passing time and clearing debt are picked up from the event bus.
 * Jumps are not: NavigationSystem calls beginJump/endJump around its state
 * updates and completeJump once location and wear are applied, so a jump's
 * checks see the destination and the worn ship.
 */
export class EncounterTriggerManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
    this.jumpInProgress = false;

    capabilities.subscribe(EVENT_NAMES.DOCKED, (data) => {
      if (data?.systemId == null) return;
      this.trigger('dock', { system: data.systemId });
    });
    capabilities.subscribe(EVENT_NAMES.TIME_CHANGED, () => {
      if (this.jumpInProgress) return;
      const state = capabilities.getState();
      if (!state) return;
      this.trigger('time', { system: state.player.currentSystem });
    });
    capabilities.subscribe(EVENT_NAMES.DEBT_CLEARED, () => this.showDebtFree());
  }

  /**
   * Suppresses time-triggered checks until endJump, so the time a jump takes
   * is checked once, at the destination, by completeJump.
   */
  beginJump() {
    this.jumpInProgress = true;
  }

  endJump() {
    this.jumpInProgress = false;
  }

  /**
   * Runs the time and jump checks for a completed jump to `systemId`.
   * Errors are logged, never thrown, so a trigger fault cannot fail the jump.
   *
   * @param {number} systemId - Destination system
   */
  completeJump(systemId) {
    try {
      const state = this.capabilities.getState();
      if (!state || state.meta?.victory) return;

      const timeEvent = this.check('time', { system: systemId });
      const jumpContext = this.buildJumpContext(systemId, state);
      const jumpEvent = this.check('jump', jumpContext);

      if (!timeEvent && !jumpEvent) {
        this.dispatch(this.check('condition', { system: systemId }), null);
        return;
      }
      // Only the last narrative emitted is shown, so the jump's wins.
      this.dispatch(timeEvent, null);
      this.dispatch(jumpEvent, jumpContext);
    } catch (error) {
      this.error('Jump event check failed:', error);
    }
  }

  /**
   * Checks `eventType` events, falling back to condition events when none
   * fires, and emits the winner.
   *
   * @param {string} eventType - 'dock' | 'time' | 'condition'
   * @param {Object} context - { system }
   */
  trigger(eventType, context) {
    const state = this.capabilities.getState();
    // markVictory relocates the ship like a jump, and an event there would
    // replace the Epilogue.
    if (!state || state.meta?.victory) return;

    let event = this.check(eventType, context);
    if (!event && eventType !== 'condition') {
      event = this.check('condition', context);
    }
    this.dispatch(event, context);
  }

  /**
   * Returns the winning event of `eventType` for today and the current
   * system, or null. Has no side effects: firing and cooldowns are recorded
   * when the player resolves the event.
   *
   * @param {string} eventType
   * @param {Object} context - { system, chances? }
   * @returns {Object|null}
   */
  check(eventType, context) {
    const state = this.capabilities.getState();
    const day = Math.floor(state.player.daysElapsed);
    const rng = new SeededRandom(
      `event-${eventType}-${day}-${state.player.currentSystem}`
    );
    return this.capabilities.checkEvents(eventType, context, () => rng.next());
  }

  /**
   * Returns the jump context, with danger chances resolved for the engine.
   * Mechanical failure and distress are rolled here, by their own seeded
   * managers, and passed to the engine as a certain or impossible chance.
   *
   * @param {number} systemId
   * @param {Object} state - Game state
   * @returns {Object}
   */
  buildJumpContext(systemId, state) {
    const mechanicalResult = this.capabilities.checkMechanicalFailure();
    const distressResult = this.capabilities.checkDistressCall();
    return {
      system: systemId,
      chances: {
        pirate_chance: this.capabilities.calculatePirateEncounterChance(
          systemId,
          state
        ),
        inspection_chance: this.capabilities.calculateInspectionChance(
          systemId,
          state
        ),
        mechanical_chance: mechanicalResult ? 1.0 : 0,
        distress_chance: distressResult ? 1.0 : 0,
      },
      mechanicalResult,
      distressResult,
    };
  }

  dispatch(event, context) {
    if (!event) return;
    if (event.category === 'danger') {
      const data = this.generateEncounter(event, context);
      if (data) this.capabilities.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, data);
    } else {
      this.emitNarrative(event);
    }
  }

  /**
   * Returns the encounter payload the danger panels expect, or null for an
   * unknown generator.
   *
   * @param {Object} event - Danger event
   * @param {Object} context - Jump context from buildJumpContext
   * @returns {Object|null}
   */
  generateEncounter(event, context) {
    const state = this.capabilities.getState();
    const systemId = context.system;

    switch (event.encounter.generator) {
      case 'pirate':
        return {
          type: 'pirate',
          encounter: {
            id: `pirate_jump_${Date.now()}`,
            type: 'pirate',
            systemId,
            threatLevel: determineThreatLevel(state),
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
            severity: determineInspectionSeverity(state),
          },
        };
      case 'mechanical_failure': {
        const failure = context.mechanicalResult;
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
        return { type: 'distress_call', encounter: context.distressResult };
      default:
        return null;
    }
  }

  emitNarrative(event) {
    let emitted = { ...event };
    if (typeof event.generateContent === 'function') {
      const dynamicContent = event.generateContent(
        this.capabilities.getState(),
        this.capabilities.starData
      );
      emitted = {
        ...emitted,
        content: { ...emitted.content, ...dynamicContent },
      };
    }
    // A fresh object on every emit, so a repeatable event re-fires in React.
    this.capabilities.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, emitted);
  }

  showDebtFree() {
    const event = this.capabilities.getEventById('cond_debt_free');
    if (!event) return;
    const { fired } = this.capabilities.getState().world.narrativeEvents;
    if (event.once && fired.includes(event.id)) return;
    this.emitNarrative(event);
  }
}
