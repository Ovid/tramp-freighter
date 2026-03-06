import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NARRATIVE_EVENTS } from '@game/data/narrative-events.js';
import * as wormholeGraph from '@game/utils/wormhole-graph.js';

describe('dock_generic_rumor', () => {
  const rumor = NARRATIVE_EVENTS.find((e) => e.id === 'dock_generic_rumor');

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have a generateContent function', () => {
    expect(typeof rumor.generateContent).toBe('function');
  });

  it('should generate text referencing an active economic event at a reachable system', () => {
    // System 3 is reachable from system 0 within 3 hops
    vi.spyOn(wormholeGraph, 'getReachableSystems').mockReturnValue([
      { systemId: 3, hopCount: 1 },
    ]);

    const state = {
      player: { currentSystem: 0 },
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

  it('should generate vague text when active events are only at unreachable systems', () => {
    // No systems reachable
    vi.spyOn(wormholeGraph, 'getReachableSystems').mockReturnValue([]);

    const state = {
      player: { currentSystem: 0 },
      world: {
        activeEvents: [
          {
            type: 'mining_strike',
            systemId: 99,
            modifiers: { ore: 1.5 },
          },
        ],
        priceKnowledge: {},
      },
    };
    const starData = [{ id: 99, name: 'Far Away System' }];

    const content = rumor.generateContent(state, starData);

    const fullText = content.text.join(' ');
    expect(fullText).not.toContain('Far Away System');
    expect(fullText).toContain('Markets are shifting');
  });

  it('should reference an active event at the current system', () => {
    // getReachableSystems excludes the origin; the fix adds currentSystem explicitly
    vi.spyOn(wormholeGraph, 'getReachableSystems').mockReturnValue([]);

    const state = {
      player: { currentSystem: 5 },
      world: {
        activeEvents: [
          {
            type: 'mining_strike',
            systemId: 5,
            modifiers: { ore: 1.5 },
          },
        ],
        priceKnowledge: {},
      },
    };
    const starData = [{ id: 5, name: 'Luyten 726-8' }];

    const content = rumor.generateContent(state, starData);

    const fullText = content.text.join(' ');
    expect(fullText).toContain('Luyten 726-8');
    expect(fullText.toLowerCase()).toMatch(/ore/i);
  });

  it('should generate vague text when no active events', () => {
    const state = {
      player: { currentSystem: 0 },
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
