import { BaseManager } from './base-manager.js';
import { GAME_VERSION, UI_CONFIG } from '../../constants.js';
import {
  saveGame as saveGameToStorage,
  loadGame as loadGameFromStorage,
  hasSavedGame as checkSavedGame,
  clearSave as clearSaveFromStorage,
} from '../save-load.js';
import {
  isVersionCompatible,
  validateStateStructure,
  migrateFromV1ToV2,
  migrateFromV2ToV2_1,
  migrateFromV2_1ToV4,
  migrateFromV4ToV4_1,
  migrateFromV4_1ToV5,
  addStateDefaults,
} from '../state-validators.js';

/**
 * SaveLoadManager - Handles game state persistence and loading
 *
 * Responsibilities:
 * - Save game state to localStorage with debouncing
 * - Load game state from localStorage with validation
 * - Handle save/load errors gracefully
 * - Support version migration
 * - Manage save debouncing to prevent performance issues
 */
export class SaveLoadManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);

    // Track last save time for debouncing
    this.lastSaveTime = 0;
  }

  /**
   * Save game state to localStorage with debouncing
   *
   * Implements save debouncing to prevent excessive saves (max 1 save per second).
   * This protects against rapid state changes causing performance issues.
   *
   * Handles save failures gracefully by logging errors and notifying the user.
   *
   * @returns {boolean} True if save succeeded or was debounced, false if failed
   */
  saveGame() {
    const result = saveGameToStorage(
      this.getState(),
      this.lastSaveTime,
      this.isTestEnvironment
    );

    if (result.success) {
      this.lastSaveTime = result.newLastSaveTime;
    } else {
      // Only show error notification if save actually failed (not just debounced)
      const now = Date.now();
      const timeSinceLastSave = now - this.lastSaveTime;

      if (timeSinceLastSave >= UI_CONFIG.SAVE_DEBOUNCE_MS) {
        // Not debounced, actual failure
        this.error('Save failed - game progress may be lost');
        // TODO: Show user notification about save failure
        // For now, just log the error - UI notification system would be added later
      }
    }

    return result.success;
  }

  /**
   * Load game state from localStorage
   *
   * Supports migration from v1.0.0 to v4.0.0 with comprehensive error handling
   * and recovery mechanisms for corrupted NPC data.
   *
   * @returns {Object|null} Loaded and validated game state, or null if load failed
   */
  loadGame() {
    try {
      // Load raw state from localStorage
      let loadedState = loadGameFromStorage(this.isTestEnvironment);

      if (!loadedState) {
        return null;
      }

      // Check version compatibility
      if (!isVersionCompatible(loadedState.meta?.version)) {
        this.log('Save version incompatible, starting new game');
        return null;
      }

      // Apply migrations in sequence
      loadedState = this.applyMigrations(loadedState);

      // Validate state structure
      if (!validateStateStructure(loadedState)) {
        this.log('Save data corrupted, starting new game');
        return null;
      }

      // Add defaults for missing fields
      loadedState = addStateDefaults(
        loadedState,
        this.getStarData(),
        this.isTestEnvironment
      );

      // Set the loaded state in GameStateManager
      this.gameStateManager.state = loadedState;

      // Emit all state events to update UI
      this.emitLoadedStateEvents(loadedState);

      return loadedState;
    } catch (error) {
      return this.handleLoadError(error);
    }
  }

  /**
   * Apply version migrations to loaded state
   *
   * @param {Object} loadedState - Raw loaded state
   * @returns {Object} Migrated state
   * @private
   */
  applyMigrations(loadedState) {
    let migratedState = loadedState;

    // Migrate from v1.0.0 if needed
    if (migratedState.meta.version === '1.0.0') {
      migratedState = migrateFromV1ToV2(
        migratedState,
        this.getStarData(),
        this.isTestEnvironment
      );
    }

    // Migrate from v2.0.0 if needed
    if (migratedState.meta.version === '2.0.0') {
      migratedState = migrateFromV2ToV2_1(
        migratedState,
        this.isTestEnvironment
      );
    }

    // Migrate from v2.1.0 if needed
    if (migratedState.meta.version === '2.1.0') {
      migratedState = migrateFromV2_1ToV4(
        migratedState,
        this.isTestEnvironment
      );
    }

    // Migrate from v4.0.0 if needed
    if (migratedState.meta.version === '4.0.0') {
      migratedState = migrateFromV4ToV4_1(
        migratedState,
        this.isTestEnvironment
      );
    }

    // Migrate from v4.1.0 to v5.0.0 if needed
    if (migratedState.meta.version === '4.1.0' && GAME_VERSION === '5.0.0') {
      migratedState = migrateFromV4_1ToV5(
        migratedState,
        this.isTestEnvironment
      );
    }

    return migratedState;
  }

  /**
   * Emit all state events after successful load to update UI
   *
   * @param {Object} loadedState - Successfully loaded and validated state
   * @private
   */
  emitLoadedStateEvents(loadedState) {
    this.emit('creditsChanged', loadedState.player.credits);
    this.emit('debtChanged', loadedState.player.debt);
    this.emit('fuelChanged', loadedState.ship.fuel);
    this.emit('cargoChanged', loadedState.ship.cargo);
    this.emit('hiddenCargoChanged', loadedState.ship.hiddenCargo);
    this.emit('locationChanged', loadedState.player.currentSystem);
    this.emit('timeChanged', loadedState.player.daysElapsed);
    this.emit('priceKnowledgeChanged', loadedState.world.priceKnowledge);
    this.emit('activeEventsChanged', loadedState.world.activeEvents);
    this.emit('shipConditionChanged', {
      hull: loadedState.ship.hull,
      engine: loadedState.ship.engine,
      lifeSupport: loadedState.ship.lifeSupport,
    });
    this.emit('upgradesChanged', loadedState.ship.upgrades);
    this.emit('cargoCapacityChanged', loadedState.ship.cargoCapacity);
    this.emit('quirksChanged', loadedState.ship.quirks);
    this.emit('karmaChanged', loadedState.player.karma || 0);
    this.emit('factionRepChanged', loadedState.player.factions || {});
    if (loadedState.missions) {
      this.emit('missionsChanged', loadedState.missions);
    }
  }

  /**
   * Handle load errors with recovery mechanisms
   *
   * @param {Error} error - The error that occurred during loading
   * @returns {Object|null} Recovered state or null if recovery failed
   * @private
   */
  handleLoadError(error) {
    this.log('Failed to load game:', error);

    // If NPC data is corrupted, try to recover by initializing empty NPC state
    if (error.message && error.message.includes('NPC')) {
      this.log('NPC data corrupted, continuing with fresh NPC relationships');
      return this.attemptNPCRecovery();
    }

    return null;
  }

  /**
   * Attempt to recover from NPC data corruption
   *
   * @returns {Object|null} Recovered state or null if recovery failed
   * @private
   */
  attemptNPCRecovery() {
    try {
      // Try to load again with NPC data reset
      let recoveredState = loadGameFromStorage(this.isTestEnvironment);
      if (recoveredState && recoveredState.npcs) {
        recoveredState.npcs = {};
        if (recoveredState.dialogue) {
          recoveredState.dialogue = {
            currentNpcId: null,
            currentNodeId: null,
            isActive: false,
            display: null,
          };
        }

        // Validate and set recovered state
        if (validateStateStructure(recoveredState)) {
          recoveredState = addStateDefaults(
            recoveredState,
            this.getStarData(),
            this.isTestEnvironment
          );
          this.gameStateManager.state = recoveredState;

          // Emit all state events
          this.emitLoadedStateEvents(recoveredState);

          return recoveredState;
        }
      }
    } catch {
      this.log('Recovery failed, starting new game');
    }

    return null;
  }

  /**
   * Check if saved game exists
   *
   * @returns {boolean} True if save data exists in localStorage
   */
  hasSavedGame() {
    return checkSavedGame();
  }

  /**
   * Clear saved game from localStorage
   *
   * @returns {boolean} True if clear succeeded
   */
  clearSave() {
    return clearSaveFromStorage(this.isTestEnvironment);
  }

  /**
   * Get last save time for debouncing
   *
   * @returns {number} Timestamp of last save
   */
  getLastSaveTime() {
    return this.lastSaveTime;
  }

  /**
   * Set last save time (for testing purposes)
   *
   * @param {number} timestamp - New last save time
   */
  setLastSaveTime(timestamp) {
    this.lastSaveTime = timestamp;
  }
}
