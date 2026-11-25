import { describe, it, expect } from 'vitest';
import { useRef, useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../../src/hooks/useFocusTrap';

function Dialog() {
  const ref = useRef(null);
  useFocusTrap(ref);
  return (
    <div ref={ref}>
      <button>Inside</button>
    </div>
  );
}

// The opener removes itself when it opens the dialog, as SystemPanel's Jump
// button does when DangerWarningDialog's Proceed closes the panel.
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <main id="main-content" tabIndex={-1}>
      {!open && <button onClick={() => setOpen(true)}>Opener</button>}
      {open && <Dialog />}
      {open && <button onClick={() => setOpen(false)}>Close</button>}
    </main>
  );
}

describe('useFocusTrap', () => {
  it('falls back to #main-content when the element to restore is gone', () => {
    const { getByText } = render(<Harness />);
    const opener = getByText('Opener');
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(getByText('Close'));
    expect(document.activeElement.id).toBe('main-content');
  });
});
