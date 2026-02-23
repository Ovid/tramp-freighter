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
});
