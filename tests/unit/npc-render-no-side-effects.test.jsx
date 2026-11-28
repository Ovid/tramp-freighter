import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { StationMenu } from '../../src/features/station/StationMenu.jsx';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';
import { PostCreditsStation } from '../../src/features/endgame/PostCreditsStation.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { createTestGame } from '../test-utils.js';

// Rendering must not create NPC records or schedule a save, and tier
// displays must follow rep changes made while they are open.
describe('NPC tier display', () => {
  let game;

  beforeEach(() => {
    cleanup();
    game = createTestGame();
    game.getState().npcs = {};
  });

  it.each([
    [
      'StationMenu',
      <StationMenu key="s" onOpenPanel={() => {}} onUndock={() => {}} />,
    ],
    [
      'PostCreditsStation',
      <PostCreditsStation
        key="p"
        onOpenPanel={() => {}}
        onReturnToTitle={() => {}}
      />,
    ],
  ])('rendering %s leaves NPC state untouched', (_name, element) => {
    const markDirty = vi.spyOn(game, 'markDirty');
    render(<GameProvider game={game}>{element}</GameProvider>);
    expect(game.getState().npcs).toEqual({});
    expect(markDirty).not.toHaveBeenCalled();
  });

  // Refuel, Repair and Info Broker panels call this during render. Chen's
  // service is docking, so 'refuel' covers the early mismatch return and
  // 'docking' covers the rep read.
  it.each(['refuel', 'docking'])(
    'getServiceDiscount(%s) leaves NPC state untouched',
    (service) => {
      const markDirty = vi.spyOn(game, 'markDirty');
      expect(game.getServiceDiscount('chen_barnards', service).discount).toBe(
        0
      );
      expect(game.getState().npcs).toEqual({});
      expect(markDirty).not.toHaveBeenCalled();
    }
  );

  it('canGetFreeRepair leaves NPC state untouched', () => {
    const markDirty = vi.spyOn(game, 'markDirty');
    expect(game.canGetFreeRepair('chen_barnards').available).toBe(false);
    expect(game.getState().npcs).toEqual({});
    expect(markDirty).not.toHaveBeenCalled();
  });

  it('canGetFreeRepair creates no record when initial rep already qualifies', () => {
    const npcData = game.npcManager.validateAndGetNPCData('chen_barnards');
    const originalRep = npcData.initialRep;
    npcData.initialRep = 75;
    try {
      expect(game.canGetFreeRepair('chen_barnards').available).toBe(true);
      expect(game.getState().npcs).toEqual({});
    } finally {
      npcData.initialRep = originalRep;
    }
  });

  it('StationMenu updates the tier badge when rep changes while open', () => {
    const { getByText } = render(
      <GameProvider game={game}>
        <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
      </GameProvider>
    );
    act(() => game.setNpcRep('cole_sol', 95));
    expect(getByText('Family')).toBeTruthy();
  });

  it('RepairPanel updates the free repair tier when rep changes while open', () => {
    game.updateShipCondition(90, 100, 100);
    game.setNpcRep('cole_sol', 75);
    const { getByText } = render(
      <GameProvider game={game}>
        <RepairPanel onClose={() => {}} />
      </GameProvider>
    );
    expect(getByText(/Trusted Tier/)).toBeTruthy();
    act(() => game.setNpcRep('cole_sol', 95));
    expect(getByText(/Family Tier/)).toBeTruthy();
  });

  it('getNPCRep returns stored rep, or initial rep without creating state', () => {
    expect(game.getNPCRep('cole_sol')).toBe(-20);
    expect(game.getState().npcs).toEqual({});
    game.getNPCState('cole_sol').rep = 42;
    expect(game.getNPCRep('cole_sol')).toBe(42);
  });
});
