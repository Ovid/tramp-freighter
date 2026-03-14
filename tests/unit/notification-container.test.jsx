import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationContainer } from '../../src/components/NotificationContainer.jsx';

vi.mock('../../src/context/NotificationContext', () => ({
  useNotificationContext: vi.fn(),
}));

import { useNotificationContext } from '../../src/context/NotificationContext';

describe('NotificationContainer', () => {
  beforeEach(() => {
    useNotificationContext.mockReset();
  });

  it('returns null when context is null', () => {
    useNotificationContext.mockReturnValue(null);
    const { container } = render(<NotificationContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when notifications array is empty', () => {
    useNotificationContext.mockReturnValue({ notifications: [] });
    const { container } = render(<NotificationContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders notifications with correct messages', () => {
    useNotificationContext.mockReturnValue({
      notifications: [
        { id: '1', type: 'info', message: 'Fuel purchased', fadeOut: false },
        { id: '2', type: 'info', message: 'Cargo sold', fadeOut: false },
      ],
    });
    render(<NotificationContainer />);

    expect(screen.getByText(/Fuel purchased/)).toBeDefined();
    expect(screen.getByText(/Cargo sold/)).toBeDefined();
  });

  it('applies correct type class for each notification type', () => {
    useNotificationContext.mockReturnValue({
      notifications: [
        { id: '1', type: 'info', message: 'Info msg', fadeOut: false },
        { id: '2', type: 'error', message: 'Error msg', fadeOut: false },
        { id: '3', type: 'warning', message: 'Warning msg', fadeOut: false },
      ],
    });
    const { container } = render(<NotificationContainer />);

    const items = container.querySelectorAll('.notification');
    expect(items[0].className).toContain('notification-info');
    expect(items[1].className).toContain('notification-error');
    expect(items[2].className).toContain('notification-warning');
  });

  it('applies fade-out class when notification.fadeOut is true', () => {
    useNotificationContext.mockReturnValue({
      notifications: [
        { id: '1', type: 'info', message: 'Fading', fadeOut: true },
        { id: '2', type: 'info', message: 'Staying', fadeOut: false },
      ],
    });
    const { container } = render(<NotificationContainer />);

    const items = container.querySelectorAll('.notification');
    expect(items[0].className).toContain('fade-out');
    expect(items[1].className).not.toContain('fade-out');
  });

  it('has aria-live="polite" for accessibility', () => {
    useNotificationContext.mockReturnValue({
      notifications: [
        { id: '1', type: 'info', message: 'Test', fadeOut: false },
      ],
    });
    const { container } = render(<NotificationContainer />);

    const wrapper = container.querySelector('.notification-container');
    expect(wrapper.getAttribute('aria-live')).toBe('polite');
  });
});
