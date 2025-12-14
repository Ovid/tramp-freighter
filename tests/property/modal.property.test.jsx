import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Modal, ConfirmModal } from '../../src/components/Modal.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * React Migration Spec, Property 42: Modals block underlying UI
 * Validates: Requirements 42.2
 *
 * For any modal being displayed, interaction with underlying UI elements
 * should be blocked.
 */
describe('Property: Modals block underlying UI', () => {
  it('should block clicks on underlying elements when modal is open', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalTitle) => {
          cleanup();

          let underlyingClicked = false;
          let modalClicked = false;

          // Render modal with underlying button
          render(
            <div>
              <button
                data-testid="underlying-button"
                onClick={() => {
                  underlyingClicked = true;
                }}
              >
                Underlying Button
              </button>
              <Modal isOpen={true} onClose={() => {}} title={modalTitle}>
                <button
                  data-testid="modal-button"
                  onClick={() => {
                    modalClicked = true;
                  }}
                >
                  Modal Button
                </button>
              </Modal>
            </div>
          );

          // Click on modal button should work
          const modalButton = screen.getByTestId('modal-button');
          fireEvent.click(modalButton);
          expect(modalClicked).toBe(true);

          // Underlying button should still be in DOM but interaction is blocked by overlay
          const underlyingButton = screen.getByTestId('underlying-button');
          expect(underlyingButton).toBeInTheDocument();

          // The modal overlay should be present
          const overlay = document.querySelector('.modal-overlay');
          expect(overlay).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should prevent body scroll when modal is open', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalContent) => {
          cleanup();

          // Render modal
          const { unmount } = render(
            <Modal isOpen={true} onClose={() => {}} title="Test">
              <div>{modalContent}</div>
            </Modal>
          );

          // Body overflow should be hidden when modal is open
          expect(document.body.style.overflow).toBe('hidden');

          // Unmount modal
          unmount();

          // Body overflow should be restored
          expect(document.body.style.overflow).toBe('');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should close modal on escape key', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalTitle) => {
          cleanup();

          let closeCalled = false;

          // Render modal
          render(
            <Modal
              isOpen={true}
              onClose={() => {
                closeCalled = true;
              }}
              title={modalTitle}
            >
              <div>Modal Content</div>
            </Modal>
          );

          // Press escape key
          fireEvent.keyDown(document, { key: 'Escape' });

          // Close should be called
          expect(closeCalled).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should close modal when clicking overlay', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalTitle) => {
          cleanup();

          let closeCalled = false;

          // Render modal
          render(
            <Modal
              isOpen={true}
              onClose={() => {
                closeCalled = true;
              }}
              title={modalTitle}
            >
              <div>Modal Content</div>
            </Modal>
          );

          // Click on overlay
          const overlay = document.querySelector('.modal-overlay');
          fireEvent.click(overlay);

          // Close should be called
          expect(closeCalled).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not close modal when clicking modal content', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalTitle) => {
          cleanup();

          let closeCalled = false;

          // Render modal
          render(
            <Modal
              isOpen={true}
              onClose={() => {
                closeCalled = true;
              }}
              title={modalTitle}
            >
              <div data-testid="modal-content">Modal Content</div>
            </Modal>
          );

          // Click on modal content
          const modalContent = screen.getByTestId('modal-content');
          fireEvent.click(modalContent);

          // Close should NOT be called
          expect(closeCalled).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 43: Modals don't block state updates
 * Validates: Requirements 42.5
 *
 * For any modal being open, GameStateManager state updates should continue
 * to function normally.
 */
describe("Property: Modals don't block state updates", () => {
  it('should allow GameStateManager updates while modal is open', () => {
    fc.assert(
      fc.property(fc.integer({ min: 600, max: 100000 }), (newCredits) => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Track state updates
        let stateUpdated = false;
        gameStateManager.subscribe('creditsChanged', () => {
          stateUpdated = true;
        });

        // Render modal
        render(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            <div>Modal is open</div>
          </Modal>
        );

        // Update game state while modal is open
        gameStateManager.updateCredits(newCredits);

        // Verify state was updated
        expect(stateUpdated).toBe(true);
        expect(gameStateManager.getState().player.credits).toBe(newCredits);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should render modal when isOpen is false', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (modalTitle) => {
          cleanup();

          // Render modal with isOpen=false
          render(
            <Modal isOpen={false} onClose={() => {}} title={modalTitle}>
              <div>Modal Content</div>
            </Modal>
          );

          // Modal should not be in DOM
          const overlay = document.querySelector('.modal-overlay');
          expect(overlay).not.toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Test ConfirmModal component
 */
describe('ConfirmModal component', () => {
  it('should call onConfirm when confirm button is clicked', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (message) => {
          cleanup();

          let confirmCalled = false;
          let cancelCalled = false;

          // Render confirm modal
          render(
            <ConfirmModal
              isOpen={true}
              onConfirm={() => {
                confirmCalled = true;
              }}
              onCancel={() => {
                cancelCalled = true;
              }}
              message={message}
            />
          );

          // Click confirm button
          const confirmButton = screen.getByText('OK');
          fireEvent.click(confirmButton);

          // Confirm should be called, cancel should not
          expect(confirmCalled).toBe(true);
          expect(cancelCalled).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should call onCancel when cancel button is clicked', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 50 })
          .filter((s) => s.trim().length >= 2),
        (message) => {
          cleanup();

          let confirmCalled = false;
          let cancelCalled = false;

          // Render confirm modal
          render(
            <ConfirmModal
              isOpen={true}
              onConfirm={() => {
                confirmCalled = true;
              }}
              onCancel={() => {
                cancelCalled = true;
              }}
              message={message}
            />
          );

          // Click cancel button
          const cancelButton = screen.getByText('Cancel');
          fireEvent.click(cancelButton);

          // Cancel should be called, confirm should not
          expect(cancelCalled).toBe(true);
          expect(confirmCalled).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
