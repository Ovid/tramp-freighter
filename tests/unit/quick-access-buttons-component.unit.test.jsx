import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Unit tests for QuickAccessButtons React component
 *
 * Tests the React QuickAccessButtons component functionality including:
 * - Button initialization and rendering
 * - Button state based on current system
 * - Click handlers
 * - Animation lock integration
 */
describe('QuickAccessButtons Component', () => {
  let game;

  beforeEach(() => {
    cleanup();
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  it('should render Dock button before System Info button', () => {
    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0].textContent).toBe('Dock');
    expect(buttons[1].textContent).toBe('System Info');
  });

  it('should render System Info and Dock buttons', () => {
    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    expect(screen.getByText('System Info')).toBeInTheDocument();
    expect(screen.getByText('Dock')).toBeInTheDocument();
  });

  it('should enable System Info button when game is active', () => {
    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    const systemInfoBtn = screen.getByText('System Info');
    expect(systemInfoBtn.disabled).toBe(false);
  });

  it('should enable Dock button when at system with station', () => {
    // Sol has a station (st: 1)
    const sol = STAR_DATA.find((s) => s.name === 'Sol');
    game.updateLocation(sol.id);

    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    const dockBtn = screen.getByText('Dock');
    expect(dockBtn.disabled).toBe(false);
  });

  it('should disable Dock button when at system without station', () => {
    // Find a system without a station
    const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);

    if (systemWithoutStation) {
      game.updateLocation(systemWithoutStation.id);

      render(
        <GameProvider game={game}>
          <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
        </GameProvider>
      );

      const dockBtn = screen.getByText('Dock');
      expect(dockBtn.disabled).toBe(true);
    }
  });

  it('should call onSystemInfo when System Info button is clicked', () => {
    const onSystemInfo = vi.fn();

    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={onSystemInfo} />
      </GameProvider>
    );

    const systemInfoBtn = screen.getByText('System Info');
    fireEvent.click(systemInfoBtn);

    expect(onSystemInfo).toHaveBeenCalledTimes(1);
  });

  it('should call onDock when Dock button is clicked at system with station', () => {
    const onDock = vi.fn();
    const sol = STAR_DATA.find((s) => s.name === 'Sol');
    game.updateLocation(sol.id);

    render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={onDock} onSystemInfo={() => {}} />
      </GameProvider>
    );

    const dockBtn = screen.getByText('Dock');
    fireEvent.click(dockBtn);

    expect(onDock).toHaveBeenCalledTimes(1);
  });

  it('should not call onDock when Dock button is clicked at system without station', () => {
    const onDock = vi.fn();
    const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);

    if (systemWithoutStation) {
      game.updateLocation(systemWithoutStation.id);

      render(
        <GameProvider game={game}>
          <QuickAccessButtons onDock={onDock} onSystemInfo={() => {}} />
        </GameProvider>
      );

      const dockBtn = screen.getByText('Dock');
      fireEvent.click(dockBtn);

      // onDock should not be called because button is disabled
      expect(onDock).not.toHaveBeenCalled();
    }
  });

  it('should update button state when location changes', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    // Start at Sol (has station)
    const sol = STAR_DATA.find((s) => s.name === 'Sol');
    act(() => {
      game.updateLocation(sol.id);
    });

    // Force re-render to pick up location change
    rerender(
      <GameProvider game={game}>
        <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
      </GameProvider>
    );

    const dockBtn = screen.getByText('Dock');
    expect(dockBtn.disabled).toBe(false);

    // Move to system without station
    const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
    if (systemWithoutStation) {
      act(() => {
        game.updateLocation(systemWithoutStation.id);
      });

      rerender(
        <GameProvider game={game}>
          <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
        </GameProvider>
      );

      expect(dockBtn.disabled).toBe(true);
    }
  });

  it('should handle missing callbacks gracefully', () => {
    render(
      <GameProvider game={game}>
        <QuickAccessButtons />
      </GameProvider>
    );

    const systemInfoBtn = screen.getByText('System Info');
    const dockBtn = screen.getByText('Dock');

    // Should not throw when clicking without callbacks
    expect(() => {
      fireEvent.click(systemInfoBtn);
      fireEvent.click(dockBtn);
    }).not.toThrow();
  });
});
