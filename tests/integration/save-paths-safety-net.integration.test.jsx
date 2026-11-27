import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { SAVE_KEY, UI_CONFIG } from '../../src/game/constants';

// Pins what reaches localStorage, whichever save call the code uses: no
// change is lost, and a pending change survives an unload flush.
describe('Save paths safety net', () => {
  let game;
  let storage;

  const saved = () => JSON.parse(storage[SAVE_KEY]);

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k) => storage[k] ?? null),
      setItem: vi.fn((k, v) => {
        storage[k] = v;
      }),
      removeItem: vi.fn((k) => delete storage[k]),
      clear: vi.fn(() => (storage = {})),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('a ship named at the start of a new game is in the save after an unload flush', async () => {
    game.initNewGame();
    render(
      <GameProvider game={game}>
        <App />
      </GameProvider>
    );

    fireEvent.click(screen.getByText('New Game'));
    const input = await screen.findByLabelText('Ship name');
    fireEvent.change(input, { target: { value: 'Rusty Mule' } });
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() =>
      expect(screen.queryByText('Name Your Ship')).not.toBeInTheDocument()
    );

    game.flushSave();

    expect(saved().ship.name).toBe('Rusty Mule');
  });

  it('two changes less than a second apart both reach the save once the debounce settles', () => {
    vi.useFakeTimers();
    game.initNewGame();
    game.saveGame();

    game.updateShipName('First');
    game.saveGame();
    game.updateCredits(4321);
    game.saveGame();

    vi.advanceTimersByTime(
      Math.max(UI_CONFIG.SAVE_DEBOUNCE_MS, UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS) + 1
    );

    expect(saved().ship.name).toBe('First');
    expect(saved().player.credits).toBe(4321);
  });

  it('a change made just before unload reaches the save on flush', () => {
    vi.useFakeTimers();
    game.initNewGame();
    game.saveGame();

    game.updateShipName('Last Light');
    game.flushSave();

    expect(saved().ship.name).toBe('Last Light');
  });
});
