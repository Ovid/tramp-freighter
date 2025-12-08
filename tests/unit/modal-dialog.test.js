import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Modal Dialog', () => {
  let dom;
  let document;
  let showModal;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(
      `
            <!DOCTYPE html>
            <html>
            <body>
                <div id="modal-overlay" class="modal-overlay hidden">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <p id="modal-message" class="modal-message"></p>
                            <div class="modal-actions">
                                <button id="modal-cancel" class="modal-cancel">Cancel</button>
                                <button id="modal-confirm" class="modal-confirm">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
      { url: 'http://localhost' }
    );

    document = dom.window.document;
    global.document = document;

    // Define showModal function
    showModal = function (message) {
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

        modalMessage.textContent = message;
        modalOverlay.classList.remove('hidden');

        const handleCancel = () => {
          cleanup();
          resolve(false);
        };

        const handleConfirm = () => {
          cleanup();
          resolve(true);
        };

        const handleEscape = (e) => {
          if (e.key === 'Escape') {
            handleCancel();
          }
        };

        const cleanup = () => {
          modalOverlay.classList.add('hidden');
          modalCancel.removeEventListener('click', handleCancel);
          modalConfirm.removeEventListener('click', handleConfirm);
          document.removeEventListener('keydown', handleEscape);
        };

        modalCancel.addEventListener('click', handleCancel);
        modalConfirm.addEventListener('click', handleConfirm);
        document.addEventListener('keydown', handleEscape);
      });
    };
  });

  it('should show modal with correct message', async () => {
    const message =
      'Starting a new game will overwrite your existing save. Continue?';
    const modalPromise = showModal(message);

    const modalOverlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');

    expect(modalOverlay.classList.contains('hidden')).toBe(false);
    expect(modalMessage.textContent).toBe(message);

    // Click cancel to resolve
    document.getElementById('modal-cancel').click();
    const result = await modalPromise;
    expect(result).toBe(false);
  });

  it('should resolve to true when confirm is clicked', async () => {
    const modalPromise = showModal('Test message');

    document.getElementById('modal-confirm').click();
    const result = await modalPromise;

    expect(result).toBe(true);
  });

  it('should resolve to false when cancel is clicked', async () => {
    const modalPromise = showModal('Test message');

    document.getElementById('modal-cancel').click();
    const result = await modalPromise;

    expect(result).toBe(false);
  });

  it('should hide modal after confirm', async () => {
    const modalPromise = showModal('Test message');
    const modalOverlay = document.getElementById('modal-overlay');

    expect(modalOverlay.classList.contains('hidden')).toBe(false);

    document.getElementById('modal-confirm').click();
    await modalPromise;

    expect(modalOverlay.classList.contains('hidden')).toBe(true);
  });

  it('should hide modal after cancel', async () => {
    const modalPromise = showModal('Test message');
    const modalOverlay = document.getElementById('modal-overlay');

    expect(modalOverlay.classList.contains('hidden')).toBe(false);

    document.getElementById('modal-cancel').click();
    await modalPromise;

    expect(modalOverlay.classList.contains('hidden')).toBe(true);
  });

  it('should resolve to false when escape key is pressed', async () => {
    const modalPromise = showModal('Test message');

    const escapeEvent = new dom.window.KeyboardEvent('keydown', {
      key: 'Escape',
    });
    document.dispatchEvent(escapeEvent);

    const result = await modalPromise;
    expect(result).toBe(false);
  });
});
