import { describe, it, expect, beforeEach } from 'vitest';
import { TANAKA_SUPPLY_CONFIG, ENDGAME_CONFIG } from '../../src/game/constants.js';
import { createTestGameStateManager } from '../test-utils.js';

describe('Tanaka Supply Run constants', () => {
  it('exports TANAKA_SUPPLY_CONFIG with required fields', () => {
    expect(TANAKA_SUPPLY_CONFIG).toBeDefined();
    expect(TANAKA_SUPPLY_CONFIG.QUANTITY).toBe(5);
    expect(TANAKA_SUPPLY_CONFIG.REP_GAIN).toBe(1);
    expect(TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS).toBe(7);
    expect(TANAKA_SUPPLY_CONFIG.GOODS).toEqual(['electronics', 'medicine']);
  });
});

describe('QuestManager.canContributeSupply', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    // Set tanaka_met flag
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags.push('tanaka_met');
    // Dock at Barnard's Star
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
  });

  it('returns true when player has 5+ electronics, is at Barnard\'s Star, tanaka_met, and no cooldown', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns true when player has 5+ medicine', () => {
    manager.state.ship.cargo = [
      { good: 'medicine', qty: 7, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns false when player has fewer than 5 of any qualifying good', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 3, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 4, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when tanaka_met flag is not set', () => {
    const npcState = manager.getNPCState('tanaka_barnards');
    npcState.flags = [];
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when not at Barnard\'s Star', () => {
    manager.state.player.currentSystem = 0; // Sol
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when cooldown has not expired', () => {
    manager.state.player.daysElapsed = 10;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 5 days ago, cooldown is 7
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns true when cooldown has expired', () => {
    manager.state.player.daysElapsed = 15;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 10 days ago, cooldown is 7
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('prefers electronics when both goods are available', () => {
    manager.state.ship.cargo = [
      { good: 'electronics', qty: 5, buyPrice: 30, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
      { good: 'medicine', qty: 5, buyPrice: 40, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    const result = manager.canContributeSupply();
    expect(result).toBe(true);
  });
});
