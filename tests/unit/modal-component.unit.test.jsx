import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal, ConfirmModal } from '../../src/components/Modal.jsx';

/**
 * Unit tests for Modal component
 *
 * Tests the React Modal component functionality including:
 * - Displaying modal with correct message
 * - Resolving to true/false based on user action
 * - Hiding modal after interaction
 * - Escape key handling
 * - Body scroll prevention
 */
describe('Modal Component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should show modal with correct message', () => {
    const message = 'Starting a new game will overwrite your existing save. Continue?';
    
    render(
      <Modal isOpen={true} onClose={() => {}} title="Confirm">
        <p className="modal-message">{message}</p>
      </Modal>
    );

    const modalOverlay = document.querySelector('.modal-overlay');
    const modalMessage = screen.getByText(message);

    expect(modalOverlay).toBeInTheDocument();
    expect(modalMessage).toBeInTheDocument();
  });

  it('should call onClose when overlay is clicked', () => {
    let closeCalled = false;

    render(
      <Modal isOpen={true} onClose={() => { closeCalled = true; }} title="Test">
        <p>Test message</p>
      </Modal>
    );

    const modalOverlay = document.querySelector('.modal-overlay');
    fireEvent.click(modalOverlay);

    expect(closeCalled).toBe(true);
  });

  it('should not call onClose when modal content is clicked', () => {
    let closeCalled = false;

    render(
      <Modal isOpen={true} onClose={() => { closeCalled = true; }} title="Test">
        <p data-testid="modal-content">Test message</p>
      </Modal>
    );

    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);

    expect(closeCalled).toBe(false);
  });

  it('should hide modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Test message</p>
      </Modal>
    );

    const modalOverlay = document.querySelector('.modal-overlay');
    expect(modalOverlay).not.toBeInTheDocument();
  });

  it('should call onClose when escape key is pressed', () => {
    let closeCalled = false;

    render(
      <Modal isOpen={true} onClose={() => { closeCalled = true; }} title="Test">
        <p>Test message</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeCalled).toBe(true);
  });

  it('should prevent body scroll when modal is open', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <p>Test message</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});

/**
 * Unit tests for ConfirmModal component
 */
describe('ConfirmModal Component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    let confirmCalled = false;
    let cancelCalled = false;

    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => { confirmCalled = true; }}
        onCancel={() => { cancelCalled = true; }}
        message="Test message"
      />
    );

    const confirmButton = screen.getByText('OK');
    fireEvent.click(confirmButton);

    expect(confirmCalled).toBe(true);
    expect(cancelCalled).toBe(false);
  });

  it('should call onCancel when cancel button is clicked', () => {
    let confirmCalled = false;
    let cancelCalled = false;

    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => { confirmCalled = true; }}
        onCancel={() => { cancelCalled = true; }}
        message="Test message"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(cancelCalled).toBe(true);
    expect(confirmCalled).toBe(false);
  });

  it('should display custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => {}}
        onCancel={() => {}}
        message="Test message"
        confirmText="Yes"
        cancelText="No"
      />
    );

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should display message text', () => {
    const message = 'Are you sure you want to proceed?';

    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => {}}
        onCancel={() => {}}
        message={message}
      />
    );

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should call onCancel when escape key is pressed', () => {
    let cancelCalled = false;

    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => {}}
        onCancel={() => { cancelCalled = true; }}
        message="Test message"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(cancelCalled).toBe(true);
  });
});
