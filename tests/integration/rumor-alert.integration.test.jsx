import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RumorAlert } from '../../src/features/hud/RumorAlert.jsx';

let mockGameEventValues = {};

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => mockGameEventValues[eventName] ?? null,
}));

describe('RumorAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameEventValues = {
      locationChanged: 0,
      cargoChanged: [
        {
          good: 'unmarked_crates',
          qty: 5,
          buyPrice: 0,
          missionId: 'mission_1',
        },
      ],
    };
  });

  it('should display rumor alert when arriving with illegal cargo', () => {
    const { rerender } = render(<RumorAlert />);
    // Simulate a jump to a new system
    mockGameEventValues.locationChanged = 4;
    rerender(<RumorAlert />);
    expect(screen.getByText(/illicit cargo/i)).toBeInTheDocument();
  });

  it('should not display rumor alert when no illegal cargo', () => {
    mockGameEventValues.cargoChanged = [
      { good: 'parts', qty: 5, buyPrice: 10 },
    ];
    const { rerender } = render(<RumorAlert />);
    mockGameEventValues.locationChanged = 4;
    rerender(<RumorAlert />);
    expect(screen.queryByText(/illicit cargo/i)).not.toBeInTheDocument();
  });

  it('should not display rumor alert on initial mount without a jump', () => {
    mockGameEventValues.locationChanged = 4;
    render(<RumorAlert />);
    expect(screen.queryByText(/illicit cargo/i)).not.toBeInTheDocument();
  });
});
