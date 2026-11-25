import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShipNamingDialog } from '../../src/features/title-screen/ShipNamingDialog.jsx';

describe('ShipNamingDialog', () => {
  // Its backdrop only blocks the pointer; Tab must not reach the page behind.
  it('keeps Tab inside the dialog', () => {
    render(
      <>
        <button>Behind</button>
        <ShipNamingDialog onSubmit={vi.fn()} />
      </>
    );
    const dialog = screen.getByRole('dialog');

    screen.getByText('Behind').focus();
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
