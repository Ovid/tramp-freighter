import { BaseManager } from './base-manager.js';
import {
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../constants.js';
import { ALL_NPCS } from '../../data/npc-data.js';

/**
 * NPCManager - Manages NPC reputation, benefits, loans, and storage
 *
 * Handles all NPC-related operations including:
 * - Reputation tracking and tier classification
 * - NPC benefits (tips, discounts, favors)
 * - Loan system with defaults and penalties
 * - Cargo storage with NPCs
 * - Free repair services
 */
export class NPCManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Validate NPC ID and get NPC data
   *
   * Public method for validating NPC IDs and retrieving NPC data.
   * Used by other managers that need to work with NPC data.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC data object
   * @throws {Error} If NPC ID is not found
   */
  validateAndGetNPCData(npcId) {
    const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
    if (!npcData) {
      throw new Error(`Unknown NPC ID: ${npcId}`);
    }
    return npcData;
  }

  /**
   * Validate NPC ID and get NPC data (private method for internal use)
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC data object
   * @throws {Error} If NPC ID is not found
   * @private
   */
  _validateAndGetNPCData(npcId) {
    return this.validateAndGetNPCData(npcId);
  }

  /**
   * Get reputation tier classification for a reputation value
   *
   * Classifies reputation into named tiers based on numeric ranges.
   * Each tier has a name and min/max bounds for display purposes.
   *
   * @param {number} rep - Reputation value (-100 to 100)
   * @returns {Object} Tier object with name, min, max properties
   */
  getRepTier(rep) {
    for (const tier of Object.values(REPUTATION_TIERS)) {
      if (rep >= tier.min && rep <= tier.max) {
        return tier;
      }
    }

    // This should never happen with valid reputation values
    throw new Error(`Invalid reputation value: ${rep}`);
  }

  /**
   * Get or initialize NPC state
   *
   * Returns existing NPC state or creates default state with initial reputation.
   * NPC state includes reputation, last interaction day, story flags, and interaction count.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} NPC state object
   */
  getNPCState(npcId) {
    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);
    const state = this.getState();

    // Return existing state or create default using NPC's initialRep
    if (!state.npcs[npcId]) {
      state.npcs[npcId] = {
        rep: npcData.initialRep,
        lastInteraction: state.player.daysElapsed,
        flags: [],
        interactions: 0,
        // NPC Benefits System fields
        lastTipDay: null,
        lastFavorDay: null,
        loanAmount: null,
        loanDay: null,
        storedCargo: [],
        lastFreeRepairDay: null,
      };
    }

    return state.npcs[npcId];
  }

  /**
   * Modify NPC reputation with trust modifier and quirk support
   *
   * Applies reputation change with NPC personality trust modifier and
   * smooth_talker quirk bonus. Clamps final value to [-100, 100] range.
   * Updates interaction count and timestamp.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} amount - Base reputation change amount
   * @param {string} reason - Reason for reputation change (for logging)
   */
  modifyRep(npcId, amount, reason) {
    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get or create NPC state
    const npcState = this.getNPCState(npcId);

    // Apply trust modifier for positive reputation gains
    let modifiedAmount = amount;
    if (amount > 0) {
      modifiedAmount *= npcData.personality.trust;
    }

    // Apply smooth_talker quirk bonus for positive reputation gains
    if (amount > 0 && this.getState().ship.quirks.includes('smooth_talker')) {
      modifiedAmount *= 1.05;
    }

    // Calculate new reputation with clamping and rounding
    const oldRep = npcState.rep;
    const newRep = Math.max(
      -100,
      Math.min(100, Math.round(oldRep + modifiedAmount))
    );

    // Log warning if clamping occurred
    if (oldRep + modifiedAmount < -100 || oldRep + modifiedAmount > 100) {
      this.warn(
        `Reputation clamped for ${npcId}: ${oldRep + modifiedAmount} -> ${newRep}`
      );
    }

    // Update NPC state
    npcState.rep = newRep;
    npcState.lastInteraction = this.getState().player.daysElapsed;
    npcState.interactions += 1;

    // Log reputation change for debugging
    this.log(
      `Reputation change for ${npcId}: ${amount} (${reason}) -> ${newRep}`
    );
  }

  /**
   * Check if NPC can provide a tip
   *
   * Validates reputation tier (>= Warm), tip availability, and cooldown period.
   * Returns availability status and reason if unavailable.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, reason: string | null }
   */
  canGetTip(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: canGetTip called before game initialization'
      );
    }

    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check reputation tier >= Warm (rep >= WARM_MIN)
    const repTier = this.getRepTier(npcState.rep);
    if (npcState.rep < REPUTATION_BOUNDS.WARM_MIN) {
      return {
        available: false,
        reason: `Requires Warm relationship (currently ${repTier.name})`,
      };
    }

    // Check NPC has non-empty tips array
    if (!npcData.tips || npcData.tips.length === 0) {
      return {
        available: false,
        reason: 'NPC has no tips available',
      };
    }

    // Check tip cooldown (7 days since lastTipDay)
    if (npcState.lastTipDay !== null) {
      const daysSinceLastTip = state.player.daysElapsed - npcState.lastTipDay;
      if (daysSinceLastTip < NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS) {
        const daysRemaining =
          NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS - daysSinceLastTip;
        return {
          available: false,
          reason: `Tip cooldown active (${daysRemaining} days remaining)`,
        };
      }
    }

    return {
      available: true,
      reason: null,
    };
  }

  /**
   * Get a random tip from NPC's tip pool
   *
   * Returns null if canGetTip() returns false. Otherwise, selects a random tip
   * from the NPC's tips array and updates lastTipDay to current game day.
   *
   * @param {string} npcId - NPC identifier
   * @returns {string | null} Tip text or null if unavailable
   */
  getTip(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: getTip called before game initialization'
      );
    }

    // Check if tip is available
    const availability = this.canGetTip(npcId);
    if (!availability.available) {
      return null;
    }

    // Get NPC data and state (validation already done in canGetTip)
    const npcData = this._validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);

    // Select random tip from NPC's tips array
    const randomIndex = Math.floor(Math.random() * npcData.tips.length);
    const selectedTip = npcData.tips[randomIndex];

    // Update lastTipDay to current game day
    npcState.lastTipDay = this.getState().player.daysElapsed;

    return selectedTip;
  }
  /**
   * Get service discount based on NPC relationship
   *
   * Checks if any NPC at the current system provides a discount for the specified
   * service type. Returns the discount percentage and source NPC name if available.
   * Only NPCs whose discountService matches the serviceType can provide discounts.
   *
   * @param {string} npcId - NPC identifier
   * @param {string} serviceType - Service type (e.g., 'repair', 'refuel', 'intel', 'docking', 'trade', 'debt', 'medical')
   * @returns {Object} { discount: number, npcName: string | null }
   */
  getServiceDiscount(npcId, serviceType) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: getServiceDiscount called before game initialization'
      );
    }

    // Validate NPC ID and get NPC data
    const npcData = this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check if NPC's discountService matches serviceType
    if (!npcData.discountService || npcData.discountService !== serviceType) {
      return {
        discount: 0,
        npcName: null,
      };
    }

    // Get reputation tier
    const repTier = this.getRepTier(npcState.rep);

    // Get discount percentage based on tier
    const discountPercentage =
      NPC_BENEFITS_CONFIG.TIER_DISCOUNTS[repTier.name.toLowerCase()] || 0;

    return {
      discount: discountPercentage,
      npcName: discountPercentage > 0 ? npcData.name : null,
    };
  }

  /**
   * Check if NPC can grant a specific favor
   *
   * Validates that the NPC meets all requirements for granting a favor:
   * 1. NPC has been met (has state entry)
   * 2. Reputation tier meets requirement (Trusted for loan, Friendly for storage)
   * 3. Favor cooldown has passed (30 days since lastFavorDay)
   * 4. No outstanding loan for loan requests
   *
   * @param {string} npcId - NPC identifier
   * @param {string} favorType - 'loan' or 'storage'
   * @returns {Object} { available: boolean, reason: string, daysRemaining?: number }
   */
  canRequestFavor(npcId, favorType) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: canRequestFavor called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Check if NPC has been met (has state entry)
    if (!state.npcs[npcId]) {
      return {
        available: false,
        reason: 'NPC not met',
      };
    }

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Check reputation tier requirements
    if (favorType === 'loan') {
      // Loan requires Trusted tier (rep >= 60)
      if (npcState.rep < REPUTATION_BOUNDS.TRUSTED_MIN) {
        const repTier = this.getRepTier(npcState.rep);
        return {
          available: false,
          reason: `Requires Trusted relationship (currently ${repTier.name})`,
        };
      }
    } else if (favorType === 'storage') {
      // Storage requires Friendly tier (rep >= 30)
      if (npcState.rep < REPUTATION_BOUNDS.FRIENDLY_MIN) {
        const repTier = this.getRepTier(npcState.rep);
        return {
          available: false,
          reason: `Requires Friendly relationship (currently ${repTier.name})`,
        };
      }
    } else {
      return {
        available: false,
        reason: `Unknown favor type: ${favorType}`,
      };
    }

    // Check favor cooldown (30 days since lastFavorDay)
    if (npcState.lastFavorDay !== null) {
      const daysSinceLastFavor =
        state.player.daysElapsed - npcState.lastFavorDay;
      if (daysSinceLastFavor < NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS) {
        const daysRemaining =
          NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS - daysSinceLastFavor;
        return {
          available: false,
          reason: `Favor used recently (wait ${daysRemaining} days)`,
          daysRemaining: daysRemaining,
        };
      }
    }

    // Check no outstanding loan for loan requests
    if (favorType === 'loan' && npcState.loanAmount !== null) {
      return {
        available: false,
        reason: 'Outstanding loan must be repaid first',
      };
    }

    return {
      available: true,
      reason: '',
    };
  }
  /**
   * Request emergency loan from NPC
   *
   * Validates loan request with canRequestFavor, then grants 500 credits to player,
   * records loan details, increases NPC reputation by 5, and sets favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  requestLoan(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: requestLoan called before game initialization'
      );
    }

    // Validate with canRequestFavor
    const availability = this.canRequestFavor(npcId, 'loan');
    if (!availability.available) {
      return {
        success: false,
        message: availability.reason,
      };
    }

    // Get NPC state (validation already done in canRequestFavor)
    const npcState = this.getNPCState(npcId);

    // Add 500 credits to player
    this.gameStateManager.updateCredits(
      state.player.credits + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Set loanAmount to 500, loanDay to current day
    npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
    npcState.loanDay = state.player.daysElapsed;

    // Increase NPC reputation by 5 (direct increase, no trust modifier for loan acceptance)
    npcState.rep = Math.max(
      -100,
      Math.min(
        100,
        npcState.rep + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS
      )
    );
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    // Log reputation change for debugging
    this.log(
      `Reputation change for ${npcId}: +${NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS} (emergency loan accepted) -> ${npcState.rep}`
    );

    // Set lastFavorDay to current day
    npcState.lastFavorDay = state.player.daysElapsed;

    return {
      success: true,
      message: `Received ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} emergency loan`,
    };
  }

  /**
   * Repay outstanding loan to NPC
   *
   * Validates that player has sufficient credits and NPC has an outstanding loan,
   * then deducts 500 credits from player and clears the loan record.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, message: string }
   */
  repayLoan(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: repayLoan called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Check if NPC has an outstanding loan
    if (npcState.loanAmount === null) {
      return {
        success: false,
        message: 'No outstanding loan',
      };
    }

    // Check player has sufficient credits
    if (state.player.credits < NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT) {
      return {
        success: false,
        message: 'Insufficient credits',
      };
    }

    // Deduct 500 credits from player
    this.gameStateManager.updateCredits(
      state.player.credits - NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Clear loanAmount and loanDay
    npcState.loanAmount = null;
    npcState.loanDay = null;

    // Update interaction tracking
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    return {
      success: true,
      message: `Repaid ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} loan`,
    };
  }

  /**
   * Check for loan defaults and apply penalties
   *
   * Called automatically on day advance in updateTime(). For each NPC with an
   * outstanding loan where daysSinceLoan > 30, reduces reputation by one tier
   * (approximately 20-30 points depending on current tier) and clears the loan record.
   *
   * Requirements: 3.16, 3.17
   */
  checkLoanDefaults() {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: checkLoanDefaults called before game initialization'
      );
    }

    const currentDay = state.player.daysElapsed;

    // Iterate through all NPCs with state
    for (const npcId in state.npcs) {
      const npcState = state.npcs[npcId];

      // Check if NPC has an outstanding loan
      if (npcState.loanAmount !== null && npcState.loanDay !== null) {
        const daysSinceLoan = currentDay - npcState.loanDay;

        // Check if loan is overdue (> 30 days)
        if (daysSinceLoan > NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE) {
          // Get current reputation tier
          const currentTier = this.getRepTier(npcState.rep);
          const oldRep = npcState.rep;

          // Calculate new reputation based on tier reduction
          let newReputation;

          // Reduce by one tier - set to maximum value of next lower tier
          if (currentTier.name === 'Family') {
            // Family (90-100) -> Trusted (60-89), set to Trusted max (89)
            newReputation = REPUTATION_BOUNDS.TRUSTED_MAX;
          } else if (currentTier.name === 'Trusted') {
            // Trusted (60-89) -> Friendly (30-59), set to Friendly max (59)
            newReputation = REPUTATION_BOUNDS.FRIENDLY_MAX;
          } else if (currentTier.name === 'Friendly') {
            // Friendly (30-59) -> Warm (10-29), set to Warm max (29)
            newReputation = REPUTATION_BOUNDS.WARM_MAX;
          } else if (currentTier.name === 'Warm') {
            // Warm (10-29) -> Neutral (-9-9), set to Neutral max (9)
            newReputation = REPUTATION_BOUNDS.NEUTRAL_MAX;
          } else if (currentTier.name === 'Neutral') {
            // Neutral (-9-9) -> Cold (-49--10), set to Cold max (-10)
            newReputation = REPUTATION_BOUNDS.COLD_MAX;
          } else if (currentTier.name === 'Cold') {
            // Cold (-49--10) -> Hostile (-100--50), set to Hostile max (-50)
            newReputation = REPUTATION_BOUNDS.HOSTILE_MAX;
          } else {
            // Already at Hostile tier, apply penalty but don't go below minimum
            newReputation = Math.max(
              oldRep - NPC_BENEFITS_CONFIG.LOAN_DEFAULT_TIER_PENALTY * 20,
              REPUTATION_BOUNDS.MIN
            );
          }

          // Apply reputation penalty with clamping
          npcState.rep = Math.max(
            REPUTATION_BOUNDS.MIN,
            Math.min(REPUTATION_BOUNDS.MAX, newReputation)
          );

          // Clear loan record
          npcState.loanAmount = null;
          npcState.loanDay = null;

          // Update interaction tracking
          npcState.lastInteraction = currentDay;
          npcState.interactions += 1;

          // Log reputation change for debugging
          this.log(
            `Loan default penalty for ${npcId}: ${oldRep} -> ${npcState.rep} (loan default, tier reduction)`
          );
        }
      }
    }
  }
  /**
   * Store cargo with NPC
   *
   * Validates storage request with canRequestFavor, then removes up to 10 cargo units
   * from ship and adds them to NPC's storedCargo array. Sets favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, stored: number, message: string }
   */
  storeCargo(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: storeCargo called before game initialization'
      );
    }

    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: storeCargo requires a valid NPC identifier'
      );
    }

    // Validate with canRequestFavor
    const availability = this.canRequestFavor(npcId, 'storage');
    if (!availability.available) {
      return {
        success: false,
        stored: 0,
        message: availability.reason,
      };
    }

    // Get NPC state (validation already done in canRequestFavor)
    const npcState = this.getNPCState(npcId);

    // Get current ship cargo
    const currentShipCargo = [...state.ship.cargo];

    // Calculate total cargo units to store (up to limit)
    const totalCargoUnits = currentShipCargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );
    const unitsToStore = Math.min(
      totalCargoUnits,
      NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT
    );

    if (unitsToStore === 0) {
      return {
        success: false,
        stored: 0,
        message: 'No cargo to store',
      };
    }

    // Initialize storedCargo if it doesn't exist
    if (!npcState.storedCargo) {
      npcState.storedCargo = [];
    }

    // Remove cargo from ship and add to NPC storage
    let remainingToStore = unitsToStore;
    const newShipCargo = [];
    const cargoToAdd = [];

    for (const stack of currentShipCargo) {
      if (remainingToStore <= 0) {
        // No more to store, keep remaining cargo on ship
        newShipCargo.push(stack);
      } else if (stack.qty <= remainingToStore) {
        // Store entire stack
        cargoToAdd.push({ ...stack });
        remainingToStore -= stack.qty;
      } else {
        // Partial stack - store some, keep rest on ship
        const storeQty = remainingToStore;
        const keepQty = stack.qty - storeQty;

        cargoToAdd.push({
          ...stack,
          qty: storeQty,
        });

        newShipCargo.push({
          ...stack,
          qty: keepQty,
        });

        remainingToStore = 0;
      }
    }

    // Add stored cargo to NPC's storedCargo array
    npcState.storedCargo.push(...cargoToAdd);

    // Update ship cargo
    this.gameStateManager.updateCargo(newShipCargo);

    // Set lastFavorDay to current day
    npcState.lastFavorDay = state.player.daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    return {
      success: true,
      stored: unitsToStore,
      message: `Stored ${unitsToStore} cargo units with ${this._validateAndGetNPCData(npcId).name}`,
    };
  }

  /**
   * Retrieve stored cargo from NPC
   *
   * Calculates available ship capacity and transfers min(storedCargo, availableCapacity)
   * to ship. Leaves remainder in NPC storage if ship capacity is insufficient.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { success: boolean, retrieved: CargoStack[], remaining: CargoStack[] }
   */
  retrieveCargo(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: retrieveCargo called before game initialization'
      );
    }

    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: retrieveCargo requires a valid NPC identifier'
      );
    }

    // Get NPC state
    const npcState = this.getNPCState(npcId);

    // Initialize storedCargo if it doesn't exist
    if (!npcState.storedCargo) {
      npcState.storedCargo = [];
    }

    // If no stored cargo, return empty result
    if (npcState.storedCargo.length === 0) {
      return {
        success: true,
        retrieved: [],
        remaining: [],
      };
    }

    // Calculate available ship capacity
    const availableCapacity = this.gameStateManager.getCargoRemaining();

    // Calculate total stored cargo units
    const totalStoredUnits = npcState.storedCargo.reduce(
      (total, stack) => total + stack.qty,
      0
    );

    // Determine how much to transfer
    const unitsToTransfer = Math.min(totalStoredUnits, availableCapacity);

    if (unitsToTransfer === 0) {
      // No capacity available, return current stored cargo as remaining
      return {
        success: true,
        retrieved: [],
        remaining: [...npcState.storedCargo],
      };
    }

    // Transfer cargo from NPC storage to ship
    let remainingToTransfer = unitsToTransfer;
    const currentShipCargo = [...state.ship.cargo];
    const retrievedCargo = [];
    const remainingStoredCargo = [];

    for (const stack of npcState.storedCargo) {
      if (remainingToTransfer <= 0) {
        // No more to transfer, keep remaining in storage
        remainingStoredCargo.push(stack);
      } else if (stack.qty <= remainingToTransfer) {
        // Transfer entire stack
        retrievedCargo.push({ ...stack });
        remainingToTransfer -= stack.qty;
      } else {
        // Partial stack - transfer some, keep rest in storage
        const transferQty = remainingToTransfer;
        const keepQty = stack.qty - transferQty;

        retrievedCargo.push({
          ...stack,
          qty: transferQty,
        });

        remainingStoredCargo.push({
          ...stack,
          qty: keepQty,
        });

        remainingToTransfer = 0;
      }
    }

    // Add retrieved cargo to ship using the same stacking logic as storeCargo
    for (const stack of retrievedCargo) {
      this.gameStateManager.shipManager._addToCargoArray(
        currentShipCargo,
        stack,
        stack.qty
      );
    }

    // Update ship cargo
    this.gameStateManager.updateCargo(currentShipCargo);

    // Update NPC's stored cargo
    npcState.storedCargo = remainingStoredCargo;

    // Update interaction tracking
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    return {
      success: true,
      retrieved: retrievedCargo,
      remaining: remainingStoredCargo,
    };
  }

  /**
   * Check if NPC can provide free repair
   *
   * Validates reputation tier (Trusted or Family), once-per-visit limitation,
   * and returns maximum hull repair percentage based on tier.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: canGetFreeRepair called before game initialization'
      );
    }

    // Validate NPC ID
    this._validateAndGetNPCData(npcId);

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.getNPCState(npcId);

    // Check reputation tier is Trusted or Family
    const repTier = this.getRepTier(npcState.rep);
    const isTrusted =
      npcState.rep >= REPUTATION_BOUNDS.TRUSTED_MIN &&
      npcState.rep <= REPUTATION_BOUNDS.TRUSTED_MAX;
    const isFamily = npcState.rep >= REPUTATION_BOUNDS.FAMILY_MIN;

    if (!isTrusted && !isFamily) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: `Requires Trusted relationship (currently ${repTier.name})`,
      };
    }

    // Check once-per-visit limitation (lastFreeRepairDay is not current day)
    const currentDay = state.player.daysElapsed;
    if (
      npcState.lastFreeRepairDay !== null &&
      npcState.lastFreeRepairDay === currentDay
    ) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: 'Free repair already used once per visit',
      };
    }

    // Determine max hull percent based on tier
    let maxHullPercent;
    if (isFamily) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;
    } else if (isTrusted) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;
    }

    return {
      available: true,
      maxHullPercent: maxHullPercent,
      reason: null,
    };
  }

  /**
   * Apply free repair from NPC
   *
   * Validates free repair availability, then repairs up to the tier-appropriate
   * hull damage limit. Sets lastFreeRepairDay to current day to enforce
   * once-per-visit limitation.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  getFreeRepair(npcId, hullDamagePercent) {
    const state = this.getState();
    if (!state) {
      throw new Error(
        'Invalid state: getFreeRepair called before game initialization'
      );
    }

    // Validate with canGetFreeRepair
    const availability = this.canGetFreeRepair(npcId);
    if (!availability.available) {
      return {
        success: false,
        repairedPercent: 0,
        message: availability.reason,
      };
    }

    // Validate hull damage parameter
    if (
      typeof hullDamagePercent !== 'number' ||
      hullDamagePercent < 0 ||
      hullDamagePercent > 100
    ) {
      return {
        success: false,
        repairedPercent: 0,
        message: 'Invalid hull damage percentage',
      };
    }

    // Calculate repair amount (up to maxHullPercent of hull damage)
    const maxRepairPercent = availability.maxHullPercent;
    const actualRepairPercent = Math.min(hullDamagePercent, maxRepairPercent);

    if (actualRepairPercent === 0) {
      return {
        success: true,
        repairedPercent: 0,
        message: 'No hull damage to repair',
      };
    }

    // Get NPC state and update lastFreeRepairDay
    const npcState = this.getNPCState(npcId);
    npcState.lastFreeRepairDay = state.player.daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    return {
      success: true,
      repairedPercent: actualRepairPercent,
      message: `Repaired ${actualRepairPercent}% hull damage`,
    };
  }
}
