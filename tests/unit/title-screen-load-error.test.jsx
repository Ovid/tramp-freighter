import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SAVE_KEY } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * When the boot-time load rejected the save, the title screen says so
 * instead of offering a Continue that would drop the player into a fresh
 * game and later overwrite the save.
 *
 * Feature: save-load, load failure reporting
 */
describe('TitleScreen with an unreadable save', () => {
  let store;

  beforeEach(() => {
    store = { [SAVE_KEY]: '{not json' };
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
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

  function bootGame() {
    // Mirrors main.jsx: try the save, fall back to a fresh in-memory game
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    if (!game.loadGame()) game.initNewGame();
    return game;
  }

  it('shows the load failure reason and no Continue button', () => {
    const game = bootGame();
    render(<TitleScreen onStartGame={vi.fn()} />, {
      wrapper: createWrapper(game),
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/could not be read/i);
    expect(screen.queryByText('Continue Game')).not.toBeInTheDocument();
  });

  it('still asks for confirmation before New Game replaces the unreadable save', () => {
    const game = bootGame();
    const onStartGame = vi.fn();
    render(<TitleScreen onStartGame={onStartGame} />, {
      wrapper: createWrapper(game),
    });

    fireEvent.click(screen.getByText('New Game'));

    expect(onStartGame).not.toHaveBeenCalled();
    expect(
      screen.getByText(/overwrite your existing save/i)
    ).toBeInTheDocument();
  });
});
