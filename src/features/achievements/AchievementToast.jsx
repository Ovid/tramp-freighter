import { useState, useEffect, useRef } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  ACHIEVEMENTS_CONFIG,
  EVENT_NAMES,
  NOTIFICATION_CONFIG,
} from '../../game/constants';

/**
 * Toast notification that appears when an achievement is unlocked.
 *
 * Listens for ACHIEVEMENT_UNLOCKED events via the Bridge Pattern.
 * Shows the achievement name briefly, then fades out.
 *
 * The ACHIEVEMENT_UNLOCKED event is fire-and-forget (not in extractStateForEvent),
 * so unlockData starts as null and only populates when the event fires.
 */
export function AchievementToast() {
  const [toast, setToast] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const unlockData = useGameEvent(EVENT_NAMES.ACHIEVEMENT_UNLOCKED);
  const prevUnlockRef = useRef(null);

  useEffect(() => {
    if (!unlockData || unlockData === prevUnlockRef.current) return;
    prevUnlockRef.current = unlockData;

    setFadeOut(false);
    setToast(unlockData);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, ACHIEVEMENTS_CONFIG.TOAST_DURATION);

    const removeTimer = setTimeout(() => {
      setToast(null);
      setFadeOut(false);
    }, ACHIEVEMENTS_CONFIG.TOAST_DURATION + NOTIFICATION_CONFIG.FADE_DURATION);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [unlockData]);

  if (!toast) return null;

  return (
    <div className={`achievement-toast ${fadeOut ? 'fade-out' : ''}`}>
      <div className="achievement-toast-title">Achievement Unlocked!</div>
      <div className="achievement-toast-name">{toast.name}</div>
    </div>
  );
}
