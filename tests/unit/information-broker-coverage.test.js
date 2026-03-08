import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InformationBroker } from '../../src/game/game-information-broker.js';
import {
  INTELLIGENCE_CONFIG,
  ENDGAME_CONFIG,
} from '../../src/game/constants.js';

describe('InformationBroker coverage', () => {
  const starData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
    { id: 3, name: 'Wolf 359', x: 0, y: 0, z: 10, type: 'M6V', st: 0 },
  ];

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getIntelligenceCost', () => {
    it('returns NEVER_VISITED price for unknown system', () => {
      const cost = InformationBroker.getIntelligenceCost(99, {});
      expect(cost).toBe(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED);
    });

    it('returns RECENT_VISIT price for recently visited system', () => {
      const knowledge = { 1: { lastVisit: 5 } };
      const cost = InformationBroker.getIntelligenceCost(1, knowledge);
      expect(cost).toBe(INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT);
    });

    it('returns RECENT_VISIT price at exactly threshold', () => {
      const knowledge = {
        1: { lastVisit: INTELLIGENCE_CONFIG.RECENT_THRESHOLD },
      };
      const cost = InformationBroker.getIntelligenceCost(1, knowledge);
      expect(cost).toBe(INTELLIGENCE_CONFIG.PRICES.RECENT_VISIT);
    });

    it('returns STALE_VISIT price beyond threshold', () => {
      const knowledge = {
        1: { lastVisit: INTELLIGENCE_CONFIG.RECENT_THRESHOLD + 1 },
      };
      const cost = InformationBroker.getIntelligenceCost(1, knowledge);
      expect(cost).toBe(INTELLIGENCE_CONFIG.PRICES.STALE_VISIT);
    });
  });

  describe('validatePurchase', () => {
    it('returns valid when credits are sufficient', () => {
      const result = InformationBroker.validatePurchase(100, 500);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('returns valid when credits exactly equal cost', () => {
      const result = InformationBroker.validatePurchase(100, 100);
      expect(result.valid).toBe(true);
    });

    it('returns invalid when credits are insufficient', () => {
      const result = InformationBroker.validatePurchase(100, 50);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient credits for intelligence');
    });
  });

  describe('purchaseIntelligence', () => {
    it('returns failure for insufficient credits', () => {
      const gameState = {
        player: { credits: 10, daysElapsed: 1 },
        world: { priceKnowledge: {}, activeEvents: [] },
      };
      const result = InformationBroker.purchaseIntelligence(
        gameState,
        1,
        starData
      );
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Insufficient credits for intelligence');
    });

    it('returns failure for unknown system', () => {
      const gameState = {
        player: { credits: 10000, daysElapsed: 1 },
        world: { priceKnowledge: {}, activeEvents: [] },
      };
      const result = InformationBroker.purchaseIntelligence(
        gameState,
        999,
        starData
      );
      expect(result.success).toBe(false);
      expect(result.reason).toBe('System not found');
    });

    it('sets source to intelligence_broker', () => {
      const gameState = {
        player: { credits: 10000, daysElapsed: 1 },
        world: {
          priceKnowledge: {},
          activeEvents: [],
          marketConditions: {},
        },
      };
      InformationBroker.purchaseIntelligence(gameState, 1, starData);
      expect(gameState.world.priceKnowledge[1].source).toBe(
        'intelligence_broker'
      );
    });

    it('sets lastVisit to 0 after purchase', () => {
      const gameState = {
        player: { credits: 10000, daysElapsed: 1 },
        world: {
          priceKnowledge: {},
          activeEvents: [],
          marketConditions: {},
        },
      };
      InformationBroker.purchaseIntelligence(gameState, 1, starData);
      expect(gameState.world.priceKnowledge[1].lastVisit).toBe(0);
    });

    it('uses stale visit price for old knowledge', () => {
      const gameState = {
        player: { credits: 10000, daysElapsed: 1 },
        world: {
          priceKnowledge: {
            1: { lastVisit: INTELLIGENCE_CONFIG.RECENT_THRESHOLD + 10 },
          },
          activeEvents: [],
          marketConditions: {},
        },
      };
      const creditsBefore = gameState.player.credits;
      InformationBroker.purchaseIntelligence(gameState, 1, starData);
      const spent = creditsBefore - gameState.player.credits;
      expect(spent).toBe(INTELLIGENCE_CONFIG.PRICES.STALE_VISIT);
    });
  });

  describe('generateRumor', () => {
    it('returns a string', () => {
      const gameState = {
        player: { daysElapsed: 10 },
        world: {
          activeEvents: [],
          visitedSystems: [0],
          marketConditions: {},
          narrativeEvents: { flags: {} },
        },
      };
      const rumor = InformationBroker.generateRumor(gameState, starData);
      expect(typeof rumor).toBe('string');
      expect(rumor.length).toBeGreaterThan(0);
    });

    it('can return event-based rumor when active events exist', () => {
      // Try many days to find one where the RNG picks the event branch
      let foundEventRumor = false;
      for (let day = 0; day < 200; day++) {
        const gameState = {
          player: { daysElapsed: day },
          world: {
            activeEvents: [
              { systemId: 1, type: 'mining_strike', name: 'Mining Strike' },
            ],
            visitedSystems: [0],
            marketConditions: {},
            narrativeEvents: { flags: {} },
          },
        };
        const rumor = InformationBroker.generateRumor(gameState, starData);
        if (
          rumor.includes('Alpha Centauri') &&
          rumor.includes('labor troubles')
        ) {
          foundEventRumor = true;
          break;
        }
      }
      expect(foundEventRumor).toBe(true);
    });

    it('returns price-based rumor when no events or event branch not taken', () => {
      const gameState = {
        player: { daysElapsed: 42 },
        world: {
          activeEvents: [],
          visitedSystems: [0],
          marketConditions: {},
          narrativeEvents: { flags: {} },
        },
      };
      const rumor = InformationBroker.generateRumor(gameState, starData);
      expect(rumor).toMatch(
        /prices are pretty good|markets are always changing/
      );
    });

    it('can return Tanaka hint for mid-game players', () => {
      let foundTanakaRumor = false;
      const minSystems = ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS;
      const visitedSystems = Array.from(
        { length: minSystems + 5 },
        (_, i) => i
      );

      for (let count = 0; count < 200; count++) {
        const gameState = {
          player: { daysElapsed: 50 },
          world: {
            activeEvents: [],
            visitedSystems,
            marketConditions: {},
            narrativeEvents: { flags: {} },
          },
        };
        const rumor = InformationBroker.generateRumor(
          gameState,
          starData,
          count
        );
        if (rumor.includes('Tanaka')) {
          foundTanakaRumor = true;
          break;
        }
      }
      expect(foundTanakaRumor).toBe(true);
    });

    it('does not return Tanaka hint when already met', () => {
      const minSystems = ENDGAME_CONFIG.BARNARDS_ENGINEER_RUMOR_SYSTEMS;
      const visitedSystems = Array.from(
        { length: minSystems + 5 },
        (_, i) => i
      );

      for (let count = 0; count < 50; count++) {
        const gameState = {
          player: { daysElapsed: 50 },
          world: {
            activeEvents: [],
            visitedSystems,
            marketConditions: {},
            narrativeEvents: { flags: { tanaka_met: true } },
          },
        };
        const rumor = InformationBroker.generateRumor(
          gameState,
          starData,
          count
        );
        expect(rumor).not.toContain('Tanaka');
      }
    });

    it('does not return Tanaka hint with too few visited systems', () => {
      for (let count = 0; count < 50; count++) {
        const gameState = {
          player: { daysElapsed: 50 },
          world: {
            activeEvents: [],
            visitedSystems: [0, 1],
            marketConditions: {},
            narrativeEvents: { flags: {} },
          },
        };
        const rumor = InformationBroker.generateRumor(
          gameState,
          starData,
          count
        );
        expect(rumor).not.toContain('Tanaka');
      }
    });

    it('handles event descriptions for all event types', () => {
      const eventTypes = [
        'mining_strike',
        'medical_emergency',
        'festival',
        'supply_glut',
      ];
      const expectedDescriptions = [
        'labor troubles',
        'a health crisis',
        'celebrations',
        'oversupply issues',
      ];

      for (let i = 0; i < eventTypes.length; i++) {
        let found = false;
        for (let day = 0; day < 300; day++) {
          const gameState = {
            player: { daysElapsed: day },
            world: {
              activeEvents: [
                { systemId: 1, type: eventTypes[i], name: 'Test' },
              ],
              visitedSystems: [0],
              marketConditions: {},
              narrativeEvents: { flags: {} },
            },
          };
          const rumor = InformationBroker.generateRumor(gameState, starData);
          if (rumor.includes(expectedDescriptions[i])) {
            found = true;
            break;
          }
        }
        expect(found).toBe(true);
      }
    });

    it('uses generic description for unknown event type', () => {
      let found = false;
      for (let day = 0; day < 300; day++) {
        const gameState = {
          player: { daysElapsed: day },
          world: {
            activeEvents: [
              { systemId: 1, type: 'unknown_event_type', name: 'Test' },
            ],
            visitedSystems: [0],
            marketConditions: {},
            narrativeEvents: { flags: {} },
          },
        };
        const rumor = InformationBroker.generateRumor(gameState, starData);
        if (rumor.includes('unusual market conditions')) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('listAvailableIntelligence', () => {
    let mockNavSystem;

    beforeEach(() => {
      mockNavSystem = {
        getConnectedSystems: vi.fn().mockReturnValue([1, 2]),
      };
    });

    it('returns intelligence for connected systems only', () => {
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem
      );
      expect(result).toHaveLength(2);
      expect(result[0].systemId).toBe(1);
      expect(result[1].systemId).toBe(2);
    });

    it('includes system name and cost', () => {
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem
      );
      expect(result[0].systemName).toBe('Alpha Centauri');
      expect(result[0].cost).toBe(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED);
    });

    it('includes lastVisit from price knowledge', () => {
      const knowledge = { 1: { lastVisit: 15 } };
      const result = InformationBroker.listAvailableIntelligence(
        knowledge,
        starData,
        0,
        mockNavSystem
      );
      expect(result[0].lastVisit).toBe(15);
    });

    it('returns null lastVisit for unknown systems', () => {
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem
      );
      expect(result[0].lastVisit).toBeNull();
    });

    it('does not include events without advanced sensors', () => {
      const events = [
        { systemId: 1, name: 'Strike', commodity: 'ore', modifier: 1.5 },
      ];
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem,
        events,
        false
      );
      expect(result[0].event).toBeUndefined();
    });

    it('includes events with advanced sensors', () => {
      const events = [
        { systemId: 1, name: 'Strike', commodity: 'ore', modifier: 1.5 },
      ];
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem,
        events,
        true
      );
      expect(result[0].event).toEqual({
        name: 'Strike',
        commodity: 'ore',
        modifier: 1.5,
      });
    });

    it('does not include event for systems without one', () => {
      const events = [
        { systemId: 99, name: 'Strike', commodity: 'ore', modifier: 1.5 },
      ];
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem,
        events,
        true
      );
      expect(result[0].event).toBeUndefined();
      expect(result[1].event).toBeUndefined();
    });

    it('returns empty array when no connected systems', () => {
      mockNavSystem.getConnectedSystems.mockReturnValue([]);
      const result = InformationBroker.listAvailableIntelligence(
        {},
        starData,
        0,
        mockNavSystem
      );
      expect(result).toHaveLength(0);
    });
  });
});
