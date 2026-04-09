import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import {
  ACHIEVEMENTS_CONFIG,
  EVENT_NAMES,
  NOTIFICATION_CONFIG,
} from '../../game/constants';

/**
 * Toast notification that appears when an achievement is unlocked.
 *
 * Subscribes directly to the event manager (not useGameEvent) to
 * capture every ACHIEVEMENT_UNLOCKED emission in a queue. React 18
 * batches setState calls, so useGameEvent would only retain the last
 * payload when multiple achievements unlock in a single synchronous
 * pass (e.g. save migration).
 */
export function AchievementToast() {
  const game = useGame();
  const [toast, setToast] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const queueRef = useRef([]);
  const showingRef = useRef(false);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      showingRef.current = false;
      return;
    }

    showingRef.current = true;
    const next = queueRef.current.shift();

    setFadeOut(false);
    setToast(next);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, ACHIEVEMENTS_CONFIG.TOAST_DURATION);

    const removeTimer = setTimeout(() => {
      setToast(null);
      setFadeOut(false);
      // Defer showNext to a separate task so React flushes the null render
      // before mounting the next toast. Without this, React 18 batches
      // setToast(null) + setToast(next) into one render, the DOM element
      // never unmounts, and CSS entrance animations don't replay.
      const deferredTimer = setTimeout(showNext, 0);
      queueRef.current._timers = [deferredTimer];
    }, ACHIEVEMENTS_CONFIG.TOAST_DURATION + NOTIFICATION_CONFIG.FADE_DURATION);

    // Store timer ids for cleanup
    queueRef.current._timers = [fadeTimer, removeTimer];
  }, []);

  useEffect(() => {
    const handler = (data) => {
      queueRef.current.push(data);
      if (!showingRef.current) {
        showNext();
      }
    };

    game.subscribe(EVENT_NAMES.ACHIEVEMENT_UNLOCKED, handler);
    const queue = queueRef.current;
    return () => {
      game.unsubscribe(EVENT_NAMES.ACHIEVEMENT_UNLOCKED, handler);
      const timers = queue._timers;
      if (timers) {
        timers.forEach(clearTimeout);
      }
    };
  }, [game, showNext]);

  if (!toast) return null;

  return (
    <div
      className={`achievement-toast ${fadeOut ? 'fade-out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="achievement-toast-title">Achievement Unlocked!</div>
      <div className="achievement-toast-name">{toast.name}</div>
    </div>
  );
}
