/**
 * Integration tests for dialogue tip functionality
 *
 * Tests the integration between DialoguePanel, dialogue system, and tip functionality.
 * Verifies that tip options appear when available, are hidden when unavailable,
 * and display correct tip content from NPCs.
 *
 * Requirements: 2.1, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('Dialogue Tips Integration', () => {
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

  describe('Tip option visibility', () => {
    it('should show tip option when NPC has tips and meets reputation requirement', async () => {
      // Use Whisper who has tips and test at Warm reputation
      const npcId = 'whisper_sirius';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 15; // Warm tier (>= 10)
      npcState.lastTipDay = null; // No cooldown

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Whisper')).toBeInTheDocument();
      });

      // Verify tip option is present
      expect(screen.getByText('Any trading tips for me?')).toBeInTheDocument();
    });

    it('should hide tip option when NPC reputation is below Warm tier', async () => {
      // Use Whisper with Neutral reputation
      const npcId = 'whisper_sirius';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 5; // Neutral tier (< 10)
      npcState.lastTipDay = null; // No cooldown

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Whisper')).toBeInTheDocument();
      });

      // Verify tip option is not present
      expect(screen.queryByText('Any trading tips for me?')).not.toBeInTheDocument();
    });

    it('should hide tip option when NPC is on tip cooldown', async () => {
      // Use Whisper with Warm reputation but recent tip
      const npcId = 'whisper_sirius';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 15; // Warm tier
      
      // Set current day and recent tip day (within 7 days)
      const currentDay = 100;
      gameStateManager.getState().player.daysElapsed = currentDay;
      npcState.lastTipDay = currentDay - 3; // 3 days ago (< 7 days)

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Whisper')).toBeInTheDocument();
      });

      // Verify tip option is not present due to cooldown
      expect(screen.queryByText('Any trading tips for me?')).not.toBeInTheDocument();
    });

    it('should hide tip option when NPC has no tips', async () => {
      // Use Father Okonkwo who has empty tips array
      const npcId = 'okonkwo_ross154';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 15; // Warm tier
      npcState.lastTipDay = null; // No cooldown

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Father Okonkwo')).toBeInTheDocument();
      });

      // Verify no tip option is present (Father Okonkwo doesn't provide trading tips)
      expect(screen.queryByText(/tips for me/)).not.toBeInTheDocument();
    });
  });

  describe('Tip content display', () => {
    it('should display actual tip content when tip option is selected', async () => {
      // Use Whisper with available tip
      const npcId = 'whisper_sirius';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 15; // Warm tier
      npcState.lastTipDay = null; // No cooldown

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Whisper')).toBeInTheDocument();
      });

      // Click the tip option
      const tipButton = screen.getByText('Any trading tips for me?');
      fireEvent.click(tipButton);

      // Wait for tip dialogue to appear
      await waitFor(() => {
        // Should show the tip dialogue text plus actual tip content
        expect(screen.getByText(/Knowledge shared is knowledge multiplied/)).toBeInTheDocument();
      });

      // Verify that actual tip content is displayed (should be one of Whisper's tips)
      const whisperNPC = ALL_NPCS.find(npc => npc.id === npcId);
      const tipTexts = whisperNPC.tips;
      
      // Check if any of the tip texts appear in the dialogue
      const hasValidTip = tipTexts.some(tip => 
        screen.queryByText(new RegExp(tip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      );
      expect(hasValidTip).toBe(true);
    });

    it('should display different tips from different NPCs', async () => {
      // Test Wei Chen's tips
      const weiChenId = 'chen_barnards';
      const weiChenState = gameStateManager.getNPCState(weiChenId);
      weiChenState.rep = 15; // Warm tier
      weiChenState.lastTipDay = null; // No cooldown

      const { rerender } = render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={weiChenId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for Wei Chen dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      });

      // Click Wei Chen's tip option
      const weiTipButton = screen.getByText('Any dock worker tips for me?');
      fireEvent.click(weiTipButton);

      // Wait for tip dialogue and capture tip content
      await waitFor(() => {
        expect(screen.getByText(/Been working these docks for years/)).toBeInTheDocument();
      });

      // Verify Wei Chen's tip content appears
      const weiChenNPC = ALL_NPCS.find(npc => npc.id === weiChenId);
      const weiTipTexts = weiChenNPC.tips;
      const hasWeiTip = weiTipTexts.some(tip => 
        screen.queryByText(new RegExp(tip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      );
      expect(hasWeiTip).toBe(true);

      // Now test Marcus Cole's tips
      const marcusId = 'cole_sol';
      const marcusState = gameStateManager.getNPCState(marcusId);
      marcusState.rep = 15; // Warm tier
      marcusState.lastTipDay = null; // No cooldown

      rerender(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={marcusId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for Marcus Cole dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Marcus Cole')).toBeInTheDocument();
      });

      // Click Marcus Cole's tip option
      const marcusTipButton = screen.getByText('Any financial tips for me?');
      fireEvent.click(marcusTipButton);

      // Wait for tip dialogue
      await waitFor(() => {
        expect(screen.getByText(/Credit management is a skill/)).toBeInTheDocument();
      });

      // Verify Marcus Cole's tip content appears (different from Wei Chen's)
      const marcusNPC = ALL_NPCS.find(npc => npc.id === marcusId);
      const marcusTipTexts = marcusNPC.tips;
      const hasMarcusTip = marcusTipTexts.some(tip => 
        screen.queryByText(new RegExp(tip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      );
      expect(hasMarcusTip).toBe(true);
    });

    it('should update tip cooldown after tip is given', async () => {
      // Use Captain Vasquez for this test
      const npcId = 'vasquez_epsilon';
      const npcState = gameStateManager.getNPCState(npcId);
      npcState.rep = 15; // Warm tier
      npcState.lastTipDay = null; // No cooldown
      
      // Set current day
      const currentDay = 50;
      gameStateManager.getState().player.daysElapsed = currentDay;

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <DialoguePanel npcId={npcId} onClose={mockOnClose} />
        </GameProvider>
      );

      // Wait for dialogue to initialize
      await waitFor(() => {
        expect(screen.getByText('Captain Vasquez')).toBeInTheDocument();
      });

      // Click the tip option
      const tipButton = screen.getByText('Any trading tips for me?');
      fireEvent.click(tipButton);

      // Wait for tip dialogue to appear
      await waitFor(() => {
        expect(screen.getByText(/Always happy to share what I know/)).toBeInTheDocument();
      });

      // Verify that lastTipDay was updated
      expect(npcState.lastTipDay).toBe(currentDay);

      // Go back to greeting and verify tip option is no longer available
      const responseButton = screen.getByText('That information is very helpful.');
      fireEvent.click(responseButton);

      // Wait for return to greeting
      await waitFor(() => {
        expect(screen.getByText(/Good to see you're still out there making runs/)).toBeInTheDocument();
      });

      // Verify tip option is no longer available due to cooldown
      expect(screen.queryByText('Any trading tips for me?')).not.toBeInTheDocument();
    });
  });

  describe('Tip option text variations', () => {
    it('should show NPC-specific tip option text', async () => {
      // Test different NPCs have different tip option text
      const testCases = [
        { npcId: 'whisper_sirius', expectedText: 'Any trading tips for me?' },
        { npcId: 'chen_barnards', expectedText: 'Any dock worker tips for me?' },
        { npcId: 'cole_sol', expectedText: 'Any financial tips for me?' },
        { npcId: 'vasquez_epsilon', expectedText: 'Any trading tips for me?' },
        { npcId: 'kim_tau_ceti', expectedText: 'Any operational tips for me?' },
        { npcId: 'rodriguez_procyon', expectedText: 'Any maintenance tips for me?' },
        { npcId: 'osman_luyten', expectedText: 'Got any market tips for me?' },
        { npcId: 'kowalski_alpha_centauri', expectedText: 'Any station operation tips for me?' },
        { npcId: 'liu_wolf359', expectedText: 'Got any risk-taking tips for me?' },
      ];

      for (const { npcId, expectedText } of testCases) {
        // Skip Father Okonkwo as he doesn't have tips
        if (npcId === 'okonkwo_ross154') continue;

        const npcState = gameStateManager.getNPCState(npcId);
        npcState.rep = 15; // Warm tier
        npcState.lastTipDay = null; // No cooldown

        const { rerender } = render(
          <GameProvider gameStateManager={gameStateManager}>
            <DialoguePanel npcId={npcId} onClose={mockOnClose} />
          </GameProvider>
        );

        // Wait for dialogue to initialize
        await waitFor(() => {
          const npcData = ALL_NPCS.find(npc => npc.id === npcId);
          expect(screen.getByText(npcData.name)).toBeInTheDocument();
        });

        // Verify the specific tip option text appears
        expect(screen.getByText(expectedText)).toBeInTheDocument();

        // Clean up for next iteration
        rerender(<div />);
      }
    });
  });
});