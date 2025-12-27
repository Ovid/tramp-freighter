import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Integration: SystemPanel Starmap Context', () => {
  let gameStateManager;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager = new GameStateManager(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );
    gameStateManager.initNewGame();
  });

  it('should throw error when useStarmap is used outside StarmapProvider in production', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const currentSystemId = gameStateManager.getState().player.currentSystem;

    // Mock console.error to capture the error boundary error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={currentSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );
    }).toThrow('useStarmap must be used within a StarmapProvider');

    // Restore environment and console
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should work correctly when wrapped in StarmapProvider', () => {
    const currentSystemId = gameStateManager.getState().player.currentSystem;
    const connectedIds = navigationSystem.getConnectedSystems(currentSystemId);

    if (connectedIds.length === 0) {
      // Skip test if no connected systems
      return;
    }

    const mockSelectStarById = vi.fn();
    const mockDeselectStar = vi.fn();
    const mockStarmapMethods = {
      selectStarById: mockSelectStarById,
      deselectStar: mockDeselectStar,
    };

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <StarmapProvider value={mockStarmapMethods}>
          <SystemPanel
            viewingSystemId={currentSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </StarmapProvider>
      </GameProvider>
    );

    // Should render without errors
    const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);
    expect(screen.getByText(currentSystem.name)).toBeInTheDocument();

    // Should be able to click connected systems
    const firstConnectedSystem = STAR_DATA.find(
      (s) => s.id === connectedIds[0]
    );
    const systemButton = screen.getByText(firstConnectedSystem.name);

    fireEvent.click(systemButton);

    // Should call selectStarById from context
    expect(mockSelectStarById).toHaveBeenCalledWith(connectedIds[0]);
  });

  it('should use test environment fallback when NODE_ENV is test', () => {
    // Ensure we're in test environment
    expect(process.env.NODE_ENV).toBe('test');

    const currentSystemId = gameStateManager.getState().player.currentSystem;
    const connectedIds = navigationSystem.getConnectedSystems(currentSystemId);

    if (connectedIds.length === 0) {
      // Skip test if no connected systems
      return;
    }

    // Should render without StarmapProvider in test environment
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <SystemPanel
          viewingSystemId={currentSystemId}
          onClose={() => {}}
          onJumpStart={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Should render without errors due to test environment fallback
    const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);
    expect(screen.getByText(currentSystem.name)).toBeInTheDocument();

    // Should be able to click connected systems (using mock methods)
    const firstConnectedSystem = STAR_DATA.find(
      (s) => s.id === connectedIds[0]
    );
    const systemButton = screen.getByText(firstConnectedSystem.name);

    // Should not throw error when clicking (uses mock methods)
    expect(() => {
      fireEvent.click(systemButton);
    }).not.toThrow();
  });

  it('should handle missing starmap methods gracefully', () => {
    const currentSystemId = gameStateManager.getState().player.currentSystem;
    const connectedIds = navigationSystem.getConnectedSystems(currentSystemId);

    if (connectedIds.length === 0) {
      // Skip test if no connected systems
      return;
    }

    // Provide empty starmap methods
    const mockStarmapMethods = {
      selectStarById: undefined,
      deselectStar: undefined,
    };

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <StarmapProvider value={mockStarmapMethods}>
          <SystemPanel
            viewingSystemId={currentSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </StarmapProvider>
      </GameProvider>
    );

    // Should render without errors
    const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);
    expect(screen.getByText(currentSystem.name)).toBeInTheDocument();

    // Should handle missing methods gracefully
    const firstConnectedSystem = STAR_DATA.find(
      (s) => s.id === connectedIds[0]
    );
    const systemButton = screen.getByText(firstConnectedSystem.name);

    // Should not throw error when clicking with undefined methods
    expect(() => {
      fireEvent.click(systemButton);
    }).not.toThrow();
  });
});