import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { createWrapper } from '../react-test-utils.jsx';

describe('DevAdminPanel', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Repair All button', () => {
    it('should set fuel to 100 in addition to repairing all systems', () => {
      // Set fuel to a low value first
      gameStateManager.setFuel(30);
      gameStateManager.updateShipCondition(50, 60, 70);

      const wrapper = createWrapper(gameStateManager);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      // Find and click the "Repair All" button
      const repairAllBtn = Array.from(
        container.querySelectorAll('.dev-admin-action-btn')
      ).find((btn) => btn.textContent.includes('Repair All'));

      expect(repairAllBtn).toBeTruthy();
      fireEvent.click(repairAllBtn);

      // Verify all systems are at 100
      const condition = gameStateManager.getShipCondition();
      expect(condition.hull).toBe(100);
      expect(condition.engine).toBe(100);
      expect(condition.lifeSupport).toBe(100);

      // Verify fuel is also set to 100
      const ship = gameStateManager.getShip();
      expect(ship.fuel).toBe(100);
    });
  });

  describe('NPC Reputation section', () => {
    it('should render NPCs in a dropdown selector instead of listing all', () => {
      const wrapper = createWrapper(gameStateManager);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      // Find the NPC section
      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      expect(npcSection).toBeTruthy();

      // Should have a select dropdown for NPC selection
      const npcSelect = npcSection.querySelector('select');
      expect(npcSelect).toBeTruthy();

      // Options should include all NPCs
      const options = Array.from(npcSelect.querySelectorAll('option'));
      // First option is placeholder
      const npcOptions = options.filter((o) => o.value !== '');
      expect(npcOptions.length).toBe(ALL_NPCS.length);
    });

    it('should list NPC options in alphabetical order by name', () => {
      const wrapper = createWrapper(gameStateManager);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      const npcSelect = npcSection.querySelector('select');
      const options = Array.from(npcSelect.querySelectorAll('option'));
      const npcNames = options
        .filter((o) => o.value !== '')
        .map((o) => o.textContent);

      const sorted = [...npcNames].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      expect(npcNames).toEqual(sorted);
    });

    it('should show rep controls for selected NPC only', () => {
      const wrapper = createWrapper(gameStateManager);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      // Before selecting an NPC, no rep controls should be visible
      const repInputBefore = npcSection.querySelector('input[type="number"]');
      expect(repInputBefore).toBeFalsy();

      // Select an NPC
      const npcSelect = npcSection.querySelector('select');
      fireEvent.change(npcSelect, { target: { value: ALL_NPCS[0].id } });

      // Now rep controls should be visible
      const repInputAfter = npcSection.querySelector('input[type="number"]');
      expect(repInputAfter).toBeTruthy();
    });
  });
});
