import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { StationMenu } from '../../src/features/station/StationMenu.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

/**
 * Unit tests for Station Menu NPC Integration
 * Feature: npc-foundation
 *
 * **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
 *
 * Tests that the station menu correctly displays NPCs when present,
 * omits the PEOPLE section when no NPCs are present, and handles
 * NPC selection to open dialogue.
 */
describe('Station Menu NPC Integration', () => {
  let gameStateManager;

  beforeEach(() => {
    cleanup();
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  describe('PEOPLE section visibility', () => {
    it('should display PEOPLE section when NPCs are present at current system', () => {
      // Sol (system 0) has Marcus Cole
      const sol = STAR_DATA.find((s) => s.id === 0);
      act(() => {
        gameStateManager.updateLocation(sol.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
        </GameProvider>
      );

      // Should show PEOPLE section
      expect(screen.getByText('PEOPLE')).toBeInTheDocument();
    });

    it('should omit PEOPLE section when no NPCs are present at current system', () => {
      // Find a system without NPCs
      const npcSystemIds = ALL_NPCS.map((npc) => npc.system);
      const systemWithoutNPCs = STAR_DATA.find(
        (s) => !npcSystemIds.includes(s.id) && s.st > 0
      );

      if (systemWithoutNPCs) {
        act(() => {
          gameStateManager.updateLocation(systemWithoutNPCs.id);
        });

        render(
          <GameProvider gameStateManager={gameStateManager}>
            <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
          </GameProvider>
        );

        // Should NOT show PEOPLE section
        expect(screen.queryByText('PEOPLE')).not.toBeInTheDocument();
      }
    });

    it('should display NPC name, role, and reputation tier', () => {
      // Sol (system 0) has Marcus Cole
      const sol = STAR_DATA.find((s) => s.id === 0);
      act(() => {
        gameStateManager.updateLocation(sol.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
        </GameProvider>
      );

      // Marcus Cole should be displayed with name, role, and tier
      expect(screen.getByText('Marcus Cole')).toBeInTheDocument();
      expect(screen.getByText('Loan Shark')).toBeInTheDocument();
      // Marcus Cole starts at -20 rep which is "Cold" tier
      expect(screen.getByText('Cold')).toBeInTheDocument();
    });
  });

  describe('NPC selection and dialogue', () => {
    it('should call onOpenPanel with dialogue and npcId when NPC is clicked', () => {
      const onOpenPanel = vi.fn();

      // Sol (system 0) has Marcus Cole
      const sol = STAR_DATA.find((s) => s.id === 0);
      act(() => {
        gameStateManager.updateLocation(sol.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={onOpenPanel} onUndock={() => {}} />
        </GameProvider>
      );

      // Click on Marcus Cole
      const npcButton = screen.getByText('Marcus Cole').closest('button');
      fireEvent.click(npcButton);

      // Should call onOpenPanel with dialogue panel and NPC ID
      expect(onOpenPanel).toHaveBeenCalledWith('dialogue', 'cole_sol');
    });
  });

  describe('NPC display at different systems', () => {
    it("should display Wei Chen at Barnard's Star", () => {
      // Barnard's Star (system 4) has Wei Chen
      const barnards = STAR_DATA.find((s) => s.id === 4);
      act(() => {
        gameStateManager.updateLocation(barnards.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
        </GameProvider>
      );

      expect(screen.getByText('Wei Chen')).toBeInTheDocument();
      expect(screen.getByText('Dock Worker')).toBeInTheDocument();
      // Wei Chen starts at 0 rep which is "Neutral" tier
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });

    it('should display Father Okonkwo at Ross 154', () => {
      // Ross 154 (system 11) has Father Okonkwo
      const ross154 = STAR_DATA.find((s) => s.id === 11);
      act(() => {
        gameStateManager.updateLocation(ross154.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
        </GameProvider>
      );

      expect(screen.getByText('Father Okonkwo')).toBeInTheDocument();
      expect(screen.getByText('Chaplain')).toBeInTheDocument();
      // Father Okonkwo starts at 10 rep which is "Warm" tier
      expect(screen.getByText('Warm')).toBeInTheDocument();
    });
  });

  describe('Reputation tier updates', () => {
    it('should display updated reputation tier after reputation change', () => {
      // Sol (system 0) has Marcus Cole
      const sol = STAR_DATA.find((s) => s.id === 0);

      // Marcus Cole starts at -20 (Cold) and has trust of 0.1
      // To move from Cold (-49 to -10) to Neutral (-9 to 9), we need to get to at least -9
      // With trust modifier of 0.1, we need to add a large amount
      // -20 + (amount * 0.1) >= -9 means amount >= 110
      // Let's add 150 to be safe: -20 + (150 * 0.1) = -20 + 15 = -5 (Neutral)
      gameStateManager.modifyRep('cole_sol', 150, 'test');

      act(() => {
        gameStateManager.updateLocation(sol.id);
      });

      render(
        <GameProvider gameStateManager={gameStateManager}>
          <StationMenu onOpenPanel={() => {}} onUndock={() => {}} />
        </GameProvider>
      );

      // Should now show Neutral tier instead of Cold
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.queryByText('Cold')).not.toBeInTheDocument();
    });
  });
});
