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
      locationChanged: 4,
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
    render(<RumorAlert />);
    expect(screen.getByText(/illicit cargo/i)).toBeInTheDocument();
  });

  it('should not display rumor alert when no illegal cargo', () => {
    mockGameEventValues.cargoChanged = [
      { good: 'parts', qty: 5, buyPrice: 10 },
    ];
    render(<RumorAlert />);
    expect(screen.queryByText(/illicit cargo/i)).not.toBeInTheDocument();
  });
});
