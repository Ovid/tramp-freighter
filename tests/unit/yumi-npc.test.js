import { describe, it, expect } from 'vitest';
import {
  YUMI_TANAKA_POSTCREDITS,
  ALL_NPCS,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';
import { YUMI_TANAKA_POSTCREDITS_DIALOGUE } from '../../src/game/data/dialogue/yumi-tanaka.js';
import { validateDialogueTree } from '../../src/game/data/dialogue/validation.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';

describe('Yumi Tanaka NPC definition', () => {
  it('passes NPC validation', () => {
    expect(() => validateNPCDefinition(YUMI_TANAKA_POSTCREDITS)).not.toThrow();
  });

  it('is located at Delta Pavonis', () => {
    expect(YUMI_TANAKA_POSTCREDITS.system).toBe(ENDGAME_CONFIG.DELTA_PAVONIS_ID);
  });

  it('is hidden with post_credits reveal flag', () => {
    expect(YUMI_TANAKA_POSTCREDITS.hidden).toBe(true);
    expect(YUMI_TANAKA_POSTCREDITS.revealFlag).toBe('post_credits');
  });

  it('starts at Warm reputation', () => {
    expect(YUMI_TANAKA_POSTCREDITS.initialRep).toBe(10);
  });

  it('is included in ALL_NPCS', () => {
    expect(ALL_NPCS).toContain(YUMI_TANAKA_POSTCREDITS);
  });

  it('has Colony Director role', () => {
    expect(YUMI_TANAKA_POSTCREDITS.role).toBe('Colony Director');
  });
});

describe('Yumi Tanaka dialogue tree', () => {
  it('passes dialogue validation', () => {
    expect(() => validateDialogueTree(YUMI_TANAKA_POSTCREDITS_DIALOGUE)).not.toThrow();
  });

  it('is registered in ALL_DIALOGUE_TREES', () => {
    expect(ALL_DIALOGUE_TREES.yumi_delta_pavonis).toBe(YUMI_TANAKA_POSTCREDITS_DIALOGUE);
  });

  it('greeting text varies by interaction round', () => {
    const greeting = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting;
    const makeCtx = (interactions) => ({ npcState: { interactions } });

    expect(greeting.text(10, makeCtx(0))).toContain('still here');
    expect(greeting.text(10, makeCtx(1))).toContain("you're back");
    expect(greeting.text(10, makeCtx(2))).toContain('Seriously');
    expect(greeting.text(10, makeCtx(3))).toContain('game is over');
    expect(greeting.text(10, makeCtx(99))).toContain('game is over');
  });

  it('round 1 choices only visible when interactions === 0', () => {
    const choices = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting.choices;
    const round1Choices = choices.filter(
      (c) => c.condition && c.condition(10, { npcState: { interactions: 0 } })
    );
    const round1ChoicesAtRound2 = choices.filter(
      (c) => c.condition && c.condition(10, { npcState: { interactions: 1 } })
    );
    expect(round1Choices.length).toBe(3);
    const r1Texts = round1Choices.map((c) => c.text);
    const r2Texts = round1ChoicesAtRound2.map((c) => c.text);
    expect(r1Texts.some((t) => r2Texts.includes(t))).toBe(false);
  });

  it('response nodes increment interactions via action', () => {
    const r1Response = YUMI_TANAKA_POSTCREDITS_DIALOGUE.r1_find;
    expect(r1Response).toBeDefined();
    const goodbyeChoice = r1Response.choices[0];
    const mockCtx = { npcState: { interactions: 0 } };
    goodbyeChoice.action(mockCtx);
    expect(mockCtx.npcState.interactions).toBe(1);
  });

  it('goodbye choice in greeting increments interactions', () => {
    const choices = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting.choices;
    const goodbye = choices.find((c) => !c.condition && c.text.includes('Goodbye'));
    expect(goodbye).toBeDefined();
    const mockCtx = { npcState: { interactions: 0 } };
    goodbye.action(mockCtx);
    expect(mockCtx.npcState.interactions).toBe(1);
  });
});
