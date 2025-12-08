import {
  BASE_PRICES,
  FUEL_PRICING,
  calculateDistanceFromSol,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  SAVE_KEY,
  FUEL_CAPACITY_EPSILON,
  REPAIR_COST_PER_PERCENT,
  SHIP_CONDITION_BOUNDS,
  SHIP_CONDITION_WARNING_THRESHOLDS,
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';
import { EconomicEventsSystem } from './game-events.js';
import { InformationBroker } from './game-information-broker.js';

// Save debouncing prevents excessive localStorage writes (max 1 save per second)
const SAVE_DEBOUNCE_MS = 1000;

/**
 * GameStateManager - Manages all game state with event-driven reactivity
 *
 * Responsibilities:
 * - Initialize new game with default values
 * - Maintain single source of truth for game state
 * - Provide state query methods
 * - Emit events on state mutations for UI reactivity
 * - Support multiple subscribers per event type
 */
export class GameStateManager {
  constructor(starData, wormholeData) {
    this.starData = starData;
    this.wormholeData = wormholeData;

    // Check once during initialization to suppress console noise during test runs
    this.isTestEnvironment =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    // Supports multiple UI components subscribing to same state changes
    this.subscribers = {
      creditsChanged: [],
      debtChanged: [],
      fuelChanged: [],
      cargoChanged: [],
      locationChanged: [],
      timeChanged: [],
      priceKnowledgeChanged: [],
      activeEventsChanged: [],
      shipConditionChanged: [],
      conditionWarning: [],
    };

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Track last save time for debouncing
    this.lastSaveTime = 0;
  }

  /**
   * Initialize a new game with default values
   */
  initNewGame() {
    // Get Sol's grain price for initial cargo using dynamic pricing
    const solSystem = this.starData.find((s) => s.id === SOL_SYSTEM_ID);
    const currentDay = 0; // Game starts at day 0
    const activeEvents = []; // No events at game start
    const solGrainPrice = TradingSystem.calculatePrice(
      'grain',
      solSystem,
      currentDay,
      activeEvents
    );

    // Calculate all Sol prices for price knowledge initialization
    const solPrices = {};
    for (const goodType of Object.keys(BASE_PRICES)) {
      solPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        solSystem,
        currentDay,
        activeEvents
      );
    }

    this.state = {
      player: {
        credits: 500,
        debt: 10000,
        currentSystem: SOL_SYSTEM_ID,
        daysElapsed: 0,
      },
      ship: {
        name: 'Serendipity',
        fuel: SHIP_CONDITION_BOUNDS.MAX,
        hull: SHIP_CONDITION_BOUNDS.MAX,
        engine: SHIP_CONDITION_BOUNDS.MAX,
        lifeSupport: SHIP_CONDITION_BOUNDS.MAX,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 20,
            purchasePrice: solGrainPrice,
            purchaseSystem: SOL_SYSTEM_ID,
            purchaseDay: 0,
          },
        ],
      },
      world: {
        visitedSystems: [SOL_SYSTEM_ID],
        priceKnowledge: {
          [SOL_SYSTEM_ID]: {
            lastVisit: 0,
            prices: solPrices,
          },
        },
        activeEvents: [],
      },
      meta: {
        version: GAME_VERSION,
        timestamp: Date.now(),
      },
    };

    if (!this.isTestEnvironment) {
      console.log('New game initialized:', this.state);
    }

    // Emit all initial state events
    this.emit('creditsChanged', this.state.player.credits);
    this.emit('debtChanged', this.state.player.debt);
    this.emit('fuelChanged', this.state.ship.fuel);
    this.emit('cargoChanged', this.state.ship.cargo);
    this.emit('locationChanged', this.state.player.currentSystem);
    this.emit('timeChanged', this.state.player.daysElapsed);
    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
    this.emit('shipConditionChanged', {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    });

    return this.state;
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  /**
   * Subscribe to state change events
   * @param {string} eventType - One of: creditsChanged, debtChanged, fuelChanged, cargoChanged, locationChanged, timeChanged, shipConditionChanged, conditionWarning
   * @param {function} callback - Function to call when event occurs
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    this.subscribers[eventType].push(callback);
    if (!this.isTestEnvironment) {
      console.log(
        `Subscribed to ${eventType}, total subscribers: ${this.subscribers[eventType].length}`
      );
    }
  }

  unsubscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      return;
    }

    const index = this.subscribers[eventType].indexOf(callback);
    if (index > -1) {
      this.subscribers[eventType].splice(index, 1);
    }
  }

  emit(eventType, data) {
    if (!this.subscribers[eventType]) {
      return;
    }

    this.subscribers[eventType].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} subscriber:`, error);
      }
    });
  }

  // ========================================================================
  // STATE QUERIES
  // ========================================================================

  getState() {
    return this.state;
  }

  getPlayer() {
    return this.state?.player;
  }

  getShip() {
    return this.state?.ship;
  }

  getCurrentSystem() {
    const systemId = this.state?.player.currentSystem;
    return this.starData.find((s) => s.id === systemId);
  }

  getCargoUsed() {
    if (!this.state?.ship.cargo) return 0;
    return this.state.ship.cargo.reduce((total, stack) => total + stack.qty, 0);
  }

  getCargoRemaining() {
    return this.state?.ship.cargoCapacity - this.getCargoUsed();
  }

  isSystemVisited(systemId) {
    return this.state?.world.visitedSystems.includes(systemId);
  }

  /**
   * Get ship condition values
   * @returns {Object} { hull, engine, lifeSupport } or null if no state
   */
  getShipCondition() {
    if (!this.state?.ship) return null;

    return {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    };
  }

  /**
   * Check ship condition and return warnings for systems below thresholds
   *
   * Evaluates current ship condition against warning thresholds and returns
   * an array of warning objects for systems that need attention.
   *
   * @returns {Array} Array of warning objects: { system: string, message: string, severity: string }
   */
  checkConditionWarnings() {
    const condition = this.getShipCondition();
    if (!condition) return [];

    const warnings = [];

    // Hull warning: < 50%
    if (condition.hull < SHIP_CONDITION_WARNING_THRESHOLDS.HULL) {
      warnings.push({
        system: 'hull',
        message: 'Risk of cargo loss during jumps',
        severity: 'warning',
      });
    }

    // Engine warning: < 30%
    if (condition.engine < SHIP_CONDITION_WARNING_THRESHOLDS.ENGINE) {
      warnings.push({
        system: 'engine',
        message: 'Jump failure risk - immediate repairs recommended',
        severity: 'warning',
      });
    }

    // Life support critical warning: < 20%
    if (
      condition.lifeSupport < SHIP_CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT
    ) {
      warnings.push({
        system: 'lifeSupport',
        message: 'Critical condition - urgent repairs required',
        severity: 'critical',
      });
    }

    return warnings;
  }

  /**
   * Get price knowledge database
   */
  getPriceKnowledge() {
    return this.state?.world.priceKnowledge || {};
  }

  /**
   * Get known prices for a specific system
   */
  getKnownPrices(systemId) {
    return this.state?.world.priceKnowledge?.[systemId]?.prices || null;
  }

  /**
   * Check if player has price knowledge for a system
   */
  hasVisitedSystem(systemId) {
    return this.state?.world.priceKnowledge?.[systemId] !== undefined;
  }

  // ========================================================================
  // STATE MUTATIONS
  // ========================================================================

  updateCredits(newCredits) {
    this.state.player.credits = newCredits;
    this.emit('creditsChanged', newCredits);
  }

  updateDebt(newDebt) {
    this.state.player.debt = newDebt;
    this.emit('debtChanged', newDebt);
  }

  updateFuel(newFuel) {
    if (
      newFuel < SHIP_CONDITION_BOUNDS.MIN ||
      newFuel > SHIP_CONDITION_BOUNDS.MAX
    ) {
      throw new Error(
        `Invalid fuel value: ${newFuel}. Fuel must be between ${SHIP_CONDITION_BOUNDS.MIN} and ${SHIP_CONDITION_BOUNDS.MAX}.`
      );
    }

    this.state.ship.fuel = newFuel;
    this.emit('fuelChanged', newFuel);
  }

  updateCargo(newCargo) {
    this.state.ship.cargo = newCargo;
    this.emit('cargoChanged', newCargo);
  }

  updateLocation(newSystemId) {
    this.state.player.currentSystem = newSystemId;

    // Track exploration progress for future features (price discovery, missions)
    if (!this.state.world.visitedSystems.includes(newSystemId)) {
      this.state.world.visitedSystems.push(newSystemId);
    }

    this.emit('locationChanged', newSystemId);
  }

  updateTime(newDays) {
    const oldDays = this.state.player.daysElapsed;
    this.state.player.daysElapsed = newDays;

    // When days advance, update price knowledge and events
    if (newDays > oldDays) {
      const daysPassed = newDays - oldDays;

      // Increment staleness for all systems
      this.incrementPriceKnowledgeStaleness(daysPassed);

      // Update economic events (trigger new events, remove expired ones)
      this.state.world.activeEvents = EconomicEventsSystem.updateEvents(
        this.state,
        this.starData
      );

      // Recalculate prices with new day number (for daily fluctuations)
      this.recalculatePricesForKnownSystems();

      // Emit event changes
      this.emit('activeEventsChanged', this.state.world.activeEvents);
    }

    this.emit('timeChanged', newDays);
  }

  /**
   * Update ship condition values
   *
   * All values are clamped to valid range to prevent invalid states.
   * Checks for condition warnings and emits them if thresholds are crossed.
   *
   * @param {number} hull - Hull integrity percentage
   * @param {number} engine - Engine condition percentage
   * @param {number} lifeSupport - Life support condition percentage
   */
  updateShipCondition(hull, engine, lifeSupport) {
    // Clamp all values to valid range
    this.state.ship.hull = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONDITION_BOUNDS.MAX, hull)
    );
    this.state.ship.engine = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONDITION_BOUNDS.MAX, engine)
    );
    this.state.ship.lifeSupport = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONDITION_BOUNDS.MAX, lifeSupport)
    );

    this.emit('shipConditionChanged', {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    });

    // Check for warnings and emit them
    const warnings = this.checkConditionWarnings();
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.emit('conditionWarning', warning);
      });
    }
  }

  /**
   * Update price knowledge for a system
   *
   * @param {number} systemId - System ID
   * @param {Object} prices - Price object with all commodity prices
   * @param {number} lastVisit - Days since last visit (0 = current)
   */
  updatePriceKnowledge(systemId, prices, lastVisit = 0) {
    if (!this.state.world.priceKnowledge) {
      this.state.world.priceKnowledge = {};
    }

    this.state.world.priceKnowledge[systemId] = {
      lastVisit: lastVisit,
      prices: { ...prices },
    };

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  /**
   * Increment lastVisit counter for all systems in price knowledge
   *
   * Called automatically when time advances
   *
   * @param {number} days - Number of days to increment (default 1)
   */
  incrementPriceKnowledgeStaleness(days = 1) {
    if (!this.state?.world.priceKnowledge) return;

    for (const systemId in this.state.world.priceKnowledge) {
      this.state.world.priceKnowledge[systemId].lastVisit += days;
    }

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  /**
   * Recalculate prices for all systems in price knowledge with current day's fluctuations
   *
   * Called automatically when day advances to update all known prices with new daily
   * fluctuations and active event modifiers.
   */
  recalculatePricesForKnownSystems() {
    if (!this.state?.world.priceKnowledge) return;

    const currentDay = this.state.player.daysElapsed;
    const activeEvents = this.state.world.activeEvents || [];

    // Recalculate prices for each system in price knowledge
    for (const systemIdStr in this.state.world.priceKnowledge) {
      const systemId = parseInt(systemIdStr);
      const system = this.starData.find((s) => s.id === systemId);

      if (system) {
        const newPrices = {};

        // Calculate new prices for all commodities
        for (const goodType of Object.keys(BASE_PRICES)) {
          newPrices[goodType] = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents
          );
        }

        // Update prices while preserving lastVisit
        this.state.world.priceKnowledge[systemId].prices = newPrices;
      }
    }

    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }

  // ========================================================================
  // ECONOMIC EVENTS SYSTEM
  // ========================================================================

  /**
   * Get active events array
   */
  getActiveEvents() {
    return this.state?.world.activeEvents || [];
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    if (!this.state.world.activeEvents) {
      this.state.world.activeEvents = [];
    }

    this.state.world.activeEvents = newEvents;
    this.emit('activeEventsChanged', newEvents);
  }

  /**
   * Get active event for a specific system
   *
   * @param {number} systemId - System identifier
   * @returns {Object|null} Active event or null
   */
  getActiveEventForSystem(systemId) {
    const activeEvents = this.getActiveEvents();
    return activeEvents.find((event) => event.systemId === systemId) || null;
  }

  /**
   * Get event type definition by event type key
   * @param {string} eventTypeKey - Event type identifier
   * @returns {Object|null} Event type definition or null
   */
  getEventType(eventTypeKey) {
    return EconomicEventsSystem.EVENT_TYPES[eventTypeKey] || null;
  }

  // ========================================================================
  // INFORMATION BROKER SYSTEM
  // ========================================================================

  /**
   * Get intelligence cost for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {number} Cost in credits
   */
  getIntelligenceCost(systemId) {
    const priceKnowledge = this.getPriceKnowledge();
    return InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
  }

  /**
   * Purchase market intelligence for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseIntelligence(systemId) {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    const result = InformationBroker.purchaseIntelligence(
      this.state,
      systemId,
      this.starData
    );

    if (result.success) {
      // Emit state change events
      this.emit('creditsChanged', this.state.player.credits);
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);

      // Persist immediately - intelligence purchase modifies credits and price knowledge
      this.saveGame();
    }

    return result;
  }

  /**
   * Generate a market rumor
   *
   * @returns {string} Rumor text
   */
  generateRumor() {
    if (!this.state) {
      return 'No rumors available.';
    }

    return InformationBroker.generateRumor(this.state, this.starData);
  }

  /**
   * Get list of all systems with intelligence costs
   *
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit }
   */
  listAvailableIntelligence() {
    const priceKnowledge = this.getPriceKnowledge();
    return InformationBroker.listAvailableIntelligence(
      priceKnowledge,
      this.starData
    );
  }

  // ========================================================================
  // TRADING OPERATIONS
  // ========================================================================

  /**
   * Execute a purchase transaction
   */
  buyGood(goodType, quantity, price) {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    const credits = this.state.player.credits;
    const cargoSpace = this.getCargoRemaining();

    const validation = this.validatePurchase(
      credits,
      cargoSpace,
      quantity,
      price
    );
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const totalCost = quantity * price;
    this.updateCredits(credits - totalCost);

    // Pass current system and day for purchase metadata
    const currentSystemId = this.state.player.currentSystem;
    const currentDay = this.state.player.daysElapsed;

    const newCargo = TradingSystem.addCargoStack(
      this.state.ship.cargo,
      goodType,
      quantity,
      price,
      currentSystemId,
      currentDay
    );
    this.updateCargo(newCargo);

    // Persist immediately - trade transactions modify credits and cargo
    this.saveGame();

    return { success: true };
  }

  validatePurchase(credits, cargoSpace, quantity, price) {
    const totalCost = quantity * price;

    if (totalCost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits',
      };
    }

    if (quantity > cargoSpace) {
      return {
        valid: false,
        reason: 'Not enough cargo space',
      };
    }

    return { valid: true };
  }



  /**
   * Execute a sale transaction from a specific cargo stack
   */
  sellGood(stackIndex, quantity, salePrice) {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    const cargo = this.state.ship.cargo;

    const validation = this.validateSale(cargo, stackIndex, quantity);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    const stack = cargo[stackIndex];
    const totalRevenue = quantity * salePrice;
    const profitMargin = salePrice - stack.purchasePrice;

    const currentCredits = this.state.player.credits;
    this.updateCredits(currentCredits + totalRevenue);

    const newCargo = this.removeFromCargoStack(cargo, stackIndex, quantity);
    this.updateCargo(newCargo);

    // Persist immediately - trade transactions modify credits and cargo
    this.saveGame();

    return {
      success: true,
      profitMargin: profitMargin,
    };
  }

  validateSale(cargo, stackIndex, quantity) {
    if (!Array.isArray(cargo) || stackIndex < 0 || stackIndex >= cargo.length) {
      return {
        valid: false,
        reason: 'Invalid cargo stack',
      };
    }

    const stack = cargo[stackIndex];
    if (quantity > stack.qty) {
      return {
        valid: false,
        reason: 'Not enough quantity in stack',
      };
    }

    if (quantity <= 0) {
      return {
        valid: false,
        reason: 'Quantity must be positive',
      };
    }

    return { valid: true };
  }

  /**
   * Decreases quantity in stack; removes stack if empty
   */
  removeFromCargoStack(cargo, stackIndex, quantity) {
    const updatedCargo = [...cargo];
    const stack = { ...updatedCargo[stackIndex] };

    stack.qty -= quantity;

    // Remove stack if empty
    if (stack.qty <= 0) {
      updatedCargo.splice(stackIndex, 1);
    } else {
      updatedCargo[stackIndex] = stack;
    }

    return updatedCargo;
  }

  // ========================================================================
  // REFUEL SYSTEM
  // ========================================================================

  /**
   * Calculate fuel price based on system distance from Sol
   *
   * @param {number} systemId - System ID to check
   * @returns {number} Fuel price per percentage point
   */
  getFuelPrice(systemId) {
    if (FUEL_PRICING.CORE_SYSTEMS.IDS.includes(systemId)) {
      return FUEL_PRICING.CORE_SYSTEMS.PRICE;
    }

    const system = this.starData.find((s) => s.id === systemId);
    if (!system) {
      return FUEL_PRICING.MID_RANGE.PRICE;
    }

    const distanceFromSol = calculateDistanceFromSol(system);

    if (
      distanceFromSol >= FUEL_PRICING.MID_RANGE.MIN_DISTANCE &&
      distanceFromSol < FUEL_PRICING.MID_RANGE.MAX_DISTANCE
    ) {
      return FUEL_PRICING.MID_RANGE.PRICE;
    }

    if (distanceFromSol >= FUEL_PRICING.OUTER.MIN_DISTANCE) {
      return FUEL_PRICING.OUTER.PRICE;
    }

    return FUEL_PRICING.INNER.PRICE;
  }

  /**
   * Validate refuel transaction
   *
   * @param {number} currentFuel - Current fuel percentage
   * @param {number} amount - Amount to refuel (percentage points)
   * @param {number} credits - Player's current credits
   * @param {number} pricePerPercent - Fuel price per percentage point
   * @returns {Object} { valid: boolean, reason: string, cost: number }
   */
  validateRefuel(currentFuel, amount, credits, pricePerPercent) {
    // Calculate total cost
    const totalCost = amount * pricePerPercent;

    // Check capacity constraint
    // Use epsilon for floating point comparison
    if (
      currentFuel + amount >
      SHIP_CONDITION_BOUNDS.MAX + FUEL_CAPACITY_EPSILON
    ) {
      return {
        valid: false,
        reason: `Cannot refuel beyond ${SHIP_CONDITION_BOUNDS.MAX}% capacity`,
        cost: totalCost,
      };
    }

    // Check credit constraint
    if (totalCost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits for refuel',
        cost: totalCost,
      };
    }

    // Check for valid amount
    if (amount <= 0) {
      return {
        valid: false,
        reason: 'Refuel amount must be positive',
        cost: totalCost,
      };
    }

    return {
      valid: true,
      reason: null,
      cost: totalCost,
    };
  }

  /**
   * Execute refuel transaction
   *
   * @param {number} amount - Amount to refuel (percentage points)
   * @returns {Object} { success: boolean, reason: string }
   */
  refuel(amount) {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    const currentFuel = this.state.ship.fuel;
    const credits = this.state.player.credits;
    const systemId = this.state.player.currentSystem;

    const pricePerPercent = this.getFuelPrice(systemId);
    const validation = this.validateRefuel(
      currentFuel,
      amount,
      credits,
      pricePerPercent
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    this.updateCredits(credits - validation.cost);
    this.updateFuel(currentFuel + amount);

    // Persist immediately - refuel modifies credits and fuel
    this.saveGame();

    return { success: true, reason: null };
  }

  // ========================================================================
  // SHIP REPAIR SYSTEM
  // ========================================================================

  /**
   * Calculate repair cost for a ship system
   *
   * Cost is ₡5 per 1% restored. If system is already at maximum condition, cost is 0.
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} currentCondition - Current condition percentage
   * @returns {number} Cost in credits
   */
  getRepairCost(systemType, amount, currentCondition) {
    // If already at max, no cost
    if (currentCondition >= SHIP_CONDITION_BOUNDS.MAX) {
      return 0;
    }

    // Calculate cost at ₡5 per 1%
    return amount * REPAIR_COST_PER_PERCENT;
  }

  /**
   * Validate repair transaction
   *
   * Validation order matters for user experience:
   * 1. Check for positive amount (basic input validation)
   * 2. Check if system already at max (no repair needed)
   * 3. Check credits (player can fix by earning money)
   * 4. Check if would exceed max (player can fix by reducing amount)
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} cost - Repair cost in credits
   * @param {number} credits - Player's current credits
   * @param {number} currentCondition - Current condition percentage
   * @returns {Object} { valid: boolean, reason: string }
   */
  validateRepair(systemType, amount, cost, credits, currentCondition) {
    // Check for valid amount first (basic input validation)
    if (amount <= 0) {
      return {
        valid: false,
        reason: 'Repair amount must be positive',
      };
    }

    // Check if system is already at maximum condition
    if (currentCondition >= SHIP_CONDITION_BOUNDS.MAX) {
      return {
        valid: false,
        reason: 'System already at maximum condition',
      };
    }

    // Check credit constraint before checking if would exceed
    // This provides better UX: player knows they need money first
    if (cost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits for repair',
      };
    }

    // Check if repair would exceed maximum condition
    if (currentCondition + amount > SHIP_CONDITION_BOUNDS.MAX) {
      return {
        valid: false,
        reason: 'Repair would exceed maximum condition',
      };
    }

    return {
      valid: true,
      reason: null,
    };
  }

  /**
   * Execute repair transaction for a ship system
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @returns {Object} { success: boolean, reason: string }
   */
  repairShipSystem(systemType, amount) {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    // Validate system type
    const validSystems = ['hull', 'engine', 'lifeSupport'];
    if (!validSystems.includes(systemType)) {
      return { success: false, reason: 'Invalid system type' };
    }

    const currentCondition = this.state.ship[systemType];
    const credits = this.state.player.credits;
    const cost = this.getRepairCost(systemType, amount, currentCondition);

    const validation = this.validateRepair(
      systemType,
      amount,
      cost,
      credits,
      currentCondition
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Deduct credits
    this.updateCredits(credits - cost);

    // Increase condition (clamped by updateShipCondition)
    const newHull =
      systemType === 'hull'
        ? currentCondition + amount
        : this.state.ship.hull;
    const newEngine =
      systemType === 'engine'
        ? currentCondition + amount
        : this.state.ship.engine;
    const newLifeSupport =
      systemType === 'lifeSupport'
        ? currentCondition + amount
        : this.state.ship.lifeSupport;

    this.updateShipCondition(newHull, newEngine, newLifeSupport);

    // Persist immediately - repair modifies credits and ship condition
    this.saveGame();

    return { success: true, reason: null };
  }

  // ========================================================================
  // DOCK/UNDOCK OPERATIONS
  // ========================================================================

  /**
   * Dock at current system's station to access trading and refueling
   *
   * Updates price knowledge on dock:
   * - First visit: Records current prices with lastVisit = daysElapsed
   * - Subsequent visits: Updates prices and resets lastVisit to 0
   */
  dock() {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    const currentSystemId = this.state.player.currentSystem;
    const currentSystem = this.starData.find((s) => s.id === currentSystemId);

    if (currentSystem) {
      // Calculate current prices for all commodities using dynamic pricing
      const currentDay = this.state.player.daysElapsed;
      const activeEvents = this.state.world.activeEvents || [];
      const currentPrices = {};

      for (const goodType of Object.keys(BASE_PRICES)) {
        currentPrices[goodType] = TradingSystem.calculatePrice(
          goodType,
          currentSystem,
          currentDay,
          activeEvents
        );
      }

      // Update price knowledge (resets lastVisit to 0)
      this.updatePriceKnowledge(currentSystemId, currentPrices, 0);
    }

    // Persist state transition - prevents loss if player closes browser while docked
    this.saveGame();

    return { success: true };
  }

  /**
   * Undock from current system's station to resume navigation
   *
   * Currently a state transition marker for auto-save
   * Future: Will close station UI, enable jumps, track undocked state.
   */
  undock() {
    if (!this.state) {
      return { success: false, reason: 'No game state' };
    }

    // Persist state transition - prevents loss if player closes browser while undocked
    this.saveGame();

    return { success: true };
  }

  // ========================================================================
  // SAVE/LOAD SYSTEM
  // ========================================================================

  /**
   * Save game state to localStorage with debouncing
   *
   * Implements save debouncing to prevent excessive saves (max 1 save per second).
   * This protects against rapid state changes causing performance issues.
   */
  saveGame() {
    if (!this.state) {
      console.error('Cannot save: no game state exists');
      return false;
    }

    // Debounce: skip save if less than 1 second since last save
    const now = Date.now();
    if (now - this.lastSaveTime < SAVE_DEBOUNCE_MS) {
      if (!this.isTestEnvironment) {
        console.log('Save debounced (too soon since last save)');
      }
      return false;
    }

    try {
      this.state.meta.timestamp = now;
      const saveData = JSON.stringify(this.state);
      localStorage.setItem(SAVE_KEY, saveData);

      this.lastSaveTime = now;
      if (!this.isTestEnvironment) {
        console.log('Game saved successfully');
      }
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   *
   * Supports migration from v1.0.0 to v2.0.0
   */
  loadGame() {
    try {
      // Retrieve save data from localStorage
      const saveData = localStorage.getItem(SAVE_KEY);

      if (!saveData) {
        if (!this.isTestEnvironment) {
          console.log('No saved game found');
        }
        return null;
      }

      let loadedState = JSON.parse(saveData);

      if (!this.isVersionCompatible(loadedState.meta?.version)) {
        if (!this.isTestEnvironment) {
          console.log('Save version incompatible, starting new game');
        }
        return null;
      }

      // Migrate from v1.0.0 to v2.0.0 if needed
      if (loadedState.meta?.version === '1.0.0' && GAME_VERSION === '2.0.0') {
        loadedState = this.migrateFromV1ToV2(loadedState);
      }

      if (!this.validateStateStructure(loadedState)) {
        if (!this.isTestEnvironment) {
          console.log('Save data corrupted, starting new game');
        }
        return null;
      }

      // Add defaults for missing Phase 2 fields (handles partial v2.0.0 saves)
      // This allows loading saves that pass validation but lack some optional fields
      if (loadedState.ship.hull === undefined) {
        loadedState.ship.hull = SHIP_CONDITION_BOUNDS.MAX;
      }
      if (loadedState.ship.engine === undefined) {
        loadedState.ship.engine = SHIP_CONDITION_BOUNDS.MAX;
      }
      if (loadedState.ship.lifeSupport === undefined) {
        loadedState.ship.lifeSupport = SHIP_CONDITION_BOUNDS.MAX;
      }
      if (loadedState.ship.cargo && Array.isArray(loadedState.ship.cargo)) {
        loadedState.ship.cargo.forEach((stack) => {
          if (stack.purchaseSystem === undefined) {
            stack.purchaseSystem = loadedState.player.currentSystem;
          }
          if (stack.purchaseDay === undefined) {
            stack.purchaseDay = 0;
          }
        });
      }
      if (!loadedState.world.priceKnowledge) {
        loadedState.world.priceKnowledge = {};

        // Initialize with current system's prices
        const currentSystemId = loadedState.player.currentSystem;
        const currentSystem = this.starData.find((s) => s.id === currentSystemId);

        if (currentSystem) {
          const currentDay = loadedState.player.daysElapsed;
          const currentPrices = {};

          for (const goodType of Object.keys(BASE_PRICES)) {
            currentPrices[goodType] = TradingSystem.calculatePrice(
              goodType,
              currentSystem,
              currentDay,
              [] // No events if missing
            );
          }

          loadedState.world.priceKnowledge[currentSystemId] = {
            lastVisit: 0,
            prices: currentPrices,
          };
        }
      }
      if (!loadedState.world.activeEvents) {
        loadedState.world.activeEvents = [];
      }

      this.state = loadedState;

      if (!this.isTestEnvironment) {
        console.log('Game loaded successfully');
      }

      // Emit all state events to update UI
      this.emit('creditsChanged', this.state.player.credits);
      this.emit('debtChanged', this.state.player.debt);
      this.emit('fuelChanged', this.state.ship.fuel);
      this.emit('cargoChanged', this.state.ship.cargo);
      this.emit('locationChanged', this.state.player.currentSystem);
      this.emit('timeChanged', this.state.player.daysElapsed);
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
      this.emit('activeEventsChanged', this.state.world.activeEvents);
      this.emit('shipConditionChanged', {
        hull: this.state.ship.hull,
        engine: this.state.ship.engine,
        lifeSupport: this.state.ship.lifeSupport,
      });

      return this.state;
    } catch (error) {
      if (!this.isTestEnvironment) {
        console.log('Failed to load game:', error);
      }
      return null;
    }
  }

  /**
   * Check if saved game exists
   */
  hasSavedGame() {
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      return saveData !== null;
    } catch (error) {
      console.error('Failed to check for saved game:', error);
      return false;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
      if (!this.isTestEnvironment) {
        console.log('Save data cleared');
      }
      return true;
    } catch (error) {
      console.error('Failed to clear save:', error);
      return false;
    }
  }

  /**
   * Check if save version is compatible with current version
   *
   * Supports migration from v1.0.0 to v2.0.0
   */
  isVersionCompatible(saveVersion) {
    if (!saveVersion) return false;

    // Exact version match
    if (saveVersion === GAME_VERSION) return true;

    // Support migration from v1.0.0 to v2.0.0
    if (saveVersion === '1.0.0' && GAME_VERSION === '2.0.0') return true;

    return false;
  }

  /**
   * Migrate save data from v1.0.0 to v2.0.0
   *
   * Adds Phase 2 features:
   * - Ship condition (hull, engine, lifeSupport)
   * - Cargo purchase metadata (purchaseSystem, purchaseDay)
   * - Price knowledge database
   * - Active events array
   *
   * @param {Object} state - v1.0.0 save state
   * @returns {Object} Migrated v2.0.0 state
   */
  migrateFromV1ToV2(state) {
    if (!this.isTestEnvironment) {
      console.log('Migrating save from v1.0.0 to v2.0.0');
    }

    // Add ship condition fields (default to maximum)
    if (state.ship.hull === undefined) {
      state.ship.hull = SHIP_CONDITION_BOUNDS.MAX;
    }
    if (state.ship.engine === undefined) {
      state.ship.engine = SHIP_CONDITION_BOUNDS.MAX;
    }
    if (state.ship.lifeSupport === undefined) {
      state.ship.lifeSupport = SHIP_CONDITION_BOUNDS.MAX;
    }

    // Add cargo purchase metadata
    if (state.ship.cargo && Array.isArray(state.ship.cargo)) {
      state.ship.cargo.forEach((stack) => {
        if (stack.purchaseSystem === undefined) {
          // Default to current system (best guess)
          stack.purchaseSystem = state.player.currentSystem;
        }
        if (stack.purchaseDay === undefined) {
          // Default to day 0 (unknown purchase time)
          stack.purchaseDay = 0;
        }
      });
    }

    // Add price knowledge database
    if (!state.world.priceKnowledge) {
      state.world.priceKnowledge = {};

      // Initialize with current system's prices
      const currentSystemId = state.player.currentSystem;
      const currentSystem = this.starData.find((s) => s.id === currentSystemId);

      if (currentSystem) {
        const currentDay = state.player.daysElapsed;
        const currentPrices = {};

        for (const goodType of Object.keys(BASE_PRICES)) {
          currentPrices[goodType] = TradingSystem.calculatePrice(
            goodType,
            currentSystem,
            currentDay,
            [] // No events in v1.0.0
          );
        }

        state.world.priceKnowledge[currentSystemId] = {
          lastVisit: 0,
          prices: currentPrices,
        };
      }
    }

    // Add active events array
    if (!state.world.activeEvents) {
      state.world.activeEvents = [];
    }

    // Update version
    state.meta.version = GAME_VERSION;

    if (!this.isTestEnvironment) {
      console.log('Migration complete');
    }

    return state;
  }

  /**
   * Validate that loaded state has required structure
   */
  validateStateStructure(state) {
    if (!state) return false;

    // Check player structure
    if (
      !state.player ||
      typeof state.player.credits !== 'number' ||
      typeof state.player.debt !== 'number' ||
      typeof state.player.currentSystem !== 'number' ||
      typeof state.player.daysElapsed !== 'number'
    ) {
      return false;
    }

    // Check ship structure
    if (
      !state.ship ||
      typeof state.ship.name !== 'string' ||
      typeof state.ship.fuel !== 'number' ||
      typeof state.ship.cargoCapacity !== 'number' ||
      !Array.isArray(state.ship.cargo)
    ) {
      return false;
    }

    // Check ship condition fields (optional - will be initialized if missing)
    if (state.ship.hull !== undefined && typeof state.ship.hull !== 'number') {
      return false;
    }
    if (state.ship.engine !== undefined && typeof state.ship.engine !== 'number') {
      return false;
    }
    if (state.ship.lifeSupport !== undefined && typeof state.ship.lifeSupport !== 'number') {
      return false;
    }

    // Check cargo stacks
    for (const stack of state.ship.cargo) {
      if (
        !stack.good ||
        typeof stack.qty !== 'number' ||
        typeof stack.purchasePrice !== 'number'
      ) {
        return false;
      }

      // Purchase metadata is optional - will be initialized if missing
      if (stack.purchaseSystem !== undefined && typeof stack.purchaseSystem !== 'number') {
        return false;
      }
      if (stack.purchaseDay !== undefined && typeof stack.purchaseDay !== 'number') {
        return false;
      }
    }

    // Check world structure
    if (!state.world || !Array.isArray(state.world.visitedSystems)) {
      return false;
    }

    // priceKnowledge and activeEvents are optional - will be initialized if missing
    if (state.world.priceKnowledge !== undefined) {
      if (typeof state.world.priceKnowledge !== 'object') {
        return false;
      }

      // Validate each price knowledge entry
      for (const systemId in state.world.priceKnowledge) {
        const knowledge = state.world.priceKnowledge[systemId];
        if (
          !knowledge ||
          typeof knowledge.lastVisit !== 'number' ||
          typeof knowledge.prices !== 'object'
        ) {
          return false;
        }
      }
    }

    if (state.world.activeEvents !== undefined) {
      if (!Array.isArray(state.world.activeEvents)) {
        return false;
      }
    }

    // Check meta structure
    if (
      !state.meta ||
      typeof state.meta.version !== 'string' ||
      typeof state.meta.timestamp !== 'number'
    ) {
      return false;
    }

    return true;
  }
}
