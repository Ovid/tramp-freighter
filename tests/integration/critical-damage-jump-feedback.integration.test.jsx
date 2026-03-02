import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel.jsx';

// Mock useDangerZone
vi.mock('../../src/hooks/useDangerZone', () => ({
  useDangerZone: () => 'safe',
}));

// Mock StarmapContext
vi.mock('../../src/context/StarmapContext', () => ({
  useStarmap: () => ({ selectStarById: vi.fn() }),
}));

// Mock star data: two connected systems
vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2V', wh: 1, r: 1, st: 1 },
    {
      id: 1,
      x: 10,
      y: 0,
      z: 0,
      name: 'Alpha Centauri',
      type: 'G2V',
      wh: 1,
      r: 1,
      st: 1,
    },
  ],
}));

// Mock GameContext
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    navigationSystem: {
      getConnectedSystems: () => [1],
      calculateDistanceBetween: () => 4.3,
      calculateFuelCost: () => 15,
      calculateFuelCostWithCondition: () => 15,
      calculateJumpTime: () => 1,
    },
    getState: () => ({
      ship: {
        quirks: [],
        upgrades: [],
        engine: 100,
        hull: 100,
        lifeSupport: 100,
      },
    }),
    calculateShipCapabilities: () => ({ fuelConsumption: 1.0 }),
    applyQuirkModifiers: (val) => val,
  }),
}));

// Mock useGameAction
vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    executeJump: vi.fn(),
  }),
}));

// Track useGameEvent and useJumpValidation per test
let mockCurrentSystemId = 0;
let mockFuel = 100;
let mockUpgrades = [];

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'locationChanged') return mockCurrentSystemId;
    if (eventName === 'fuelChanged') return mockFuel;
    if (eventName === 'upgradesChanged') return mockUpgrades;
    return null;
  },
}));

let mockValidation = { valid: true, distance: 4.3, fuelCost: 15, jumpTime: 1 };

vi.mock('../../src/hooks/useJumpValidation', () => ({
  useJumpValidation: () => mockValidation,
}));

describe('Integration: Critical Damage Jump Feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentSystemId = 0;
    mockFuel = 100;
    mockUpgrades = [];
    mockValidation = {
      valid: true,
      reason: null,
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };
  });

  it('shows critical damage modal when viewing a target system with critical damage', () => {
    mockValidation = {
      valid: false,
      reason: 'critical_damage',
      error: 'Hull (5%) critically damaged. Repairs required before departure.',
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Ship Damaged')).toBeTruthy();
    expect(
      screen.getAllByText(/critically damaged/).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(
        'Dock at a station for repairs before attempting a jump.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Understood')).toBeTruthy();
  });

  it('disables jump button when validation fails due to critical damage', () => {
    mockValidation = {
      valid: false,
      reason: 'critical_damage',
      error: 'Hull (5%) critically damaged. Repairs required before departure.',
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    const jumpBtn = screen.getByText('Jump to System');
    expect(jumpBtn.disabled).toBe(true);
  });

  it('dismisses critical damage modal when Understood is clicked', () => {
    mockValidation = {
      valid: false,
      reason: 'critical_damage',
      error: 'Hull (5%) critically damaged. Repairs required before departure.',
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Ship Damaged')).toBeTruthy();

    fireEvent.click(screen.getByText('Understood'));

    expect(screen.queryByText('Ship Damaged')).toBeNull();
  });

  it('does not show critical damage modal when viewing current system', () => {
    mockValidation = {
      valid: false,
      reason: 'critical_damage',
      error: 'Hull (5%) critically damaged. Repairs required before departure.',
      distance: 0,
      fuelCost: 0,
      jumpTime: 0,
    };

    render(
      <SystemPanel
        viewingSystemId={0}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    expect(screen.queryByText('Ship Damaged')).toBeNull();
  });

  it('does not show critical damage modal when validation passes', () => {
    mockValidation = {
      valid: true,
      reason: null,
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    expect(screen.queryByText('Ship Damaged')).toBeNull();
  });

  it('does not show critical damage modal for non-critical validation errors', () => {
    mockValidation = {
      valid: false,
      reason: 'insufficient_fuel',
      error: 'Not enough fuel for this jump.',
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    expect(screen.queryByText('Ship Damaged')).toBeNull();
    // The inline error should still show
    expect(screen.getByText('Not enough fuel for this jump.')).toBeTruthy();
  });

  it('shows inline validation error alongside the modal for critical damage', () => {
    mockValidation = {
      valid: false,
      reason: 'critical_damage',
      error: 'Hull (5%) critically damaged. Repairs required before departure.',
      distance: 4.3,
      fuelCost: 15,
      jumpTime: 1,
    };

    render(
      <SystemPanel
        viewingSystemId={1}
        onClose={vi.fn()}
        onJumpStart={vi.fn()}
        onJumpComplete={vi.fn()}
      />
    );

    // Modal shows
    expect(screen.getByText('Ship Damaged')).toBeTruthy();

    // Inline validation message also shows (in the panel behind the modal)
    const errorMessages = screen.getAllByText(/critically damaged/);
    expect(errorMessages.length).toBeGreaterThanOrEqual(2); // modal + inline
  });
});
