import { describe, it, expect } from 'vitest';
import {
  EVENT_NAMES,
  EVENT_STATE_MAP,
  SOL_SYSTEM_ID,
} from '../../src/game/constants.js';

describe('EVENT_STATE_MAP', () => {
  // Events not in EVENT_STATE_MAP pass data directly (no state extraction).
  // They are signal-only or carry data via the emit call itself.
  const directDataEvents = [
    EVENT_NAMES.CONDITION_WARNING,
    EVENT_NAMES.ENCOUNTER_TRIGGERED,
    EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED,
    EVENT_NAMES.SAVE_FAILED,
    EVENT_NAMES.JUMP_ANIMATION_NEAR_END,
    EVENT_NAMES.EXOTIC_MATTER_COLLECTED,
    EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED,
    EVENT_NAMES.PAVONIS_RUN_TRIGGERED,
    EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED,
    EVENT_NAMES.DEBT_CLEARED,
    EVENT_NAMES.DOCKED,
    EVENT_NAMES.UNDOCKED,
    EVENT_NAMES.JUMP_COMPLETED,
    EVENT_NAMES.ACHIEVEMENT_UNLOCKED,
  ];

  it('has a mapping for every state-extracting EVENT_NAME', () => {
    const eventNames = Object.values(EVENT_NAMES);
    const mappedEvents = Object.keys(EVENT_STATE_MAP);

    for (const name of eventNames) {
      if (!directDataEvents.includes(name)) {
        expect(mappedEvents, `Missing mapping for ${name}`).toContain(name);
      }
    }
  });

  it('each mapping is a function that accepts state and returns a value', () => {
    for (const [eventName, extractor] of Object.entries(EVENT_STATE_MAP)) {
      expect(typeof extractor, `${eventName} extractor is not a function`).toBe(
        'function'
      );
    }
  });

  it('does not include direct-data events', () => {
    const mappedEvents = Object.keys(EVENT_STATE_MAP);
    for (const name of directDataEvents) {
      expect(
        mappedEvents,
        `${name} should not be in EVENT_STATE_MAP (it is a direct-data event)`
      ).not.toContain(name);
    }
  });

  it('extractors return expected values from mock state', () => {
    const mockState = {
      player: {
        credits: 1000,
        debt: 500,
        currentSystem: SOL_SYSTEM_ID,
        daysElapsed: 42,
        karma: 5,
        factions: { traders: 10 },
        finance: { loanRate: 0.05 },
      },
      ship: {
        fuel: 80,
        cargo: [{ good: 'ore', qty: 5, buyPrice: 10 }],
        cargoCapacity: 100,
        hiddenCargo: [],
        hull: 90,
        engine: 85,
        lifeSupport: 95,
        name: 'Rocinante',
        upgrades: { scanner: true },
        quirks: ['leaky'],
      },
      world: {
        priceKnowledge: { Sol: {} },
        activeEvents: ['drought'],
        intelligence: { pirateBase: 'Tau Ceti' },
      },
      dialogue: { npcId: 'bartender', node: 'greeting' },
      missions: {
        active: [{ id: 1 }],
        completed: [],
        failed: [],
        board: [],
        boardLastRefresh: 0,
        pendingFailureNotices: [],
      },
      quests: { mainQuest: 'active' },
      achievements: { firstTrade: true },
      npcs: { bartender: { trust: 5 } },
      preferences: { musicVolume: 0.8 },
    };

    expect(EVENT_STATE_MAP[EVENT_NAMES.CREDITS_CHANGED](mockState)).toBe(1000);
    expect(EVENT_STATE_MAP[EVENT_NAMES.DEBT_CHANGED](mockState)).toBe(500);
    expect(EVENT_STATE_MAP[EVENT_NAMES.FUEL_CHANGED](mockState)).toBe(80);
    expect(EVENT_STATE_MAP[EVENT_NAMES.LOCATION_CHANGED](mockState)).toBe(
      SOL_SYSTEM_ID
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.TIME_CHANGED](mockState)).toBe(42);
    expect(EVENT_STATE_MAP[EVENT_NAMES.CARGO_CHANGED](mockState)).toEqual([
      { good: 'ore', qty: 5, buyPrice: 10 },
    ]);
    expect(EVENT_STATE_MAP[EVENT_NAMES.CARGO_CAPACITY_CHANGED](mockState)).toBe(
      100
    );
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.HIDDEN_CARGO_CHANGED](mockState)
    ).toEqual([]);
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.SHIP_CONDITION_CHANGED](mockState)
    ).toEqual({
      hull: 90,
      engine: 85,
      lifeSupport: 95,
    });
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED](mockState)
    ).toEqual({
      Sol: {},
    });
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.ACTIVE_EVENTS_CHANGED](mockState)
    ).toEqual(['drought']);
    expect(EVENT_STATE_MAP[EVENT_NAMES.SHIP_NAME_CHANGED](mockState)).toBe(
      'Rocinante'
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.UPGRADES_CHANGED](mockState)).toEqual({
      scanner: true,
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.QUIRKS_CHANGED](mockState)).toEqual([
      'leaky',
    ]);
    expect(EVENT_STATE_MAP[EVENT_NAMES.DIALOGUE_CHANGED](mockState)).toEqual({
      npcId: 'bartender',
      node: 'greeting',
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.HULL_CHANGED](mockState)).toBe(90);
    expect(EVENT_STATE_MAP[EVENT_NAMES.ENGINE_CHANGED](mockState)).toBe(85);
    expect(EVENT_STATE_MAP[EVENT_NAMES.LIFE_SUPPORT_CHANGED](mockState)).toBe(
      95
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.KARMA_CHANGED](mockState)).toBe(5);
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.INTELLIGENCE_CHANGED](mockState)
    ).toEqual({
      pirateBase: 'Tau Ceti',
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.CURRENT_SYSTEM_CHANGED](mockState)).toBe(
      SOL_SYSTEM_ID
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.FACTION_REP_CHANGED](mockState)).toEqual(
      {
        traders: 10,
      }
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.MISSIONS_CHANGED](mockState)).toEqual(
      mockState.missions
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.QUEST_CHANGED](mockState)).toEqual({
      mainQuest: 'active',
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.FINANCE_CHANGED](mockState)).toEqual({
      loanRate: 0.05,
    });
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.ACHIEVEMENTS_CHANGED](mockState)
    ).toEqual({
      firstTrade: true,
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.NPCS_CHANGED](mockState)).toEqual({
      bartender: { trust: 5 },
    });
    expect(EVENT_STATE_MAP[EVENT_NAMES.PREFERENCES_CHANGED](mockState)).toEqual(
      {
        musicVolume: 0.8,
      }
    );
  });

  it('extractors use fallback defaults when state properties are missing', () => {
    const minimalState = {
      player: { credits: 0, debt: 0, currentSystem: 'Sol', daysElapsed: 0 },
      ship: {
        fuel: 0,
        cargo: [],
        cargoCapacity: 0,
        hiddenCargo: [],
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        name: '',
        upgrades: {},
        quirks: [],
      },
      world: { priceKnowledge: {}, activeEvents: [] },
      dialogue: null,
    };

    expect(EVENT_STATE_MAP[EVENT_NAMES.KARMA_CHANGED](minimalState)).toBe(0);
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.INTELLIGENCE_CHANGED](minimalState)
    ).toEqual({});
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.FACTION_REP_CHANGED](minimalState)
    ).toEqual({});
    expect(EVENT_STATE_MAP[EVENT_NAMES.MISSIONS_CHANGED](minimalState)).toEqual(
      {
        active: [],
        completed: [],
        failed: [],
        board: [],
        boardLastRefresh: 0,
        pendingFailureNotices: [],
      }
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.QUEST_CHANGED](minimalState)).toEqual(
      {}
    );
    expect(EVENT_STATE_MAP[EVENT_NAMES.FINANCE_CHANGED](minimalState)).toBe(
      null
    );
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.ACHIEVEMENTS_CHANGED](minimalState)
    ).toEqual({});
    expect(EVENT_STATE_MAP[EVENT_NAMES.NPCS_CHANGED](minimalState)).toEqual({});
    expect(
      EVENT_STATE_MAP[EVENT_NAMES.PREFERENCES_CHANGED](minimalState)
    ).toEqual({});
  });
});
