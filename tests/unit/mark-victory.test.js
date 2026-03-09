import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

describe('markVictory', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('moves the player to Delta Pavonis', () => {
    gsm.markVictory();
    expect(gsm.getState().player.currentSystem).toBe(
      ENDGAME_CONFIG.DELTA_PAVONIS_ID
    );
  });
});
