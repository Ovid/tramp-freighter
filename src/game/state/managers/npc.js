import { BaseManager } from './base-manager.js';
import {
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  EVENT_NAMES,
} from '../../constants.js';
import { ALL_NPCS } from '../../data/npc-data.js';
import { SeededRandom } from '../../utils/seeded-random.js';
import { pluralizeUnit } from '../../utils/string-utils.js';

function totalUnits(stacks) {
  return stacks.reduce((total, stack) => total + stack.qty, 0);
}

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
   * Read an NPC's reputation without creating their record.
   *
   * Safe to call during render, unlike getNPCState, which writes a default
   * record and schedules a save.
   *
   * @param {string} npcId - NPC identifier
   * @returns {number} Stored reputation, or the NPC's initial reputation
   */
  getNPCRep(npcId) {
    const npcData = this.validateAndGetNPCData(npcId);
    const stored = this.getStoredNPCState(npcId);
    return stored ? stored.rep : npcData.initialRep;
  }

  /**
   * Reset an NPC's interaction count so count-gated dialogue starts over.
   *
   * @param {string} npcId - NPC identifier
   */
  resetInteractions(npcId) {
    this.getNPCState(npcId).interactions = 0;
    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
    this.capabilities.markDirty();
  }

  /**
   * Read an NPC's stored record without creating one.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object|null} The stored record, or null if the NPC has none yet
   */
  getStoredNPCState(npcId) {
    return this.capabilities.getOwnState()[npcId] ?? null;
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

    // Check if NPC's discountService matches serviceType
    if (!npcData.discountService || npcData.discountService !== serviceType) {
      return {
        discount: 0,
        npcName: null,
      };
    }

    // Panels call this during render, so read without creating a record
    const repTier = this.getRepTier(this.getNPCRep(npcId));

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
   * 5. Storage is not full (storage requests)
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
      // >= because older saves can already hold more than the cap
      const storedUnits = totalUnits(npcState.storedCargo ?? []);
      if (storedUnits >= NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT) {
        return { available: false, reason: 'Storage full' };
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

    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
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

          this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
            ...this.capabilities.getOwnState(),
          });
          this.capabilities.markDirty();
        }
      }
    }
  }
  /**
   * Check picker selections against the stacks they index into.
   * Runs every check before anything changes, so nothing is half-applied.
   *
   * @param {Array<{stackIndex: number, qty: number}>} selections
   * @param {Array} source - Stacks the selections index into
   * @param {boolean} rejectMissionCargo
   * @returns {{ total: number } | { error: string }}
   */
  _checkSelections(selections, source, rejectMissionCargo) {
    if (!Array.isArray(selections) || selections.length === 0) {
      return { error: 'Nothing selected' };
    }
    // Integer check first: 0 and '0' differ in a Set but name the same slot
    const seen = new Set();
    let total = 0;
    for (const selection of selections) {
      const { stackIndex, qty } = selection ?? {};
      if (!Number.isInteger(stackIndex) || stackIndex < 0) {
        return { error: 'Invalid cargo stack' };
      }
      if (seen.has(stackIndex)) {
        return { error: 'Cargo stack selected twice' };
      }
      seen.add(stackIndex);
      if (!Number.isInteger(qty) || qty <= 0) {
        return { error: 'Quantity must be a positive whole number' };
      }
      const stack = source[stackIndex];
      if (!stack) {
        return { error: 'Invalid cargo stack' };
      }
      if (rejectMissionCargo && stack.missionId) {
        return { error: 'Mission cargo cannot be stored' };
      }
      if (qty > stack.qty) {
        return { error: 'Not enough quantity in stack' };
      }
      total += qty;
    }
    return { total };
  }

  /**
   * Build new source and target arrays from the original indices.
   * Never splice while walking the selections: removing an earlier stack
   * would shift the indices of later ones.
   */
  _moveSelections(selections, source, target) {
    const taken = new Map(selections.map((s) => [s.stackIndex, s.qty]));
    const newSource = [];
    source.forEach((stack, index) => {
      const left = stack.qty - (taken.get(index) ?? 0);
      if (left > 0) newSource.push({ ...stack, qty: left });
    });
    const newTarget = target.map((stack) => ({ ...stack }));
    for (const { stackIndex, qty } of selections) {
      this.capabilities.addToCargoArray(newTarget, source[stackIndex], qty);
    }
    return { newSource, newTarget };
  }

  /**
   * Store player-selected cargo with an NPC
   *
   * Mission cargo is refused, and the NPC never holds more than
   * CARGO_STORAGE_LIMIT units in total. Sets the shared favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @param {Array<{stackIndex: number, qty: number}>} selections - Indexes into ship cargo
   * @returns {Object} { success: boolean, stored: number, message: string }
   */
  storeCargo(npcId, selections) {
    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: storeCargo requires a valid NPC identifier'
      );
    }

    const availability = this.canRequestFavor(npcId, 'storage');
    if (!availability.available) {
      return { success: false, stored: 0, message: availability.reason };
    }

    const npcState = this.getNPCState(npcId);
    const storedCargo = npcState.storedCargo ?? [];
    const shipCargo = this.capabilities.getShipCargo();

    const check = this._checkSelections(selections, shipCargo, true);
    if (check.error) {
      return { success: false, stored: 0, message: check.error };
    }

    const room =
      NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - totalUnits(storedCargo);
    if (check.total > room) {
      return {
        success: false,
        stored: 0,
        message: `Only ${pluralizeUnit(room)} of storage left`,
      };
    }

    const { newSource, newTarget } = this._moveSelections(
      selections,
      shipCargo,
      storedCargo
    );
    npcState.storedCargo = newTarget;
    this.capabilities.updateCargo(newSource);

    const daysElapsed = this.capabilities.getDaysElapsed();
    npcState.lastFavorDay = daysElapsed;
    npcState.lastInteraction = daysElapsed;
    npcState.interactions += 1;

    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
    this.capabilities.markDirty();

    return {
      success: true,
      stored: check.total,
      message: `Stored ${pluralizeUnit(check.total)} with ${this.validateAndGetNPCData(npcId).name}`,
    };
  }

  /**
   * Retrieve player-selected cargo from an NPC
   *
   * Limited by free hold space, which already counts passengers.
   * Getting your own cargo back is not a favor, so no cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @param {Array<{stackIndex: number, qty: number}>} selections - Indexes into storedCargo
   * @returns {Object} { success: boolean, retrieved: number, message: string }
   */
  retrieveCargo(npcId, selections) {
    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: retrieveCargo requires a valid NPC identifier'
      );
    }

    const npcState = this.getNPCState(npcId);
    const storedCargo = npcState.storedCargo ?? [];

    const check = this._checkSelections(selections, storedCargo, false);
    if (check.error) {
      return { success: false, retrieved: 0, message: check.error };
    }

    if (check.total > this.capabilities.getCargoRemaining()) {
      return {
        success: false,
        retrieved: 0,
        message: 'Not enough cargo space',
      };
    }

    const { newSource, newTarget } = this._moveSelections(
      selections,
      storedCargo,
      this.capabilities.getShipCargo()
    );
    npcState.storedCargo = newSource;
    this.capabilities.updateCargo(newTarget);

    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, {
      ...this.capabilities.getOwnState(),
    });
    this.capabilities.markDirty();

    return {
      success: true,
      retrieved: check.total,
      message: `Retrieved ${pluralizeUnit(check.total)} from ${this.validateAndGetNPCData(npcId).name}`,
    };
  }
}
