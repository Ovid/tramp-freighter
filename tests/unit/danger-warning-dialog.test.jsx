import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DangerWarningDialog } from '../../src/features/danger/DangerWarningDialog.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';

// Mock the GameStateManager
const mockGameStateManager = {
  getState: vi.fn(() => ({
    player: {
      currentSystem: 0,
      karma: 0,
      factions: {
        authorities: 0,
        traders: 0,
        outlaws: 0,
        civilians: 0,
      },
    },
    ship: {
      cargo: [],
      engine: 100,
      upgrades: [],
      quirks: [],
    },
  })),
  dangerManager: {
    getDangerZone: vi.fn((systemId) => {
      if (systemId === 0 || systemId === 1) return 'safe';
      if (systemId === 7 || systemId === 10) return 'contested';
      return 'dangerous';
    }),
    calculatePirateEncounterChance: vi.fn(() => 0.2),
    calculateInspectionChance: vi.fn(() => 0.1),
  },
};

// Mock the custom hooks
vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn((eventName) => {
    switch (eventName) {
      case 'cargoChanged':
        return [];
      case 'engineChanged':
        return 100;
      case 'upgradesChanged':
        return [];
      case 'factionRepChanged':
        return {
          authorities: 0,
          traders: 0,
          outlaws: 0,
          civilians: 0,
        };
      default:
        return {};
    }
  }),
}));

describe('DangerWarningDialog', () => {
  const defaultProps = {
    destinationSystemId: 15,
    destinationSystemName: 'Wolf 359',
    onProceed: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (props = {}) => {
    return render(
      <GameProvider gameStateManager={mockGameStateManager}>
        <DangerWarningDialog {...defaultProps} {...props} />
      </GameProvider>
    );
  };

  it('should display destination system name', () => {
    renderWithContext();
    expect(screen.getByText('Wolf 359')).toBeInTheDocument();
  });

  it('should display danger zone classification', () => {
    renderWithContext();
    expect(screen.getByText('Dangerous')).toBeInTheDocument();
  });

  it('should display pirate encounter probability', () => {
    renderWithContext();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Pirate Encounters')).toBeInTheDocument();
  });

  it('should display inspection probability', () => {
    renderWithContext();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('Customs Inspections')).toBeInTheDocument();
  });

  it('should show proceed and cancel buttons', () => {
    renderWithContext();
    expect(screen.getByText('Accept Risk & Proceed')).toBeInTheDocument();
    expect(screen.getByText('Cancel Jump')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    renderWithContext({ onCancel });
    
    fireEvent.click(screen.getByText('Cancel Jump'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should show confirmation for dangerous systems', () => {
    renderWithContext();
    
    fireEvent.click(screen.getByText('Accept Risk & Proceed'));
    expect(screen.getByText('Are you sure you want to jump to this dangerous system?')).toBeInTheDocument();
    expect(screen.getByText('Yes, Proceed Anyway')).toBeInTheDocument();
    expect(screen.getByText('No, Go Back')).toBeInTheDocument();
  });

  it('should call onProceed when confirmed for dangerous systems', () => {
    const onProceed = vi.fn();
    renderWithContext({ onProceed });
    
    // Click proceed button
    fireEvent.click(screen.getByText('Accept Risk & Proceed'));
    
    // Confirm the dangerous jump
    fireEvent.click(screen.getByText('Yes, Proceed Anyway'));
    
    expect(onProceed).toHaveBeenCalledOnce();
  });

  it('should proceed directly for safe systems', () => {
    const onProceed = vi.fn();
    mockGameStateManager.dangerManager.getDangerZone.mockReturnValue('safe');
    
    renderWithContext({ 
      destinationSystemId: 0,
      destinationSystemName: 'Sol',
      onProceed 
    });
    
    fireEvent.click(screen.getByText('Proceed'));
    expect(onProceed).toHaveBeenCalledOnce();
  });

  it('should display close button', () => {
    renderWithContext();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should call onCancel when close button is clicked', () => {
    const onCancel = vi.fn();
    renderWithContext({ onCancel });
    
    fireEvent.click(screen.getByText('×'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});