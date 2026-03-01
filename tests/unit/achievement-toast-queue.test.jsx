import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AchievementToast } from '../../src/features/achievements/AchievementToast';
import { GameProvider } from '../../src/context/GameContext';
import {
  ACHIEVEMENTS_CONFIG,
  NOTIFICATION_CONFIG,
} from '../../src/game/constants';

/**
 * Tests for AchievementToast queue behavior.
 *
 * When multiple achievements unlock simultaneously, the toast component
 * must display each one sequentially. Between toasts, the DOM element
 * must unmount (return null) so CSS entrance animations replay.
 */
describe('AchievementToast queue', () => {
  let mockGSM;

  function createMockGameStateManager() {
    const subscribers = {};
    return {
      subscribe(eventType, callback) {
        if (!subscribers[eventType]) subscribers[eventType] = [];
        subscribers[eventType].push(callback);
      },
      unsubscribe(eventType, callback) {
        if (!subscribers[eventType]) return;
        const idx = subscribers[eventType].indexOf(callback);
        if (idx > -1) subscribers[eventType].splice(idx, 1);
      },
      emit(eventType, data) {
        (subscribers[eventType] || []).forEach((cb) => cb(data));
      },
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockGSM = createMockGameStateManager();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function renderToast() {
    return render(
      <GameProvider gameStateManager={mockGSM}>
        <AchievementToast />
      </GameProvider>
    );
  }

  function emitAchievement(name) {
    mockGSM.emit('achievementUnlocked', {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: `Unlocked ${name}`,
      category: 'test',
      tier: 1,
    });
  }

  it('should display first toast when one achievement unlocks', () => {
    renderToast();

    act(() => {
      emitAchievement('First Steps');
    });

    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
  });

  it('should unmount toast element between sequential displays', () => {
    renderToast();

    act(() => {
      emitAchievement('First Steps');
      emitAchievement('Survivor');
    });

    // Toast 1 visible
    expect(screen.getByText('First Steps')).toBeInTheDocument();

    // Advance past fade timer
    act(() => {
      vi.advanceTimersToNextTimer();
    });

    // Advance past remove timer — toast should unmount before next appears
    act(() => {
      vi.advanceTimersToNextTimer();
    });

    // The component must return null here (DOM element removed)
    // so the CSS slideIn animation replays when the next toast mounts
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });

  it('should display all queued toasts sequentially', () => {
    renderToast();

    act(() => {
      emitAchievement('First Steps');
      emitAchievement('Survivor');
      emitAchievement('Trader');
    });

    // Toast 1 visible
    expect(screen.getByText('First Steps')).toBeInTheDocument();

    // Advance past toast 1 fully (fade + remove + deferred showNext)
    act(() => {
      vi.advanceTimersByTime(
        ACHIEVEMENTS_CONFIG.TOAST_DURATION +
          NOTIFICATION_CONFIG.FADE_DURATION +
          1
      );
    });

    // Toast 2 should now be visible
    expect(screen.getByText('Survivor')).toBeInTheDocument();
    expect(screen.queryByText('First Steps')).not.toBeInTheDocument();

    // Advance past toast 2
    act(() => {
      vi.advanceTimersByTime(
        ACHIEVEMENTS_CONFIG.TOAST_DURATION +
          NOTIFICATION_CONFIG.FADE_DURATION +
          1
      );
    });

    // Toast 3 should now be visible
    expect(screen.getByText('Trader')).toBeInTheDocument();
    expect(screen.queryByText('Survivor')).not.toBeInTheDocument();

    // Advance past toast 3
    act(() => {
      vi.advanceTimersByTime(
        ACHIEVEMENTS_CONFIG.TOAST_DURATION +
          NOTIFICATION_CONFIG.FADE_DURATION +
          1
      );
    });

    // No toast should be visible
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });
});
