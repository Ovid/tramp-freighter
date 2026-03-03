import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionCompleteNotifier } from '../../src/features/missions/MissionCompleteNotifier.jsx';

const mockCompleteMission = vi.fn(() => ({
  success: true,
  rewards: { credits: 216 },
}));
const mockGetCompletableMissions = vi.fn(() => [
  {
    id: 'delivery_001',
    type: 'delivery',
    title: 'Cargo Run: parts to Sirius A',
    requirements: { cargo: 'parts', quantity: 24, destination: 'Sirius A' },
    rewards: { credits: 216 },
    grossCredits: 216,
  },
]);

const mockCalculateTradeWithholding = vi.fn((amount) => ({
  withheld: 0,
  playerReceives: amount,
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    completeMission: mockCompleteMission,
    getCompletableMissions: mockGetCompletableMissions,
    calculateTradeWithholding: mockCalculateTradeWithholding,
  }),
}));

const stableMissions = { active: [], completed: [] };
vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn(() => stableMissions),
}));

describe('MissionCompleteNotifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-show completion dialog when completable missions exist on dock', () => {
    render(<MissionCompleteNotifier />);
    expect(screen.getByText(/Mission Complete/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cargo Run: parts to Sirius A/)
    ).toBeInTheDocument();
    expect(screen.getByText(/216/)).toBeInTheDocument();
  });

  it('should call completeMission when player confirms', () => {
    render(<MissionCompleteNotifier />);
    const completeBtn = screen.getByText('Complete');
    fireEvent.click(completeBtn);
    expect(mockCompleteMission).toHaveBeenCalledWith('delivery_001');
  });

  it('should render nothing when no completable missions exist', () => {
    mockGetCompletableMissions.mockReturnValue([]);
    const { container } = render(<MissionCompleteNotifier />);
    expect(container.innerHTML).toBe('');
  });
});
