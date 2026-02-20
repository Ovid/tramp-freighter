import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MissionCompleteNotifier } from '../../src/features/missions/MissionCompleteNotifier.jsx';

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: vi.fn(),
}));

import { useGameAction } from '../../src/hooks/useGameAction';

const passengerMission = {
  id: 'passenger_001',
  type: 'passenger',
  title: 'Passenger: Dr. Chen',
  requirements: { destination: 4, deadline: 10, cargoSpace: 2 },
  rewards: { credits: 800 },
  passenger: {
    name: 'Dr. Chen',
    type: 'scientist',
    satisfaction: 75,
    dialogue: 'Fascinating ship you have.',
  },
};

const cargoMission = {
  id: 'cargo_001',
  type: 'delivery',
  title: 'Cargo Run: grain to Sol',
  requirements: { cargo: 'grain', quantity: 15, destination: 0, deadline: 7 },
  rewards: { credits: 200 },
};

describe('MissionCompleteNotifier passenger display', () => {
  beforeEach(() => {
    useGameAction.mockReturnValue({
      completeMission: vi.fn(() => ({ success: true })),
      getCompletableMissions: vi.fn(() => [passengerMission]),
    });
  });

  it('should show passenger name in delivery info', () => {
    render(<MissionCompleteNotifier />);
    expect(screen.getByText(/Dr\. Chen disembarks/)).toBeDefined();
  });

  it('should show satisfaction percentage and label', () => {
    render(<MissionCompleteNotifier />);
    expect(screen.getByText(/75%/)).toBeDefined();
    expect(screen.getByText(/Satisfied/)).toBeDefined();
  });

  it('should show "Very Satisfied" for satisfaction >= 80', () => {
    const highSatMission = {
      ...passengerMission,
      passenger: { ...passengerMission.passenger, satisfaction: 85 },
    };
    useGameAction.mockReturnValue({
      completeMission: vi.fn(() => ({ success: true })),
      getCompletableMissions: vi.fn(() => [highSatMission]),
    });

    render(<MissionCompleteNotifier />);
    expect(screen.getByText(/Very Satisfied/)).toBeDefined();
  });

  it('should not show passenger info for cargo missions', () => {
    useGameAction.mockReturnValue({
      completeMission: vi.fn(() => ({ success: true })),
      getCompletableMissions: vi.fn(() => [cargoMission]),
    });

    render(<MissionCompleteNotifier />);
    expect(screen.queryByText(/disembarks/)).toBeNull();
    expect(screen.queryByText(/Satisfaction/)).toBeNull();
  });
});
