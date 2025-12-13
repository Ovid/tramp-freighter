/**
 * Property-Based Tests for Controller Initialization
 * Feature: architecture-refactor, Property 2: Controller Initialization
 * Validates: Requirements 1.2, 1.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { TradePanelController } from '../../js/controllers/trade.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { JSDOM } from 'jsdom';

describe('Property 2: Controller Initialization - architecture-refactor', () => {
  let dom;
  let document;
  let gameStateManager;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <body>
        <div id="trade-panel">
          <span id="trade-system-name"></span>
          <div id="market-goods"></div>
          <div id="cargo-stacks"></div>
          <span id="trade-cargo-used">0</span>
          <span id="trade-cargo-capacity">100</span>
          <span id="trade-cargo-remaining">100</span>
          <div id="hidden-cargo-section" class="hidden">
            <span id="hidden-cargo-used">0</span>
            <span id="hidden-cargo-capacity">10</span>
            <div id="hidden-cargo-stacks"></div>
          </div>
        </div>
      </body>
      </html>
    `);

    document = dom.window.document;
    global.document = document;

    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    };

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.lastSaveTime = 0;
    gameStateManager.initNewGame();
  });

  afterEach(() => {
    global.localStorage.clear();
    delete global.document;
  });

  it('should receive all required DOM elements as constructor parameters', () => {
    fc.assert(
      fc.property(fc.boolean(), (includeOptionalElements) => {
        const elements = {
          tradePanel: document.getElementById('trade-panel'),
          tradeSystemName: document.getElementById('trade-system-name'),
          marketGoods: document.getElementById('market-goods'),
          cargoStacks: document.getElementById('cargo-stacks'),
          tradeCargoUsed: document.getElementById('trade-cargo-used'),
          tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
          tradeCargoRemaining: document.getElementById('trade-cargo-remaining'),
        };

        if (includeOptionalElements) {
          elements.hiddenCargoSection = document.getElementById(
            'hidden-cargo-section'
          );
          elements.hiddenCargoUsed =
            document.getElementById('hidden-cargo-used');
          elements.hiddenCargoCapacity = document.getElementById(
            'hidden-cargo-capacity'
          );
          elements.hiddenCargoStacks = document.getElementById(
            'hidden-cargo-stacks'
          );
        }

        const controller = new TradePanelController(
          elements,
          gameStateManager,
          TEST_STAR_DATA
        );

        expect(controller.elements).toBeDefined();
        expect(controller.gameStateManager).toBe(gameStateManager);
        expect(controller.starData).toBe(TEST_STAR_DATA);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error if required DOM elements are missing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'tradePanel',
          'tradeSystemName',
          'marketGoods',
          'cargoStacks',
          'tradeCargoUsed',
          'tradeCargoCapacity',
          'tradeCargoRemaining'
        ),
        (missingElement) => {
          const elements = {
            tradePanel: document.getElementById('trade-panel'),
            tradeSystemName: document.getElementById('trade-system-name'),
            marketGoods: document.getElementById('market-goods'),
            cargoStacks: document.getElementById('cargo-stacks'),
            tradeCargoUsed: document.getElementById('trade-cargo-used'),
            tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
            tradeCargoRemaining: document.getElementById(
              'trade-cargo-remaining'
            ),
          };

          delete elements[missingElement];

          expect(() => {
            new TradePanelController(
              elements,
              gameStateManager,
              TEST_STAR_DATA
            );
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error if gameStateManager is missing', () => {
    fc.assert(
      fc.property(fc.boolean(), () => {
        const elements = {
          tradePanel: document.getElementById('trade-panel'),
          tradeSystemName: document.getElementById('trade-system-name'),
          marketGoods: document.getElementById('market-goods'),
          cargoStacks: document.getElementById('cargo-stacks'),
          tradeCargoUsed: document.getElementById('trade-cargo-used'),
          tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
          tradeCargoRemaining: document.getElementById('trade-cargo-remaining'),
        };

        expect(() => {
          new TradePanelController(elements, null, TEST_STAR_DATA);
        }).toThrow('gameStateManager parameter required');
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error if starData is missing', () => {
    fc.assert(
      fc.property(fc.boolean(), () => {
        const elements = {
          tradePanel: document.getElementById('trade-panel'),
          tradeSystemName: document.getElementById('trade-system-name'),
          marketGoods: document.getElementById('market-goods'),
          cargoStacks: document.getElementById('cargo-stacks'),
          tradeCargoUsed: document.getElementById('trade-cargo-used'),
          tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
          tradeCargoRemaining: document.getElementById('trade-cargo-remaining'),
        };

        expect(() => {
          new TradePanelController(elements, gameStateManager, null);
        }).toThrow('starData parameter required');
      }),
      { numRuns: 100 }
    );
  });

  it('should initialize with correct goodsList', () => {
    fc.assert(
      fc.property(fc.boolean(), () => {
        const elements = {
          tradePanel: document.getElementById('trade-panel'),
          tradeSystemName: document.getElementById('trade-system-name'),
          marketGoods: document.getElementById('market-goods'),
          cargoStacks: document.getElementById('cargo-stacks'),
          tradeCargoUsed: document.getElementById('trade-cargo-used'),
          tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
          tradeCargoRemaining: document.getElementById('trade-cargo-remaining'),
        };

        const controller = new TradePanelController(
          elements,
          gameStateManager,
          TEST_STAR_DATA
        );

        expect(controller.goodsList).toBeDefined();
        expect(Array.isArray(controller.goodsList)).toBe(true);
        expect(controller.goodsList.length).toBeGreaterThan(0);
        expect(controller.goodsList).toContain('grain');
        expect(controller.goodsList).toContain('ore');
      }),
      { numRuns: 100 }
    );
  });
});
