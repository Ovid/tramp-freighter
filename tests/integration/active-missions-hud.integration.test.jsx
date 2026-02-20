import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveMissions } from '../../src/features/hud/ActiveMissions.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'missionsChanged')
      return {
        active: [
          {
            id: 'delivery_001',
            type: 'delivery',
            title: 'Cargo Run: parts to Sirius A',
            deadlineDay: 27,
            requirements: {
              cargo: 'parts',
              quantity: 24,
              destination: 4,
              deadline: 21,
            },
            destination: { systemId: 4, name: 'Sirius A' },
            rewards: { credits: 216 },
          },
          {
            id: 'delivery_002',
            type: 'passenger',
            title: 'Passenger: Niko Garcia',
            deadlineDay: 30,
            requirements: {
              destination: 7,
              deadline: 24,
            },
            destination: { systemId: 7, name: 'Tau Ceti' },
            rewards: { credits: 300 },
          },
        ],
        completed: [],
        failed: [],
        board: [],
      };
    if (eventName === 'timeChanged') return 6;
    if (eventName === 'cargoChanged')
      return [
        { good: 'parts', qty: 10 },
        { good: 'tritium', qty: 5 },
      ];
    return null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    abandonMission: vi.fn(() => ({ success: true })),
  }),
}));

describe('ActiveMissions HUD - Cargo Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display cargo progress for delivery missions with cargo requirements', () => {
    render(<ActiveMissions />);
    // Mission with cargo requirement should show progress: 10/24 parts
    expect(screen.getByText(/10\/24 parts/)).toBeInTheDocument();
  });

  it('should not display cargo progress for missions without cargo requirements', () => {
    render(<ActiveMissions />);
    // Passenger mission has no cargo requirement - no progress line
    const missionItems = screen.getAllByText(/remaining/);
    expect(missionItems).toHaveLength(2);
    // Only one cargo progress line should exist
    const cargoProgress = screen.queryAllByText(/\/\d+/);
    expect(cargoProgress).toHaveLength(1);
  });
});

describe('ActiveMissions HUD - Abandon Mission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show an abandon button for each active mission', () => {
    render(<ActiveMissions />);
    const abandonButtons = screen.getAllByText('Abandon');
    expect(abandonButtons).toHaveLength(2);
  });

  it('should show confirmation dialog when abandon is clicked', () => {
    render(<ActiveMissions />);
    const abandonButtons = screen.getAllByText('Abandon');
    fireEvent.click(abandonButtons[0]);
    expect(screen.getByText(/Abandon Mission/)).toBeInTheDocument();
    // Modal message contains the mission title in quotes
    expect(
      screen.getByText(/Abandon "Cargo Run: parts to Sirius A"/)
    ).toBeInTheDocument();
  });
});

describe('ActiveMissions HUD - Destination Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display destination for each active mission', () => {
    const { container } = render(<ActiveMissions />);
    const destinations = container.querySelectorAll('.mission-hud-destination');
    expect(destinations).toHaveLength(2);
    expect(destinations[0].textContent).toContain('Sirius A');
    expect(destinations[1].textContent).toContain('Tau Ceti');
  });
});
