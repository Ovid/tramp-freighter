import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ShipManager.addToCargoArray is a public API', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  it('addToCargoArray stacks cargo with matching good and buyPrice', async () => {
    const { ShipManager } =
      await import('../../src/game/state/managers/ship.js');

    const mockGSM = {
      state: { ship: { cargo: [] } },
      isTestEnvironment: true,
    };
    const manager = new ShipManager(mockGSM);

    const cargo = [];
    const stack = {
      good: 'ore',
      buyPrice: 10,
      buySystem: 1,
      buySystemName: 'Alpha Centauri',
      buyDate: 5,
    };

    manager.addToCargoArray(cargo, stack, 3);
    expect(cargo).toEqual([
      {
        good: 'ore',
        qty: 3,
        buyPrice: 10,
        buySystem: 1,
        buySystemName: 'Alpha Centauri',
        buyDate: 5,
      },
    ]);

    // Same good+price should stack
    manager.addToCargoArray(cargo, stack, 2);
    expect(cargo[0].qty).toBe(5);
    expect(cargo).toHaveLength(1);
  });

  it('NPCManager uses facade addToCargoArray instead of private method', async () => {
    const { NPCManager } = await import('../../src/game/state/managers/npc.js');

    // Verify the source does not contain _addToCargoArray
    const npcSource = NPCManager.toString();
    expect(npcSource).not.toContain('._addToCargoArray');
  });
});
