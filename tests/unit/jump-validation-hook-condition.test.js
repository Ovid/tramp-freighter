import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('executeJump passes shipCondition to validateJump', () => {
  let game;
  let target;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
    );
    game.isTestEnvironment = true;
    game.initNewGame();
    target = game.navigationSystem.getConnectedSystems(0)[0];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should reject jump when ship hull is critically damaged', async () => {
    game.updateShipCondition(10, 50, 80);

    const result = await game.executeJump(target);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Hull');
  });

  it('should allow jump when all systems are healthy', async () => {
    game.updateShipCondition(80, 80, 80);

    const result = await game.executeJump(target);
    expect(result.success).toBe(true);
  });
});
