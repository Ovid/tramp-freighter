import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { QuickAccessButtons } from '../../src/features/hud/QuickAccessButtons';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * React Migration Spec, Property 49: Animation lock disables quick access
 * Validates: Requirement 46.3
 *
 * When animations are running, quick access buttons should be disabled
 * to prevent player actions during cinematic sequences.
 */
describe('Property 49: Animation lock disables quick access', () => {
  it('should disable quick access buttons when animation is running', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAnimationRunning) => {
        cleanup(); // Clean up between property test iterations

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Create mock animation system with specified lock state
        const mockAnimationSystem = {
          isAnimating: isAnimationRunning,
          inputLockManager: {
            isInputLocked: vi.fn(() => isAnimationRunning),
            lock: vi.fn(),
            unlock: vi.fn(),
          },
        };

        gameStateManager.setAnimationSystem(mockAnimationSystem);

        const wrapper = createWrapper(gameStateManager);
        const mockOnDock = vi.fn();

        // Render QuickAccessButtons
        render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

        // Find buttons
        const systemInfoBtn = screen.getByText('System Info');
        const dockBtn = screen.getByText('Dock');

        // Verify buttons are disabled when animation is running
        if (isAnimationRunning) {
          expect(systemInfoBtn).toBeDisabled();
          expect(dockBtn).toBeDisabled();

          // Clicking disabled buttons should not trigger callbacks
          fireEvent.click(systemInfoBtn);
          fireEvent.click(dockBtn);
          expect(mockOnDock).not.toHaveBeenCalled();
        } else {
          // When animation is not running, System Info should be enabled
          expect(systemInfoBtn).not.toBeDisabled();

          // Dock button state depends on whether current system has a station
          // (tested separately in quick-access-button-state test)
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should prevent dock callback when animation is running even if button is clicked', () => {
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
    const mockOnDock = vi.fn();

    render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

    const dockBtn = screen.getByText('Dock');

    // Button should be disabled
    expect(dockBtn).toBeDisabled();

    // Try to click (should not trigger callback)
    fireEvent.click(dockBtn);
    expect(mockOnDock).not.toHaveBeenCalled();
  });

  it('should allow dock callback when animation is not running', () => {
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
    const mockOnDock = vi.fn();

    render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

    const dockBtn = screen.getByText('Dock');

    // Button should be enabled (Sol has a station)
    expect(dockBtn).not.toBeDisabled();

    // Click should trigger callback
    fireEvent.click(dockBtn);
    expect(mockOnDock).toHaveBeenCalledTimes(1);
  });

  it('should handle missing animation system gracefully', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Don't set animation system (simulating before StarMapCanvas mounts)
    const wrapper = createWrapper(gameStateManager);
    const mockOnDock = vi.fn();

    render(<QuickAccessButtons onDock={mockOnDock} />, { wrapper });

    const systemInfoBtn = screen.getByText('System Info');
    const dockBtn = screen.getByText('Dock');

    // Buttons should be enabled when animation system is not available
    expect(systemInfoBtn).not.toBeDisabled();
    expect(dockBtn).not.toBeDisabled();

    // Clicking should work
    fireEvent.click(dockBtn);
    expect(mockOnDock).toHaveBeenCalledTimes(1);
  });

  it('should re-enable buttons when animation completes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Create mock animation system starting locked
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
    const mockOnDock = vi.fn();

    const { rerender } = render(<QuickAccessButtons onDock={mockOnDock} />, {
      wrapper,
    });

    const dockBtn = screen.getByText('Dock');

    // Initially disabled
    expect(dockBtn).toBeDisabled();

    // Simulate animation completing
    mockAnimationSystem.isAnimating = false;
    mockAnimationSystem.inputLockManager.isInputLocked.mockReturnValue(false);

    // Force re-render to pick up new animation state
    rerender(<QuickAccessButtons onDock={mockOnDock} />);

    // Button should now be enabled
    expect(dockBtn).not.toBeDisabled();

    // Clicking should work
    fireEvent.click(dockBtn);
    expect(mockOnDock).toHaveBeenCalledTimes(1);
  });
});
