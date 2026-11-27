import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { CombatPanel } from '../../src/features/danger/CombatPanel.jsx';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';
import { MechanicalFailurePanel } from '../../src/features/danger/MechanicalFailurePanel.jsx';
import { DistressCallPanel } from '../../src/features/danger/DistressCallPanel.jsx';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Encounter panels show the ship's current condition, so a condition change
 * while a panel is open must reach it.
 *
 * Feature: danger-system, encounter panel condition display
 */

const HULL = 37;
const ENGINE = 38;
const LIFE_SUPPORT = 39;

const noop = () => {};

const PANELS = [
  {
    name: 'CombatPanel',
    shows: [HULL, ENGINE, LIFE_SUPPORT],
    element: (
      <CombatPanel
        combat={{ intensity: 'moderate', description: 'Combat.' }}
        onChoice={noop}
        onClose={noop}
      />
    ),
  },
  {
    name: 'PirateEncounterPanel',
    shows: [HULL, ENGINE, LIFE_SUPPORT],
    element: (
      <PirateEncounterPanel
        encounter={{
          id: 'pirate_test',
          type: 'pirate',
          systemId: 0,
          threatLevel: 'moderate',
        }}
        onChoice={noop}
        onClose={noop}
      />
    ),
  },
  {
    name: 'MechanicalFailurePanel',
    shows: [HULL, ENGINE, LIFE_SUPPORT],
    element: (
      <MechanicalFailurePanel
        failure={{ type: 'engine_failure', severity: 'major' }}
        onChoice={noop}
        onClose={noop}
      />
    ),
  },
  {
    name: 'DistressCallPanel',
    shows: [LIFE_SUPPORT],
    element: (
      <DistressCallPanel
        distressCall={{ description: 'Help!', type: 'stranded' }}
        onChoice={noop}
        onClose={noop}
      />
    ),
  },
];

describe('Encounter panel condition refresh', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(PANELS)(
    '$name shows a ship condition change made while it is open',
    ({ element, shows }) => {
      const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      game.initNewGame();
      const { container } = render(
        <GameProvider game={game}>{element}</GameProvider>
      );

      act(() => game.updateShipCondition(HULL, ENGINE, LIFE_SUPPORT));

      for (const value of shows) {
        expect(container.textContent).toContain(`${value}%`);
      }
    }
  );
});
