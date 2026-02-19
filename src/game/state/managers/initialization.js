import {
  COMMODITY_TYPES,
  SHIP_CONFIG,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  NEW_GAME_DEFAULTS,
  KARMA_CONFIG,
  FACTION_CONFIG,
} from '../../constants.js';
import { TradingSystem } from '../../game-trading.js';
import { validateAllDialogueTrees } from '../../data/dialogue-trees.js';

/**
 * InitializationManager - Handles game initialization and setup
 *
 * Responsibilities:
 * - Initialize new game state with default values
 * - Set up initial player, ship, and world state
 * - Calculate initial prices and market conditions
 * - Emit initial state events for UI synchronization
 */
export class InitializationManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;
    this.starData = gameStateManager.starData;
    this.isTestEnvironment = gameStateManager.isTestEnvironment;
  }

  /**
   * Create complete initial game state
   *
   * Creates complete initial game state including:
   * - Player state (credits, debt, location, time)
   * - Ship state (name, quirks, upgrades, condition, cargo)
   * - World state (visited systems, price knowledge, events)
   * - NPC and dialogue state
   * - Game metadata
   *
   * @returns {Object} Complete initial game state
   */
  createInitialState() {
    // Validate dialogue trees and constants during game initialization
    validateAllDialogueTrees();

    const playerState = this.initializePlayerState();
    const shipState = this.initializeShipState();
    const worldState = this.initializeWorldState();
    const npcState = this.initializeNPCState();
    const dialogueState = this.initializeDialogueState();
    const missionState = this.initializeMissionState();
    const metaState = this.initializeMetaState();

    return {
      player: playerState,
      ship: shipState,
      world: worldState,
      npcs: npcState,
      dialogue: dialogueState,
      missions: missionState,
      meta: metaState,
    };
  }

  /**
   * Initialize player state with default values
   *
   * @returns {Object} Player state object
   */
  initializePlayerState() {
    // Build factions object from config
    const factions = {};
    for (const faction of FACTION_CONFIG.FACTIONS) {
      factions[faction] = FACTION_CONFIG.INITIAL;
    }

    return {
      credits: NEW_GAME_DEFAULTS.STARTING_CREDITS,
      debt: NEW_GAME_DEFAULTS.STARTING_DEBT,
      currentSystem: SOL_SYSTEM_ID,
      daysElapsed: 0,
      karma: KARMA_CONFIG.INITIAL,
      factions,
    };
  }

  /**
   * Initialize ship state with default values and random quirks
   *
   * @returns {Object} Ship state object
   */
  initializeShipState() {
    // Assign random quirks to the ship
    const shipQuirks = this.gameStateManager.assignShipQuirks();

    // Get Sol's grain price for initial cargo using dynamic pricing
    const solSystem = this.starData.find((s) => s.id === SOL_SYSTEM_ID);
    const currentDay = 0; // Game starts at day 0
    const activeEvents = []; // No events at game start
    const marketConditions = {}; // No market conditions at game start
    const solGrainPrice = TradingSystem.calculatePrice(
      'grain',
      solSystem,
      currentDay,
      activeEvents,
      marketConditions
    );

    return {
      name: NEW_GAME_DEFAULTS.STARTING_SHIP_NAME,
      quirks: shipQuirks,
      upgrades: [],
      fuel: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      hull: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      engine: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      lifeSupport: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      cargoCapacity: NEW_GAME_DEFAULTS.STARTING_CARGO_CAPACITY,
      cargo: [
        {
          good: 'grain',
          qty: NEW_GAME_DEFAULTS.STARTING_GRAIN_QUANTITY,
          buyPrice: solGrainPrice,
          buySystem: SOL_SYSTEM_ID,
          buySystemName: 'Sol',
          buyDate: 0,
        },
      ],
      hiddenCargo: [],
      hiddenCargoCapacity: 0,
    };
  }

  /**
   * Initialize world state with Sol system data
   *
   * @returns {Object} World state object
   */
  initializeWorldState() {
    // Calculate all Sol prices for price knowledge initialization
    const solSystem = this.starData.find((s) => s.id === SOL_SYSTEM_ID);
    const currentDay = 0;
    const activeEvents = [];
    const marketConditions = {};

    const solPrices = {};
    for (const goodType of COMMODITY_TYPES) {
      solPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        solSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
    }

    return {
      visitedSystems: [SOL_SYSTEM_ID],
      priceKnowledge: {
        [SOL_SYSTEM_ID]: {
          lastVisit: 0,
          prices: solPrices,
          source: 'visited',
        },
      },
      activeEvents: [],
      marketConditions: {},
      currentSystemPrices: solPrices,
      dangerFlags: {
        piratesFought: 0,
        piratesNegotiated: 0,
        civiliansSaved: 0,
        civiliansLooted: 0,
        inspectionsPassed: 0,
        inspectionsBribed: 0,
        inspectionsFled: 0,
      },
    };
  }

  /**
   * Initialize NPC state (empty at game start)
   *
   * @returns {Object} Empty NPC state object
   */
  initializeNPCState() {
    return {};
  }

  /**
   * Initialize dialogue state (inactive at game start)
   *
   * @returns {Object} Dialogue state object
   */
  initializeDialogueState() {
    return {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
  }

  /**
   * Initialize mission state (empty at game start)
   *
   * @returns {Object} Mission state object
   */
  initializeMissionState() {
    return {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    };
  }

  /**
   * Initialize game metadata
   *
   * @returns {Object} Meta state object
   */
  initializeMetaState() {
    return {
      version: GAME_VERSION,
      timestamp: Date.now(),
    };
  }

  /**
   * Emit all initial state events for UI synchronization
   *
   * Called after state initialization to ensure all UI components
   * receive the initial state values through the event system.
   *
   * @param {Object} state - Complete game state object
   */
  emitInitialEvents(state) {
    const { player, ship } = state;

    this.gameStateManager.emit('creditsChanged', player.credits);
    this.gameStateManager.emit('debtChanged', player.debt);
    this.gameStateManager.emit('fuelChanged', ship.fuel);
    this.gameStateManager.emit('cargoChanged', ship.cargo);
    this.gameStateManager.emit('hiddenCargoChanged', ship.hiddenCargo);
    this.gameStateManager.emit('locationChanged', player.currentSystem);
    this.gameStateManager.emit('timeChanged', player.daysElapsed);
    this.gameStateManager.emit(
      'priceKnowledgeChanged',
      state.world.priceKnowledge
    );
    this.gameStateManager.emit('shipConditionChanged', {
      hull: ship.hull,
      engine: ship.engine,
      lifeSupport: ship.lifeSupport,
    });
    this.gameStateManager.emit('upgradesChanged', ship.upgrades);
    this.gameStateManager.emit('cargoCapacityChanged', ship.cargoCapacity);
    this.gameStateManager.emit('quirksChanged', ship.quirks);
    if (state.missions) {
      this.gameStateManager.emit('missionsChanged', state.missions);
    }
  }
}
