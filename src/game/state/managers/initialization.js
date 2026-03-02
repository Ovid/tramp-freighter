import {
  COMMODITY_TYPES,
  SHIP_CONFIG,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  NEW_GAME_DEFAULTS,
  KARMA_CONFIG,
  FACTION_CONFIG,
  COLE_DEBT_CONFIG,
  DEFAULT_PREFERENCES,
} from '../../constants.js';
import { TradingSystem } from '../../game-trading.js';
import { validateAllDialogueTrees } from '../../data/dialogue-trees.js';
import { SeededRandom } from '../../utils/seeded-random.js';

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
  createInitialState(gameSeed = Date.now().toString()) {
    // Validate dialogue trees and constants during game initialization
    validateAllDialogueTrees();

    const playerState = this.initializePlayerState();
    const shipState = this.initializeShipState(gameSeed);
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
      stats: {
        creditsEarned: 0,
        jumpsCompleted: 0,
        cargoHauled: 0,
        charitableActs: 0,
      },
      quests: {},
      achievements: {},
      preferences: { ...DEFAULT_PREFERENCES },
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
      finance: {
        heat: COLE_DEBT_CONFIG.STARTING_HEAT,
        lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
        interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
        lastInterestDay: 0,
        nextCheckpoint: COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
        totalBorrowed: 0,
        totalRepaid: 0,
        lastCheckpointRepaid: 0,
        borrowedThisPeriod: false,
      },
    };
  }

  /**
   * Initialize ship state with default values and random quirks
   *
   * @returns {Object} Ship state object
   */
  initializeShipState(gameSeed = Date.now().toString()) {
    // Assign quirks using a seeded RNG so the same seed always produces the same ship
    const rng = new SeededRandom(`quirks-${gameSeed}`);
    const shipQuirks = this.gameStateManager.assignShipQuirks(() => rng.next());

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
      narrativeEvents: {
        fired: [],
        cooldowns: {},
        flags: {},
        dockedSystems: [],
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
      completionHistory: [],
      pendingFailureNotices: [],
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
}
