/**
 * Property-based tests for restricted goods premium pricing
 *
 * Feature: danger-system, Property 16: Restricted Goods Premium Pricing
 * Validates: Requirements 11.10, 11.11, 11.12
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  RESTRICTED_GOODS_CONFIG,
  COMMODITY_TYPES,
  BASE_PRICES,
} from '../../src/game/constants.js';

describe('Restricted Goods Premium Pricing Properties', () => {
  it('should apply premium multiplier when selling restricted goods in legal zones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.integer({ min: 10, max: 200 }), // Base price range
        (goodType, systemId, basePrice) => {
          // Check if good is restricted in this system
          const isRestricted = gameStateManager.tradingManager.isGoodRestricted(goodType, systemId);
          
          // Calculate sell price
          const sellPrice = gameStateManager.tradingManager.calculateSellPrice(goodType, systemId, basePrice);
          
          if (isRestricted) {
            // In restricted zones, normal trade should be blocked (price calculation irrelevant)
            // This will be tested in the canSellGood test
            return true;
          } else {
            // In legal zones, check if this good is restricted elsewhere
            const isRestrictedElsewhere = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.safe.includes(goodType) ||
                                        RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.contested.includes(goodType) ||
                                        RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.dangerous.includes(goodType) ||
                                        RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);
            
            if (isRestrictedElsewhere) {
              // Should apply premium multiplier (1.5x)
              const expectedPrice = basePrice * RESTRICTED_GOODS_CONFIG.PREMIUM_MULTIPLIER;
              return Math.abs(sellPrice - expectedPrice) < 0.01; // Allow for floating point precision
            } else {
              // Non-restricted goods should have normal pricing
              return Math.abs(sellPrice - basePrice) < 0.01;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should block normal trade for restricted goods in restricted zones', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        fc.boolean(), // hasBlackMarketContact
        (goodType, systemId, hasBlackMarketContact) => {
          const isRestricted = gameStateManager.tradingManager.isGoodRestricted(goodType, systemId);
          const canSell = gameStateManager.tradingManager.canSellGood(goodType, systemId, hasBlackMarketContact);
          
          if (isRestricted) {
            // In restricted zones, can only sell with black market contacts
            return canSell === hasBlackMarketContact;
          } else {
            // In legal zones, can always sell
            return canSell === true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow black market contact bypass for restricted zone sales', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (goodType, systemId) => {
          const isRestricted = gameStateManager.tradingManager.isGoodRestricted(goodType, systemId);
          
          if (isRestricted) {
            // Without black market contact, should not be able to sell
            const canSellWithoutContact = gameStateManager.tradingManager.canSellGood(goodType, systemId, false);
            
            // With black market contact, should be able to sell
            const canSellWithContact = gameStateManager.tradingManager.canSellGood(goodType, systemId, true);
            
            return !canSellWithoutContact && canSellWithContact;
          } else {
            // Non-restricted goods should be sellable regardless of contacts
            const canSellWithoutContact = gameStateManager.tradingManager.canSellGood(goodType, systemId, false);
            const canSellWithContact = gameStateManager.tradingManager.canSellGood(goodType, systemId, true);
            
            return canSellWithoutContact && canSellWithContact;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify restricted goods by zone and system', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...COMMODITY_TYPES),
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (goodType, systemId) => {
          const isRestricted = gameStateManager.tradingManager.isGoodRestricted(goodType, systemId);
          const dangerZone = gameStateManager.getDangerZone(systemId);
          
          // Check zone-based restrictions
          const zoneRestricted = RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[dangerZone]?.includes(goodType) || false;
          
          // Check core system restrictions (systems 0, 1)
          const coreSystemRestricted = (systemId === 0 || systemId === 1) && 
                                     RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);
          
          const expectedRestricted = zoneRestricted || coreSystemRestricted;
          
          return isRestricted === expectedRestricted;
        }
      ),
      { numRuns: 100 }
    );
  });
});