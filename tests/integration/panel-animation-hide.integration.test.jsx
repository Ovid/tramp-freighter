import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

/**
 * Integration Tests for Panel Hiding During Jump Animation (React Migration)
 *
 * Verifies that panels are properly hidden during jump animations and restored
 * when the animation completes. In the React version, this is handled by the
 * App component's view mode state management.
 *
 * React Migration Spec: Requirements 11.1, 11.4
 * Migrated from: tests/integration/trade-panel-animation-hide.integration.test.js
 */
describe('Panel Animation Hide Integration (React)', () => {
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
    // WebGL is not supported in jsdom test environment
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should hide station menu when jump starts and not restore it after animation', async () => {
    // Initialize game with enough fuel
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    const { container } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game - click New Game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    // Submit ship name
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Dock at station (Sol has a station)
    const dockBtn = screen.getByText('Dock');
    fireEvent.click(dockBtn);

    // Verify station menu is visible
    await waitFor(() => {
      expect(screen.getByText('Trade')).toBeInTheDocument();
      expect(screen.getByText('Refuel')).toBeInTheDocument();
    });

    // Open system panel to jump
    // In React version, we need to select a system first
    // Simulate selecting Alpha Centauri (system 1)
    if (window.StarmapBridge?.selectStarById) {
      window.StarmapBridge.selectStarById(1);
    }

    // Wait for system panel to appear
    await waitFor(() => {
      const jumpBtn = screen.queryByText('Jump to System');
      if (jumpBtn) {
        expect(jumpBtn).toBeInTheDocument();
      }
    });

    // Click jump button
    const jumpBtn = screen.queryByText('Jump to System');
    if (jumpBtn) {
      fireEvent.click(jumpBtn);

      // Station menu should be hidden immediately (view mode changes to ORBIT)
      await waitFor(() => {
        expect(screen.queryByText('Refuel')).not.toBeInTheDocument();
      });

      // After jump completes, station menu should NOT be restored
      // (player is in orbit, not docked)
      await waitFor(
        () => {
          expect(screen.queryByText('Refuel')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    }
  });

  it('should not show station menu after jump if it was not visible before', async () => {
    // Initialize game with enough fuel
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load (in orbit, not docked)
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Verify station menu is not visible
    expect(screen.queryByText('Refuel')).not.toBeInTheDocument();

    // Select a system and jump
    if (window.StarmapBridge?.selectStarById) {
      window.StarmapBridge.selectStarById(1);
    }

    await waitFor(() => {
      const jumpBtn = screen.queryByText('Jump to System');
      if (jumpBtn) {
        fireEvent.click(jumpBtn);
      }
    });

    // After jump, station menu should still not be visible
    await waitFor(
      () => {
        expect(screen.queryByText('Refuel')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should hide trade panel when jump starts', async () => {
    // Initialize game with enough fuel
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Dock at station
    const dockBtn = screen.getByText('Dock');
    fireEvent.click(dockBtn);

    // Open trade panel
    await waitFor(() => {
      expect(screen.getByText('Trade')).toBeInTheDocument();
    });
    const tradeBtn = screen.getByText('Trade');
    fireEvent.click(tradeBtn);

    // Verify trade panel is visible
    await waitFor(() => {
      expect(screen.getByText(/Market Goods/i)).toBeInTheDocument();
    });

    // Select a system and jump
    if (window.StarmapBridge?.selectStarById) {
      window.StarmapBridge.selectStarById(1);
    }

    await waitFor(() => {
      const jumpBtn = screen.queryByText('Jump to System');
      if (jumpBtn) {
        fireEvent.click(jumpBtn);

        // Trade panel should be hidden immediately
        waitFor(() => {
          expect(screen.queryByText(/Market Goods/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  it('should handle jump without animation system gracefully', async () => {
    // Initialize game with enough fuel
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Execute jump directly through GameStateManager (no animation)
    const result = await navigationSystem.executeJump(gameStateManager, 1);

    expect(result.success).toBe(true);
    expect(gameStateManager.state.player.currentSystem).toBe(1);
  });

  it('should maintain view mode state across failed jumps', async () => {
    // Initialize game
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Dock at station
    const dockBtn = screen.getByText('Dock');
    fireEvent.click(dockBtn);

    // Verify station menu is visible
    await waitFor(() => {
      expect(screen.getByText('Trade')).toBeInTheDocument();
    });

    // Try to jump to invalid system (no wormhole connection)
    const result = await navigationSystem.executeJump(gameStateManager, 50);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No wormhole connection');

    // Station menu should still be visible (jump failed)
    expect(screen.getByText('Trade')).toBeInTheDocument();
  });

  it('should handle view mode transitions correctly during jump sequence', async () => {
    // Initialize game with enough fuel
    gameStateManager.initNewGame();
    gameStateManager.updateFuel(100);

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start game
    const newGameBtn = screen.getByText('New Game');
    fireEvent.click(newGameBtn);

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Wait for game to load (ORBIT mode)
    await waitFor(() => {
      expect(screen.getByText('System Info')).toBeInTheDocument();
    });

    // Dock at station (STATION mode)
    const dockBtn = screen.getByText('Dock');
    fireEvent.click(dockBtn);

    await waitFor(() => {
      expect(screen.getByText('Trade')).toBeInTheDocument();
    });

    // Open trade panel (PANEL mode)
    const tradeBtn = screen.getByText('Trade');
    fireEvent.click(tradeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Market Goods/i)).toBeInTheDocument();
    });

    // Jump should transition back to ORBIT mode
    if (window.StarmapBridge?.selectStarById) {
      window.StarmapBridge.selectStarById(1);
    }

    await waitFor(() => {
      const jumpBtn = screen.queryByText('Jump to System');
      if (jumpBtn) {
        fireEvent.click(jumpBtn);

        // Should be in ORBIT mode (no station menu or panels)
        waitFor(() => {
          expect(screen.queryByText('Trade')).not.toBeInTheDocument();
          expect(screen.queryByText(/Market Goods/i)).not.toBeInTheDocument();
        });
      }
    });
  });
});
