/**
 * Unit Tests for Save/Load Danger Events
 * Feature: danger-system
 *
 * Verifies that karmaChanged and factionRepChanged events are emitted
 * when loading a saved game, so danger panel components get correct
 * values after mid-session save loads.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Save/Load Danger Events', () => {
  let manager;
  let emitSpy;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    emitSpy = vi.spyOn(manager, 'emit');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should emit karmaChanged with saved karma value after load', () => {
    // Set up game state with specific karma
    manager.initNewGame();
    manager.getState().player.karma = 42;

    // Save the game
    manager.saveGame();

    // Clear the emit spy to only capture load events
    emitSpy.mockClear();

    // Load the saved game
    const loaded = manager.loadGame();
    expect(loaded).not.toBeNull();

    // Verify karmaChanged was emitted with the saved value
    const karmaEmit = emitSpy.mock.calls.find(
      ([event]) => event === 'karmaChanged'
    );
    expect(karmaEmit).toBeDefined();
    expect(karmaEmit[1]).toBe(42);
  });

  it('should emit factionRepChanged with saved faction values after load', () => {
    // Set up game state with specific faction reputations
    manager.initNewGame();
    manager.getState().player.factions = {
      authorities: 10,
      traders: -5,
      outlaws: 20,
      civilians: 15,
    };

    // Save the game
    manager.saveGame();

    // Clear the emit spy to only capture load events
    emitSpy.mockClear();

    // Load the saved game
    const loaded = manager.loadGame();
    expect(loaded).not.toBeNull();

    // Verify factionRepChanged was emitted with the saved values
    const factionEmit = emitSpy.mock.calls.find(
      ([event]) => event === 'factionRepChanged'
    );
    expect(factionEmit).toBeDefined();
    expect(factionEmit[1]).toEqual({
      authorities: 10,
      traders: -5,
      outlaws: 20,
      civilians: 15,
    });
  });

  it('should emit karmaChanged with 0 when karma is missing from save', () => {
    // Set up a minimal game state and save
    manager.initNewGame();
    manager.saveGame();

    // Manipulate the saved data to remove karma
    const savedData = JSON.parse(localStorage.getItem('trampFreighterSave'));
    delete savedData.player.karma;
    localStorage.setItem('trampFreighterSave', JSON.stringify(savedData));

    // Clear the emit spy to only capture load events
    emitSpy.mockClear();

    // Load the saved game
    const loaded = manager.loadGame();
    expect(loaded).not.toBeNull();

    // Verify karmaChanged was emitted with fallback value of 0
    const karmaEmit = emitSpy.mock.calls.find(
      ([event]) => event === 'karmaChanged'
    );
    expect(karmaEmit).toBeDefined();
    expect(karmaEmit[1]).toBe(0);
  });

  it('should emit factionRepChanged with empty object when factions missing from save', () => {
    // Set up a minimal game state and save
    manager.initNewGame();
    manager.saveGame();

    // Manipulate the saved data to remove factions
    const savedData = JSON.parse(localStorage.getItem('trampFreighterSave'));
    delete savedData.player.factions;
    localStorage.setItem('trampFreighterSave', JSON.stringify(savedData));

    // Clear the emit spy to only capture load events
    emitSpy.mockClear();

    // Load the saved game
    const loaded = manager.loadGame();
    expect(loaded).not.toBeNull();

    // Verify factionRepChanged was emitted (addStateDefaults will add default factions)
    const factionEmit = emitSpy.mock.calls.find(
      ([event]) => event === 'factionRepChanged'
    );
    expect(factionEmit).toBeDefined();
    expect(factionEmit[1]).toBeDefined();
    expect(typeof factionEmit[1]).toBe('object');
  });
});
