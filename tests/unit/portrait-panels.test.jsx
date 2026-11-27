import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    const defaults = {
      hullChanged: 100,
      engineChanged: 100,
      fuelChanged: 100,
      lifeSupportChanged: 100,
      cargoChanged: [],
      hiddenCargoChanged: [],
      creditsChanged: 1000,
      upgradesChanged: [],
      quirksChanged: [],
      karmaChanged: 0,
      factionRepChanged: {
        authorities: 0,
        outlaws: 0,
        civilians: 0,
        traders: 0,
      },
      currentSystemChanged: 0,
      intelligenceChanged: {},
    };
    return defaults[eventName] ?? null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({}),
}));

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGame: () => ({
    getDangerZone: () => 'safe',
  }),
}));

const noop = () => {};
const portraitSrc = (container) =>
  container.querySelector('img.portrait')?.getAttribute('src');

describe('encounter panel portraits', () => {
  it('PirateEncounterPanel shows the portrait for its threat level', () => {
    const { container } = render(
      <PirateEncounterPanel
        encounter={{ threatLevel: 'strong' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/pirate/strong.webp');
  });
});
