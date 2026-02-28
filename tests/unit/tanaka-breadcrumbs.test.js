import { describe, it, expect } from 'vitest';
import { WEI_CHEN_DIALOGUE } from '../../src/game/data/dialogue/wei-chen.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

/**
 * Unit tests for Tanaka quest narrative breadcrumbs.
 * Feature: tanaka-breadcrumbs
 *
 * Validates that Wei Chen and Captain Vasquez dialogue trees provide
 * narrative guidance for discovering and progressing through the Tanaka quest.
 */

function makeContext(overrides = {}) {
  return {
    karma: 0,
    canGetTip: { available: false },
    narrativeFlags: {},
    systemsVisited: 0,
    getQuestStage: () => 0,
    getQuestState: () => null,
    canStartQuestStage: () => false,
    canContributeSupply: () => false,
    hasClaimedStageRewards: () => false,
    shipHull: 100,
    shipEngine: 100,
    debt: 0,
    credits: 0,
    ...overrides,
  };
}

describe('Wei Chen Tanaka Breadcrumbs', () => {
  const greeting = WEI_CHEN_DIALOGUE.greeting;

  function findChoice(text, rep, context) {
    return greeting.choices.find((c) => {
      if (!c.text.includes(text)) return false;
      if (c.condition) return c.condition(rep, context);
      return true;
    });
  }

  describe('Pre-Discovery: station_gossip choice', () => {
    it('appears when tanaka_met is NOT set', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears once tanaka_met is set', () => {
      const ctx = makeContext({
        systemsVisited: 3,
        narrativeFlags: { tanaka_met: true },
      });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeUndefined();
    });

    it('has no rep requirement (available at rep 0)', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const choice = findChoice('Bore Station', 0, ctx);
      expect(choice).toBeDefined();
    });
  });

  describe('station_gossip node text', () => {
    it('mentions needing more experience when systems < threshold', () => {
      const ctx = makeContext({ systemsVisited: 3 });
      const text = WEI_CHEN_DIALOGUE.station_gossip.text(0, ctx);
      expect(text).toMatch(/been around/i);
    });

    it('encourages talking to Tanaka when systems >= threshold', () => {
      const ctx = makeContext({
        systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
      });
      const text = WEI_CHEN_DIALOGUE.station_gossip.text(0, ctx);
      expect(text).toMatch(/talk to you|worth/i);
    });
  });

  describe('Post-Meeting: tanaka_gossip choice', () => {
    it('appears when tanaka_met AND quest stage 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 0,
      });
      const choice = findChoice('Tanaka', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when quest stage > 0', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
      });
      // Should not match the tanaka_gossip choice (stage 0 only)
      const choices = greeting.choices.filter((c) => {
        if (!c.text.includes('Tanaka') || !c.text.includes('know')) return false;
        if (c.condition) return c.condition(0, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('tanaka_gossip node text', () => {
    it('mentions electronics and medicine', () => {
      const raw = WEI_CHEN_DIALOGUE.tanaka_gossip.text;
      const text = typeof raw === 'function' ? raw(0) : raw;
      expect(text).toMatch(/electronics/i);
      expect(text).toMatch(/medicine/i);
    });
  });

  describe('Mid-Quest: tanaka_progress choice', () => {
    it('appears when quest active but next stage blocked', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
        canStartQuestStage: () => false,
      });
      const choice = findChoice('Tanaka', 0, ctx);
      expect(choice).toBeDefined();
    });

    it('disappears when next stage is available', () => {
      const ctx = makeContext({
        narrativeFlags: { tanaka_met: true },
        getQuestStage: () => 1,
        canStartQuestStage: () => true,
      });
      // The mid-quest hint should hide when the player CAN advance
      const choices = greeting.choices.filter((c) => {
        if (!c.next || c.next !== 'tanaka_progress') return false;
        if (c.condition) return c.condition(0, ctx);
        return true;
      });
      expect(choices).toHaveLength(0);
    });
  });

  describe('tanaka_progress node text', () => {
    it('encourages bringing research supplies', () => {
      const raw = WEI_CHEN_DIALOGUE.tanaka_progress.text;
      const text = typeof raw === 'function' ? raw(0) : raw;
      expect(text).toMatch(/supplies|electronics|medicine/i);
    });
  });
});
