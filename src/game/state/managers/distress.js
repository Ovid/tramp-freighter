import { BaseManager } from './base-manager.js';
import { DISTRESS_CONFIG } from '../../constants.js';

/**
 * DistressManager - Handles civilian distress call encounters
 *
 * Extracted from DangerManager. Checks for and resolves distress call
 * encounters: respond, ignore, loot.
 *
 * Feature: danger-system, Property 11: Distress Call Outcomes
 * Validates: Requirements 7.1-7.10, 8.6, 8.7
 */
export class DistressManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Check for distress call encounters during jump
   *
   * @param {number} rng - Random number (0-1) for encounter determination
   * @returns {Object|null} Distress call object or null if no encounter
   */
  checkDistressCall(rng) {
    this.validateState();

    if (rng < DISTRESS_CONFIG.CHANCE) {
      return {
        id: `distress_${Date.now()}`,
        type: 'civilian_distress',
        description:
          'A civilian vessel is broadcasting a distress signal. Their engines have failed and they need assistance.',
        options: ['respond', 'ignore', 'loot'],
      };
    }

    return null;
  }

  /**
   * Resolve a distress call encounter choice and return the outcome
   *
   * @param {Object} distressCall - The distress call encounter object
   * @param {string} choice - Distress call choice ('respond', 'ignore', 'loot')
   * @returns {Object} Distress call outcome with success, costs, rewards, and description
   */
  resolveDistressCallEncounter(distressCall, choice) {
    this.validateState();

    let result;
    switch (choice) {
      case 'respond':
        result = this.resolveDistressRespond();
        this.gameStateManager.incrementDangerFlag('civiliansSaved');
        break;
      case 'ignore':
        result = this.resolveDistressIgnore();
        break;
      case 'loot':
        result = this.resolveDistressLoot();
        this.gameStateManager.incrementDangerFlag('civiliansLooted');
        break;
      default:
        throw new Error(`Unknown distress call choice: ${choice}`);
    }

    return result;
  }

  /**
   * Resolve respond distress call choice
   *
   * Costs: 2 days, 15% fuel, 5% life support
   * Rewards: ₡500, +10 civilian reputation, +1 karma
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressRespond() {
    return {
      success: true,
      costs: {
        days: DISTRESS_CONFIG.RESPOND.DAYS_COST,
        fuel: DISTRESS_CONFIG.RESPOND.FUEL_COST,
        lifeSupport: DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST,
      },
      rewards: {
        credits: DISTRESS_CONFIG.RESPOND.CREDITS_REWARD,
        factionRep: {
          civilians: DISTRESS_CONFIG.RESPOND.REP_REWARD,
        },
        karma: DISTRESS_CONFIG.RESPOND.KARMA_REWARD,
      },
      description:
        'You helped the distressed vessel repair their engines. They were grateful and offered payment for your assistance.',
    };
  }

  /**
   * Resolve ignore distress call choice
   *
   * Costs: -1 karma
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressIgnore() {
    return {
      success: false,
      costs: {},
      rewards: {
        karma: DISTRESS_CONFIG.IGNORE.KARMA_PENALTY,
      },
      description:
        'You ignored the distress call and continued on your way. The decision weighs on your conscience.',
    };
  }

  /**
   * Resolve loot distress call choice
   *
   * Costs: 1 day, -3 karma, -15 civilian reputation
   * Rewards: +5 outlaw reputation, cargo
   *
   * @returns {Object} Distress call outcome
   */
  resolveDistressLoot() {
    return {
      success: true,
      costs: {
        days: DISTRESS_CONFIG.LOOT.DAYS_COST,
      },
      rewards: {
        karma: DISTRESS_CONFIG.LOOT.KARMA_PENALTY,
        factionRep: {
          civilians: DISTRESS_CONFIG.LOOT.REP_PENALTY,
          outlaws: DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN,
        },
        cargo: [
          {
            good: 'parts',
            qty: 2,
            buyPrice: 0,
            buySystemName: 'Salvaged',
          },
        ],
      },
      description:
        'You salvaged valuable parts from the distressed vessel. The crew will remember your betrayal.',
    };
  }
}
