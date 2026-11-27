import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { RepairPanel } from '../../src/features/repair/RepairPanel';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { ALL_NPCS } from '../../src/game/data/npc-data';

// The repair panel shows a price on every button; the player must be charged
// exactly that price. These cases use damage levels where per-system and
// combined rounding agree, so they pin behaviour that must not change when the
// price calculation moves out of the panel.
const REPAIR_NPC = ALL_NPCS.find((npc) => npc.discountService === 'repair');
const FRIENDLY_REP = 35;
const PLENTY_OF_CREDITS = 10000;

function priceOf(button) {
  return Number(button.textContent.match(/₡(\d+)/)[1]);
}

describe('RepairPanel charges the price it displays', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.isTestEnvironment = true;
    game.initNewGame();
    game.updateCredits(PLENTY_OF_CREDITS);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderPanel = () =>
    render(
      <GameProvider game={game}>
        <RepairPanel onClose={() => {}} />
      </GameProvider>
    );

  const giveDiscount = () => {
    game.updateLocation(REPAIR_NPC.system);
    game.getNPCState(REPAIR_NPC.id).rep = FRIENDLY_REP;
    expect(game.getServiceDiscount(REPAIR_NPC.id, 'repair').discount).toBe(0.1);
  };

  it('charges the Repair All price with no discount and restores every system', () => {
    game.updateShipCondition(70, 80, 90);
    renderPanel();

    const button = screen.getByRole('button', { name: /Repair All to Full/ });
    const shown = priceOf(button);
    fireEvent.click(button);

    expect(shown).toBe(300);
    expect(game.getState().player.credits).toBe(PLENTY_OF_CREDITS - shown);
    expect(game.getState().ship.hull).toBe(100);
    expect(game.getState().ship.engine).toBe(100);
    expect(game.getState().ship.lifeSupport).toBe(100);
  });

  it('disables Repair All when the player cannot afford the undiscounted total', () => {
    game.updateShipCondition(70, 80, 90);
    game.updateCredits(299);
    renderPanel();

    expect(
      screen.getByRole('button', { name: /Repair All to Full/ })
    ).toBeDisabled();
  });

  it('charges the Repair All price with a discount when rounding agrees', () => {
    giveDiscount();
    game.updateShipCondition(90, 90, 90);
    renderPanel();

    const button = screen.getByRole('button', { name: /Repair All to Full/ });
    const shown = priceOf(button);
    fireEvent.click(button);

    expect(shown).toBe(135);
    expect(game.getState().player.credits).toBe(PLENTY_OF_CREDITS - shown);
    expect(game.getState().ship.hull).toBe(100);
  });

  it('charges the per-system discounted price shown on the button', () => {
    giveDiscount();
    game.updateShipCondition(50, 100, 100);
    renderPanel();

    const button = screen.getAllByRole('button', { name: /\+25% \(₡/ })[0];
    const shown = priceOf(button);
    fireEvent.click(button);

    expect(shown).toBe(113);
    expect(game.getState().player.credits).toBe(PLENTY_OF_CREDITS - shown);
    expect(game.getState().ship.hull).toBe(75);
  });

  it('charges the per-system Full price with no discount', () => {
    game.updateShipCondition(100, 60, 100);
    renderPanel();

    const buttons = screen.getAllByRole('button', { name: /^Full \(₡/ });
    const engineFull = buttons.find((b) => priceOf(b) > 0);
    const shown = priceOf(engineFull);
    fireEvent.click(engineFull);

    expect(shown).toBe(200);
    expect(game.getState().player.credits).toBe(PLENTY_OF_CREDITS - shown);
    expect(game.getState().ship.engine).toBe(100);
  });
});
