import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JumpDialog } from '../../src/features/navigation/JumpDialog';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Property: Jump Dialog', () => {
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

  it('should display target system name and jump information', () => {
    // Sol (0) to Alpha Centauri A (1) - connected systems
    const targetSystemId = 1;

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Should display system name
    expect(screen.getByText(/Alpha Centauri A/i)).toBeInTheDocument();

    // Should display distance, fuel cost, and jump time
    expect(screen.getByText(/Distance:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuel Cost:/i)).toBeInTheDocument();
    expect(screen.getByText(/Jump Time:/i)).toBeInTheDocument();

    // Should have jump button
    expect(screen.getByText(/Jump to System/i)).toBeInTheDocument();
  });

  it('should disable jump button when fuel is insufficient', () => {
    // Set fuel to 0
    gameStateManager.updateFuel(0);

    const targetSystemId = 1;

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
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
    // Find a system not connected to Sol
    const unconnectedSystem = STAR_DATA.find((system) => {
      const isConnected = navigationSystem.areSystemsConnected(0, system.id);
      return !isConnected && system.id !== 0;
    });

    if (!unconnectedSystem) {
      // Skip test if all systems are connected to Sol
      return;
    }

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={unconnectedSystem.id}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const jumpButton = screen.getByText(/Jump to System/i);
    expect(jumpButton).toBeDisabled();

    // Should show error message
    expect(screen.getByText(/No wormhole connection/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const targetSystemId = 1;

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={onClose}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should have enabled jump button for valid jumps', () => {
    const targetSystemId = 1; // Alpha Centauri A - connected to Sol

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    const jumpButton = screen.getByText(/Jump to System/i);

    // Button should be enabled for valid jump
    expect(jumpButton).not.toBeDisabled();

    // Should not show error message
    expect(screen.queryByText(/Insufficient fuel/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No wormhole connection/i)
    ).not.toBeInTheDocument();
  });

  it('should update displayed information when fuel changes', () => {
    const targetSystemId = 1;

    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Initially should be enabled (sufficient fuel)
    let jumpButton = screen.getByText(/Jump to System/i);
    expect(jumpButton).not.toBeDisabled();

    // Reduce fuel to insufficient level
    gameStateManager.updateFuel(0);

    // Re-render to reflect state change
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Should now be disabled
    jumpButton = screen.getByText(/Jump to System/i);
    expect(jumpButton).toBeDisabled();
    expect(screen.getByText(/Insufficient fuel/i)).toBeInTheDocument();
  });

  it('should calculate correct fuel cost and jump time', () => {
    const targetSystemId = 1; // Alpha Centauri A

    render(
      <GameProvider gameStateManager={gameStateManager}>
        <JumpDialog
          targetSystemId={targetSystemId}
          onClose={() => {}}
          onJumpComplete={() => {}}
        />
      </GameProvider>
    );

    // Get validation data
    const validation = navigationSystem.validateJump(0, targetSystemId, 100);

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
