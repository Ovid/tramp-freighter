import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Property: System Panel', () => {
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

  describe('Current System View', () => {
    it('should display current system information with connected systems', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;

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

      // Should display system name
      const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);
      expect(screen.getByText(currentSystem.name)).toBeInTheDocument();

      // Should display system properties
      expect(screen.getByText(/Coordinates:/i)).toBeInTheDocument();
      expect(screen.getByText(/Spectral Class:/i)).toBeInTheDocument();
      expect(screen.getByText(/Wormholes:/i)).toBeInTheDocument();
      expect(screen.getByText(/Status:/i)).toBeInTheDocument();

      // Should NOT display jump information
      expect(screen.queryByText(/Distance:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Fuel Cost:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Jump Time:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Jump to System/i)).not.toBeInTheDocument();
    });

    it('should display connected systems list', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;

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

      // Get connected systems
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length > 0) {
        // Should display at least one connected system
        const firstConnectedSystem = STAR_DATA.find(
          (s) => s.id === connectedIds[0]
        );
        expect(screen.getByText(firstConnectedSystem.name)).toBeInTheDocument();
      } else {
        // Should show "no connections" message
        expect(
          screen.getByText(/No wormhole connections/i)
        ).toBeInTheDocument();
      }
    });

    it('should display dock button when system has station', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);

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

      if (currentSystem.st > 0) {
        expect(screen.getByText(/Dock at Station/i)).toBeInTheDocument();
      } else {
        expect(screen.queryByText(/Dock at Station/i)).not.toBeInTheDocument();
      }
    });

    it('should call window.selectStarById when connected system is clicked', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length === 0) {
        // Skip test if no connected systems
        return;
      }

      window.selectStarById = vi.fn();

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

      const firstConnectedSystem = STAR_DATA.find(
        (s) => s.id === connectedIds[0]
      );
      const systemButton = screen.getByText(firstConnectedSystem.name);

      fireEvent.click(systemButton);

      expect(window.selectStarById).toHaveBeenCalledWith(connectedIds[0]);
    });

    it('should not display economic event info when Advanced Sensors not installed', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;

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

      // Should not display event info section when Advanced Sensors not installed
      expect(screen.queryByText(/📊/)).not.toBeInTheDocument();
    });

    it('should round coordinates to 2 decimal places', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);

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

      // Check that coordinates are displayed with 2 decimal places
      const expectedCoords = `${(currentSystem.x / 10).toFixed(2)}, ${(currentSystem.y / 10).toFixed(2)}, ${(currentSystem.z / 10).toFixed(2)}`;
      expect(screen.getByText(expectedCoords)).toBeInTheDocument();
    });
  });

  describe('Different System View (Jump Info)', () => {
    it('should display jump information for different system', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length === 0) {
        // Skip test if no connected systems
        return;
      }

      const targetSystemId = connectedIds[0];

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={targetSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      // Should display target system name
      const targetSystem = STAR_DATA.find((s) => s.id === targetSystemId);
      expect(screen.getByText(targetSystem.name)).toBeInTheDocument();

      // Should display jump information
      expect(screen.getByText(/Distance:/i)).toBeInTheDocument();
      expect(screen.getByText(/Fuel Cost:/i)).toBeInTheDocument();
      expect(screen.getByText(/Jump Time:/i)).toBeInTheDocument();

      // Should display jump button
      expect(screen.getByText(/Jump to System/i)).toBeInTheDocument();

      // Should NOT display connected systems list
      expect(screen.queryByText(/Dock at Station/i)).not.toBeInTheDocument();
    });

    it('should disable jump button when fuel is insufficient', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length === 0) {
        return;
      }

      const targetSystemId = connectedIds[0];

      // Set fuel to 0
      gameStateManager.updateFuel(0);

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={targetSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      const jumpButton = screen.getByText(/Jump to System/i);
      expect(jumpButton).toBeDisabled();

      // Should show error message
      expect(screen.getByText(/Insufficient fuel/i)).toBeInTheDocument();
    });

    it('should disable jump button when no wormhole connection exists', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;

      // Find a system not connected to current system
      const unconnectedSystem = STAR_DATA.find((system) => {
        const isConnected = navigationSystem.areSystemsConnected(
          currentSystemId,
          system.id
        );
        return !isConnected && system.id !== currentSystemId;
      });

      if (!unconnectedSystem) {
        // Skip test if all systems are connected
        return;
      }

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={unconnectedSystem.id}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      const jumpButton = screen.getByText(/Jump to System/i);
      expect(jumpButton).toBeDisabled();

      // Should show error message
      expect(screen.getByText(/No wormhole connection/i)).toBeInTheDocument();
    });

    it('should call onClose and onJumpStart when jump button is clicked', async () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length === 0) {
        return;
      }

      const targetSystemId = connectedIds[0];
      const onClose = vi.fn();
      const onJumpStart = vi.fn();
      const onJumpComplete = vi.fn();

      // Mock animation system with all required methods
      const mockAnimationSystem = {
        playJumpAnimation: vi.fn().mockResolvedValue(undefined),
        animateJump: vi.fn().mockResolvedValue(undefined),
        isLocked: vi.fn().mockReturnValue(false),
        inputLockManager: {
          isLocked: vi.fn().mockReturnValue(false),
        },
      };
      gameStateManager.setAnimationSystem(mockAnimationSystem);

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={targetSystemId}
            onClose={onClose}
            onJumpStart={onJumpStart}
            onJumpComplete={onJumpComplete}
          />
        </GameProvider>
      );

      const jumpButton = screen.getByText(/Jump to System/i);
      fireEvent.click(jumpButton);

      // Should call onClose and onJumpStart immediately
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onJumpStart).toHaveBeenCalledTimes(1);

      // Wait for jump to complete
      await waitFor(() => {
        expect(onJumpComplete).toHaveBeenCalled();
      });
    });

    it('should calculate correct jump information', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const connectedIds =
        navigationSystem.getConnectedSystems(currentSystemId);

      if (connectedIds.length === 0) {
        return;
      }

      const targetSystemId = connectedIds[0];

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={targetSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      // Get validation data
      const validation = navigationSystem.validateJump(
        currentSystemId,
        targetSystemId,
        100
      );

      // Check that displayed values match calculated values
      expect(
        screen.getByText(new RegExp(`${validation.distance.toFixed(1)} LY`))
      ).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`${Math.round(validation.fuelCost)}%`))
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(
            `${validation.jumpTime} day${validation.jumpTime !== 1 ? 's' : ''}`
          )
        )
      ).toBeInTheDocument();
    });
  });

  describe('Panel Controls', () => {
    it('should call onClose when close button is clicked', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const onClose = vi.fn();

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={currentSystemId}
            onClose={onClose}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when dock button is clicked', () => {
      const currentSystemId = gameStateManager.getState().player.currentSystem;
      const currentSystem = STAR_DATA.find((s) => s.id === currentSystemId);

      if (currentSystem.st === 0) {
        // Skip test if current system has no station
        return;
      }

      const onClose = vi.fn();

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <SystemPanel
            viewingSystemId={currentSystemId}
            onClose={onClose}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </GameProvider>
      );

      const dockButton = screen.getByText(/Dock at Station/i);
      fireEvent.click(dockButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
