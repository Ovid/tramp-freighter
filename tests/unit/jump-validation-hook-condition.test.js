import { describe, it, expect, vi } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';

describe('executeJump passes shipCondition to validateJump', () => {
  it('should reject jump when ship hull is critically damaged', async () => {
    const stars = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 10, y: 0, z: 0, name: 'Target' },
    ];
    const wormholes = [[0, 1]];
    const nav = new NavigationSystem(stars, wormholes);

    const mockGSM = {
      getState: () => ({
        player: { currentSystem: 0 },
        ship: {
          fuel: 100,
          engine: 50,
          hull: 10,
          lifeSupport: 80,
          quirks: [],
        },
      }),
      calculateShipCapabilities: () => ({
        fuelConsumption: 1.0,
        hullDegradation: 1.0,
        lifeSupportDrain: 1.0,
      }),
      applyQuirkModifiers: vi.fn((val) => val),
      updateFuel: vi.fn(),
      updateTime: vi.fn(),
      updateLocation: vi.fn(),
      updateShipCondition: vi.fn(),
      saveGame: vi.fn(),
      markDirty: vi.fn(),
    };

    const result = await nav.executeJump(mockGSM, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Hull');
  });

  it('should allow jump when all systems are healthy', async () => {
    const stars = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 10, y: 0, z: 0, name: 'Target' },
    ];
    const wormholes = [[0, 1]];
    const nav = new NavigationSystem(stars, wormholes);

    const mockGSM = {
      getState: () => ({
        player: { currentSystem: 0 },
        ship: {
          fuel: 100,
          engine: 80,
          hull: 80,
          lifeSupport: 80,
          quirks: [],
        },
      }),
      calculateShipCapabilities: () => ({
        fuelConsumption: 1.0,
        hullDegradation: 1.0,
        lifeSupportDrain: 1.0,
      }),
      applyQuirkModifiers: vi.fn((val) => val),
      updateFuel: vi.fn(),
      updateTime: vi.fn(),
      updateLocation: vi.fn(),
      updateShipCondition: vi.fn(),
      saveGame: vi.fn(),
      markDirty: vi.fn(),
    };

    const result = await nav.executeJump(mockGSM, 1);
    expect(result.success).toBe(true);
  });
});
