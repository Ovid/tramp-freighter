import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';
import { InspectionPanel } from '../../src/features/danger/InspectionPanel.jsx';
import { DistressCallPanel } from '../../src/features/danger/DistressCallPanel.jsx';
import { CombatPanel } from '../../src/features/danger/CombatPanel.jsx';
import { NegotiationPanel } from '../../src/features/danger/NegotiationPanel.jsx';

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

describe('Encounter Panel Dismiss Triggers Flee', () => {
  let onChoice;
  let onClose;

  beforeEach(() => {
    onChoice = vi.fn();
    onClose = vi.fn();
    vi.clearAllMocks();
  });

  it('PirateEncounterPanel close button triggers flee', () => {
    const { container } = render(
      <PirateEncounterPanel
        encounter={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('InspectionPanel close button triggers flee', () => {
    const { container } = render(
      <InspectionPanel
        inspection={{ securityLevel: 'standard' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('DistressCallPanel close button triggers ignore', () => {
    const { container } = render(
      <DistressCallPanel
        distressCall={{ description: 'Help!', type: 'stranded' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('ignore');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('CombatPanel close button triggers flee', () => {
    const { container } = render(
      <CombatPanel
        combat={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('NegotiationPanel close button triggers flee', () => {
    const { container } = render(
      <NegotiationPanel
        encounter={{ threatLevel: 'moderate', pirateType: 'raider' }}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const closeBtn = container.querySelector('.close-btn');
    fireEvent.click(closeBtn);
    expect(onChoice).toHaveBeenCalledWith('flee');
    expect(onClose).not.toHaveBeenCalled();
  });
});
