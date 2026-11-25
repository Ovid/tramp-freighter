/**
 * Modal dialog component using React Portals.
 *
 * Renders modal content in a portal to ensure proper z-index stacking
 * and blocks interaction with underlying UI elements.
 *
 * React Migration Spec: Requirements 33.2, 33.4, 33.5, 42.1, 42.2, 42.3, 42.4, 42.5
 */
import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Modal component that renders content in a portal.
 *
 * Uses React Portals to render modal content at the document root level,
 * ensuring proper z-index stacking and blocking underlying UI interaction.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.title - Modal title
 * @param {boolean} props.showCloseButton - Whether to show close button
 * @returns {JSX.Element|null} Modal component or null if not open
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useFocusTrap(dialogRef, isOpen);

  // Handle escape key to close modal (document-level so it works regardless of focus)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open (reference-counted for nested modals)
  useEffect(() => {
    if (!isOpen) return;

    if (!Modal._overflowCount) Modal._overflowCount = 0;
    Modal._overflowCount++;
    document.body.style.overflow = 'hidden';

    return () => {
      Modal._overflowCount--;
      if (Modal._overflowCount <= 0) {
        Modal._overflowCount = 0;
        document.body.style.overflow = '';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className="modal-content">
          {title && (
            <div className="modal-header">
              <h2 id={titleId} className="modal-title">
                {title}
              </h2>
            </div>
          )}
          {showCloseButton && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          )}
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );

  // Render modal in a portal at document root
  return createPortal(modalContent, document.body);
}

/**
 * Confirmation modal with OK/Cancel buttons.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @returns {JSX.Element} Confirmation modal
 */
export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      showCloseButton={false}
    >
      <p className="modal-message">{message}</p>
      <div className="modal-actions">
        <button className="modal-cancel" onClick={onCancel}>
          {cancelText}
        </button>
        <button className="modal-confirm" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
