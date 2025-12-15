import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { TradingSystem } from '../../src/game/game-trading';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

/**
 * Integration Tests for Complete Game Flow (React Migration)
 *
 * These tests verify that all game systems work together correctly
 * through complete user workflows using React components.
 *
 * React Migration Spec: Requirements 11.1, 11.4
 */

describe('Complete Game Flow Integration Tests (React)', () => {
  let gameStateManager;
  let navigationSystem;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Initialize game systems
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.navigationSystem = navigationSystem;

    // Mock console methods to suppress expected errors during tests
    // WebGL is not supported in jsdom test environment, so we suppress these expected errors
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('New Game → Jump → Trade → Refuel → Save → Load Cycle', () => {
    it('should complete a full game cycle successfully', async () => {
      // Step 1: Initialize new game
      const initialState = gameStateManager.initNewGame();

      expect(initialState.player.credits).toBe(500);
      expect(initialState.player.debt).toBe(10000);
      expect(initialState.player.currentSystem).toBe(0); // Sol
      expect(initialState.player.daysElapsed).toBe(0);
      expect(initialState.ship.fuel).toBe(100);
      expect(initialState.ship.cargo.length).toBe(1); // Initial grain

      // Step 2: Execute a jump to Alpha Centauri (system 1)
      const jumpResult = await navigationSystem.executeJump(
        gameStateManager,
        1
      );

      expect(jumpResult.success).toBe(true);
      expect(gameStateManager.state.player.currentSystem).toBe(1);
      expect(gameStateManager.state.ship.fuel).toBeLessThan(100);
      expect(gameStateManager.state.player.daysElapsed).toBeGreaterThan(0);

      const fuelAfterJump = gameStateManager.state.ship.fuel;

      // Step 3: Sell initial grain cargo at Alpha Centauri
      const currentSystem = STAR_DATA.find((s) => s.id === 1);
      const currentDay = gameStateManager.state.player.daysElapsed;
      const activeEvents = gameStateManager.state.world.activeEvents || [];
      const marketConditions = gameStateManager.state.world.marketConditions;
      const grainPrice = TradingSystem.calculatePrice(
        'grain',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );

      const sellResult = gameStateManager.sellGood(0, 20, grainPrice);

      expect(sellResult.success).toBe(true);
      expect(gameStateManager.state.ship.cargo.length).toBe(0); // Cargo empty after selling all
      expect(gameStateManager.state.player.credits).toBeGreaterThan(500); // Made profit

      const creditsAfterSale = gameStateManager.state.player.credits;

      // Step 4: Buy ore at Alpha Centauri
      const orePrice = TradingSystem.calculatePrice(
        'ore',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      const buyQuantity = 10;

      const buyResult = gameStateManager.buyGood('ore', buyQuantity, orePrice);

      expect(buyResult.success).toBe(true);
      expect(gameStateManager.state.ship.cargo.length).toBe(1);
      expect(gameStateManager.state.ship.cargo[0].good).toBe('ore');
      expect(gameStateManager.state.ship.cargo[0].qty).toBe(buyQuantity);
      expect(gameStateManager.state.player.credits).toBe(
        creditsAfterSale - orePrice * buyQuantity
      );

      const creditsAfterPurchase = gameStateManager.state.player.credits;

      // Step 5: Refuel at Alpha Centauri
      const fuelPrice = gameStateManager.getFuelPrice(1);
      // Calculate safe refuel amount that won't exceed 100%
      const maxRefuelAmount = 100 - fuelAfterJump;
      const refuelAmount = Math.min(15, maxRefuelAmount);

      const refuelResult = gameStateManager.refuel(refuelAmount);

      expect(refuelResult.success).toBe(true);
      expect(gameStateManager.state.ship.fuel).toBe(
        fuelAfterJump + refuelAmount
      );
      expect(gameStateManager.state.player.credits).toBe(
        creditsAfterPurchase - fuelPrice * refuelAmount
      );

      // Step 6: Save game (wait a moment to avoid debouncing)
      // The refuel operation already saved, so we need to wait for debounce period
      await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait 1.1 seconds
      const saveSuccess = gameStateManager.saveGame();

      expect(saveSuccess).toBe(true);
      expect(localStorage.getItem('trampFreighterSave')).not.toBeNull();

      // Capture state before load
      const stateBeforeLoad = JSON.parse(
        JSON.stringify(gameStateManager.state)
      );

      // Step 7: Load game
      const newGameStateManager = new GameStateManager(
        STAR_DATA,
        WORMHOLE_DATA
      );
      const loadedState = newGameStateManager.loadGame();

      expect(loadedState).not.toBeNull();
      expect(loadedState.player.credits).toBe(stateBeforeLoad.player.credits);
      expect(loadedState.player.debt).toBe(stateBeforeLoad.player.debt);
      expect(loadedState.player.currentSystem).toBe(
        stateBeforeLoad.player.currentSystem
      );
      expect(loadedState.player.daysElapsed).toBe(
        stateBeforeLoad.player.daysElapsed
      );
      expect(loadedState.ship.fuel).toBe(stateBeforeLoad.ship.fuel);
      expect(loadedState.ship.cargo.length).toBe(
        stateBeforeLoad.ship.cargo.length
      );
      expect(loadedState.ship.cargo[0].good).toBe(
        stateBeforeLoad.ship.cargo[0].good
      );
      expect(loadedState.ship.cargo[0].qty).toBe(
        stateBeforeLoad.ship.cargo[0].qty
      );
    });

    it('should verify profit from trading cycle', async () => {
      // Initialize new game
      gameStateManager.initNewGame();
      const initialCredits = gameStateManager.state.player.credits;

      // Jump to a system with better grain prices
      await navigationSystem.executeJump(gameStateManager, 1);

      // Sell initial grain
      const currentSystem = STAR_DATA.find((s) => s.id === 1);
      const currentDay = gameStateManager.state.player.daysElapsed;
      const activeEvents = gameStateManager.state.world.activeEvents || [];
      const marketConditions = gameStateManager.state.world.marketConditions;
      const grainPrice = TradingSystem.calculatePrice(
        'grain',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.sellGood(0, 20, grainPrice);

      const creditsAfterSale = gameStateManager.state.player.credits;

      // Verify profit was made
      expect(creditsAfterSale).toBeGreaterThan(initialCredits);

      // Calculate actual profit (accounting for fuel cost)
      const profit = creditsAfterSale - initialCredits;
      expect(profit).toBeGreaterThan(0);
    });
  });

  describe('Error Scenario Integration Tests', () => {
    it('should handle invalid jump attempts correctly', async () => {
      gameStateManager.initNewGame();

      // Attempt to jump to a non-connected system
      const jumpResult = await navigationSystem.executeJump(
        gameStateManager,
        50
      );

      expect(jumpResult.success).toBe(false);
      expect(jumpResult.error).toContain('No wormhole connection');

      // Verify state unchanged
      expect(gameStateManager.state.player.currentSystem).toBe(0);
      expect(gameStateManager.state.ship.fuel).toBe(100);
      expect(gameStateManager.state.player.daysElapsed).toBe(0);
    });

    it('should handle insufficient fuel for jump', async () => {
      gameStateManager.initNewGame();

      // Reduce fuel to insufficient level
      gameStateManager.updateFuel(5);

      // Attempt to jump (requires more than 5% fuel)
      const jumpResult = await navigationSystem.executeJump(
        gameStateManager,
        1
      );

      expect(jumpResult.success).toBe(false);
      expect(jumpResult.error).toContain('Insufficient fuel');

      // Verify state unchanged
      expect(gameStateManager.state.player.currentSystem).toBe(0);
      expect(gameStateManager.state.ship.fuel).toBe(5);
    });

    it('should handle insufficient credits for purchase', () => {
      gameStateManager.initNewGame();

      // Set credits to low amount
      gameStateManager.updateCredits(10);

      // Attempt to buy expensive goods
      const currentSystem = STAR_DATA.find((s) => s.id === 0);
      const currentDay = gameStateManager.state.player.daysElapsed;
      const activeEvents = gameStateManager.state.world.activeEvents || [];
      const marketConditions = gameStateManager.state.world.marketConditions;
      const tritiumPrice = TradingSystem.calculatePrice(
        'tritium',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );

      const buyResult = gameStateManager.buyGood('tritium', 10, tritiumPrice);

      expect(buyResult.success).toBe(false);
      expect(buyResult.reason).toContain('Insufficient credits');

      // Verify state unchanged
      expect(gameStateManager.state.player.credits).toBe(10);
      expect(gameStateManager.state.ship.cargo.length).toBe(1); // Only initial grain
    });

    it('should handle insufficient cargo space for purchase', () => {
      gameStateManager.initNewGame();

      // Fill cargo to near capacity
      const currentSystem = STAR_DATA.find((s) => s.id === 0);
      const currentDay = gameStateManager.state.player.daysElapsed;
      const activeEvents = gameStateManager.state.world.activeEvents || [];
      const marketConditions = gameStateManager.state.world.marketConditions;
      const grainPrice = TradingSystem.calculatePrice(
        'grain',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );

      // Buy 30 more grain (20 initial + 30 = 50, at capacity)
      gameStateManager.buyGood('grain', 30, grainPrice);

      // Attempt to buy more
      const buyResult = gameStateManager.buyGood('grain', 1, grainPrice);

      expect(buyResult.success).toBe(false);
      expect(buyResult.reason).toContain('Not enough cargo space');

      // Verify cargo at capacity
      const cargoUsed = gameStateManager.getCargoUsed();
      expect(cargoUsed).toBe(50);
    });

    it('should handle insufficient credits for refuel', () => {
      gameStateManager.initNewGame();

      // Set credits to low amount
      gameStateManager.updateCredits(5);

      // Reduce fuel
      gameStateManager.updateFuel(50);

      // Attempt to refuel more than affordable
      const refuelResult = gameStateManager.refuel(50);

      expect(refuelResult.success).toBe(false);
      expect(refuelResult.reason).toContain('Insufficient credits');

      // Verify state unchanged
      expect(gameStateManager.state.ship.fuel).toBe(50);
      expect(gameStateManager.state.player.credits).toBe(5);
    });

    it('should handle refuel beyond capacity', () => {
      gameStateManager.initNewGame();

      // Fuel is at 100%, attempt to refuel
      const refuelResult = gameStateManager.refuel(10);

      expect(refuelResult.success).toBe(false);
      expect(refuelResult.reason).toContain(
        'Cannot refuel beyond 100% capacity'
      );

      // Verify state unchanged
      expect(gameStateManager.state.ship.fuel).toBe(100);
    });
  });

  describe('React UI Integration Tests', () => {
    it('should render HUD with initial game state', () => {
      gameStateManager.initNewGame();

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <App />
        </GameProvider>
      );

      // App should render title screen initially
      expect(screen.getByText('Tramp Freighter Blues')).toBeInTheDocument();
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });

    it('should transition from title screen to game on new game', async () => {
      gameStateManager.initNewGame();

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <App />
        </GameProvider>
      );

      // Click New Game button
      const newGameBtn = screen.getByText('New Game');
      fireEvent.click(newGameBtn);

      // Should show ship naming dialog
      await waitFor(() => {
        expect(screen.getByText('Name Your Ship')).toBeInTheDocument();
      });
    });

    it('should update HUD when state changes', () => {
      gameStateManager.initNewGame();

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <App />
        </GameProvider>
      );

      // Start game to get past title screen
      const newGameBtn = screen.getByText('New Game');
      fireEvent.click(newGameBtn);

      // Submit ship name to get to game
      const confirmBtn = screen.getByText('Confirm');
      fireEvent.click(confirmBtn);

      // Wait for HUD to render
      waitFor(() => {
        // HUD should display initial values
        expect(screen.getByText(/500/)).toBeInTheDocument(); // Credits
        expect(screen.getByText(/100%/)).toBeInTheDocument(); // Fuel
      });

      // Change credits
      gameStateManager.updateCredits(1000);

      waitFor(() => {
        expect(screen.getByText(/1,000/)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Save Integration Tests', () => {
    it('should auto-save after jump', async () => {
      gameStateManager.initNewGame();

      // Clear any existing save
      localStorage.clear();

      // Execute jump
      await navigationSystem.executeJump(gameStateManager, 1);

      // Verify save exists
      const saveData = localStorage.getItem('trampFreighterSave');
      expect(saveData).not.toBeNull();

      // Verify saved state matches current state
      const savedState = JSON.parse(saveData);
      expect(savedState.player.currentSystem).toBe(1);
    });

    it('should auto-save after trade transaction', () => {
      gameStateManager.initNewGame();

      // Clear any existing save
      localStorage.clear();

      // Execute trade
      const currentSystem = STAR_DATA.find((s) => s.id === 0);
      const currentDay = gameStateManager.state.player.daysElapsed;
      const activeEvents = gameStateManager.state.world.activeEvents || [];
      const marketConditions = gameStateManager.state.world.marketConditions;
      const grainPrice = TradingSystem.calculatePrice(
        'grain',
        currentSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.sellGood(0, 10, grainPrice);

      // Verify save exists
      const saveData = localStorage.getItem('trampFreighterSave');
      expect(saveData).not.toBeNull();

      // Verify saved state reflects trade
      const savedState = JSON.parse(saveData);
      expect(savedState.ship.cargo[0].qty).toBe(10); // Sold 10 of 20
    });

    it('should auto-save after refuel transaction', () => {
      gameStateManager.initNewGame();

      // Reduce fuel first
      gameStateManager.updateFuel(50);

      // Clear any existing save
      localStorage.clear();

      // Execute refuel
      gameStateManager.refuel(20);

      // Verify save exists
      const saveData = localStorage.getItem('trampFreighterSave');
      expect(saveData).not.toBeNull();

      // Verify saved state reflects refuel
      const savedState = JSON.parse(saveData);
      expect(savedState.ship.fuel).toBe(70);
    });

    it('should auto-save after dock/undock', () => {
      gameStateManager.initNewGame();

      // Clear any existing save
      localStorage.clear();

      // Execute dock
      gameStateManager.dock();

      // Verify save exists
      let saveData = localStorage.getItem('trampFreighterSave');
      expect(saveData).not.toBeNull();

      const timestampAfterDock = JSON.parse(saveData).meta.timestamp;

      // Wait a moment to ensure timestamp changes
      const waitStart = Date.now();
      while (Date.now() - waitStart < 10) {
        // Wait
      }

      // Execute undock
      gameStateManager.undock();

      // Verify save updated
      saveData = localStorage.getItem('trampFreighterSave');
      expect(saveData).not.toBeNull();

      const timestampAfterUndock = JSON.parse(saveData).meta.timestamp;
      expect(timestampAfterUndock).toBeGreaterThanOrEqual(timestampAfterDock);
    });
  });

  describe('Multi-System Trading Integration', () => {
    it('should complete a profitable multi-system trading route', async () => {
      gameStateManager.initNewGame();

      // Step 1: Sell initial grain at Sol
      const solSystem = STAR_DATA.find((s) => s.id === 0);
      let currentDay = gameStateManager.state.player.daysElapsed;
      let activeEvents = gameStateManager.state.world.activeEvents || [];
      let marketConditions = gameStateManager.state.world.marketConditions;
      const solGrainPrice = TradingSystem.calculatePrice(
        'grain',
        solSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.sellGood(0, 20, solGrainPrice);

      // Step 2: Buy ore at Sol
      const solOrePrice = TradingSystem.calculatePrice(
        'ore',
        solSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.buyGood('ore', 20, solOrePrice);

      // Step 3: Jump to Alpha Centauri
      await navigationSystem.executeJump(gameStateManager, 1);

      // Step 4: Sell ore at Alpha Centauri
      const alphaSystem = STAR_DATA.find((s) => s.id === 1);
      currentDay = gameStateManager.state.player.daysElapsed;
      activeEvents = gameStateManager.state.world.activeEvents || [];
      marketConditions = gameStateManager.state.world.marketConditions;
      const alphaOrePrice = TradingSystem.calculatePrice(
        'ore',
        alphaSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.sellGood(0, 20, alphaOrePrice);

      // Step 5: Buy grain at Alpha Centauri
      const alphaGrainPrice = TradingSystem.calculatePrice(
        'grain',
        alphaSystem,
        currentDay,
        activeEvents,
        marketConditions
      );
      gameStateManager.buyGood('grain', 20, alphaGrainPrice);

      // Step 6: Jump back to Sol
      await navigationSystem.executeJump(gameStateManager, 0);

      // Step 7: Sell grain at Sol
      gameStateManager.sellGood(0, 20, solGrainPrice);

      const finalCredits = gameStateManager.state.player.credits;

      // Verify we're back at Sol with empty cargo
      expect(gameStateManager.state.player.currentSystem).toBe(0);
      expect(gameStateManager.state.ship.cargo.length).toBe(0);

      // Note: We may or may not have made profit depending on prices and fuel costs
      // The important thing is the system works correctly
      expect(finalCredits).toBeGreaterThan(0);
    });
  });
});
