import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from '../../src/hooks/useClickOutside.js';
import { PanelContainer } from '../../src/features/station/PanelContainer.jsx';

// An unknown panel name renders an empty container, which is enough to test
// the container's own key handling without mounting game-backed panels.
const EMPTY_PANEL = 'none';

describe('PanelContainer Escape key', () => {
  afterEach(() => {
    cleanup();
  });

  it('closes the panel on Escape', () => {
    const onClose = vi.fn();
    render(<PanelContainer activePanel={EMPTY_PANEL} onClose={onClose} />);

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves Escape to an open modal', () => {
    const onClose = vi.fn();
    render(
      <>
        <div className="modal-overlay" />
        <PanelContainer activePanel={EMPTY_PANEL} onClose={onClose} />
      </>
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes only the panel, not the station menu that opened it', () => {
    const onClose = vi.fn();
    const onUndock = vi.fn();
    const { getByText } = render(
      <>
        <StationMenuStandIn onUndock={onUndock} />
        <PanelContainer activePanel={EMPTY_PANEL} onClose={onClose} />
      </>
    );
    // Focus stays on the menu button after clicking it to open the panel
    getByText('Trade').focus();

    fireEvent.keyDown(document.activeElement, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onUndock).not.toHaveBeenCalled();
  });
});

// Same Escape wiring as StationMenu, which is mounted before any panel
function StationMenuStandIn({ onUndock }) {
  const ref = useRef(null);
  useClickOutside(ref, onUndock);
  return (
    <div ref={ref} data-panel>
      <button>Trade</button>
    </div>
  );
}
