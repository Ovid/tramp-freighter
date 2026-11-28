import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { PostCreditsStation } from '../../src/features/endgame/PostCreditsStation.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('PostCreditsStation', () => {
  let game;

  beforeEach(() => {
    cleanup();
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  it('should render Return to Title button with station-btn styling', () => {
    render(
      <GameProvider game={game}>
        <PostCreditsStation onOpenPanel={() => {}} onReturnToTitle={() => {}} />
      </GameProvider>
    );

    const button = screen.getByText('Return to Title');
    expect(button.tagName).toBe('BUTTON');
    expect(button.classList.contains('station-btn')).toBe(true);
  });

  it('shows the initial-rep tier for an NPC with no stored state', () => {
    delete game.getState().npcs.yumi_delta_pavonis;
    render(
      <GameProvider game={game}>
        <PostCreditsStation onOpenPanel={() => {}} onReturnToTitle={() => {}} />
      </GameProvider>
    );

    expect(screen.getByText('Yumi Tanaka')).toBeInTheDocument();
    expect(screen.getByText('Warm')).toBeInTheDocument();
  });

  it('shows the tier of an NPC with stored reputation', () => {
    game.getNPCState('yumi_delta_pavonis').rep = 95;
    render(
      <GameProvider game={game}>
        <PostCreditsStation onOpenPanel={() => {}} onReturnToTitle={() => {}} />
      </GameProvider>
    );

    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('updates the tier badge when rep changes while open', () => {
    render(
      <GameProvider game={game}>
        <PostCreditsStation onOpenPanel={() => {}} onReturnToTitle={() => {}} />
      </GameProvider>
    );
    act(() => game.setNpcRep('yumi_delta_pavonis', 95));
    expect(screen.getByText('Family')).toBeInTheDocument();
  });
});
