'use strict';

import { NOTIFICATION_CONFIG } from '../game-constants.js';

/**
 * Initialize notification system
 *
 * Creates a notification system instance that manages a queue of notifications
 * and displays them sequentially to prevent overlap.
 *
 * @param {HTMLElement} notificationArea - Notification container element
 * @returns {Object} Notification system instance with queue and state
 */
export function createNotificationSystem(notificationArea) {
  return {
    notificationArea,
    notificationQueue: [],
    isShowingNotification: false,
  };
}

/**
 * Show a notification
 *
 * Adds a notification to the queue and processes it if no notification is currently showing.
 * Notifications are displayed sequentially with fade-in/fade-out animations.
 *
 * @param {Object} system - Notification system instance
 * @param {string} message - Notification message
 * @param {number} duration - Display duration in ms
 * @param {string} type - Notification type: 'error', 'success', 'info'
 */
export function showNotification(system, message, duration, type) {
  system.notificationQueue.push({ message, duration, type });

  if (!system.isShowingNotification) {
    processNotificationQueue(system);
  }
}

/**
 * Show an error notification
 *
 * Convenience method for displaying error notifications with default error duration.
 *
 * @param {Object} system - Notification system instance
 * @param {string} message - Error message
 * @param {number} duration - Display duration in ms (defaults to error duration)
 */
export function showError(
  system,
  message,
  duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION
) {
  showNotification(system, message, duration, 'error');
}

/**
 * Show a success notification
 *
 * Convenience method for displaying success notifications with default success duration.
 *
 * @param {Object} system - Notification system instance
 * @param {string} message - Success message
 * @param {number} duration - Display duration in ms (defaults to success duration)
 */
export function showSuccess(
  system,
  message,
  duration = NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION
) {
  showNotification(system, message, duration, 'success');
}

/**
 * Show an info notification
 *
 * Convenience method for displaying informational notifications with default error duration.
 * Uses error duration as default since info notifications are typically important.
 *
 * @param {Object} system - Notification system instance
 * @param {string} message - Info message
 * @param {number} duration - Display duration in ms (defaults to error duration)
 */
export function showInfo(
  system,
  message,
  duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION
) {
  showNotification(system, message, duration, 'info');
}

/**
 * Process the notification queue sequentially
 *
 * Displays notifications one at a time with fade-in/fade-out animations.
 * Ensures messages don't overlap by processing the queue recursively.
 *
 * @param {Object} system - Notification system instance
 */
function processNotificationQueue(system) {
  if (system.notificationQueue.length === 0) {
    system.isShowingNotification = false;
    return;
  }

  system.isShowingNotification = true;
  const { message, duration, type } = system.notificationQueue.shift();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add to notification area
  system.notificationArea.appendChild(notification);

  // Auto-dismiss after duration
  setTimeout(() => {
    // Add fade-out animation
    notification.classList.add('fade-out');

    // Remove from DOM after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      // Process next notification in queue
      processNotificationQueue(system);
    }, NOTIFICATION_CONFIG.FADE_DURATION);
  }, duration);
}

/**
 * Clear all notifications immediately
 *
 * Removes all notifications from the queue and DOM.
 * Useful for cleanup or when switching game states.
 *
 * @param {Object} system - Notification system instance
 */
export function clearNotifications(system) {
  system.notificationQueue = [];
  system.isShowingNotification = false;

  if (system.notificationArea) {
    system.notificationArea.replaceChildren();
  }
}
