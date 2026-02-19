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
        expect(event.id).toBeTruthy();
        expect(['dock', 'jump', 'time', 'condition', 'chain']).toContain(
          event.type
        );
        expect(event.category).toBe('narrative');
        expect(typeof event.priority).toBe('number');
      });

      it('should have a trigger with chance', () => {
        // Chain events don't need triggers
        if (event.type === 'chain') return;
        expect(event.trigger).toBeTruthy();
        expect(typeof event.trigger.chance).toBe('number');
        expect(event.trigger.chance).toBeGreaterThan(0);
        expect(event.trigger.chance).toBeLessThanOrEqual(1);
      });

      it('should have content with text and choices', () => {
        expect(event.content).toBeTruthy();
        expect(Array.isArray(event.content.text)).toBe(true);
        expect(event.content.text.length).toBeGreaterThan(0);
        expect(Array.isArray(event.content.choices)).toBe(true);
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
});
