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

    const manager = new ShipManager({
      isTestEnvironment: true,
    });

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

  // Regression (issue #57): stripping missionId turned mission cargo into
  // "sellable" goods with no market price, and selling them set credits to NaN.
  it('addToCargoArray preserves missionId on mission cargo', async () => {
    const { ShipManager } =
      await import('../../src/game/state/managers/ship.js');
    const manager = new ShipManager({ isTestEnvironment: true });

    const cargo = [];
    manager.addToCargoArray(
      cargo,
      { good: 'diplomatic_pouches', buyPrice: 0, missionId: 'cargo_run_a' },
      5
    );

    expect(cargo[0].missionId).toBe('cargo_run_a');
  });

  it('addToCargoArray keeps different missions’ cargo in separate stacks', async () => {
    const { ShipManager } =
      await import('../../src/game/state/managers/ship.js');
    const manager = new ShipManager({ isTestEnvironment: true });

    const cargo = [];
    const pouch = { good: 'diplomatic_pouches', buyPrice: 0 };
    manager.addToCargoArray(cargo, { ...pouch, missionId: 'a' }, 5);
    manager.addToCargoArray(cargo, { ...pouch, missionId: 'b' }, 5);
    manager.addToCargoArray(cargo, pouch, 5);

    expect(cargo.map((s) => [s.missionId, s.qty])).toEqual([
      ['a', 5],
      ['b', 5],
      [undefined, 5],
    ]);
  });

  it('NPCManager uses facade addToCargoArray instead of private method', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/game/state/managers/npc.js', 'utf-8');

    expect(source).not.toContain('._addToCargoArray');
  });
});
