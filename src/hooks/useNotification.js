import { useState, useCallback, useRef, useEffect } from 'react';
import { NOTIFICATION_CONFIG } from '../game/constants';

/**
 * Custom hook for managing notifications
 *
 * Provides methods to show error, success, and info notifications.
 * Manages a queue to display notifications sequentially without overlap.
 * Notifications automatically expire and fade out after their duration.
 *
 * @returns {Object} Notification methods and state
 */
export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);
  const nextIdRef = useRef(0);

  /**
   * Process the notification queue sequentially
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

    // Auto-dismiss after duration
    setTimeout(() => {
      // Mark as fading out
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, fadeOut: true } : n
        )
      );

      // Remove from DOM after animation completes
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );

        // Process next notification in queue
        processQueue();
      }, NOTIFICATION_CONFIG.FADE_DURATION);
    }, notification.duration);
  }, []);

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
   * Convenience method for displaying error notifications with default error duration.
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
   * Convenience method for displaying success notifications with default success duration.
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
   * Convenience method for displaying informational notifications with default error duration.
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
   * Clear all notifications immediately
   *
   * Removes all notifications from the queue and visible list.
   * Useful for cleanup or when switching game states.
   */
  const clearNotifications = useCallback(() => {
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
    clearNotifications,
  };
}
