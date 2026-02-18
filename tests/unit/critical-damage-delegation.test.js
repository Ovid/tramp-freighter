import { describe, it, expect } from 'vitest';

describe('Critical Damage Delegation', () => {
  it('GameStateManager should delegate applyEmergencyPatch to RepairManager', async () => {
    const { GameStateManager } =
      await import('../../src/game/state/game-state-manager.js');
    const gsm = new GameStateManager();
    expect(typeof gsm.applyEmergencyPatch).toBe('function');
  });

  it('GameStateManager should delegate cannibalizeSystem to RepairManager', async () => {
    const { GameStateManager } =
      await import('../../src/game/state/game-state-manager.js');
    const gsm = new GameStateManager();
    expect(typeof gsm.cannibalizeSystem).toBe('function');
  });
});
