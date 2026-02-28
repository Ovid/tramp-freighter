import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RefuelPanel } from '../../src/features/refuel/RefuelPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Tests that RefuelPanel slider max accounts for NPC discounts.
 *
 * Bug: calculateMaxRefuel and validateRefuel were called with undiscounted
 * fuelPrice, making the slider cap more restrictive than the actual
 * discounted transaction allows.
 */
describe('RefuelPanel discount affects slider max', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('slider max should be higher when NPC discount is available', () => {
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Sol, price = 2 cr/%, fuel at 20% (80% capacity remaining)
    gameStateManager.state.player.currentSystem = 0;
    gameStateManager.state.ship.fuel = 20;
    gameStateManager.state.player.credits = 80;

    // Without discount: max affordable = floor(80/2) = 40
    // With 20% discount: effective price = 1.6, max affordable = floor(80/1.6) = 50
    // Capacity = 80, so credits are the bottleneck either way.
    // Expected slider max without discount: 40
    // Expected slider max with discount: 50

    // Mock getServiceDiscount to simulate a 20% refuel discount NPC
    const originalGetServiceDiscount =
      gameStateManager.getServiceDiscount.bind(gameStateManager);
    vi.spyOn(gameStateManager, 'getServiceDiscount').mockImplementation(
      (npcId, serviceType) => {
        if (serviceType === 'refuel') {
          return { discount: 0.2, npcName: 'Test NPC' };
        }
        return originalGetServiceDiscount(npcId, serviceType);
      }
    );

    const wrapper = createWrapper(gameStateManager);
    render(<RefuelPanel onClose={() => {}} />, { wrapper });

    // The Max button shows the slider max value
    const maxButton = screen.getByRole('button', { name: /Max/ });
    const maxMatch = maxButton.textContent.match(/(\d+)/);
    const sliderMax = Number(maxMatch[1]);

    // With discount, player should be able to refuel 50%, not just 40%
    expect(sliderMax).toBe(50);
  });

  it('slider max should use undiscounted price when no discount available', () => {
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Sol, price = 2 cr/%, fuel at 20%, 80 credits
    gameStateManager.state.player.currentSystem = 0;
    gameStateManager.state.ship.fuel = 20;
    gameStateManager.state.player.credits = 80;

    // No discount mock — default behavior (no refuel NPCs exist)
    // max affordable = floor(80/2) = 40

    const wrapper = createWrapper(gameStateManager);
    render(<RefuelPanel onClose={() => {}} />, { wrapper });

    const maxButton = screen.getByRole('button', { name: /Max/ });
    const maxMatch = maxButton.textContent.match(/(\d+)/);
    const sliderMax = Number(maxMatch[1]);

    expect(sliderMax).toBe(40);
  });
});
