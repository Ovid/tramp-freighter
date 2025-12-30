import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DangerWarningDialog } from '../../src/features/danger/DangerWarningDialog';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Unit tests for DangerWarningDialog component
 * 
 * Tests the DangerWarningDialog component in isolation,
 * focusing on rendering, user interactions, and data display.
 * 
 * Feature: danger-system
 * Validates: Requirements 1.3, 12.1, 12.2, 12.3, 12.4, 12.5
 */
describe('DangerWarningDialog', () => {
  let gameStateManager;
  let navigationSystem;

  beforeEach(() => {
    // Create NavigationSystem and GameStateManager properly
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    gameStateManager.initNewGame();

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const renderDangerWarningDialog = (props = {}) => {
    const defaultProps = {
      destinationSystemId: 73, // 70 Ophiuchi A (dangerous)
      destinationSystemName: '70 Ophiuchi A',
      onProceed: vi.fn(),
      onCancel: vi.fn(),
      ...props,
    };

    return render(
      <GameProvider gameStateManager={gameStateManager}>
        <DangerWarningDialog {...defaultProps} />
      </GameProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render dialog with correct title and destination', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('Jump Warning')).toBeInTheDocument();
      expect(screen.getByText('70 Ophiuchi A')).toBeInTheDocument();
      expect(screen.getByText('Destination')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderDangerWarningDialog();

      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render risk assessment section', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Pirate Encounters')).toBeInTheDocument();
      expect(screen.getByText('Customs Inspections')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('Accept Risk & Proceed')).toBeInTheDocument();
      expect(screen.getByText('Cancel Jump')).toBeInTheDocument();
    });
  });

  describe('Danger Zone Classification Display', () => {
    it('should display "Dangerous" for dangerous systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 73, // 70 Ophiuchi A
        destinationSystemName: '70 Ophiuchi A',
      });

      expect(screen.getByText('Dangerous')).toBeInTheDocument();
      expect(screen.getByText('Security Level:')).toBeInTheDocument();
    });

    it('should display "Contested" for contested systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 7, // Sirius
        destinationSystemName: 'Sirius',
      });

      expect(screen.getByText('Contested')).toBeInTheDocument();
    });

    it('should display zone description', () => {
      renderDangerWarningDialog();

      // Should show description for dangerous zone
      expect(screen.getByText(/Frontier systems with high pirate activity/)).toBeInTheDocument();
    });
  });

  describe('Risk Assessment Display', () => {
    it('should display pirate encounter probability as percentage', () => {
      renderDangerWarningDialog();

      // Should show percentage for pirate encounters
      const percentageElements = screen.getAllByText(/%$/);
      expect(percentageElements.length).toBeGreaterThanOrEqual(2); // At least pirate and inspection
    });

    it('should display inspection probability as percentage', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('Probability of customs inspection upon arrival')).toBeInTheDocument();
    });

    it('should show risk factors when cargo is present', () => {
      // Add cargo to trigger risk factors
      const state = gameStateManager.getState();
      state.ship.cargo.push({
        type: 'electronics',
        quantity: 10,
        purchasePrice: 100,
        purchaseSystem: 4,
        purchaseDate: 0
      });

      renderDangerWarningDialog();

      expect(screen.getByText('Risk Modifiers')).toBeInTheDocument();
      expect(screen.getByText('Cargo value affects pirate encounter chance')).toBeInTheDocument();
    });

    it('should show engine condition risk factor when engine is damaged', () => {
      // Damage engine to trigger risk factor
      gameStateManager.updateShipCondition(100, 40, 100); // Engine at 40%

      renderDangerWarningDialog();

      expect(screen.getByText('Risk Modifiers')).toBeInTheDocument();
      expect(screen.getByText('Poor engine condition increases pirate risk')).toBeInTheDocument();
    });

    it('should show advanced sensors benefit when installed', () => {
      // Add advanced sensors upgrade
      const state = gameStateManager.getState();
      state.ship.upgrades.push('advanced_sensors');

      renderDangerWarningDialog();

      expect(screen.getByText('Risk Modifiers')).toBeInTheDocument();
      expect(screen.getByText('Advanced sensors reduce pirate detection')).toBeInTheDocument();
    });
  });

  describe('Safety Recommendations', () => {
    it('should show safety recommendations for dangerous systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        destinationSystemName: '70 Ophiuchi A',
      });

      expect(screen.getByText('Safety Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Dangerous zone - high pirate activity expected')).toBeInTheDocument();
      expect(screen.getByText('Ensure ship systems are in good condition')).toBeInTheDocument();
    });

    it('should show different recommendations for contested systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 7, // Contested system
        destinationSystemName: 'Sirius',
      });

      expect(screen.getByText('Safety Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Contested zone - moderate risk of encounters')).toBeInTheDocument();
    });

    it('should show general recommendations for all dangerous zones', () => {
      renderDangerWarningDialog();

      expect(screen.getByText('Consider cargo value vs. risk tolerance')).toBeInTheDocument();
      expect(screen.getByText('Alternative routes through safer systems may be available')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onProceed when "Accept Risk & Proceed" is clicked', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({ 
        destinationSystemId: 73, // Dangerous system
        destinationSystemName: '70 Ophiuchi A',
        onProceed: mockOnProceed 
      });

      const proceedButton = screen.getByText('Accept Risk & Proceed');
      fireEvent.click(proceedButton);

      // For dangerous systems, should show confirmation dialog first
      expect(screen.getByText('Are you sure you want to jump to this dangerous system?')).toBeInTheDocument();
      
      // Click final confirmation
      const confirmButton = screen.getByText('Yes, Proceed Anyway');
      fireEvent.click(confirmButton);

      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when "Cancel Jump" is clicked', () => {
      const mockOnCancel = vi.fn();
      renderDangerWarningDialog({ onCancel: mockOnCancel });

      const cancelButton = screen.getByText('Cancel Jump');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button (×) is clicked', () => {
      const mockOnCancel = vi.fn();
      renderDangerWarningDialog({ onCancel: mockOnCancel });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should show confirmation dialog for dangerous systems', () => {
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        destinationSystemName: '70 Ophiuchi A',
      });

      const proceedButton = screen.getByText('Accept Risk & Proceed');
      fireEvent.click(proceedButton);

      // Should show confirmation for dangerous systems
      expect(screen.getByText('Are you sure you want to jump to this dangerous system?')).toBeInTheDocument();
      expect(screen.getByText('Yes, Proceed Anyway')).toBeInTheDocument();
      expect(screen.getByText('No, Go Back')).toBeInTheDocument();
    });

    it('should proceed directly for contested systems without confirmation', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 7, // Contested system
        destinationSystemName: 'Sirius',
        onProceed: mockOnProceed,
      });

      const proceedButton = screen.getByText('Proceed');
      fireEvent.click(proceedButton);

      // Should call onProceed directly without confirmation
      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should handle confirmation dialog interactions', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        onProceed: mockOnProceed,
      });

      // Click initial proceed button
      const proceedButton = screen.getByText('Accept Risk & Proceed');
      fireEvent.click(proceedButton);

      // Should show confirmation
      expect(screen.getByText('Yes, Proceed Anyway')).toBeInTheDocument();

      // Click final confirmation
      const confirmButton = screen.getByText('Yes, Proceed Anyway');
      fireEvent.click(confirmButton);

      expect(mockOnProceed).toHaveBeenCalledTimes(1);
    });

    it('should cancel confirmation dialog', () => {
      const mockOnProceed = vi.fn();
      renderDangerWarningDialog({
        destinationSystemId: 73, // Dangerous system
        onProceed: mockOnProceed,
      });

      // Click initial proceed button
      const proceedButton = screen.getByText('Accept Risk & Proceed');
      fireEvent.click(proceedButton);

      // Click "No, Go Back"
      const goBackButton = screen.getByText('No, Go Back');
      fireEvent.click(goBackButton);

      // Should return to original dialog
      expect(screen.getByText('Accept Risk & Proceed')).toBeInTheDocument();
      expect(mockOnProceed).not.toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    it('should handle null faction data gracefully', () => {
      // Corrupt faction data
      const state = gameStateManager.getState();
      state.player.factions = null;

      // Should not crash
      expect(() => {
        renderDangerWarningDialog();
      }).not.toThrow();

      expect(screen.getByText('Jump Warning')).toBeInTheDocument();
    });

    it('should handle missing ship condition data gracefully', () => {
      // Should not crash with default ship condition
      expect(() => {
        renderDangerWarningDialog();
      }).not.toThrow();

      expect(screen.getByText('Jump Warning')).toBeInTheDocument();
    });

    it('should handle empty cargo array', () => {
      // Ensure cargo is empty
      const state = gameStateManager.getState();
      state.ship.cargo = [];

      renderDangerWarningDialog();

      // Should not show cargo risk factor
      expect(screen.queryByText('Cargo value affects pirate encounter chance')).not.toBeInTheDocument();
    });

    it('should handle missing upgrades array', () => {
      // Remove upgrades
      const state = gameStateManager.getState();
      state.ship.upgrades = [];

      renderDangerWarningDialog();

      // Should not show advanced sensors benefit
      expect(screen.queryByText('Advanced sensors reduce pirate detection')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', () => {
      renderDangerWarningDialog();

      // Should have dialog container with proper ID
      const dialog = document.getElementById('danger-warning-dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('visible');
    });

    it('should have proper heading hierarchy', () => {
      renderDangerWarningDialog();

      // Should have h2 for main title
      const mainTitle = screen.getByRole('heading', { level: 2 });
      expect(mainTitle).toHaveTextContent('Jump Warning');

      // Should have h3 for sections
      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have focusable buttons', () => {
      renderDangerWarningDialog();

      const proceedButton = screen.getByText('Accept Risk & Proceed');
      const cancelButton = screen.getByText('Cancel Jump');
      const closeButton = screen.getByText('×');

      expect(proceedButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
      expect(closeButton).not.toBeDisabled();
    });
  });
});