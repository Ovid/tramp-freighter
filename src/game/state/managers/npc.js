import { BaseManager } from './base-manager.js';
import {
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  EVENT_NAMES,
} from '../../constants.js';
import { ALL_NPCS } from '../../data/npc-data.js';
import { SeededRandom } from '../../utils/seeded-random.js';

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
    const npcData = this.validateAndGetNPCData(npcId);
    const npcs = this.capabilities.getOwnState();

    // Return existing state or create default using NPC's initialRep
    if (!npcs[npcId]) {
      npcs[npcId] = {
        rep: npcData.initialRep,
        lastInteraction: this.capabilities.getDaysElapsed(),
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
      this.capabilities.markDirty();
    }

    return npcs[npcId];
  }

  /**
   * Modify NPC reputation with trust modifier and quirk support
   *
   * Applies reputation change with NPC personality trust modifier and
   * smooth_talker quirk bonus, then delegates to modifyRepRaw for
   * clamping, interaction tracking, achievements, and UI updates.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} amount - Base reputation change amount
   * @param {string} reason - Reason for reputation change (for logging)
   */
  modifyRep(npcId, amount, reason) {
    const npcData = this.validateAndGetNPCData(npcId);

    let modifiedAmount = amount;
    if (amount > 0) {
      modifiedAmount *= npcData.personality.trust;
    }

    if (
      amount > 0 &&
      this.capabilities.getShipQuirks().includes('smooth_talker')
    ) {
      modifiedAmount *= 1.05;
    }

    this.modifyRepRaw(npcId, modifiedAmount, reason);
  }

  /**
   * Modify NPC reputation without trust/quirk modifiers
   *
   * Applies an exact reputation change with all gameplay side-effects
   * (interaction tracking, achievements, UI updates) but no personality
   * or quirk modifiers. Used for system-granted rewards (quests, missions)
   * where the reward value should be deterministic.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} amount - Exact reputation change amount
   * @param {string} reason - Reason for reputation change (for logging)
   */
  modifyRepRaw(npcId, amount, reason) {
    this.validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);

    const oldRep = npcState.rep;
    const newRep = Math.max(-100, Math.min(100, Math.round(oldRep + amount)));

    if (oldRep + amount < -100 || oldRep + amount > 100) {
      this.warn(
        `Reputation clamped for ${npcId}: ${oldRep + amount} -> ${newRep}`
      );
    }

    npcState.rep = newRep;
    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    this.log(
      `Reputation change for ${npcId}: ${amount} (${reason}) -> ${newRep}`
    );
    this.capabilities.checkAchievements();
    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
    this.capabilities.markDirty();
  }

  /**
   * Set NPC reputation to an exact value (dev tool)
   *
   * Bypasses trust multiplier and does not update interaction tracking.
   * Used by dev admin panel for testing tier-gated behaviors.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} value - Target reputation value (-100 to 100)
   */
  setNpcRep(npcId, value) {
    this.validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);
    npcState.rep = Math.round(
      Math.max(REPUTATION_BOUNDS.MIN, Math.min(REPUTATION_BOUNDS.MAX, value))
    );
    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
    this.capabilities.markDirty();
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
    // Validate NPC ID and get NPC data
    const npcData = this.validateAndGetNPCData(npcId);

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
      const daysSinceLastTip =
        this.capabilities.getDaysElapsed() - npcState.lastTipDay;
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
    // Check if tip is available
    const availability = this.canGetTip(npcId);
    if (!availability.available) {
      return null;
    }

    // Get NPC data and state (validation already done in canGetTip)
    const npcData = this.validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);

    // Select random tip from NPC's tips array using deterministic RNG
    // Use game day + npcId as seed for consistent but varied tip selection
    const daysElapsed = this.capabilities.getDaysElapsed();
    const tipSeed = `tip-${npcId}-${daysElapsed}`;
    const rng = new SeededRandom(tipSeed);
    const randomIndex = rng.nextInt(0, npcData.tips.length - 1);
    const selectedTip = npcData.tips[randomIndex];

    // Update lastTipDay to current game day
    npcState.lastTipDay = daysElapsed;

    this.capabilities.markDirty();

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
    // Validate NPC ID and get NPC data
    const npcData = this.validateAndGetNPCData(npcId);

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
    // Validate NPC ID
    this.validateAndGetNPCData(npcId);

    // Check if NPC has been met (has state entry)
    const npcs = this.capabilities.getOwnState();
    if (!npcs[npcId]) {
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
        this.capabilities.getDaysElapsed() - npcState.lastFavorDay;
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
    const daysElapsed = this.capabilities.getDaysElapsed();

    // Add 500 credits to player
    this.capabilities.updateCredits(
      this.capabilities.getCredits() + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Set loanAmount to 500, loanDay to current day
    npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
    npcState.loanDay = daysElapsed;

    // Increase NPC reputation by 5 (direct increase, no trust modifier for loan acceptance)
    npcState.rep = Math.max(
      -100,
      Math.min(
        100,
        npcState.rep + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS
      )
    );
    npcState.lastInteraction = daysElapsed;
    npcState.interactions += 1;

    // Log reputation change for debugging
    this.log(
      `Reputation change for ${npcId}: +${NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS} (emergency loan accepted) -> ${npcState.rep}`
    );

    // Set lastFavorDay to current day
    npcState.lastFavorDay = daysElapsed;

    this.capabilities.markDirty();

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
    // Validate NPC ID
    this.validateAndGetNPCData(npcId);

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
    if (
      this.capabilities.getCredits() < NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    ) {
      return {
        success: false,
        message: 'Insufficient credits',
      };
    }

    // Deduct 500 credits from player
    this.capabilities.updateCredits(
      this.capabilities.getCredits() - NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
    );

    // Clear loanAmount and loanDay
    npcState.loanAmount = null;
    npcState.loanDay = null;

    // Update interaction tracking
    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    this.capabilities.markDirty();

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
    const currentDay = this.capabilities.getDaysElapsed();
    const npcs = this.capabilities.getOwnState();

    // Iterate through all NPCs with state
    for (const npcId in npcs) {
      const npcState = npcs[npcId];

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
              oldRep -
                NPC_BENEFITS_CONFIG.LOAN_DEFAULT_TIER_PENALTY *
                  NPC_BENEFITS_CONFIG.LOAN_DEFAULT_HOSTILE_MULTIPLIER,
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

          this.capabilities.markDirty();
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
    const currentShipCargo = [...this.capabilities.getShipCargo()];

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
    this.capabilities.updateCargo(newShipCargo);

    const daysElapsed = this.capabilities.getDaysElapsed();

    // Set lastFavorDay to current day
    npcState.lastFavorDay = daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = daysElapsed;
    npcState.interactions += 1;

    this.capabilities.markDirty();

    return {
      success: true,
      stored: unitsToStore,
      message: `Stored ${unitsToStore} cargo units with ${this.validateAndGetNPCData(npcId).name}`,
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
    const availableCapacity = this.capabilities.getCargoRemaining();

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
    const currentShipCargo = [...this.capabilities.getShipCargo()];
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
      this.capabilities.addToCargoArray(currentShipCargo, stack, stack.qty);
    }

    // Update ship cargo
    this.capabilities.updateCargo(currentShipCargo);

    // Update NPC's stored cargo
    npcState.storedCargo = remainingStoredCargo;

    // Update interaction tracking
    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    if (retrievedCargo.length > 0) {
      this.capabilities.markDirty();
    }

    return {
      success: true,
      retrieved: retrievedCargo,
      remaining: remainingStoredCargo,
    };
  }
}
