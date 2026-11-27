import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, within } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { CombatPanel } from '../../src/features/danger/CombatPanel.jsx';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  COMBAT_CONFIG,
  NEGOTIATION_CONFIG,
  KARMA_CONFIG,
} from '../../src/game/constants.js';

/**
 * Pins the odds both encounter panels display in the conditions where the
 * panels and the resolvers already agree (healthy engine, unescalated
 * encounter, no distress-call quirk). Whatever owns the odds calculation,
 * these numbers must not move.
 *
 * Feature: danger-system, combat odds display
 */

const pct = (chance) =>
  `${Math.round(Math.max(0, Math.min(1, chance)) * 100)}%`;

const SCENARIOS = [
  { label: 'no modifiers', quirks: [], upgrades: [], karma: 0 },
  {
    label: 'hot_thruster quirk',
    quirks: ['hot_thruster'],
    upgrades: [],
    karma: 0,
  },
  {
    label: 'efficient_drive upgrade',
    quirks: [],
    upgrades: ['efficient_drive'],
    karma: 0,
  },
  {
    label: 'hot_thruster and efficient_drive',
    quirks: ['hot_thruster'],
    upgrades: ['efficient_drive'],
    karma: 0,
  },
  { label: 'good karma', quirks: [], upgrades: [], karma: 200 },
  { label: 'bad karma', quirks: [], upgrades: [], karma: -200 },
];

function expectedOdds({ quirks, upgrades, karma }) {
  const k = karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;
  let evasive = COMBAT_CONFIG.EVASIVE.BASE_CHANCE + k;
  if (quirks.includes('hot_thruster')) {
    evasive += COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
  }
  if (upgrades.includes('efficient_drive')) {
    evasive += COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
  }
  return {
    evasive: pct(evasive),
    returnFire: pct(COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE + k),
    distressCall: pct(COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE + k),
    counterProposal: pct(NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE + k),
    medicineClaim: pct(NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE + k),
  };
}

function makeGame({ quirks, upgrades, karma }) {
  const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  game.initNewGame();
  const state = game.getState();
  state.ship.engine = 100;
  state.ship.quirks = [...quirks];
  state.ship.upgrades = [...upgrades];
  state.ship.cargo = [{ good: 'medicine', qty: 1, buyPrice: 10 }];
  state.player.karma = karma;
  return game;
}

function optionButton(container, name) {
  const nameEl = Array.from(container.querySelectorAll('.option-name')).find(
    (el) => el.textContent === name
  );
  return nameEl.closest('button');
}

function combatFinal(container, name) {
  return optionButton(container, name).querySelector('.breakdown-value.final')
    .textContent;
}

function pirateProb(container, optionName, label) {
  const button = optionButton(container, optionName);
  const item = Array.from(button.querySelectorAll('.probability-item')).find(
    (el) => within(el).queryByText(label)
  );
  return item.querySelector('.prob-value').textContent;
}

describe('Combat odds display safety net', () => {
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

  for (const scenario of SCENARIOS) {
    it(`CombatPanel shows resolver-consistent odds with ${scenario.label}`, () => {
      const game = makeGame(scenario);
      const expected = expectedOdds(scenario);
      const { container } = render(
        <GameProvider game={game}>
          <CombatPanel
            combat={{ intensity: 'moderate', description: 'Combat.' }}
            onChoice={vi.fn()}
            onClose={vi.fn()}
          />
        </GameProvider>
      );

      expect(combatFinal(container, 'Evasive Maneuvers')).toBe(
        expected.evasive
      );
      expect(combatFinal(container, 'Return Fire')).toBe(expected.returnFire);
      expect(combatFinal(container, 'Distress Call')).toBe(
        expected.distressCall
      );
    });

    it(`PirateEncounterPanel shows resolver-consistent odds with ${scenario.label}`, () => {
      const game = makeGame(scenario);
      const expected = expectedOdds(scenario);
      const { container } = render(
        <GameProvider game={game}>
          <PirateEncounterPanel
            encounter={{
              id: 'pirate_test',
              type: 'pirate',
              systemId: 0,
              threatLevel: 'moderate',
            }}
            onChoice={vi.fn()}
            onClose={vi.fn()}
          />
        </GameProvider>
      );

      expect(pirateProb(container, 'Flee', 'Evasive Success:')).toBe(
        expected.evasive
      );
      expect(pirateProb(container, 'Fight', 'Return Fire Success:')).toBe(
        expected.returnFire
      );
      expect(pirateProb(container, 'Negotiate', 'Counter-Proposal:')).toBe(
        expected.counterProposal
      );
      expect(pirateProb(container, 'Negotiate', 'Medicine Sympathy:')).toBe(
        expected.medicineClaim
      );
    });
  }
});
