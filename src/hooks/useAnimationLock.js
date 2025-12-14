import { useGameState } from '../context/GameContext';

/**
 * useAnimationLock hook provides access to animation lock state
 *
 * This hook provides a way to check if animations are currently running
 * and input is locked. It does NOT trigger re-renders when animation state
 * changes (per Requirement 43.4), but provides methods to check the current
 * state when needed (e.g., in event handlers or render logic).
 *
 * React Migration Spec: Requirements 43.2, 43.5
 *
 * @returns {Object} Animation lock state and methods
 * @returns {Function} returns.isLocked - Function that returns true if input is currently locked
 * @returns {Function} returns.isAnimating - Function that returns true if animation is currently playing
 */
export function useAnimationLock() {
  const gameStateManager = useGameState();

  // Access the animation system through the game state manager
  // The animation system is set during starmap initialization
  const animationSystem = gameStateManager.animationSystem;

  /**
   * Check if input is currently locked
   *
   * @returns {boolean} True if input is locked
   */
  const isLocked = () => {
    if (!animationSystem) {
      throw new Error(
        'Animation system not initialized - StarMapCanvas must be mounted before using useAnimationLock'
      );
    }
    if (!animationSystem.inputLockManager) {
      throw new Error('Invalid animation system: inputLockManager missing');
    }
    return animationSystem.inputLockManager.isInputLocked();
  };

  /**
   * Check if animation is currently playing
   *
   * @returns {boolean} True if animation is playing
   */
  const isAnimating = () => {
    if (!animationSystem) {
      throw new Error(
        'Animation system not initialized - StarMapCanvas must be mounted before using useAnimationLock'
      );
    }
    return animationSystem.isAnimating;
  };

  return {
    isLocked,
    isAnimating,
  };
}
