import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Integration: SystemPanel shows the stars of a system', () => {
  let game;

  beforeEach(() => {
    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  function renderPanel(viewingSystemId) {
    render(
      <GameProvider game={game}>
        <StarmapProvider
          value={{ selectStarById: vi.fn(), deselectStar: vi.fn() }}
        >
          <SystemPanel
            viewingSystemId={viewingSystemId}
            onClose={() => {}}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </StarmapProvider>
      </GameProvider>
    );
  }

  it('titles Sirius by system name and lists both stars', () => {
    renderPanel(7);
    expect(screen.getByRole('heading', { name: 'Sirius' })).toBeTruthy();
    expect(screen.getByText('Sirius A: A1, main-sequence star')).toBeTruthy();
    expect(screen.getByText('Sirius B: DA2, white dwarf')).toBeTruthy();
  });

  it('lists the stars of the current system too', () => {
    game.getState().player.currentSystem = 1;
    renderPanel(1);
    // Only the current-system branch lists wormhole connections
    expect(document.querySelector('.connected-systems')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Alpha Centauri' })
    ).toBeTruthy();
    expect(
      screen.getByText('Alpha Centauri B: K0, main-sequence star')
    ).toBeTruthy();
  });

  it("a single star like Barnard's Star has no Stars list", () => {
    renderPanel(4);
    expect(
      screen.getByRole('heading', { name: "Barnard's Star" })
    ).toBeTruthy();
    expect(screen.queryByText('Stars:')).toBeNull();
  });
});
