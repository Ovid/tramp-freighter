import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';
import { NegotiationPanel } from '../../src/features/danger/NegotiationPanel.jsx';
import { InspectionPanel } from '../../src/features/danger/InspectionPanel.jsx';
import { DistressCallPanel } from '../../src/features/danger/DistressCallPanel.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    const defaults = {
      shipConditionChanged: { hull: 100, engine: 100, lifeSupport: 100 },
      fuelChanged: 100,
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

vi.mock('../../src/context/GameContext.jsx', async () => {
  const { realOddsGetters } = await import('../mock-odds.js');
  const odds = realOddsGetters();
  return {
    useGame: () => ({
      getDangerZone: () => 'safe',
      ...odds,
    }),
  };
});

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

  it('NegotiationPanel shows the portrait for its threat level', () => {
    const { container } = render(
      <NegotiationPanel
        encounter={{ threatLevel: 'dangerous' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/pirate/dangerous.webp');
  });

  it('InspectionPanel shows the customs inspector', () => {
    const { container } = render(
      <InspectionPanel
        inspection={{ securityLevel: 'standard' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/encounter/inspection.webp');
  });

  it('DistressCallPanel shows the mayday pilot', () => {
    const { container } = render(
      <DistressCallPanel
        distressCall={{ description: 'Help!', type: 'stranded' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/encounter/distress.webp');
  });
});
