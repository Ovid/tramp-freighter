// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCameraToolbar } from '../../src/features/navigation/MobileCameraToolbar';

describe('MobileCameraToolbar', () => {
  afterEach(() => vi.restoreAllMocks());

  const defaultProps = {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFindStar: vi.fn(),
    stars: [
      { id: 0, name: 'Sol' },
      { id: 1, name: 'Alpha Centauri' },
    ],
    toggles: {
      showAntimatter: false,
      showJumpWarnings: true,
      showRotation: true,
      showBoundary: false,
    },
    onToggle: vi.fn(),
  };

  it('should render zoom buttons', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeTruthy();
  });

  it('should render a Find Star select', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('combobox', { name: /find star/i })).toBeTruthy();
  });

  it('should render a settings button', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeTruthy();
  });

  it('should call onZoomIn when pressed', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(defaultProps.onZoomIn).toHaveBeenCalled();
  });

  it('should show settings popover when pressed', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText(/Antimatter/i)).toBeTruthy();
    expect(screen.getByText(/Jump Warnings/i)).toBeTruthy();
  });

  it('all buttons should have mobile-toolbar-btn class', () => {
    const { container } = render(<MobileCameraToolbar {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.classList.contains('mobile-toolbar-btn')).toBe(true);
    });
  });
});
