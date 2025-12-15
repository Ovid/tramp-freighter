import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

describe('Quick Access Buttons Integration', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Mock animation system
    const mockAnimationSystem = {
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };
    gameStateManager.setAnimationSystem(mockAnimationSystem);
  });

  describe('Complete User Workflow', () => {
    it('should allow reopening system info panel after closing it', () => {
      const wrapper = createWrapper(gameStateManager);
      const mockOnSystemInfo = vi.fn();

      render(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />, {
        wrapper,
      });

      const systemInfoBtn = screen.getByText('System Info');

      // User clicks System Info button multiple times
      fireEvent.click(systemInfoBtn);
      fireEvent.click(systemInfoBtn);

      // Should call callback each time
      expect(mockOnSystemInfo).toHaveBeenCalledTimes(2);
    });

    it('should allow reopening station interface after closing it', () => {
      // User is at Sol (has station)
      const sol = STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const wrapper = createWrapper(gameStateManager);
      const mockOnDock = vi.fn();

      render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

      const dockBtn = screen.getByText('Dock');

      // User clicks Dock button
      fireEvent.click(dockBtn);

      // Should call callback
      expect(mockOnDock).toHaveBeenCalledTimes(1);
    });

    it('should handle clicking System Info button multiple times', () => {
      const wrapper = createWrapper(gameStateManager);
      const mockOnSystemInfo = vi.fn();

      render(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />, {
        wrapper,
      });

      const systemInfoBtn = screen.getByText('System Info');

      fireEvent.click(systemInfoBtn);
      fireEvent.click(systemInfoBtn);
      fireEvent.click(systemInfoBtn);

      expect(mockOnSystemInfo).toHaveBeenCalledTimes(3);
    });

    it('should handle clicking Dock button multiple times', () => {
      const wrapper = createWrapper(gameStateManager);
      const mockOnDock = vi.fn();

      render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

      const dockBtn = screen.getByText('Dock');

      fireEvent.click(dockBtn);
      fireEvent.click(dockBtn);

      expect(mockOnDock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Button State Synchronization', () => {
    it('should keep buttons enabled across system changes', () => {
      // Start at Sol (has station)
      const sol = STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const wrapper = createWrapper(gameStateManager);

      const { rerender } = render(<QuickAccessButtons />, { wrapper });

      const systemInfoBtn = screen.getByText('System Info');
      const dockBtn = screen.getByText('Dock');

      expect(systemInfoBtn).not.toBeDisabled();
      expect(dockBtn).not.toBeDisabled();

      // Jump to a system without station
      const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
      if (systemWithoutStation) {
        act(() => {
          gameStateManager.updateLocation(systemWithoutStation.id);
        });
        rerender(<QuickAccessButtons />);

        expect(systemInfoBtn).not.toBeDisabled();
        expect(dockBtn).toBeDisabled(); // Disabled because no station
      }
    });

    it('should keep System Info button enabled across all systems', () => {
      const wrapper = createWrapper(gameStateManager);

      const { rerender } = render(<QuickAccessButtons />, { wrapper });

      const systemInfoBtn = screen.getByText('System Info');

      // Check at Sol
      const sol = STAR_DATA.find((s) => s.name === 'Sol');
      act(() => {
        gameStateManager.updateLocation(sol.id);
      });
      rerender(<QuickAccessButtons />);
      expect(systemInfoBtn).not.toBeDisabled();

      // Check at Alpha Centauri
      const alphaCentauri = STAR_DATA.find((s) => s.name === 'Alpha Centauri');
      if (alphaCentauri) {
        act(() => {
          gameStateManager.updateLocation(alphaCentauri.id);
        });
        rerender(<QuickAccessButtons />);
        expect(systemInfoBtn).not.toBeDisabled();
      }

      // Check at a system without station
      const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
      if (systemWithoutStation) {
        act(() => {
          gameStateManager.updateLocation(systemWithoutStation.id);
        });
        rerender(<QuickAccessButtons />);
        expect(systemInfoBtn).not.toBeDisabled();
      }
    });
  });

  describe('Panel Independence', () => {
    it('should trigger System Info callback independently', () => {
      const wrapper = createWrapper(gameStateManager);
      const mockOnSystemInfo = vi.fn();
      const mockOnDock = vi.fn();

      render(
        <QuickAccessButtons
          onSystemInfo={mockOnSystemInfo}
          onDock={mockOnDock}
        />,
        { wrapper }
      );

      const systemInfoBtn = screen.getByText('System Info');

      // Click System Info button
      fireEvent.click(systemInfoBtn);

      // System Info callback should be called
      expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

      // Dock callback should not be called
      expect(mockOnDock).not.toHaveBeenCalled();
    });

    it('should trigger Dock callback independently', () => {
      const wrapper = createWrapper(gameStateManager);
      const mockOnSystemInfo = vi.fn();
      const mockOnDock = vi.fn();

      render(
        <QuickAccessButtons
          onSystemInfo={mockOnSystemInfo}
          onDock={mockOnDock}
        />,
        { wrapper }
      );

      const dockBtn = screen.getByText('Dock');

      // Click Dock button
      fireEvent.click(dockBtn);

      // Dock callback should be called
      expect(mockOnDock).toHaveBeenCalledTimes(1);

      // System Info callback should not be called
      expect(mockOnSystemInfo).not.toHaveBeenCalled();
    });
  });

  describe('User Feedback', () => {
    it('should disable Dock button at system without station', () => {
      // Move to system without station
      const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
      if (!systemWithoutStation) {
        throw new Error('Test requires a system without a station');
      }

      gameStateManager.updateLocation(systemWithoutStation.id);

      const wrapper = createWrapper(gameStateManager);

      render(<QuickAccessButtons />, { wrapper });

      const dockBtn = screen.getByText('Dock');
      expect(dockBtn).toBeDisabled();
    });

    it('should enable Dock button at system with station', () => {
      const sol = STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const wrapper = createWrapper(gameStateManager);

      render(<QuickAccessButtons />, { wrapper });

      const dockBtn = screen.getByText('Dock');
      expect(dockBtn).not.toBeDisabled();
    });

    it('should never disable System Info button', () => {
      const wrapper = createWrapper(gameStateManager);

      render(<QuickAccessButtons />, { wrapper });

      const systemInfoBtn = screen.getByText('System Info');
      expect(systemInfoBtn).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      const wrapper = createWrapper(gameStateManager);

      render(<QuickAccessButtons />, { wrapper });

      const systemInfoBtn = screen.getByText('System Info');
      const dockBtn = screen.getByText('Dock');

      expect(systemInfoBtn).toBeInTheDocument();
      expect(dockBtn).toBeInTheDocument();
    });

    it('should enable buttons with proper enabled state', () => {
      const sol = STAR_DATA.find((s) => s.name === 'Sol');
      gameStateManager.updateLocation(sol.id);

      const wrapper = createWrapper(gameStateManager);

      render(<QuickAccessButtons />, { wrapper });

      const systemInfoBtn = screen.getByText('System Info');
      const dockBtn = screen.getByText('Dock');

      expect(systemInfoBtn).not.toBeDisabled();
      expect(dockBtn).not.toBeDisabled();
    });
  });
});
