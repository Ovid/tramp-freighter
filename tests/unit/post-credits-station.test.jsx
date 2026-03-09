import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PostCreditsStation } from '../../src/features/endgame/PostCreditsStation.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
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
});
