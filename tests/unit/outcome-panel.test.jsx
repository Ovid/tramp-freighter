import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutcomePanel } from '../../src/features/danger/OutcomePanel.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';

// Mock GameStateManager
const mockGameStateManager = {
  getState: vi.fn(() => ({
    player: {
      karma: 0,
      factions: { authorities: 0, traders: 0, outlaws: 0, civilians: 0 },
    },
    ship: { hull: 100, engine: 100, fuel: 100, lifeSupport: 100 },
  })),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

// Mock useGameEvent hook
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: vi.fn((eventName) => {
    switch (eventName) {
      case 'karmaChanged':
        return 0;
      case 'factionRepChanged':
        return { authorities: 0, traders: 0, outlaws: 0, civilians: 0 };
      default:
        return null;
    }
  }),
}));

describe('OutcomePanel', () => {
  const defaultOutcome = {
    success: true,
    encounterType: 'pirate_encounter',
    choiceMade: 'negotiate',
    explanation:
      'You successfully negotiated with the pirates and avoided combat.',
    modifiers: [
      {
        name: 'Good Karma',
        value: 0.05,
        type: 'bonus',
        description: 'Your positive karma helped in negotiations.',
      },
    ],
    consequences: {},
    karmaChanges: [
      {
        amount: 1,
        reason: 'peaceful resolution',
      },
    ],
    reputationChanges: [
      {
        faction: 'outlaws',
        amount: 5,
        reason: 'negotiated with pirates',
      },
    ],
    resourceChanges: {
      fuel: -10,
      credits: -100,
    },
  };

  const defaultProps = {
    outcome: defaultOutcome,
    onClose: vi.fn(),
    onContinue: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (props = {}) => {
    return render(
      <GameProvider gameStateManager={mockGameStateManager}>
        <OutcomePanel {...defaultProps} {...props} />
      </GameProvider>
    );
  };

  it('should display outcome panel title', () => {
    renderWithContext();
    expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
  });

  it('should display encounter result status', () => {
    renderWithContext();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
  });

  it('should display the choice made by player', () => {
    renderWithContext();
    expect(screen.getByText('Your Choice:')).toBeInTheDocument();
    expect(screen.getByText('Negotiate')).toBeInTheDocument();
  });

  it('should display outcome explanation', () => {
    renderWithContext();
    expect(
      screen.getByText(
        'You successfully negotiated with the pirates and avoided combat.'
      )
    ).toBeInTheDocument();
  });

  it('should display modifiers that affected the result', () => {
    renderWithContext();
    expect(
      screen.getByText('Factors That Influenced the Outcome')
    ).toBeInTheDocument();
    expect(screen.getByText('Good Karma')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('should display karma changes', () => {
    renderWithContext();
    expect(screen.getByText('Moral Standing')).toBeInTheDocument();
    expect(screen.getByText('Karma:')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('(peaceful resolution)')).toBeInTheDocument();
  });

  it('should display reputation changes', () => {
    renderWithContext();
    expect(screen.getByText('Faction Standing')).toBeInTheDocument();
    expect(screen.getAllByText('Outlaws:')).toHaveLength(2); // One in changes, one in current standings
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('(negotiated with pirates)')).toBeInTheDocument();
  });

  it('should display resource changes', () => {
    renderWithContext();
    expect(screen.getByText('Ship & Resources')).toBeInTheDocument();
    expect(screen.getByText('Fuel:')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText('Credits:')).toBeInTheDocument();
    expect(screen.getByText('-₡100')).toBeInTheDocument();
  });

  it('should display current karma and faction standings', () => {
    renderWithContext();
    expect(screen.getByText('Current Karma:')).toBeInTheDocument();
    expect(screen.getByText('Current Standing:')).toBeInTheDocument();
    expect(screen.getByText('Authorities:')).toBeInTheDocument();
    expect(screen.getByText('Traders:')).toBeInTheDocument();
    expect(screen.getByText('Civilians:')).toBeInTheDocument();
  });

  it('should handle failure outcomes', () => {
    const failureOutcome = {
      ...defaultOutcome,
      success: false,
      explanation: 'The negotiation failed and combat ensued.',
    };

    renderWithContext({ outcome: failureOutcome });
    expect(screen.getByText('Failure')).toBeInTheDocument();
    expect(
      screen.getByText('The negotiation failed and combat ensued.')
    ).toBeInTheDocument();
  });

  it('should call onContinue when continue button is clicked', () => {
    const onContinue = vi.fn();
    renderWithContext({ onContinue });

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithContext({ onClose });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle empty outcome gracefully', () => {
    renderWithContext({ outcome: null });
    // Component should not render anything when outcome is null
    expect(screen.queryByText('Encounter Outcome')).not.toBeInTheDocument();
  });

  it('should display additional effects when present', () => {
    const outcomeWithEffects = {
      ...defaultOutcome,
      consequences: {
        additionalEffects: [
          "Your ship's reputation precedes you in this sector.",
          'Pirates in this area will be more cautious around you.',
        ],
      },
    };

    renderWithContext({ outcome: outcomeWithEffects });
    expect(screen.getByText('Additional Effects')).toBeInTheDocument();
    expect(
      screen.getByText("Your ship's reputation precedes you in this sector.")
    ).toBeInTheDocument();
    expect(
      screen.getByText('Pirates in this area will be more cautious around you.')
    ).toBeInTheDocument();
  });

  it('should format different resource types correctly', () => {
    const outcomeWithVariousResources = {
      ...defaultOutcome,
      resourceChanges: {
        hull: -20,
        engine: -5,
        fuel: -15,
        lifeSupport: -10,
        credits: 500,
        cargo: -2,
        days: 3,
      },
    };

    renderWithContext({ outcome: outcomeWithVariousResources });
    expect(screen.getByText('Hull Integrity:')).toBeInTheDocument();
    expect(screen.getByText('Engine Condition:')).toBeInTheDocument();
    expect(screen.getByText('Life Support:')).toBeInTheDocument();
    expect(screen.getByText('+₡500')).toBeInTheDocument();
    expect(screen.getByText('-2% cargo')).toBeInTheDocument();
    expect(screen.getByText('+3 days')).toBeInTheDocument();
  });
});
