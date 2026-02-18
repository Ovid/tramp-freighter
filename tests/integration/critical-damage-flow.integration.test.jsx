import { describe, it, expect, vi } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Integration: Critical Damage Confinement Flow', () => {
  const stars = [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
    { id: 1, x: 10, y: 0, z: 0, name: 'Target' },
  ];
  const wormholes = [[0, 1]];

  it('full flow: critical hull → jump blocked → emergency patch → jump succeeds', () => {
    const nav = new NavigationSystem(stars, wormholes);

    // Step 1: Verify jump is blocked with critical hull
    const shipCondition = { hull: 5, engine: 80, lifeSupport: 90 };
    const blocked = nav.validateJump(
      0,
      1,
      100,
      80,
      null,
      [],
      1.0,
      shipCondition
    );
    expect(blocked.valid).toBe(false);
    expect(blocked.error).toContain('Hull');

    // Step 2: Apply emergency patch
    const mockState = {
      player: { credits: 0, daysElapsed: 10 },
      ship: { ...shipCondition },
    };
    const mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn((h, e, ls) => {
        mockState.ship.hull = h;
        mockState.ship.engine = e;
        mockState.ship.lifeSupport = ls;
      }),
      updateTime: vi.fn((d) => {
        mockState.player.daysElapsed = d;
      }),
      saveGame: vi.fn(),
    };

    const repairMgr = new RepairManager(mockGSM);
    repairMgr.getState = () => mockState;
    repairMgr.validateState = () => {};

    const patchResult = repairMgr.applyEmergencyPatch('hull');
    expect(patchResult.success).toBe(true);
    expect(mockState.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(mockState.player.daysElapsed).toBe(13);

    // Step 3: Verify jump now succeeds
    const updatedCondition = { ...mockState.ship };
    const unblocked = nav.validateJump(
      0,
      1,
      100,
      updatedCondition.engine,
      null,
      [],
      1.0,
      updatedCondition
    );
    expect(unblocked.valid).toBe(true);
  });

  it('full flow: critical hull → cannibalize from engine → jump succeeds', () => {
    const nav = new NavigationSystem(stars, wormholes);

    const shipCondition = { hull: 5, engine: 80, lifeSupport: 90 };
    const blocked = nav.validateJump(
      0,
      1,
      100,
      80,
      null,
      [],
      1.0,
      shipCondition
    );
    expect(blocked.valid).toBe(false);

    // Cannibalize: need 16% gain, costs 24% from donors
    const mockState = {
      player: { credits: 0 },
      ship: { ...shipCondition },
    };
    const mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn((h, e, ls) => {
        mockState.ship.hull = h;
        mockState.ship.engine = e;
        mockState.ship.lifeSupport = ls;
      }),
      saveGame: vi.fn(),
    };

    const repairMgr = new RepairManager(mockGSM);
    repairMgr.getState = () => mockState;
    repairMgr.validateState = () => {};

    const result = repairMgr.cannibalizeSystem('hull', [
      { system: 'engine', amount: 12 },
      { system: 'lifeSupport', amount: 12 },
    ]);
    expect(result.success).toBe(true);
    expect(mockState.ship.hull).toBe(21);
    expect(mockState.ship.engine).toBe(68);
    expect(mockState.ship.lifeSupport).toBe(78);

    // Verify jump now succeeds
    const unblocked = nav.validateJump(
      0,
      1,
      100,
      mockState.ship.engine,
      null,
      [],
      1.0,
      mockState.ship
    );
    expect(unblocked.valid).toBe(true);
  });
});
