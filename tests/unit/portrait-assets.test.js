import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';
import { determineThreatLevel } from '../../src/game/utils/calculators.js';
import {
  PASSENGER_CONFIG,
  THREAT_LEVEL_CONFIG,
} from '../../src/game/constants.js';

const portraitExists = (category, key) =>
  existsSync(`public/portraits/${category}/${key}.webp`);

function makeGameState({ cargoValue = 0, hull = 100, outlawRep = 0 } = {}) {
  return {
    ship: { cargo: [{ qty: 1, buyPrice: cargoValue }], hull },
    player: { factions: { outlaws: outlawRep } },
  };
}

// One state per branch of determineThreatLevel, so every level the game can
// produce is checked against the shipped files.
const THREAT_STATES = [
  makeGameState({ cargoValue: THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS + 1 }),
  makeGameState({ cargoValue: THREAT_LEVEL_CONFIG.CARGO_VALUE_STRONG + 1 }),
  makeGameState(),
  makeGameState({ outlawRep: -THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK - 1 }),
];

describe('portrait assets', () => {
  it.each(ALL_NPCS.map((npc) => npc.id))('has a portrait for NPC %s', (id) => {
    expect(portraitExists('npc', id)).toBe(true);
  });

  it('has a portrait for every pirate threat level', () => {
    const levels = THREAT_STATES.map(determineThreatLevel);
    // Guards the fixtures: if two states collapse onto one level, a level
    // would go unchecked.
    expect(new Set(levels).size).toBe(4);
    for (const level of levels) {
      expect(portraitExists('pirate', level), level).toBe(true);
    }
  });

  it.each(['inspection', 'distress'])('has a portrait for %s', (key) => {
    expect(portraitExists('encounter', key)).toBe(true);
  });

  // NPC speakers get their art from npc-data; every other event names it.
  const npcNames = new Set(ALL_NPCS.map((npc) => npc.name));
  it.each(
    NARRATIVE_EVENTS.filter((e) => !npcNames.has(e.content.speaker)).map(
      (e) => [e.id, e.content.art]
    )
  )('has art for narrative event %s', (id, art) => {
    expect(art, id).toBeTruthy();
    expect(portraitExists(...art.split('/'))).toBe(true);
  });

  // passenger_complaint_comfort picks its art from the passenger's type.
  it.each(Object.keys(PASSENGER_CONFIG.TYPES))(
    'has a portrait for %s passengers',
    (type) => {
      expect(portraitExists('narrative', `passenger_${type}`)).toBe(true);
    }
  );
});
