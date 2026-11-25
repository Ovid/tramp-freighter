import { describe, it, expect } from 'vitest';
import { isWormholeConnected } from '../../src/game/utils/wormhole-graph.js';
import { InformationBroker } from '../../src/game/game-information-broker.js';
import { EconomicEventsSystem } from '../../src/game/game-events.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';

describe('isWormholeConnected', () => {
  it('is true only for systems with at least one lane', () => {
    expect(isWormholeConnected(0)).toBe(true); // Sol
    expect(isWormholeConnected(8)).toBe(false); // Sirius B (companion)
    expect(isWormholeConnected(104)).toBe(false); // Ross 882 (no lanes)
    expect(isWormholeConnected(115)).toBe(false); // Delta Pavonis
  });
});

describe('rumors only name wormhole-connected systems', () => {
  const unconnected = STAR_DATA.filter((s) => !isWormholeConnected(s.id));

  function rumorState(day, activeEvents = []) {
    return {
      player: { daysElapsed: day },
      world: {
        activeEvents,
        visitedSystems: [0],
        marketConditions: {},
        narrativeEvents: { flags: {} },
      },
    };
  }

  it('the best-price rumor never names an unconnected system', () => {
    for (let day = 0; day < 200; day++) {
      const rumor = InformationBroker.generateRumor(rumorState(day), STAR_DATA);
      for (const s of unconnected) {
        expect(rumor).not.toContain(` ${s.name} `);
      }
    }
  });

  it('the event hint skips events on unconnected systems', () => {
    const onCompanion = [
      { id: 'festival_8_0', type: 'festival', systemId: 8 }, // Sirius B
    ];
    for (let day = 0; day < 200; day++) {
      const rumor = InformationBroker.generateRumor(
        rumorState(day, onCompanion),
        STAR_DATA
      );
      expect(rumor).not.toContain('Sirius B');
    }
  });
});

describe('economic events only start on wormhole-connected systems', () => {
  function eventState(day, activeEvents = []) {
    return {
      player: { daysElapsed: day },
      world: { activeEvents },
    };
  }

  it('updateEvents never starts an event on an unconnected system', () => {
    const state = eventState(0);
    for (let day = 0; day < 365; day++) {
      state.player.daysElapsed = day;
      state.world.activeEvents = EconomicEventsSystem.updateEvents(
        state,
        STAR_DATA
      );
      for (const e of state.world.activeEvents) {
        expect(isWormholeConnected(e.systemId), e.id).toBe(true);
      }
    }
  });

  it('an old-save event on a companion still expires normally', () => {
    const old = {
      id: 'festival_8_0',
      type: 'festival',
      systemId: 8,
      startDay: 0,
      endDay: 5,
      modifiers: {},
    };
    const after = EconomicEventsSystem.updateEvents(
      eventState(6, [old]),
      STAR_DATA
    );
    expect(after.find((e) => e.id === old.id)).toBeUndefined();
  });
});
