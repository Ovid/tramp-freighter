import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Integration tests for System Info accessibility when panels are open.
 *
 * Validates that System Info button remains functional regardless of:
 * - Animation state
 * - Panel state
 * - View mode
 *
 * This ensures players can always access system information.
 */
describe('System Info Accessible With Panels Open', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Mock animation system to avoid errors
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

  it('should allow System Info callback to be triggered when animation is running', () => {
    // Set animation to running
    const mockAnimationSystem = {
      isAnimating: true,
      inputLockManager: {
        isInputLocked: vi.fn(() => true),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };
    gameStateManager.setAnimationSystem(mockAnimationSystem);

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
    const dockBtn = screen.getByText('Dock');

    // System Info should NOT be disabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Dock should be disabled
    expect(dockBtn).toBeDisabled();

    // Clicking System Info should trigger callback
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

    // Clicking Dock should not trigger callback
    fireEvent.click(dockBtn);
    expect(mockOnDock).not.toHaveBeenCalled();
  });

  it('should allow System Info callback to be triggered multiple times', () => {
    const wrapper = createWrapper(gameStateManager);
    const mockOnSystemInfo = vi.fn();

    render(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />, {
      wrapper,
    });

    const systemInfoBtn = screen.getByText('System Info');

    // Click multiple times
    fireEvent.click(systemInfoBtn);
    fireEvent.click(systemInfoBtn);
    fireEvent.click(systemInfoBtn);

    // All clicks should trigger callback
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(3);
  });

  it('should allow System Info to be clicked when Dock is disabled due to no station', () => {
    // Jump to a system without a station
    const systemWithoutStation = STAR_DATA.find((s) => s.st === 0);
    if (!systemWithoutStation) {
      throw new Error('Test requires a system without a station');
    }

    gameStateManager.updateLocation(systemWithoutStation.id);

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
    const dockBtn = screen.getByText('Dock');

    // Dock should be disabled (no station)
    expect(dockBtn).toBeDisabled();

    // System Info should be enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Clicking System Info should work
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

    // Clicking Dock should not work
    fireEvent.click(dockBtn);
    expect(mockOnDock).not.toHaveBeenCalled();
  });

  it('should allow System Info to be clicked when Dock is disabled due to animation', () => {
    // Set animation to running
    const mockAnimationSystem = {
      isAnimating: true,
      inputLockManager: {
        isInputLocked: vi.fn(() => true),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };
    gameStateManager.setAnimationSystem(mockAnimationSystem);

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
    const dockBtn = screen.getByText('Dock');

    // Dock should be disabled (animation running)
    expect(dockBtn).toBeDisabled();

    // System Info should be enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Clicking System Info should work
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

    // Clicking Dock should not work
    fireEvent.click(dockBtn);
    expect(mockOnDock).not.toHaveBeenCalled();
  });

  it('should never disable System Info button regardless of game state', async () => {
    const wrapper = createWrapper(gameStateManager);
    const mockOnSystemInfo = vi.fn();

    const { rerender } = render(
      <QuickAccessButtons onSystemInfo={mockOnSystemInfo} />,
      { wrapper }
    );

    const systemInfoBtn = screen.getByText('System Info');

    // Initially enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Jump to different system
    await act(async () => {
      gameStateManager.updateLocation(1);
    });
    rerender(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />);
    expect(systemInfoBtn).not.toBeDisabled();

    // Start animation
    await act(async () => {
      const mockAnimationSystem = {
        isAnimating: true,
        inputLockManager: {
          isInputLocked: vi.fn(() => true),
          lock: vi.fn(),
          unlock: vi.fn(),
        },
      };
      gameStateManager.setAnimationSystem(mockAnimationSystem);
    });
    rerender(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />);
    expect(systemInfoBtn).not.toBeDisabled();

    // Stop animation
    await act(async () => {
      const mockAnimationSystem = gameStateManager.animationSystem;
      mockAnimationSystem.isAnimating = false;
      mockAnimationSystem.inputLockManager.isInputLocked.mockReturnValue(false);
    });
    rerender(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />);
    expect(systemInfoBtn).not.toBeDisabled();

    // System Info should always be clickable
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalled();
  });
});
