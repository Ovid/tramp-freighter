import { useState, useCallback, useRef } from 'react';
import { NOTIFICATION_CONFIG } from '../game/constants';

/**
 * Custom hook for managing notifications
 *
 * Provides methods to show error, success, and info notifications.
 * Manages a queue to display notifications sequentially without overlap.
 * Notifications automatically expire and fade out after their duration.
 * Supports pause (hover/focus), resume, and manual dismiss.
 *
 * @returns {Object} Notification methods and state
 */
export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);
  const nextIdRef = useRef(0);
  // Tracks the active auto-dismiss timer: { timeoutId, startTime, remaining, notificationId }
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  /**
   * Fade out a notification and remove it, then process the next queued item.
   */
  const fadeOutAndRemove = useCallback((id, afterRemove) => {
    // Guard against double-fade (e.g. auto-dismiss fires, then user clicks dismiss)
    if (fadeTimerRef.current !== null) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, fadeOut: true } : n))
    );
    fadeTimerRef.current = setTimeout(() => {
      fadeTimerRef.current = null;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      afterRemove();
    }, NOTIFICATION_CONFIG.FADE_DURATION);
  }, []);

  /**
   * Process the notification queue sequentially.
   *
   * Displays notifications one at a time with fade-in/fade-out animations.
   * Ensures messages don't overlap by processing the queue recursively.
   */
  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }

    isShowingRef.current = true;
    const notification = queueRef.current.shift();

    // Add notification to visible list
    setNotifications((prev) => [...prev, notification]);

    // Schedule auto-dismiss with tracked timer
    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      timerRef.current = null;
      fadeOutAndRemove(notification.id, () => processQueue());
    }, notification.duration);

    timerRef.current = {
      timeoutId,
      startTime,
      remaining: notification.duration,
      notificationId: notification.id,
    };
  }, [fadeOutAndRemove]);

  /**
   * Show a notification
   *
   * Adds a notification to the queue and processes it if no notification is currently showing.
   *
   * @param {string} message - Notification message
   * @param {number} duration - Display duration in ms
   * @param {string} type - Notification type: 'error', 'success', 'info'
   */
  const showNotification = useCallback(
    (message, duration, type) => {
      const notification = {
        id: nextIdRef.current++,
        message,
        duration,
        type,
        fadeOut: false,
      };

      queueRef.current.push(notification);

      if (!isShowingRef.current) {
        processQueue();
      }
    },
    [processQueue]
  );

  /**
   * Show an error notification
   *
   * @param {string} message - Error message
   * @param {number} duration - Display duration in ms (defaults to error duration)
   */
  const showError = useCallback(
    (message, duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION) => {
      showNotification(message, duration, 'error');
    },
    [showNotification]
  );

  /**
   * Show a success notification
   *
   * @param {string} message - Success message
   * @param {number} duration - Display duration in ms (defaults to success duration)
   */
  const showSuccess = useCallback(
    (message, duration = NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION) => {
      showNotification(message, duration, 'success');
    },
    [showNotification]
  );

  /**
   * Show an info notification
   *
   * Uses error duration as default since info notifications are typically important.
   *
   * @param {string} message - Info message
   * @param {number} duration - Display duration in ms (defaults to error duration)
   */
  const showInfo = useCallback(
    (message, duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION) => {
      showNotification(message, duration, 'info');
    },
    [showNotification]
  );

  /**
   * Pause the auto-dismiss timer for a notification (e.g. on hover or focus).
   *
   * @param {number} id - Notification ID
   */
  const pauseNotification = useCallback((id) => {
    const timer = timerRef.current;
    if (timer && timer.notificationId === id && timer.timeoutId !== null) {
      clearTimeout(timer.timeoutId);
      const elapsed = Date.now() - timer.startTime;
      timer.remaining = Math.max(0, timer.remaining - elapsed);
      timer.timeoutId = null;
    }
  }, []);

  /**
   * Resume the auto-dismiss timer for a notification (e.g. on mouse leave or blur).
   *
   * @param {number} id - Notification ID
   */
  const resumeNotification = useCallback(
    (id) => {
      const timer = timerRef.current;
      if (timer && timer.notificationId === id && timer.timeoutId === null) {
        const remaining = timer.remaining;
        const startTime = Date.now();
        const timeoutId = setTimeout(() => {
          timerRef.current = null;
          fadeOutAndRemove(id, () => processQueue());
        }, remaining);

        timerRef.current = {
          timeoutId,
          startTime,
          remaining,
          notificationId: id,
        };
      }
    },
    [fadeOutAndRemove, processQueue]
  );

  /**
   * Immediately dismiss a notification (e.g. click the dismiss button).
   *
   * @param {number} id - Notification ID
   */
  const dismissNotification = useCallback(
    (id) => {
      const timer = timerRef.current;
      if (timer && timer.notificationId === id) {
        if (timer.timeoutId !== null) {
          clearTimeout(timer.timeoutId);
        }
        timerRef.current = null;
      }
      // If a fade is already in progress (auto-dismiss started it), cancel it
      // and remove immediately to avoid stalling the queue
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        processQueue();
        return;
      }
      fadeOutAndRemove(id, () => processQueue());
    },
    [fadeOutAndRemove, processQueue]
  );

  /**
   * Clear all notifications immediately
   *
   * Removes all notifications from the queue and visible list.
   * Useful for cleanup or when switching game states.
   */
  const clearNotifications = useCallback(() => {
    if (timerRef.current && timerRef.current.timeoutId !== null) {
      clearTimeout(timerRef.current.timeoutId);
    }
    timerRef.current = null;
    if (fadeTimerRef.current !== null) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    queueRef.current = [];
    isShowingRef.current = false;
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    showError,
    showSuccess,
    showInfo,
    pauseNotification,
    resumeNotification,
    dismissNotification,
    clearNotifications,
  };
}
