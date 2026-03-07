import { describe, it, expect } from 'vitest';
import {
  YUMI_TANAKA_POSTCREDITS,
  ALL_NPCS,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

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
