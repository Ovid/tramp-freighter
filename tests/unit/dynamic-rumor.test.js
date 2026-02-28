import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NARRATIVE_EVENTS } from '@game/data/narrative-events.js';

describe('dock_generic_rumor', () => {
  const rumor = NARRATIVE_EVENTS.find((e) => e.id === 'dock_generic_rumor');

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should have a generateContent function', () => {
    expect(typeof rumor.generateContent).toBe('function');
  });

  it('should generate text referencing an active economic event', () => {
    const state = {
      world: {
        activeEvents: [
          {
            type: 'mining_strike',
            systemId: 3,
            modifiers: { ore: 1.5 },
          },
        ],
        priceKnowledge: {},
      },
    };
    const starData = [{ id: 3, name: 'Tau Ceti' }];

    const content = rumor.generateContent(state, starData);

    expect(content.text.length).toBeGreaterThan(0);
    const fullText = content.text.join(' ');
    expect(fullText).toContain('Tau Ceti');
    expect(fullText.toLowerCase()).toMatch(/ore/i);
  });

  it('should generate vague text when no active events', () => {
    const state = {
      world: {
        activeEvents: [],
        priceKnowledge: {},
      },
    };
    const starData = [];

    const content = rumor.generateContent(state, starData);

    expect(content.text.length).toBeGreaterThan(0);
    const fullText = content.text.join(' ');
    expect(fullText).toBeTruthy();
  });
});
