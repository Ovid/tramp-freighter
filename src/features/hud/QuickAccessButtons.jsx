import { useState, useEffect } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';
import { useAnimationLock } from '../../hooks/useAnimationLock';

/**
 * QuickAccessButtons component displays quick access buttons for common actions.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - locationChanged: Updates button state when player location changes
 *
 * Uses useAnimationLock to disable buttons during animations.
 * Polls animation state after location changes to re-enable buttons when animation completes.
 *
 * React Migration Spec: Requirements 46.1, 46.2, 46.3, 46.4, 46.5
 *
 * @param {Function} onDock - Callback to trigger docking at a station
 * @param {Function} onSystemInfo - Callback to open system info panel
 */
export function QuickAccessButtons({ onDock, onSystemInfo }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');
  const animationLock = useAnimationLock();
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);

  // Get current system data
  const starData = gameStateManager.starData;
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Determine if docking is available (system has a station)
  const canDock = currentSystem.st > 0;

  // Poll animation lock state after location changes
  // Location changes before animation completes, so we need to poll until animation finishes
  useEffect(() => {
    // Check animation state immediately
    const checkAnimationState = () => {
      try {
        const locked = animationLock.isLocked();
        setIsAnimationRunning(locked);
        return locked;
      } catch (error) {
        // Animation system not initialized yet - treat as not locked
        setIsAnimationRunning(false);
        return false;
      }
    };

    // Check immediately
    const isLocked = checkAnimationState();

    // If animation is running, poll until it completes
    if (isLocked) {
      const pollInterval = setInterval(() => {
        const stillLocked = checkAnimationState();
        if (!stillLocked) {
          clearInterval(pollInterval);
        }
      }, 100); // Poll every 100ms

      return () => clearInterval(pollInterval);
    }
  }, [currentSystemId, animationLock]);

  const handleSystemInfo = () => {
    // System Info should always be accessible, even during animations
    // This allows players to view system information at any time
    if (onSystemInfo) {
      onSystemInfo();
    }
  };

  const handleDock = () => {
    // Don't execute if animation is running
    if (isAnimationRunning) return;

    if (canDock && onDock) {
      onDock();
    }
  };

  return (
    <div className="hud-section hud-quick-access">
      <div className="hud-quick-access-label">Quick Access:</div>
      <div className="hud-quick-access-buttons">
        <button
          className="quick-access-btn"
          onClick={handleSystemInfo}
          disabled={false}
        >
          System Info
        </button>
        <button
          className="quick-access-btn"
          onClick={handleDock}
          disabled={!canDock || isAnimationRunning}
        >
          Dock
        </button>
      </div>
    </div>
  );
}
