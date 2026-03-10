import { describe, it, expect } from 'vitest';

describe('useGameAction exposes methods used by RefuelPanel and RepairPanel', () => {
  it('exports getFuelPrice and getServiceDiscount through domain hooks', async () => {
    // getFuelPrice is in useShipActions, getServiceDiscount is in useNPCActions.
    // Both are spread into useGameAction via domain hook composition.
    const fs = await import('fs');

    const shipSource = fs.readFileSync('src/hooks/useShipActions.js', 'utf-8');
    expect(shipSource).toContain('getFuelPrice:');

    const npcSource = fs.readFileSync('src/hooks/useNPCActions.js', 'utf-8');
    expect(npcSource).toContain('getServiceDiscount:');

    // Verify useGameAction composes from domain hooks
    const actionSource = fs.readFileSync(
      'src/hooks/useGameAction.js',
      'utf-8'
    );
    expect(actionSource).toContain('...ship');
    expect(actionSource).toContain('...npc');
  });

  it('RefuelPanel does not call game directly for price/discount', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/features/refuel/RefuelPanel.jsx',
      'utf-8'
    );

    expect(source).not.toContain('game.getFuelPrice');
    expect(source).not.toContain('game.getServiceDiscount');
  });

  it('RepairPanel does not call game directly for discount', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/features/repair/RepairPanel.jsx',
      'utf-8'
    );

    expect(source).not.toContain('game.getServiceDiscount');
  });
});
