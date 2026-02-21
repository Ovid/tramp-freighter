import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG, NEW_GAME_DEFAULTS } from '../../src/game/constants.js';

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Cole Debt System', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  describe('Finance State Initialization', () => {
    it('initializes player.finance with correct defaults', () => {
      const state = gsm.state;
      expect(state.player.finance).toBeDefined();
      expect(state.player.finance.heat).toBe(COLE_DEBT_CONFIG.STARTING_HEAT);
      expect(state.player.finance.lienRate).toBe(
        COLE_DEBT_CONFIG.STARTING_LIEN_RATE
      );
      expect(state.player.finance.interestRate).toBe(
        COLE_DEBT_CONFIG.INTEREST_RATE
      );
      expect(state.player.finance.lastInterestDay).toBe(0);
      expect(state.player.finance.nextCheckpoint).toBe(
        COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY
      );
      expect(state.player.finance.totalBorrowed).toBe(0);
      expect(state.player.finance.totalRepaid).toBe(0);
    });

    it('player.debt still exists at starting value', () => {
      expect(gsm.state.player.debt).toBe(NEW_GAME_DEFAULTS.STARTING_DEBT);
    });
  });
});
