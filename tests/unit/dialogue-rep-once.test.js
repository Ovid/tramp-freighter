/**
 * Conversation choices award their repGain only once per NPC, so repeating
 * a dialogue chain cannot farm reputation. Choices with a real cost
 * (actions, cargo pickers) are unaffected.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue repGain is awarded once per choice', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  it('does not grant rep again when the same conversation is repeated', () => {
    const npcId = 'tanaka_barnards';
    const askFurther = () => {
      showDialogue(npcId, 'about_work', game);
      const index = 0; // "How much further?" (+1)
      selectChoice(npcId, index, game);
      game.clearDialogueState();
    };

    const start = game.getNPCState(npcId).rep;
    askFurther();
    const afterFirst = game.getNPCState(npcId).rep;
    askFurther();

    expect(afterFirst).toBeGreaterThan(start);
    expect(game.getNPCState(npcId).rep).toBe(afterFirst);
  });
});
