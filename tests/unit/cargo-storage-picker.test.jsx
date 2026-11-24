import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { CargoStoragePicker } from '../../src/features/cargo-storage/CargoStoragePicker.jsx';
import { createTestGame } from '../test-utils.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;

describe('CargoStoragePicker', () => {
  let game;
  let onConfirm;
  let onCancel;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
    game.getNPCState(NPC_ID).storedCargo = [];
    onConfirm = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPicker = (mode) =>
    render(
      <GameProvider game={game}>
        <CargoStoragePicker
          mode={mode}
          npcId={NPC_ID}
          npcName={NPC_NAME}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </GameProvider>
    );

  const more = (good, price) =>
    screen.getByRole('button', {
      name: `Store one more ${good} bought at ${price} credits`,
    });
  const less = (good, price) =>
    screen.getByRole('button', {
      name: `Store one less ${good} bought at ${price} credits`,
    });
  const max = (good, price) =>
    screen.getByRole('button', {
      name: `Store as many ${good} bought at ${price} credits as fit`,
    });

  it('shows mission cargo as not storable, without controls', () => {
    game.updateCargo([
      { good: 'sealed_containers', qty: 2, buyPrice: 0, missionId: 'm1' },
      { good: 'grain', qty: 2, buyPrice: 10 },
    ]);
    renderPicker('store');
    expect(
      screen.getByText('Mission Cargo (cannot be stored)')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Sealed Containers/ })
    ).not.toBeInTheDocument();
  });

  it('tells apart two stacks of the same good by buy price', () => {
    game.updateCargo([
      { good: 'grain', qty: 2, buyPrice: 10 },
      { good: 'grain', qty: 2, buyPrice: 12 },
    ]);
    renderPicker('store');
    expect(
      screen.getByText('Qty: 2 | Bought at: 10 ₡/unit')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Qty: 2 | Bought at: 12 ₡/unit')
    ).toBeInTheDocument();
    expect(more('Grain', 10)).not.toBe(more('Grain', 12));
  });

  it('+ and − change the quantity and + stops at the limit', () => {
    game.getNPCState(NPC_ID).storedCargo = [
      {
        good: 'ore',
        qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - 2,
        buyPrice: 1,
      },
    ];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    fireEvent.click(more('Grain', 10));
    fireEvent.click(more('Grain', 10));
    expect(more('Grain', 10)).toBeDisabled();
    fireEvent.click(less('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 1 unit' })).toBeEnabled();
  });

  it('Max on a second row fills only what is left', () => {
    game.updateCargo([
      { good: 'grain', qty: 8, buyPrice: 10 },
      { good: 'ore', qty: 8, buyPrice: 20 },
    ]);
    renderPicker('store');
    fireEvent.click(max('Grain', 10));
    fireEvent.click(max('Ore', 20));
    fireEvent.click(screen.getByRole('button', { name: /^Store \d+ units?$/ }));
    expect(onConfirm).toHaveBeenCalledWith([
      { stackIndex: 0, qty: 8 },
      { stackIndex: 1, qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - 8 },
    ]);
  });

  it('shows the selected total, already stored and the favor warning', () => {
    game.getNPCState(NPC_ID).storedCargo = [
      { good: 'ore', qty: 3, buyPrice: 1 },
    ];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    expect(
      screen.getByText('Selected: 0 / 7 (3 already stored)')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Storing uses ${NPC_NAME}'s favor: no more storage or loans from them for ${NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS} days.`
      )
    ).toBeInTheDocument();
  });

  it('disables confirm at 0 and pluralizes its label', () => {
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    expect(
      screen.getByRole('button', { name: 'Store 0 units' })
    ).toBeDisabled();
    fireEvent.click(more('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 1 unit' })).toBeEnabled();
    fireEvent.click(more('Grain', 10));
    fireEvent.click(more('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 3 units' })).toBeEnabled();
  });

  it('leaves a row set back to 0 out of the selections', () => {
    game.updateCargo([
      { good: 'grain', qty: 5, buyPrice: 10 },
      { good: 'ore', qty: 5, buyPrice: 20 },
    ]);
    renderPicker('store');
    fireEvent.click(more('Grain', 10));
    fireEvent.click(less('Grain', 10));
    fireEvent.click(more('Ore', 20));
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));
    expect(onConfirm).toHaveBeenCalledWith([{ stackIndex: 1, qty: 1 }]);
  });

  it('shows "No cargo you can store" when nothing is storable', () => {
    game.updateCargo([
      { good: 'sealed_containers', qty: 2, buyPrice: 0, missionId: 'm1' },
    ]);
    renderPicker('store');
    expect(screen.getByText('No cargo you can store')).toBeInTheDocument();
  });

  it('shows "No cargo you can store" when storage is already over the cap', () => {
    // Older saves can hold more than the cap
    game.getNPCState(NPC_ID).storedCargo = [
      {
        good: 'ore',
        qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT + 5,
        buyPrice: 1,
      },
    ];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    expect(screen.getByText('No cargo you can store')).toBeInTheDocument();
  });

  it('shows "No room in your hold" when retrieving into a full hold', () => {
    game.getNPCState(NPC_ID).storedCargo = [
      { good: 'ore', qty: 3, buyPrice: 1 },
    ];
    game.updateCargo([
      { good: 'grain', qty: game.getState().ship.cargoCapacity, buyPrice: 10 },
    ]);
    renderPicker('retrieve');
    expect(screen.getByText('No room in your hold')).toBeInTheDocument();
  });

  it('retrieve mode lists stored cargo and reads "(hold space)"', () => {
    game.getNPCState(NPC_ID).storedCargo = [
      { good: 'ore', qty: 3, buyPrice: 1 },
    ];
    game.updateCargo([]);
    renderPicker('retrieve');
    const space = game.getCargoRemaining();
    expect(
      screen.getByText(`Selected: 0 / ${space} (hold space)`)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retrieve as many Ore bought at 1 credits as fit',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retrieve 3 units' }));
    expect(onConfirm).toHaveBeenCalledWith([{ stackIndex: 0, qty: 3 }]);
  });

  it('Cancel calls onCancel', () => {
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
