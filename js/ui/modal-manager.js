'use strict';

/**
 * Modal Manager - Handles modal dialog display and interaction
 *
 * Manages event notification modals and confirmation dialogs.
 * Provides functions for showing/hiding modals and handling user interactions.
 */

/**
 * Show event notification modal when docking at a system with an active event
 *
 * Displays event details including name, description, and remaining duration.
 * Modal can be dismissed by clicking the dismiss button or pressing Escape.
 *
 * @param {Object} elements - Modal DOM elements
 * @param {HTMLElement} elements.eventModalOverlay - Modal overlay container
 * @param {HTMLElement} elements.eventModalTitle - Event title element
 * @param {HTMLElement} elements.eventModalDescription - Event description element
 * @param {HTMLElement} elements.eventModalDuration - Event duration element
 * @param {HTMLElement} elements.eventModalDismiss - Dismiss button element
 * @param {Object} event - The active event object
 * @param {string} event.type - Event type identifier
 * @param {number} event.endDay - Day when event expires
 * @param {Object} eventType - Event type definition
 * @param {string} eventType.name - Display name of event
 * @param {string} eventType.description - Event description text
 * @param {number} currentDay - Current game day for duration calculation
 */
export function showEventModal(elements, event, eventType, currentDay) {
  if (!event || !elements.eventModalOverlay) {
    return;
  }

  if (!eventType) {
    return;
  }

  // Calculate remaining duration
  const remainingDays = event.endDay - currentDay;

  // Set modal content
  elements.eventModalTitle.textContent = eventType.name;
  elements.eventModalDescription.textContent = eventType.description;
  elements.eventModalDuration.textContent = `Expected duration: ${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`;

  // Show modal
  elements.eventModalOverlay.classList.remove('hidden');

  // Focus dismiss button
  if (elements.eventModalDismiss) {
    elements.eventModalDismiss.focus();
  }
}

/**
 * Hide event notification modal
 *
 * Removes the modal from view by adding the 'hidden' class.
 *
 * @param {Object} elements - Modal DOM elements
 * @param {HTMLElement} elements.eventModalOverlay - Modal overlay container
 */
export function hideEventModal(elements) {
  if (elements.eventModalOverlay) {
    elements.eventModalOverlay.classList.add('hidden');
  }
}

/**
 * Show confirmation modal dialog
 *
 * Displays a modal with a message and OK/Cancel buttons.
 * Returns a promise that resolves to true if confirmed, false if cancelled.
 * Modal can be dismissed by clicking Cancel, OK, or pressing Escape.
 *
 * @param {string} message - Confirmation message to display
 * @returns {Promise<boolean>} Promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    if (!modalOverlay || !modalMessage || !modalCancel || !modalConfirm) {
      console.error('Modal elements not found');
      resolve(false);
      return;
    }

    // Set message
    modalMessage.textContent = message;

    // Show modal
    modalOverlay.classList.remove('hidden');

    // Focus cancel button (safer default)
    modalCancel.focus();

    // Handle cancel
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    // Handle confirm
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    // Cleanup function
    const cleanup = () => {
      modalOverlay.classList.add('hidden');
      modalCancel.removeEventListener('click', handleCancel);
      modalConfirm.removeEventListener('click', handleConfirm);
      document.removeEventListener('keydown', handleEscape);
    };

    // Add event listeners
    modalCancel.addEventListener('click', handleCancel);
    modalConfirm.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleEscape);
  });
}

/**
 * Setup event modal handlers
 *
 * Attaches event listeners for dismissing the event notification modal.
 * Handles both button clicks and Escape key presses.
 *
 * @param {Object} elements - Modal DOM elements
 * @param {HTMLElement} elements.eventModalDismiss - Dismiss button element
 * @param {HTMLElement} elements.eventModalOverlay - Modal overlay container
 * @param {Function} onDismiss - Callback function to execute when modal is dismissed
 */
export function setupEventModalHandlers(elements, onDismiss) {
  if (elements.eventModalDismiss) {
    elements.eventModalDismiss.addEventListener('click', () => {
      onDismiss();
    });
  }

  // Handle escape key to dismiss event notification
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'Escape' &&
      elements.eventModalOverlay &&
      !elements.eventModalOverlay.classList.contains('hidden')
    ) {
      onDismiss();
    }
  });
}
