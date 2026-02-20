import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MissionBoardPanel } from '../../src/features/missions/MissionBoardPanel.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: vi.fn(),
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: vi.fn(),
}));

import { useGameEvent } from '../../src/hooks/useGameEvent';
import { useGameAction } from '../../src/hooks/useGameAction';

const passengerMission = {
  id: 'passenger_001',
  type: 'passenger',
  title: 'Passenger: Dr. Chen',
  description: 'Transport Dr. Chen to Epsilon Eridani.',
  requirements: { destination: 13, deadline: 10, cargoSpace: 2 },
  rewards: { credits: 800 },
  passenger: {
    name: 'Dr. Chen',
    type: 'scientist',
    satisfaction: 50,
    dialogue: 'Fascinating ship you have.',
  },
};

const cargoMission = {
  id: 'cargo_001',
  type: 'delivery',
  title: 'Cargo Run: grain to Sol',
  description: 'Standard delivery.',
  requirements: { cargo: 'grain', quantity: 15, destination: 0, deadline: 7 },
  rewards: { credits: 200 },
};

describe('MissionBoardPanel passenger rendering', () => {
  beforeEach(() => {
    cleanup();
    useGameAction.mockReturnValue({
      acceptMission: vi.fn(() => ({ success: true })),
      refreshMissionBoard: vi.fn(),
    });
  });

  it('should render passenger type capitalized', () => {
    useGameEvent.mockReturnValue({ board: [passengerMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.getByText('Scientist')).toBeInTheDocument();
  });

  it('should render passenger dialogue in quotes', () => {
    useGameEvent.mockReturnValue({ board: [passengerMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.getByText(/Fascinating ship you have/)).toBeInTheDocument();
  });

  it('should render cargo space requirement for passengers', () => {
    useGameEvent.mockReturnValue({ board: [passengerMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.getByText(/Space Required: 2 units/)).toBeInTheDocument();
  });

  it('should render deadline and reward for passenger missions', () => {
    useGameEvent.mockReturnValue({ board: [passengerMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.getByText(/Deadline: 10 days/)).toBeInTheDocument();
    expect(screen.getByText(/800/)).toBeInTheDocument();
  });

  it('should render cargo details for delivery missions', () => {
    useGameEvent.mockReturnValue({ board: [cargoMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.getByText(/Deliver:/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
    // "grain" appears in title and details; verify at least one exists
    expect(screen.getAllByText(/grain/).length).toBeGreaterThanOrEqual(1);
  });

  it('should not render Deliver text for passenger missions', () => {
    useGameEvent.mockReturnValue({ board: [passengerMission] });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    expect(screen.queryByText(/Deliver:/)).not.toBeInTheDocument();
  });

  it('should render mixed board with both mission types', () => {
    useGameEvent.mockReturnValue({
      board: [passengerMission, cargoMission],
    });
    render(<MissionBoardPanel onClose={vi.fn()} />);
    // Passenger elements
    expect(screen.getByText('Scientist')).toBeInTheDocument();
    expect(screen.getByText(/Fascinating ship you have/)).toBeInTheDocument();
    // Cargo elements present (appears in title and details)
    expect(screen.getAllByText(/grain/).length).toBeGreaterThanOrEqual(1);
  });
});
