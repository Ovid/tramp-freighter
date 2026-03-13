import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { useClickOutside } from '../../src/hooks/useClickOutside.js';
import { useRef } from 'react';

// Test harness component that uses the hook
function TestPanel({ onClose, enabled = true }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose, enabled);
  return (
    <div ref={ref} data-panel data-testid="panel">
      <button data-testid="inner-btn">Inside</button>
    </div>
  );
}

describe('useClickOutside hook', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onClose when mousedown fires outside the panel', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="outside"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when mousedown fires inside the panel', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="inner-btn"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when mousedown fires on another data-panel element', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-panel data-testid="other-panel">
          Other Panel
        </div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="other-panel"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when mousedown fires inside #game-hud', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div id="game-hud">
          <button data-testid="hud-btn">HUD Button</button>
        </div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="hud-btn"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when mousedown fires inside #camera-controls', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div id="camera-controls">
          <button data-testid="cam-btn">Settings</button>
        </div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="cam-btn"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when mousedown fires on #dev-admin-btn', () => {
    const onClose = vi.fn();
    render(
      <div>
        <button id="dev-admin-btn" data-testid="dev-btn">
          Dev
        </button>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="dev-btn"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when mousedown fires inside .modal-overlay', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div className="modal-overlay" data-testid="modal">
          Modal
        </div>
        <TestPanel onClose={onClose} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="modal"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not fire when enabled is false', () => {
    const onClose = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TestPanel onClose={onClose} enabled={false} />
      </div>
    );

    fireEvent.mouseDown(document.querySelector('[data-testid="outside"]'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <div>
        <div data-testid="outside">Outside</div>
        <TestPanel onClose={onClose} />
      </div>
    );

    unmount();
    fireEvent.mouseDown(document);
    expect(onClose).not.toHaveBeenCalled();
  });
});
