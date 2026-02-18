import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { RESTRICTED_GOODS_CONFIG } from '../../src/game/constants.js';

describe('Restricted Goods Counting Properties', () => {
  it('should count zero restricted goods when cargo contains only unrestricted items for the zone', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom('safe', 'contested', 'dangerous'),
        (zone) => {
          const restricted = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
          // Create cargo with only items NOT in restricted list
          const unrestricted = ['grain', 'ore'].filter(g => !restricted.includes(g));
          if (unrestricted.length === 0) return true; // Skip if all goods restricted

          const cargo = unrestricted.map(good => ({
            good,
            quantity: 5,
            purchasePrice: 10,
          }));

          const count = gameStateManager.countRestrictedGoods(cargo, zone);
          return count === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count restricted goods correctly for each zone', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom('safe', 'contested', 'dangerous'),
        (zone) => {
          const restricted = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];
          if (restricted.length === 0) return true;

          // Create cargo with one restricted item
          const cargo = [
            { good: restricted[0], quantity: 5, purchasePrice: 10 },
            { good: 'grain', quantity: 3, purchasePrice: 8 },
          ];

          const count = gameStateManager.countRestrictedGoods(cargo, zone);
          // Should count the restricted item but not grain (unless grain is restricted)
          const expectedCount = cargo.filter(item =>
            restricted.includes(item.good)
          ).length;
          return count === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count core system restricted goods when in core systems', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Core systems (Sol=0, Alpha Centauri=1) restrict 'parts'
    const cargo = [
      { good: 'parts', quantity: 5, purchasePrice: 30 },
      { good: 'grain', quantity: 3, purchasePrice: 8 },
    ];

    // systemId 0 (Sol) is a core system
    const count = gameStateManager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBe(1); // parts is restricted in core systems
  });
});
