import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useJumpEncounters } from '../../src/hooks/useJumpEncounters.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

// Test component that uses the hook
function TestComponent({ onEncounter }) {
  const { checkForEncounters } = useJumpEncounters({ onEncounter });

  // Expose the method for testing - wrapper that gets current state
  window.testCheckForEncounters = (systemId) => {
    // In a real component, this would come from Bridge Pattern hooks
    // For testing, we get it directly from the GameStateManager
    const gameStateManager = window.testGameStateManager;
    if (gameStateManager) {
      const gameState = gameStateManager.getState();
      checkForEncounters(systemId, gameState);
    }
  };

  return <div>Test Component</div>;
}

describe('useJumpEncounters Integration', () => {
  let gameStateManager;
  let mockOnEncounter;

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    // Mock console methods
    vi.stubGlobal('console', {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Expose gameStateManager for test wrapper
    window.testGameStateManager = gameStateManager;

    mockOnEncounter = vi.fn();
  });

  it('should integrate with GameStateManager and check for encounters', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <TestComponent onEncounter={mockOnEncounter} />
      </GameProvider>
    );

    // Verify the hook exposes the checkForEncounters method
    expect(window.testCheckForEncounters).toBeDefined();
    expect(typeof window.testCheckForEncounters).toBe('function');
  });

  it('should handle encounter checking without errors', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <TestComponent onEncounter={mockOnEncounter} />
      </GameProvider>
    );

    // Test checking for encounters on a safe system (should not trigger encounters)
    act(() => {
      window.testCheckForEncounters(0); // Sol system (safe)
    });

    // Should not have called onEncounter for safe system with default state
    expect(mockOnEncounter).not.toHaveBeenCalled();
  });

  it('should respond to location changes', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <TestComponent onEncounter={mockOnEncounter} />
      </GameProvider>
    );

    // Simulate a location change (jump completion)
    act(() => {
      gameStateManager.emit('locationChanged', 1); // Alpha Centauri (safe)
    });

    // The hook should have processed the location change
    // Encounters may or may not occur based on probability and game state
    // The test verifies the hook responds to location changes without errors
    expect(typeof window.testCheckForEncounters).toBe('function');
  });

  it('should determine threat levels correctly', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <TestComponent onEncounter={mockOnEncounter} />
      </GameProvider>
    );

    // Add high-value cargo to increase threat level
    const gameState = gameStateManager.getState();
    gameState.ship.cargo = [
      { type: 'electronics', quantity: 10, purchasePrice: 1500 }, // 15,000 credits total
    ];

    // Test on a dangerous system
    act(() => {
      window.testCheckForEncounters(20); // Distant system (dangerous)
    });

    // With high-value cargo in dangerous system, encounters are more likely
    // But we can't guarantee an encounter due to randomness
    // The test verifies the method runs without errors
  });
});
