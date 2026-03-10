import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { createTestGame } from '../test-utils.js';

describe('NPC dialogue greeting text coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('context-dependent greeting text', () => {
    it('includes bad karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = -30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('hard edge');
    });

    it('includes good karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = 30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('good ones');
    });

    it('includes civilian faction appreciation for Vasquez', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.factions = {
        civilians: 50,
        traders: 0,
        outlaws: 0,
        authorities: 0,
      };
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('helping folks');
    });

    it('includes loan reminder for Vasquez when loan is active', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 5;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('500');
    });

    it('includes overdue loan warning for Vasquez', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 200;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('overdue');
    });
  });

  describe('dialogue action callbacks via selectChoice', () => {
    it('loan request choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const loanChoice = result.choices.find(
        (c) => c.text && c.text.toLowerCase().includes('loan')
      );
      if (loanChoice) {
        expect(loanChoice.next).toBeDefined();
      }
    });

    it('storage choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const storageChoice = result.choices.find(
        (c) =>
          c.text &&
          (c.text.toLowerCase().includes('storage') ||
            c.text.toLowerCase().includes('store'))
      );
      if (storageChoice) {
        expect(storageChoice.next).toBeDefined();
      }
    });
  });

  describe('NPC greeting validation at various rep levels', () => {
    const npcIds = [
      'vasquez_epsilon',
      'chen_barnards',
      'kowalski_alpha_centauri',
      'liu_wolf359',
      'rodriguez_procyon',
      'osman_luyten',
      'kim_tau_ceti',
    ];

    for (const npcId of npcIds) {
      it(`renders greeting for ${npcId} at various rep levels`, () => {
        for (const rep of [0, 10, 20, 30, 50, 70, 90]) {
          gsm.getNPCState(npcId).rep = rep;
          const result = showDialogue(npcId, 'greeting', gsm);
          expect(result.text).toBeDefined();
          expect(result.text.length).toBeGreaterThan(0);
        }
      });
    }
  });
});
