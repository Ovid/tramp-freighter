import { BaseManager } from './base-manager.js';
import {
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '../../constants.js';
import { calculateKarmaModifier } from '../../utils/danger-utils.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * NegotiationManager - Handles pirate negotiation resolution
 *
 * Extracted from DangerManager. Resolves dialogue-based pirate encounter options:
 * counter-proposal, medicine claim, intel offer, accept demand.
 *
 * Feature: danger-system, Property 6: Negotiation Outcomes
 * Validates: Requirements 4.1-4.11, 8.7, 9.4, 9.10
 */
export class NegotiationManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Resolve a negotiation choice and return the outcome
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Negotiation choice ('counter_proposal', 'medicine_claim', 'intel_offer', 'accept_demand')
   * @returns {Object} Negotiation outcome with success, costs, rewards, and description
   */
  resolveNegotiation(encounter, choice) {
    this.validateState();

    const gameState = this.getState();

    // Generate deterministic RNG from game context
    const seed = buildEncounterSeed(
      gameState.player.daysElapsed,
      gameState.player.currentSystem,
      'negotiation'
    );
    const seededRng = new SeededRandom(seed);
    const rngValue = seededRng.next();

    let result;
    switch (choice) {
      case 'counter_proposal':
        result = this.resolveCounterProposal(encounter, gameState, rngValue);
        break;
      case 'medicine_claim':
        result = this.resolveMedicineClaim(encounter, gameState, rngValue);
        break;
      case 'intel_offer':
        result = this.resolveIntelOffer(encounter, gameState, rngValue);
        break;
      case 'accept_demand':
        result = this.resolveAcceptDemand();
        break;
      default:
        throw new Error(`Unknown negotiation choice: ${choice}`);
    }

    this.gameStateManager.incrementDangerFlag('piratesNegotiated');
    return result;
  }

  /**
   * Resolve counter-proposal negotiation choice
   *
   * Success rate: 60% base chance + karma modifier
   * Success: 10% cargo payment instead of full demand
   * Failure: +10% enemy strength increase, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveCounterProposal(encounter, gameState, rng) {
    const { COUNTER_PROPOSAL } = NEGOTIATION_CONFIG;

    let successChance = COUNTER_PROPOSAL.BASE_CHANCE;
    successChance += calculateKarmaModifier(gameState.player.karma);

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      if (this.hasTradeCargoForPirates()) {
        return {
          success: true,
          costs: {
            cargoPercent: COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT,
          },
          rewards: {},
          description:
            'Successfully negotiated a reduced payment with the pirates.',
        };
      }

      const reducedCredits = Math.round(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND *
          PIRATE_CREDIT_DEMAND_CONFIG.COUNTER_PROPOSAL_DISCOUNT
      );
      return {
        success: true,
        costs: {
          credits: reducedCredits,
        },
        rewards: {},
        description: `Talked the pirates down to ₡${reducedCredits} in credits.`,
      };
    } else {
      return {
        success: false,
        escalate: true,
        costs: {},
        rewards: {},
        description: "The pirates don't take kindly to your offer.",
      };
    }
  }

  /**
   * Resolve medicine claim negotiation choice
   *
   * Success rate: 40% sympathy chance if medicine present
   * Success: Free passage
   * Failure: Forces combat or other consequence
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveMedicineClaim(encounter, gameState, rng) {
    const { MEDICINE_CLAIM } = NEGOTIATION_CONFIG;

    const hasMedicine = gameState.ship.cargo.some(
      (item) => item.good === 'medicine'
    );

    if (!hasMedicine) {
      return {
        success: false,
        costs: {},
        rewards: {},
        description:
          'Pirates discovered you have no medicine. They see through the lie.',
      };
    }

    let sympathyChance = MEDICINE_CLAIM.SYMPATHY_CHANCE;
    sympathyChance += calculateKarmaModifier(gameState.player.karma);

    sympathyChance = Math.max(0, Math.min(1, sympathyChance));

    const success = rng < sympathyChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {},
        description:
          'Pirates showed sympathy for your medical mission and let you pass.',
      };
    } else {
      return {
        success: false,
        costs: {
          cargoPercent: encounter.demandPercent || 20,
        },
        rewards: {},
        description:
          'Pirates acknowledged your medicine but still demanded payment.',
      };
    }
  }

  /**
   * Resolve intel offer negotiation choice
   *
   * Success: Free passage, +3 outlaw reputation for cooperating with pirates
   * Failure: Reputation penalty if discovered, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveIntelOffer(encounter, gameState, rng) {
    const { INTEL_OFFER } = NEGOTIATION_CONFIG;

    const hasPriorIntel = gameState.world.flags?.hasPriorIntel || false;

    if (!hasPriorIntel) {
      return {
        success: false,
        costs: {},
        rewards: {},
        description: 'You have nothing the pirates want.',
      };
    }

    let successChance = NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE;
    successChance += calculateKarmaModifier(gameState.player.karma);

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {
          factionRep: {
            outlaws: INTEL_OFFER.OUTLAW_REP_GAIN,
          },
        },
        description:
          'Pirates accepted your intelligence and let you pass. Your cooperation was noted.',
      };
    } else {
      return {
        success: false,
        costs: {},
        rewards: {
          factionRep: {
            authorities: INTEL_OFFER.SUCCESS_REP_PENALTY,
          },
        },
        description:
          'Pirates rejected your intelligence offer and became suspicious.',
      };
    }
  }

  /**
   * Check if ship has any trade cargo for pirate tribute
   *
   * @returns {boolean} True if ship has trade cargo with qty > 0
   */
  hasTradeCargoForPirates() {
    this.validateState();
    const cargo = this.getState().ship.cargo;
    return cargo.some((item) => item.qty > 0);
  }

  /**
   * Resolve accept demand negotiation choice
   *
   * If the ship has trade cargo, pays the standard cargo percentage.
   * If no trade cargo, demands flat credits instead. If player can't
   * afford credits, routes to kidnap/damage resolution.
   *
   * @returns {Object} Negotiation outcome
   */
  resolveAcceptDemand() {
    const { ACCEPT_DEMAND } = NEGOTIATION_CONFIG;

    if (this.hasTradeCargoForPirates()) {
      return {
        success: true,
        costs: {
          cargoPercent: ACCEPT_DEMAND.CARGO_PERCENT,
        },
        rewards: {},
        description:
          'Paid the pirates their demanded tribute and continued safely.',
      };
    }

    const state = this.getState();
    const rng = new SeededRandom(
      buildEncounterSeed(
        state.player.daysElapsed,
        state.player.currentSystem,
        'negotiation_payment'
      )
    );

    const { MIN_CREDIT_DEMAND, MAX_CREDIT_DEMAND } =
      PIRATE_CREDIT_DEMAND_CONFIG;
    const creditDemand = Math.round(
      MIN_CREDIT_DEMAND + rng.next() * (MAX_CREDIT_DEMAND - MIN_CREDIT_DEMAND)
    );

    if (state.player.credits >= creditDemand) {
      return {
        success: true,
        costs: {
          credits: creditDemand,
        },
        rewards: {},
        description: `No cargo to plunder. Pirates demanded ₡${creditDemand} in credits instead.`,
      };
    }

    return this.resolveCannotPayPirates(rng);
  }

  /**
   * Resolve situation when player can't pay pirate credit demand
   *
   * If active passenger missions exist, pirates may kidnap the highest-value
   * passenger (weighted by type). Otherwise, pirates damage the ship.
   *
   * @param {SeededRandom} [rng] - Seeded RNG instance (created internally if not provided)
   * @returns {Object} Negotiation outcome with kidnap or damage costs
   */
  resolveCannotPayPirates(rng) {
    if (!rng) {
      const state = this.getState();
      rng = new SeededRandom(
        buildEncounterSeed(
          state.player.daysElapsed,
          state.player.currentSystem,
          'negotiation_payment'
        )
      );
    }

    const gameState = this.getState();
    const activeMissions = gameState.missions?.active || [];
    const passengerMissions = activeMissions.filter(
      (m) => m.type === 'passenger' && m.passenger
    );

    if (passengerMissions.length > 0) {
      const sorted = [...passengerMissions].sort((a, b) => {
        const wA =
          PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[a.passenger.type] || 0;
        const wB =
          PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[b.passenger.type] || 0;
        return wB - wA;
      });

      const target = sorted[0];
      const weight =
        PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_WEIGHTS[target.passenger.type] || 0;
      const rngValue = rng.next();

      if (rngValue < weight) {
        return {
          success: false,
          costs: {
            kidnappedPassengerId: target.id,
          },
          rewards: {},
          description: `You couldn't pay. The pirates seized your passenger, ${target.passenger.name}.`,
        };
      }
    }

    const { MIN_PERCENT, MAX_PERCENT } =
      PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE;
    const damageRng = rng.next();
    const damagePercent = Math.round(
      MIN_PERCENT + damageRng * (MAX_PERCENT - MIN_PERCENT)
    );

    const systems = ['hull', 'engine', 'lifeSupport'];
    const targetSystem = rng.pickRandom(systems);

    const costs = {};
    costs[targetSystem] = damagePercent;

    return {
      success: false,
      costs,
      rewards: {},
      description: `You couldn't pay. Pirates damaged your ${targetSystem === 'lifeSupport' ? 'life support' : targetSystem} before leaving.`,
    };
  }
}
