import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock all hooks TradePanel depends on
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: vi.fn((eventName) => {
    const defaults = {
      cargoChanged: [],
      creditsChanged: 1000,
      locationChanged: 'sol',
      timeChanged: 1,
      cargoCapacityChanged: 20,
      upgradesChanged: ['smuggler_panels'],
      hiddenCargoChanged: [],
      missionsChanged: { active: [] },
    };
    return defaults[eventName] ?? null;
  }),
}));

vi.mock('../../src/hooks/useTradeActions', () => ({
  useTradeActions: () => ({
    buyGood: vi.fn(),
    sellGood: vi.fn(),
    recordVisitedPrices: vi.fn(),
    getCurrentSystemPrices: () => ({
      food: 10,
      water: 8,
      minerals: 15,
      tech: 50,
      medicine: 30,
      luxuries: 80,
    }),
  }),
}));

vi.mock('../../src/hooks/useShipActions', () => ({
  useShipActions: () => ({
    moveToHiddenCargo: vi.fn(),
    moveToRegularCargo: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [
    {
      id: 'sol',
      name: 'Sol',
      economy: 'industrial',
      techLevel: 5,
      goods: {
        food: { basePrice: 10, qty: 100 },
        water: { basePrice: 8, qty: 100 },
      },
    },
  ],
}));

vi.mock('../../src/hooks/useDangerZone', () => ({
  useDangerZone: () => null,
}));

describe('TradePanel accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hidden cargo toggle button should have aria-expanded reflecting collapsed state', async () => {
    const { TradePanel } =
      await import('../../src/features/trade/TradePanel.jsx');
    render(<TradePanel onClose={() => {}} />);

    const toggleButton = screen.getByRole('button', { name: /show|hide/i });
    // Initially not collapsed, so aria-expanded should be true
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(toggleButton).toHaveAttribute(
      'aria-controls',
      'hidden-cargo-content'
    );

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click again to expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });
});
