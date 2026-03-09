/**
 * Integration tests for quest progress bar in DialoguePanel
 *
 * Verifies the quest progress UI renders correctly when an NPC has
 * quest data, and is absent for non-quest NPCs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

describe('DialoguePanel Quest Progress', () => {
  let game;
  let mockOnClose;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.stubGlobal('console', {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    });

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Quest NPC (Tanaka)', () => {
    it('should display quest progress bar with Trust label', async () => {
      // Give Tanaka some reputation so progress bar has values
      game.modifyRepRaw('tanaka_barnards', 5, 'test');

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
      });

      // Should show Trust label with current/threshold values
      expect(
        screen.getByText(
          (content) =>
            content.includes('Trust:') &&
            content.includes('5') &&
            content.includes(`${ENDGAME_CONFIG.STAGE_1_REP}`)
        )
      ).toBeInTheDocument();

      // Should render the progressbar with correct ARIA attributes
      const progressBar = screen.getByRole('progressbar', {
        name: 'Quest progress',
      });
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '5');
      expect(progressBar).toHaveAttribute(
        'aria-valuemax',
        `${ENDGAME_CONFIG.STAGE_1_REP}`
      );
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should clamp negative reputation to zero in progress bar', async () => {
      // Set Tanaka's rep to a negative value
      game.modifyRepRaw('tanaka_barnards', -10, 'test');

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
      });

      const progressBar = screen.getByRole('progressbar', {
        name: 'Quest progress',
      });
      // aria-valuenow should be clamped to 0, not -10
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');

      // Fill width should be 0%, not negative
      const fill = progressBar.querySelector('.quest-progress-fill');
      expect(fill.style.width).toBe('0%');
    });

    it('should clamp aria-valuenow to aria-valuemax when rep exceeds threshold', async () => {
      // Give Tanaka more rep than needed for stage 1
      game.modifyRepRaw(
        'tanaka_barnards',
        ENDGAME_CONFIG.STAGE_1_REP + 5,
        'test'
      );

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
      });

      const progressBar = screen.getByRole('progressbar', {
        name: 'Quest progress',
      });
      expect(progressBar).toHaveAttribute(
        'aria-valuenow',
        `${ENDGAME_CONFIG.STAGE_1_REP}`
      );
    });

    it('should show "Ready!" label when rep meets threshold', async () => {
      game.modifyRepRaw(
        'tanaka_barnards',
        ENDGAME_CONFIG.STAGE_1_REP + 5,
        'test'
      );

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
      });

      // Should show "Ready!" instead of "Next: Field Test"
      expect(screen.getByText(/Ready!/)).toBeInTheDocument();
      expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();

      // Label should show clamped value, not exceeding threshold
      expect(
        screen.getByText(
          (content) =>
            content.includes('Trust:') &&
            content.includes(`${ENDGAME_CONFIG.STAGE_1_REP}`) &&
            content.includes(`${ENDGAME_CONFIG.STAGE_1_REP}`)
        )
      ).toBeInTheDocument();
    });

    it('should show next stage name', async () => {
      game.modifyRepRaw('tanaka_barnards', 3, 'test');

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="tanaka_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Yuki Tanaka')).toBeInTheDocument();
      });

      // Stage 1 name is "Field Test"
      expect(screen.getByText(/Next:.*Field Test/)).toBeInTheDocument();
    });
  });

  describe('Non-quest NPC (Wei Chen)', () => {
    it('should not display quest progress bar', async () => {
      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="chen_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Should not have a progressbar
      expect(
        screen.queryByRole('progressbar', { name: 'Quest progress' })
      ).not.toBeInTheDocument();

      // Should not show Trust label
      expect(screen.queryByText(/Trust:/)).not.toBeInTheDocument();
    });
  });
});
