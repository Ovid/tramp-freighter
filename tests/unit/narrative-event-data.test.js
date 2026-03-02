import { describe, it, expect } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Narrative Event Data', () => {
  it('should export a non-empty array', () => {
    expect(Array.isArray(NARRATIVE_EVENTS)).toBe(true);
    expect(NARRATIVE_EVENTS.length).toBeGreaterThan(0);
  });

  it('should have unique IDs', () => {
    const ids = NARRATIVE_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  NARRATIVE_EVENTS.forEach((event) => {
    describe(`event: ${event.id}`, () => {
      it('should have required fields', () => {
        expect(event.id).toEqual(expect.any(String));
        expect(event.id.length).toBeGreaterThan(0);
        expect(['dock', 'jump', 'time', 'condition', 'chain']).toContain(
          event.type
        );
        expect(event.category).toBe('narrative');
        expect(event.priority).toEqual(expect.any(Number));
      });

      it('should have a trigger with chance', () => {
        // Chain events don't need triggers
        if (event.type === 'chain') return;
        expect(event.trigger).toEqual(
          expect.objectContaining({ chance: expect.any(Number) })
        );
        expect(event.trigger.chance).toBeGreaterThan(0);
        expect(event.trigger.chance).toBeLessThanOrEqual(1);
      });

      it('should have content with text and choices', () => {
        expect(event.content).toEqual(
          expect.objectContaining({
            text: expect.any(Array),
            choices: expect.any(Array),
          })
        );
        expect(event.content.text.length).toBeGreaterThan(0);
        expect(event.content.choices.length).toBeGreaterThan(0);
      });

      it('should have valid choice structure', () => {
        event.content.choices.forEach((choice) => {
          expect(typeof choice.text).toBe('string');
          expect(choice).toHaveProperty('next');
          expect(choice).toHaveProperty('effects');
        });
      });
    });
  });

  describe('dock_cheap_fuel event', () => {
    const cheapFuel = NARRATIVE_EVENTS.find((e) => e.id === 'dock_cheap_fuel');

    it('Deal choice should reward fuel when costing credits', () => {
      const dealChoice = cheapFuel.content.choices.find(
        (c) => c.effects.costs.credits > 0
      );
      expect(dealChoice.effects.rewards.fuelMinimum).toBeGreaterThan(0);
    });
  });

  describe('time_debt_warning text', () => {
    const debtWarning = NARRATIVE_EVENTS.find(
      (e) => e.id === 'time_debt_warning'
    );

    it('should not threaten actions that are not implemented', () => {
      const fullText = debtWarning.content.text.join(' ');
      expect(fullText).not.toMatch(/come looking|come find|hunt you/i);
    });
  });

  describe('cargo reward schema', () => {
    const eventsWithCargo = NARRATIVE_EVENTS.flatMap((event) =>
      event.content.choices
        .filter((c) => c.effects?.rewards?.cargo)
        .map((c) => ({
          eventId: event.id,
          choiceText: c.text,
          cargo: c.effects.rewards.cargo,
        }))
    );

    eventsWithCargo.forEach(({ eventId, choiceText, cargo }) => {
      it(`${eventId} choice "${choiceText}" uses canonical cargo fields`, () => {
        cargo.forEach((item) => {
          expect(item).toHaveProperty('good');
          expect(item).toHaveProperty('qty');
          expect(item).toHaveProperty('buyPrice');
          expect(item).not.toHaveProperty('type');
          expect(item).not.toHaveProperty('quantity');
          expect(item).not.toHaveProperty('purchasePrice');
        });
      });
    });
  });

  describe('breadcrumb events', () => {
    it('should include dock_barnards_engineer_rumor event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_engineer_rumor'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
    });

    it('should include dock_beyond_the_lanes_rumor event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_beyond_the_lanes_rumor'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
    });

    it('should include dock_barnards_pre_tanaka event', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_pre_tanaka'
      );
      expect(event).toBeDefined();
      expect(event.type).toBe('dock');
      expect(event.once).toBe(true);
      expect(event.trigger.system).toBe(4);
    });

    it('dock_barnards_engineer_rumor requires 5+ systems and tanaka_met not set', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_engineer_rumor'
      );
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const systemsCondition = conditions.find(
        (c) => c.type === 'systems_visited_count'
      );
      const flagCondition = conditions.find(
        (c) => c.type === 'flag_not_set'
      );
      expect(systemsCondition).toBeDefined();
      expect(systemsCondition.value).toBe(5);
      expect(flagCondition).toBeDefined();
      expect(flagCondition.flag).toBe('tanaka_met');
    });

    it('dock_beyond_the_lanes_rumor requires 3+ systems visited', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_beyond_the_lanes_rumor'
      );
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const systemsCondition = conditions.find(
        (c) => c.type === 'systems_visited_count'
      );
      expect(systemsCondition).toBeDefined();
      expect(systemsCondition.value).toBe(3);
    });

    it('dock_barnards_pre_tanaka requires Barnard\'s Star and tanaka_met not set', () => {
      const event = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_barnards_pre_tanaka'
      );
      expect(event.trigger.system).toBe(4);
      const conditions = event.trigger.condition;
      expect(Array.isArray(conditions)).toBe(true);
      const flagCondition = conditions.find(
        (c) => c.type === 'flag_not_set'
      );
      expect(flagCondition).toBeDefined();
      expect(flagCondition.flag).toBe('tanaka_met');
    });
  });
});
