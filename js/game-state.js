import {
  BASE_PRICES,
  FUEL_PRICING,
  calculateDistanceFromSol,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  SAVE_KEY,
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
    };

    // Initialize with null state (will be set by initNewGame or loadGame)
    this.state = null;

    // Track last save time for debouncing
    this.lastSaveTime = 0;
  }

  /**
   * Suppress console noise during test runs
   */
  _logIfNotTest(message, ...args) {
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      console.log(message, ...args);
    }
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
        fuel: 100,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 20,
            purchasePrice: solGrainPrice,
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

    this._logIfNotTest('New game initialized:', this.state);

    // Emit all initial state events
    this.emit('creditsChanged', this.state.player.credits);
    this.emit('debtChanged', this.state.player.debt);
    this.emit('fuelChanged', this.state.ship.fuel);
    this.emit('cargoChanged', this.state.ship.cargo);
    this.emit('locationChanged', this.state.player.currentSystem);
    this.emit('timeChanged', this.state.player.daysElapsed);
    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);

    return this.state;
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  /**
   * Subscribe to state change events
   * @param {string} eventType - One of: creditsChanged, debtChanged, fuelChanged, cargoChanged, locationChanged, timeChanged
   * @param {function} callback - Function to call when event occurs
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    this.subscribers[eventType].push(callback);
    this._logIfNotTest(
      `Subscribed to ${eventType}, total subscribers: ${this.subscribers[eventType].length}`
    );
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
    if (!this.state) return;

    this.state.player.credits = newCredits;
    this.emit('creditsChanged', newCredits);
  }

  updateDebt(newDebt) {
    if (!this.state) return;

    this.state.player.debt = newDebt;
    this.emit('debtChanged', newDebt);
  }

  updateFuel(newFuel) {
    if (!this.state) return;

    if (newFuel < 0 || newFuel > 100) {
      throw new Error(
        `Invalid fuel value: ${newFuel}. Fuel must be between 0 and 100.`
      );
    }

    this.state.ship.fuel = newFuel;
    this.emit('fuelChanged', newFuel);
  }

  updateCargo(newCargo) {
    if (!this.state) return;

    this.state.ship.cargo = newCargo;
    this.emit('cargoChanged', newCargo);
  }

  updateLocation(newSystemId) {
    if (!this.state) return;

    this.state.player.currentSystem = newSystemId;

    // Track exploration progress for future features (price discovery, missions)
    if (!this.state.world.visitedSystems.includes(newSystemId)) {
      this.state.world.visitedSystems.push(newSystemId);
    }

    this.emit('locationChanged', newSystemId);
  }

  updateTime(newDays) {
    if (!this.state) return;

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
   * Update price knowledge for a system
   *
   * @param {number} systemId - System ID
   * @param {Object} prices - Price object with all commodity prices
   * @param {number} lastVisit - Days since last visit (0 = current)
   */
  updatePriceKnowledge(systemId, prices, lastVisit = 0) {
    if (!this.state) return;

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
    if (!this.state) return;

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

    const newCargo = this.addCargoStack(
      this.state.ship.cargo,
      goodType,
      quantity,
      price
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
   * Add a cargo stack for a purchase
   *
   * Delegates to TradingSystem for consolidation logic
   */
  addCargoStack(cargo, goodType, quantity, price) {
    return TradingSystem.addCargoStack(cargo, goodType, quantity, price);
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
    // Use small epsilon for floating point comparison
    if (currentFuel + amount > 100.01) {
      return {
        valid: false,
        reason: 'Cannot refuel beyond 100% capacity',
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
      this._logIfNotTest('Save debounced (too soon since last save)');
      return false;
    }

    try {
      this.state.meta.timestamp = now;
      const saveData = JSON.stringify(this.state);
      localStorage.setItem(SAVE_KEY, saveData);

      this.lastSaveTime = now;
      this._logIfNotTest('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  loadGame() {
    try {
      // Retrieve save data from localStorage
      const saveData = localStorage.getItem(SAVE_KEY);

      if (!saveData) {
        this._logIfNotTest('No saved game found');
        return null;
      }

      const loadedState = JSON.parse(saveData);

      if (!this.isVersionCompatible(loadedState.meta?.version)) {
        this._logIfNotTest('Save version incompatible, starting new game');
        return null;
      }

      if (!this.validateStateStructure(loadedState)) {
        this._logIfNotTest('Save data corrupted, starting new game');
        return null;
      }

      this.state = loadedState;

      // Initialize priceKnowledge if missing (backward compatibility)
      if (!this.state.world.priceKnowledge) {
        this.state.world.priceKnowledge = {};

        // Record current system's prices
        const currentSystemId = this.state.player.currentSystem;
        const currentSystem = this.starData.find(
          (s) => s.id === currentSystemId
        );

        if (currentSystem) {
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
          this.state.world.priceKnowledge[currentSystemId] = {
            lastVisit: 0,
            prices: currentPrices,
          };
        }
      }

      // Initialize activeEvents if missing (backward compatibility)
      if (!this.state.world.activeEvents) {
        this.state.world.activeEvents = [];
      }

      this._logIfNotTest('Game loaded successfully');

      // Emit all state events to update UI
      this.emit('creditsChanged', this.state.player.credits);
      this.emit('debtChanged', this.state.player.debt);
      this.emit('fuelChanged', this.state.ship.fuel);
      this.emit('cargoChanged', this.state.ship.cargo);
      this.emit('locationChanged', this.state.player.currentSystem);
      this.emit('timeChanged', this.state.player.daysElapsed);
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
      this.emit('activeEventsChanged', this.state.world.activeEvents);

      return this.state;
    } catch (error) {
      this._logIfNotTest('Failed to load game:', error);
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
      this._logIfNotTest('Save data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear save:', error);
      return false;
    }
  }

  /**
   * Check if save version is compatible with current version
   */
  isVersionCompatible(saveVersion) {
    if (!saveVersion) return false;

    // For now, only exact version match is compatible
    // Future versions may implement migration logic
    return saveVersion === GAME_VERSION;
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

    // Check cargo stacks
    for (const stack of state.ship.cargo) {
      if (
        !stack.good ||
        typeof stack.qty !== 'number' ||
        typeof stack.purchasePrice !== 'number'
      ) {
        return false;
      }
    }

    // Check world structure
    if (!state.world || !Array.isArray(state.world.visitedSystems)) {
      return false;
    }

    // Check priceKnowledge structure (optional for backward compatibility)
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

    // Check activeEvents structure (optional for backward compatibility)
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
