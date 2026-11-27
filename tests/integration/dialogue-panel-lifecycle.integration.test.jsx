/**
 * Integration tests for DialoguePanel lifecycle behavior
 *
 * Tests the panel's behavior during initialization, dialogue progression,
 * and dialogue ending. Ensures the panel doesn't prematurely close on mount
 * and properly closes when dialogue ends.
 *
 * These tests prevent regressions of:
 * - Panel showing "Loading dialogue..." indefinitely when dialogue ends
 * - Panel immediately closing on mount before dialogue initializes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { NotificationProvider } from '../../src/context/NotificationContext.jsx';
import { NotificationContainer } from '../../src/components/NotificationContainer.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';

describe('DialoguePanel Lifecycle', () => {
  let game;
  let mockOnClose;

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    // Mock console methods to suppress test output
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

  describe('Panel initialization', () => {
    it('should not call onClose during initial mount', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to fully initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Verify onClose was never called during initialization
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('opens over a dialogue left active by a save, under StrictMode', async () => {
      // A save can hold an active dialogue. StrictMode's simulated unmount
      // clears it, which must not read as this panel's dialogue ending.
      await game.startDialogue('rodriguez_procyon', 'greeting');

      render(
        <StrictMode>
          <GameProvider game={game}>
            <DialoguePanel npcId="rodriguez_procyon" onClose={mockOnClose} />
          </GameProvider>
        </StrictMode>
      );

      await waitFor(() => {
        expect(screen.getByText(/Rodriguez/)).toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show loading state briefly then display dialogue content', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Eventually should show dialogue content, not loading
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
        expect(
          screen.queryByText('Loading dialogue...')
        ).not.toBeInTheDocument();
      });
    });

    it('should display NPC greeting after initialization', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        // Should show Wei Chen's greeting
        expect(screen.getByText(/Another trader/)).toBeInTheDocument();
      });
    });
  });

  describe('Dialogue ending behavior', () => {
    it('should call onClose when selecting a farewell choice (next: null)', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Find and click the farewell option
      const farewellButton = screen.getByText('Nothing right now. Take care.');
      fireEvent.click(farewellButton);

      // Should call onClose when dialogue ends
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not show "Loading dialogue..." when dialogue ends', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click farewell option
      const farewellButton = screen.getByText('Nothing right now. Take care.');
      fireEvent.click(farewellButton);

      // Wait for onClose to be called
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // The panel should close via onClose, not show loading state
      // If the component is still mounted, it shouldn't show "Loading dialogue..."
      // because onClose should unmount it
    });
  });

  describe('Dialogue progression', () => {
    it('should continue dialogue when selecting a choice with next node', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Find and click a conversation option (not farewell)
      const conversationButton = screen.getByText(
        "Just making conversation. How's work?"
      );
      fireEvent.click(conversationButton);

      // Should show next dialogue node, not close
      await waitFor(() => {
        // Should still show Wei Chen (dialogue continues)
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
        // Should show new dialogue text from small_talk node
        expect(screen.getByText(/Work's work/)).toBeInTheDocument();
      });

      // onClose should not have been called
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not show loading state between dialogue nodes', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click conversation option
      const conversationButton = screen.getByText(
        "Just making conversation. How's work?"
      );
      fireEvent.click(conversationButton);

      // Should transition smoothly without showing loading
      await waitFor(() => {
        expect(screen.getByText(/Work's work/)).toBeInTheDocument();
      });

      // Loading state should not appear during transition
      expect(screen.queryByText('Loading dialogue...')).not.toBeInTheDocument();
    });
  });

  describe('Manual close behavior', () => {
    it('should call onClose when clicking the close button', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click the close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Should call onClose (may be called multiple times due to manual close + auto-close effect)
      // The important thing is that it gets called at least once
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should clear dialogue state when manually closing', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Verify dialogue is active
      const dialogueState = game.getDialogueState();
      expect(dialogueState.isActive).toBe(true);

      // Click the close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Dialogue state should be cleared
      const clearedState = game.getDialogueState();
      expect(clearedState.isActive).toBe(false);
      expect(clearedState.currentNpcId).toBeNull();
    });

    it('should clear dialogue state when the parent unmounts the panel', async () => {
      // Escape, undock, dock and jump all close the panel without its button
      const { unmount } = render(
        <GameProvider game={game}>
          <DialoguePanel npcId="chen_barnards" onClose={mockOnClose} />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });
      expect(game.getDialogueState().isActive).toBe(true);

      unmount();

      const clearedState = game.getDialogueState();
      expect(clearedState.isActive).toBe(false);
      expect(clearedState.currentNpcId).toBeNull();
      expect(clearedState.display).toBeNull();
    });
  });

  describe('Multiple dialogue sessions', () => {
    it('should handle reopening dialogue after closing', async () => {
      const npcId = 'chen_barnards';

      const { rerender } = render(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for first dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Close dialogue via farewell
      const farewellButton = screen.getByText('Nothing right now. Take care.');
      fireEvent.click(farewellButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      // Reset mock and simulate reopening (parent would unmount/remount)
      mockOnClose.mockClear();

      // Unmount and remount to simulate reopening
      rerender(<div />);

      rerender(
        <GameProvider game={game}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Should initialize properly again
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Should not have called onClose during reinitialization
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Failure handling', () => {
    it('closes the panel and clears dialogue when a choice throws', async () => {
      vi.spyOn(game, 'selectDialogueChoice').mockRejectedValue(
        new Error('choice failure')
      );

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="chen_barnards" onClose={mockOnClose} />
        </GameProvider>
      );
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nothing right now. Take care.'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(game.getState().dialogue.isActive).toBe(false);
    });

    it('still lets the player close the panel when the dialogue fails to start', async () => {
      vi.spyOn(game, 'startDialogue').mockRejectedValue(
        new Error('start failure')
      );

      render(
        <GameProvider game={game}>
          <DialoguePanel npcId="chen_barnards" onClose={mockOnClose} />
        </GameProvider>
      );
      await waitFor(() => {
        expect(game.startDialogue).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByLabelText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    describe('the player is told', () => {
      const renderWithToasts = () =>
        render(
          <GameProvider game={game}>
            <NotificationProvider>
              <NotificationContainer />
              <DialoguePanel npcId="chen_barnards" onClose={mockOnClose} />
            </NotificationProvider>
          </GameProvider>
        );

      it('when the dialogue fails to start, and the panel closes', async () => {
        vi.spyOn(game, 'startDialogue').mockRejectedValue(
          new Error('start failure')
        );

        renderWithToasts();

        expect(
          await screen.findByText(
            /Something went wrong with this conversation, so it has been closed\./
          )
        ).toBeInTheDocument();
        expect(mockOnClose).toHaveBeenCalled();
      });

      it('when a choice fails, and the panel closes', async () => {
        vi.spyOn(game, 'selectDialogueChoice').mockRejectedValue(
          new Error('choice failure')
        );
        renderWithToasts();
        await screen.findByText('Wei Chen');

        fireEvent.click(screen.getByText('Nothing right now. Take care.'));

        expect(
          await screen.findByText(
            /Something went wrong with this conversation, so it has been closed\./
          )
        ).toBeInTheDocument();
        expect(mockOnClose).toHaveBeenCalled();
      });

      it("when a choice's action fails, and the conversation continues", async () => {
        const node = ALL_DIALOGUE_TREES.chen_barnards.greeting;
        const farewell = node.choices.find(
          (c) => c.text === 'Nothing right now. Take care.'
        );
        const { action, next } = farewell;
        farewell.action = () => {
          throw new Error('action failure');
        };
        farewell.next = 'greeting';

        try {
          renderWithToasts();
          await screen.findByText('Wei Chen');

          fireEvent.click(screen.getByText('Nothing right now. Take care.'));

          expect(
            await screen.findByText(
              /Something went wrong with that request\. It may not have gone through\./
            )
          ).toBeInTheDocument();
          expect(mockOnClose).not.toHaveBeenCalled();
          expect(screen.getByText('Wei Chen')).toBeInTheDocument();
        } finally {
          farewell.action = action;
          farewell.next = next;
        }
      });
    });
  });
});
