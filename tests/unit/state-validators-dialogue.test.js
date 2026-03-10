import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateStateStructure } from '../../src/game/state/state-validators.js';

describe('validateStateStructure dialogue state validation', () => {
  let validState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    validState = {
      meta: { version: '5.0', timestamp: Date.now() },
      player: {
        currentSystem: 0,
        credits: 1000,
        daysElapsed: 10,
        karma: 0,
        debt: 0,
        factions: { traders: 0, civilians: 0, outlaws: 0, authorities: 0 },
      },
      ship: {
        name: 'Test',
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        fuelCapacity: 100,
        cargo: [],
        quirks: [],
        upgrades: [],
      },
      world: {
        visitedSystems: [0],
      },
      missions: {
        active: [],
        completed: [],
        failed: [],
        board: [],
      },
    };
  });

  it('accepts valid state without dialogue', () => {
    expect(validateStateStructure(validState)).toBe(true);
  });

  it('rejects dialogue as non-object', () => {
    validState.dialogue = 'invalid';
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects dialogue as null', () => {
    validState.dialogue = null;
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects dialogue with non-string currentNpcId', () => {
    validState.dialogue = {
      currentNpcId: 123,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects dialogue with non-string currentNodeId', () => {
    validState.dialogue = {
      currentNpcId: null,
      currentNodeId: 123,
      isActive: false,
      display: null,
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects dialogue with non-boolean isActive', () => {
    validState.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: 'true',
      display: null,
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects dialogue with non-object display', () => {
    validState.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: 'invalid',
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('accepts valid dialogue with all null fields', () => {
    validState.dialogue = {
      currentNpcId: null,
      currentNodeId: null,
      isActive: false,
      display: null,
    };
    expect(validateStateStructure(validState)).toBe(true);
  });

  it('accepts valid dialogue with active state', () => {
    validState.dialogue = {
      currentNpcId: 'chen_barnards',
      currentNodeId: 'greeting',
      isActive: true,
      display: { text: 'Hello' },
    };
    expect(validateStateStructure(validState)).toBe(true);
  });
});

describe('validateStateStructure NPC validation', () => {
  let validState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    validState = {
      meta: { version: '5.0', timestamp: Date.now() },
      player: {
        currentSystem: 0,
        credits: 1000,
        daysElapsed: 10,
        karma: 0,
        debt: 0,
        factions: { traders: 0, civilians: 0, outlaws: 0, authorities: 0 },
      },
      ship: {
        name: 'Test',
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        fuelCapacity: 100,
        cargo: [],
        quirks: [],
        upgrades: [],
      },
      world: {
        visitedSystems: [0],
      },
      missions: {
        active: [],
        completed: [],
        failed: [],
        board: [],
      },
    };
  });

  it('rejects NPC state with non-number rep', () => {
    validState.npcs = {
      chen: { rep: 'high', lastInteraction: 0, flags: [], interactions: 0 },
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('rejects NPC state with non-array flags', () => {
    validState.npcs = {
      chen: { rep: 10, lastInteraction: 0, flags: 'none', interactions: 0 },
    };
    expect(validateStateStructure(validState)).toBe(false);
  });

  it('accepts valid NPC state', () => {
    validState.npcs = {
      chen: { rep: 10, lastInteraction: 0, flags: [], interactions: 5 },
    };
    expect(validateStateStructure(validState)).toBe(true);
  });
});
