import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { createWrapper } from '../react-test-utils.jsx';

describe('DevAdminPanel', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Repair All button', () => {
    it('should set fuel to 100 in addition to repairing all systems', () => {
      // Set fuel to a low value first
      game.setFuel(30);
      game.updateShipCondition(50, 60, 70);

      const wrapper = createWrapper(game);
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
      const condition = game.getShipCondition();
      expect(condition.hull).toBe(100);
      expect(condition.engine).toBe(100);
      expect(condition.lifeSupport).toBe(100);

      // Verify fuel is also set to 100
      const ship = game.getShip();
      expect(ship.fuel).toBe(100);
    });
  });

  describe('NPC Reputation section', () => {
    it('should render NPCs in a dropdown selector instead of listing all', () => {
      const wrapper = createWrapper(game);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      // Find the NPC section
      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      expect(npcSection).toBeTruthy();

      // Should have a custom select dropdown for NPC selection
      const customSelect = npcSection.querySelector('.custom-select');
      expect(customSelect).toBeTruthy();

      // Open the dropdown to see options
      const trigger = customSelect.querySelector('.custom-select-trigger');
      fireEvent.click(trigger);

      const options = customSelect.querySelectorAll('.custom-select-option');
      expect(options.length).toBe(ALL_NPCS.length);
    });

    it('should list NPC options in alphabetical order by name', () => {
      const wrapper = createWrapper(game);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      const customSelect = npcSection.querySelector('.custom-select');
      const trigger = customSelect.querySelector('.custom-select-trigger');
      fireEvent.click(trigger);

      const options = Array.from(
        customSelect.querySelectorAll('.custom-select-option')
      );
      const npcNames = options.map((o) => o.textContent);

      const sorted = [...npcNames].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      expect(npcNames).toEqual(sorted);
    });

    it('should show rep controls for selected NPC only', () => {
      const wrapper = createWrapper(game);
      const { container } = render(<DevAdminPanel onClose={() => {}} />, {
        wrapper,
      });

      const npcSection = Array.from(
        container.querySelectorAll('.dev-admin-section')
      ).find((section) => section.textContent.includes('NPC Reputation'));

      // Before selecting an NPC, no rep controls should be visible
      const repInputBefore = npcSection.querySelector('input[type="number"]');
      expect(repInputBefore).toBeFalsy();

      // Open the dropdown and select an NPC
      const customSelect = npcSection.querySelector('.custom-select');
      const trigger = customSelect.querySelector('.custom-select-trigger');
      fireEvent.click(trigger);
      const firstOption = customSelect.querySelector('.custom-select-option');
      fireEvent.click(firstOption);

      // Now rep controls should be visible
      const repInputAfter = npcSection.querySelector('input[type="number"]');
      expect(repInputAfter).toBeTruthy();
    });
  });
});
