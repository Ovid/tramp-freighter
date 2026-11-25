/**
 * Conversation choices award their repGain only once per NPC, so repeating
 * a dialogue chain cannot farm reputation. Choices with a real cost
 * (actions, cargo pickers) pay every time the action succeeds.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';
import {
  NPC_BENEFITS_CONFIG,
  REPUTATION_BOUNDS,
} from '../../src/game/constants.js';

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

  it('keeps a claim when choices are inserted above it in a later version', () => {
    const npcId = 'tanaka_barnards';
    const node = YUKI_TANAKA_DIALOGUE.about_work;
    const askFurther = (index) => {
      showDialogue(npcId, 'about_work', game);
      selectChoice(npcId, index, game);
      game.clearDialogueState();
    };

    askFurther(0); // "How much further?" (+1)
    const afterFirst = game.getNPCState(npcId).rep;
    node.choices.unshift({ text: 'A newly added line', next: null });
    try {
      askFurther(1);
    } finally {
      node.choices.shift();
    }

    expect(game.getNPCState(npcId).rep).toBe(afterFirst);
  });
});

describe('Dialogue repGain on action choices', () => {
  let game;
  const npcId = 'kim_tau_ceti';
  const choose = (nodeId) => {
    showDialogue(npcId, nodeId, game);
    selectChoice(npcId, 0, game);
    game.clearDialogueState();
  };

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    game.getNPCState(npcId).rep = REPUTATION_BOUNDS.TRUSTED_MIN;
  });

  it('pays dialogue rep on every successful loan cycle', () => {
    choose('request_loan');
    choose('repay_loan');
    game.getState().player.daysElapsed +=
      NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS + 1;

    const before = game.getNPCState(npcId).rep;
    choose('request_loan');

    const dialogueRep = 3;
    expect(game.getNPCState(npcId).rep - before).toBe(
      dialogueRep + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS
    );
  });

  it('pays no dialogue rep when the action fails', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = game.getNPCState(npcId).rep;
    choose('repay_loan'); // no outstanding loan

    expect(game.getNPCState(npcId).rep).toBe(before);
  });
});
