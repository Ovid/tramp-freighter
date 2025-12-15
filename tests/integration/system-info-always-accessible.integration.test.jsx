import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Integration tests for System Info accessibility.
 *
 * Validates that System Info button is always accessible:
 * - During animations
 * - When panels are open
 * - In any view mode
 *
 * This ensures players can always view system information regardless of game state.
 */
describe('System Info Always Accessible', () => {
  it('should allow System Info to be clicked during animations', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system with lock enabled
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

    // System Info should NOT be disabled during animation
    expect(systemInfoBtn).not.toBeDisabled();

    // Dock should be disabled during animation
    expect(dockBtn).toBeDisabled();

    // Clicking System Info should trigger callback
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

    // Clicking Dock should not trigger callback
    fireEvent.click(dockBtn);
    expect(mockOnDock).not.toHaveBeenCalled();
  });

  it('should allow System Info to be clicked when no animation system exists', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Don't set animation system (simulating before StarMapCanvas mounts)
    const wrapper = createWrapper(gameStateManager);
    const mockOnSystemInfo = vi.fn();

    render(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />, {
      wrapper,
    });

    const systemInfoBtn = screen.getByText('System Info');

    // System Info should be enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Clicking should trigger callback
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);
  });

  it('should allow System Info to be clicked when animation is not running', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system with lock disabled
    const mockAnimationSystem = {
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };

    gameStateManager.setAnimationSystem(mockAnimationSystem);

    const wrapper = createWrapper(gameStateManager);
    const mockOnSystemInfo = vi.fn();

    render(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />, {
      wrapper,
    });

    const systemInfoBtn = screen.getByText('System Info');

    // System Info should be enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Clicking should trigger callback
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple System Info clicks during animation', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system with lock enabled
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

  it('should keep System Info enabled when transitioning from unlocked to locked', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system starting unlocked
    let isLocked = false;
    const mockAnimationSystem = {
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => isLocked),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };

    gameStateManager.setAnimationSystem(mockAnimationSystem);

    const wrapper = createWrapper(gameStateManager);
    const mockOnSystemInfo = vi.fn();

    const { rerender } = render(
      <QuickAccessButtons onSystemInfo={mockOnSystemInfo} />,
      { wrapper }
    );

    const systemInfoBtn = screen.getByText('System Info');

    // Initially enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Click should work
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(1);

    // Simulate animation starting
    isLocked = true;
    mockAnimationSystem.isAnimating = true;

    // Force re-render
    rerender(<QuickAccessButtons onSystemInfo={mockOnSystemInfo} />);

    // System Info should STILL be enabled
    expect(systemInfoBtn).not.toBeDisabled();

    // Click should still work
    fireEvent.click(systemInfoBtn);
    expect(mockOnSystemInfo).toHaveBeenCalledTimes(2);
  });

  it('should not prevent System Info callback when Dock is disabled', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

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
});
