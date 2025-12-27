/**
 * @fileoverview Integration tests for RepairPanel free repair functionality
 *
 * Tests the integration between RepairPanel UI and GameStateManager free repair methods.
 * Verifies that free repair options appear when available and function correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { SHIP_CONFIG, NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock console methods
vi.stubGlobal('console', {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe('RepairPanel Free Repair Integration', () => {
  let gameStateManager;
  let mockOnClose;

  beforeEach(() => {
    // Create fresh GameStateManager instance
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
    
    // Mock onClose function
    mockOnClose = vi.fn();
    
    // Set up test scenario: player at Sol with damaged hull
    const state = gameStateManager.getState();
    state.player.currentSystem = 0; // Sol
    state.ship.hull = 70; // 30% hull damage
    
    // Set up Marcus Cole (at Sol) with Trusted reputation for free repair
    const marcusId = 'cole_sol';
    const marcusState = gameStateManager.getNPCState(marcusId);
    marcusState.rep = 65; // Trusted tier
    marcusState.lastFreeRepairDay = null; // No previous free repair
  });

  const renderRepairPanel = () => {
    return render(
      <GameProvider gameStateManager={gameStateManager}>
        <RepairPanel onClose={mockOnClose} />
      </GameProvider>
    );
  };

  it('should display free repair option when NPC at Trusted tier is available', () => {
    renderRepairPanel();

    // Should show free repair section
    expect(screen.getByText('Free Repair Available')).toBeInTheDocument();
    
    // Should show Marcus Cole as available for free repair
    expect(screen.getByText('Marcus Cole (Loan Shark)')).toBeInTheDocument();
    
    // Should show repair limit for Trusted tier
    expect(screen.getByText(`Can repair up to ${NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted}% hull damage`)).toBeInTheDocument();
    
    // Should show actual repair amount (10% since hull is at 70%)
    expect(screen.getByText('Will repair: 10.0% hull damage')).toBeInTheDocument();
    
    // Should have enabled free repair button
    const freeRepairButton = screen.getByText('Get Free Repair');
    expect(freeRepairButton).toBeInTheDocument();
    expect(freeRepairButton).not.toBeDisabled();
  });

  it('should not display free repair section when no NPCs are available', () => {
    // Set Marcus Cole to Cold reputation (no free repair)
    const marcusState = gameStateManager.getNPCState('cole_sol');
    marcusState.rep = -20; // Cold tier
    
    renderRepairPanel();

    // Should not show free repair section
    expect(screen.queryByText('Free Repair Available')).not.toBeInTheDocument();
  });

  it('should apply free repair when button is clicked', () => {
    renderRepairPanel();

    const freeRepairButton = screen.getByText('Get Free Repair');
    
    // Click the free repair button
    fireEvent.click(freeRepairButton);
    
    // Should show success message
    expect(screen.getByText(/Free repair completed:/)).toBeInTheDocument();
    
    // Hull should be repaired by 10% (from 70% to 80%)
    const state = gameStateManager.getState();
    expect(state.ship.hull).toBe(80);
    
    // Marcus Cole's lastFreeRepairDay should be set
    const marcusState = gameStateManager.getNPCState('cole_sol');
    expect(marcusState.lastFreeRepairDay).toBe(state.player.daysElapsed);
  });

  it('should disable free repair button when no hull damage exists', () => {
    // Set hull to maximum condition
    const state = gameStateManager.getState();
    state.ship.hull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    
    renderRepairPanel();

    // Should show "No hull damage to repair"
    expect(screen.getByText('No hull damage to repair')).toBeInTheDocument();
    
    // Free repair button should be disabled
    const freeRepairButton = screen.getByText('Get Free Repair');
    expect(freeRepairButton).toBeDisabled();
  });

  it('should show higher repair limit for Family tier NPC', () => {
    // Set Marcus Cole to Family reputation
    const marcusState = gameStateManager.getNPCState('cole_sol');
    marcusState.rep = 95; // Family tier
    
    renderRepairPanel();

    // Should show Family tier repair limit
    expect(screen.getByText(`Can repair up to ${NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family}% hull damage`)).toBeInTheDocument();
  });

  it('should not show free repair option when already used today', () => {
    // Set Marcus Cole as having used free repair today
    const state = gameStateManager.getState();
    const marcusState = gameStateManager.getNPCState('cole_sol');
    marcusState.lastFreeRepairDay = state.player.daysElapsed;
    
    renderRepairPanel();

    // Should not show free repair section since no NPCs are available
    expect(screen.queryByText('Free Repair Available')).not.toBeInTheDocument();
  });
});