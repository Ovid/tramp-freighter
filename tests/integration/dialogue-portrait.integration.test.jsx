import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('DialoguePanel portrait', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('console', { log: vi.fn(), error: vi.fn(), warn: vi.fn() });
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the NPC's portrait beside their dialogue", async () => {
    const { container } = render(
      <GameProvider game={game}>
        <DialoguePanel npcId="chen_barnards" onClose={vi.fn()} />
      </GameProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('img.portrait')?.getAttribute('src')).toBe(
        '/portraits/npc/chen_barnards.webp'
      );
    });
  });
});
