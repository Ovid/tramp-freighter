import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Integration: SystemPanel accessibility', () => {
  let game;

  beforeEach(() => {
    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  function panel(viewingSystemId, props = {}) {
    return (
      <GameProvider game={game}>
        <StarmapProvider
          value={{
            selectStarById: props.selectStarById ?? vi.fn(),
            deselectStar: vi.fn(),
          }}
        >
          <SystemPanel
            viewingSystemId={viewingSystemId}
            onClose={props.onClose ?? (() => {})}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </StarmapProvider>
      </GameProvider>
    );
  }

  it('close button calls onClose without arguments, so the star is deselected', () => {
    const onClose = vi.fn();
    render(panel(game.getState().player.currentSystem, { onClose }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]).toEqual([]);
  });
});
