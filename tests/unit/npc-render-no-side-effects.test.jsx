import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { StationMenu } from '../../src/features/station/StationMenu.jsx';
import { PostCreditsStation } from '../../src/features/endgame/PostCreditsStation.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { createTestGame } from '../test-utils.js';

// Rendering must not create NPC records or schedule a save.
describe('NPC tier display has no side effects', () => {
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

  it('getNPCRep returns stored rep, or initial rep without creating state', () => {
    expect(game.getNPCRep('cole_sol')).toBe(-20);
    expect(game.getState().npcs).toEqual({});
    game.getNPCState('cole_sol').rep = 42;
    expect(game.getNPCRep('cole_sol')).toBe(42);
  });
});
