import { describe, it, expect } from 'vitest';

describe('useGameAction exposes methods used by RefuelPanel and RepairPanel', () => {
  it('exports getFuelPrice and getServiceDiscount through useGameAction', async () => {
    // Read the source to verify the methods are exposed
    const fs = await import('fs');
    const source = fs.readFileSync('src/hooks/useGameAction.js', 'utf-8');

    expect(source).toContain('getFuelPrice:');
    expect(source).toContain('getServiceDiscount:');
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
