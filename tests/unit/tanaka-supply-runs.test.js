import { describe, it, expect, beforeEach } from 'vitest';
import {
  TANAKA_SUPPLY_CONFIG,
  ENDGAME_CONFIG,
} from '../../src/game/constants.js';
import { createTestGameStateManager } from '../test-utils.js';
import { buildDialogueContext } from '../../src/game/game-dialogue.js';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

describe('Tanaka Supply Run constants', () => {
  it('exports TANAKA_SUPPLY_CONFIG with required fields', () => {
    expect(TANAKA_SUPPLY_CONFIG).toBeDefined();
    expect(TANAKA_SUPPLY_CONFIG.QUANTITY).toBe(5);
    expect(TANAKA_SUPPLY_CONFIG.REP_GAIN).toBe(3);
    expect(TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS).toBe(7);
    expect(TANAKA_SUPPLY_CONFIG.GOODS).toEqual(['electronics', 'medicine']);
  });
});

function setTanakaMet(manager) {
  manager.state.world.narrativeEvents.flags.tanaka_met = true;
}

describe('QuestManager.canContributeSupply', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    // Set tanaka_met flag in narrativeEvents (where the game actually stores it)
    setTanakaMet(manager);
    // Dock at Barnard's Star
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
  });

  it("returns true when player has 5+ electronics, is at Barnard's Star, tanaka_met, and no cooldown", () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns true when player has 5+ medicine', () => {
    manager.state.ship.cargo = [
      {
        good: 'medicine',
        qty: 7,
        buyPrice: 40,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('returns false when player has fewer than 5 of any qualifying good', () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 3,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
      {
        good: 'medicine',
        qty: 4,
        buyPrice: 40,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when tanaka_met flag is not set', () => {
    manager.state.world.narrativeEvents.flags.tanaka_met = false;
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it("returns false when not at Barnard's Star", () => {
    manager.state.player.currentSystem = 0; // Sol
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns false when cooldown has not expired', () => {
    manager.state.player.daysElapsed = 10;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 5 days ago, cooldown is 7
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(false);
  });

  it('returns true when cooldown has expired', () => {
    manager.state.player.daysElapsed = 15;
    manager.state.quests.tanaka.data.lastSupplyDay = 5; // 10 days ago, cooldown is 7
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    expect(manager.canContributeSupply()).toBe(true);
  });

  it('prefers electronics when both goods are available', () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
      {
        good: 'medicine',
        qty: 5,
        buyPrice: 40,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const result = manager.canContributeSupply();
    expect(result).toBe(true);
  });
});

describe('QuestManager.contributeSupply', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    setTanakaMet(manager);
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
  });

  it('deducts 5 electronics and adds 3 rep on success', () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 8,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const repBefore = manager.getNPCState('tanaka_barnards').rep;
    const result = manager.contributeSupply();
    expect(result.success).toBe(true);
    expect(result.goodDonated).toBe('electronics');

    // Cargo reduced
    const remaining = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(remaining).toBe(3);

    // Rep increased by TANAKA_SUPPLY_CONFIG.REP_GAIN (3)
    expect(manager.getNPCState('tanaka_barnards').rep).toBe(repBefore + 3);
  });

  it('sets lastSupplyDay cooldown on success', () => {
    manager.state.player.daysElapsed = 42;
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    manager.contributeSupply();
    expect(manager.state.quests.tanaka.data.lastSupplyDay).toBe(42);
  });

  it('prefers electronics over medicine when both available', () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
      {
        good: 'medicine',
        qty: 5,
        buyPrice: 40,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const result = manager.contributeSupply();
    expect(result.goodDonated).toBe('electronics');

    // Electronics deducted, medicine untouched
    const electronicsLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    const medicineLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'medicine')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(electronicsLeft).toBe(0);
    expect(medicineLeft).toBe(5);
  });

  it('falls back to medicine when electronics insufficient', () => {
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 2,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
      {
        good: 'medicine',
        qty: 6,
        buyPrice: 40,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
    const result = manager.contributeSupply();
    expect(result.goodDonated).toBe('medicine');
  });

  it('fails when not eligible', () => {
    manager.state.ship.cargo = []; // No cargo
    const result = manager.contributeSupply();
    expect(result.success).toBe(false);
  });
});

describe('research_supply dialogue node', () => {
  it('exists in Tanaka dialogue tree', () => {
    expect(YUKI_TANAKA_DIALOGUE.research_supply).toBeDefined();
  });

  it('has text function that returns a string', () => {
    expect(typeof YUKI_TANAKA_DIALOGUE.research_supply.text).toBe('function');
    const text = YUKI_TANAKA_DIALOGUE.research_supply.text(0, {});
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('has a single choice that returns to greeting', () => {
    const choices = YUKI_TANAKA_DIALOGUE.research_supply.choices;
    expect(choices.length).toBe(1);
    expect(choices[0].next).toBe('greeting');
  });

  it('choice action calls contributeSupply', () => {
    let called = false;
    const mockContext = {
      contributeSupply: () => {
        called = true;
        return { success: true, goodDonated: 'electronics' };
      },
    };
    YUKI_TANAKA_DIALOGUE.research_supply.choices[0].action(mockContext);
    expect(called).toBe(true);
  });
});

describe('greeting choices include supply run option', () => {
  it('has a supply run choice with canContributeSupply condition', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    expect(supplyChoice).toBeDefined();
    expect(typeof supplyChoice.condition).toBe('function');
  });

  it('supply run choice is visible when canContributeSupply returns true', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    const context = { canContributeSupply: () => true };
    expect(supplyChoice.condition(0, context)).toBe(true);
  });

  it('supply run choice is hidden when canContributeSupply returns false', () => {
    const supplyChoice = YUKI_TANAKA_DIALOGUE.greeting.choices.find(
      (c) => c.next === 'research_supply'
    );
    const context = { canContributeSupply: () => false };
    expect(supplyChoice.condition(0, context)).toBe(false);
  });
});

describe('Dialogue context for supply runs', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
  });

  it('exposes canContributeSupply on dialogue context', () => {
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    expect(typeof context.canContributeSupply).toBe('function');
  });

  it('exposes contributeSupply on dialogue context', () => {
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    expect(typeof context.contributeSupply).toBe('function');
  });
});

describe('canContributeSupply checks narrativeEvents.flags for tanaka_met', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    // Set tanaka_met in the CORRECT location (narrativeEvents.flags),
    // NOT in npcState.flags — mirrors how the game actually sets this flag
    manager.state.world.narrativeEvents = {
      fired: [],
      cooldowns: {},
      flags: { tanaka_met: true },
      dockedSystems: [],
    };
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 5,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
  });

  it('returns true when tanaka_met is set in narrativeEvents.flags (not npcState.flags)', () => {
    // npcState.flags should be empty — the flag is NOT stored there
    const npcState = manager.getNPCState('tanaka_barnards');
    expect(npcState.flags).not.toContain('tanaka_met');
    // But canContributeSupply should still return true
    expect(manager.canContributeSupply()).toBe(true);
  });
});

describe('Full supply run flow (integration)', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    setTanakaMet(manager);
    manager.state.player.currentSystem = ENDGAME_CONFIG.TANAKA_SYSTEM;
    manager.state.player.daysElapsed = 20;
    manager.state.ship.cargo = [
      {
        good: 'electronics',
        qty: 10,
        buyPrice: 30,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ];
  });

  it('completes a supply run: eligible → donate → cooldown → ineligible → wait → eligible again', () => {
    // 1. Eligible
    expect(manager.canContributeSupply()).toBe(true);

    // 2. Donate
    const result = manager.contributeSupply();
    expect(result.success).toBe(true);
    expect(result.goodDonated).toBe('electronics');

    // 3. Cargo reduced by 5
    const cargoLeft = manager.state.ship.cargo
      .filter((c) => c.good === 'electronics')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(cargoLeft).toBe(5);

    // 4. On cooldown — not eligible
    expect(manager.canContributeSupply()).toBe(false);

    // 5. Advance time past cooldown
    manager.state.player.daysElapsed = 28; // 8 days later, cooldown is 7
    expect(manager.canContributeSupply()).toBe(true);

    // 6. Second donation works
    const result2 = manager.contributeSupply();
    expect(result2.success).toBe(true);
  });
});
