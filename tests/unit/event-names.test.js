import { describe, it, expect } from 'vitest';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('EVENT_NAMES', () => {
  it('exports a frozen object of event name constants', () => {
    expect(EVENT_NAMES).toBeDefined();
    expect(Object.isFrozen(EVENT_NAMES)).toBe(true);
  });

  it('contains all required event names', () => {
    const requiredEvents = [
      'CREDITS_CHANGED', 'DEBT_CHANGED', 'FUEL_CHANGED', 'CARGO_CHANGED',
      'CARGO_CAPACITY_CHANGED', 'HIDDEN_CARGO_CHANGED', 'LOCATION_CHANGED',
      'TIME_CHANGED', 'PRICE_KNOWLEDGE_CHANGED', 'ACTIVE_EVENTS_CHANGED',
      'SHIP_CONDITION_CHANGED', 'CONDITION_WARNING', 'SHIP_NAME_CHANGED',
      'UPGRADES_CHANGED', 'QUIRKS_CHANGED', 'DIALOGUE_CHANGED',
      'FACTION_REP_CHANGED', 'FINANCE_CHANGED', 'ENCOUNTER_TRIGGERED',
      'NARRATIVE_EVENT_TRIGGERED', 'HULL_CHANGED', 'ENGINE_CHANGED',
      'LIFE_SUPPORT_CHANGED', 'KARMA_CHANGED', 'INTELLIGENCE_CHANGED',
      'CURRENT_SYSTEM_CHANGED', 'MISSIONS_CHANGED', 'NPCS_CHANGED',
      'DOCKED', 'QUEST_CHANGED', 'JUMP_COMPLETED', 'PAVONIS_RUN_TRIGGERED',
      'UNDOCKED',
    ];
    for (const key of requiredEvents) {
      expect(EVENT_NAMES).toHaveProperty(key);
    }
  });

  it('maps UPPER_SNAKE keys to camelCase string values', () => {
    expect(EVENT_NAMES.CREDITS_CHANGED).toBe('creditsChanged');
    expect(EVENT_NAMES.CARGO_CHANGED).toBe('cargoChanged');
    expect(EVENT_NAMES.DOCKED).toBe('docked');
    expect(EVENT_NAMES.JUMP_COMPLETED).toBe('jumpCompleted');
  });

  it('has no duplicate values', () => {
    const values = Object.values(EVENT_NAMES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
