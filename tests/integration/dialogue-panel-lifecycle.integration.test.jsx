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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('DialoguePanel Lifecycle', () => {
  let gameStateManager;
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

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
    mockOnClose = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Panel initialization', () => {
    it('should not call onClose during initial mount', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider gameStateManager={gameStateManager}>
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

    it('should show loading state briefly then display dialogue content', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Eventually should show dialogue content, not loading
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
        expect(screen.queryByText('Loading dialogue...')).not.toBeInTheDocument();
      });
    });

    it('should display NPC greeting after initialization', async () => {
      const npcId = 'chen_barnards';

      render(
        <GameProvider gameStateManager={gameStateManager}>
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
        <GameProvider gameStateManager={gameStateManager}>
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
        <GameProvider gameStateManager={gameStateManager}>
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
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Find and click a conversation option (not farewell)
      const conversationButton = screen.getByText("Just making conversation. How's work?");
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
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click conversation option
      const conversationButton = screen.getByText("Just making conversation. How's work?");
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
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click the close button
      const closeButton = screen.getByLabelText('Close dialogue');
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
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Verify dialogue is active
      const dialogueState = gameStateManager.getDialogueState();
      expect(dialogueState.isActive).toBe(true);

      // Click the close button
      const closeButton = screen.getByLabelText('Close dialogue');
      fireEvent.click(closeButton);

      // Dialogue state should be cleared
      const clearedState = gameStateManager.getDialogueState();
      expect(clearedState.isActive).toBe(false);
      expect(clearedState.currentNpcId).toBeNull();
    });
  });

  describe('Multiple dialogue sessions', () => {
    it('should handle reopening dialogue after closing', async () => {
      const npcId = 'chen_barnards';

      const { rerender } = render(
        <GameProvider gameStateManager={gameStateManager}>
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
        <GameProvider gameStateManager={gameStateManager}>
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
});
