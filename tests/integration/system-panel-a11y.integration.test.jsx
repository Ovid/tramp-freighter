import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Integration: SystemPanel accessibility', () => {
  let game;

  beforeEach(() => {
    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  function panel(viewingSystemId, props = {}) {
    return (
      <GameProvider game={game}>
        <StarmapProvider
          value={{
            selectStarById: props.selectStarById ?? vi.fn(),
            deselectStar: vi.fn(),
          }}
        >
          <SystemPanel
            viewingSystemId={viewingSystemId}
            onClose={props.onClose ?? (() => {})}
            onJumpStart={() => {}}
            onJumpComplete={() => {}}
          />
        </StarmapProvider>
      </GameProvider>
    );
  }

  it('close button calls onClose without arguments, so the star is deselected', () => {
    const onClose = vi.fn();
    render(panel(game.getState().player.currentSystem, { onClose }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]).toEqual([]);
  });

  it('is a region named by an h2 of the system name', () => {
    const id = game.getState().player.currentSystem;
    render(panel(id));
    const name = STAR_DATA.find((s) => s.id === id).name;
    const region = screen.getByRole('region', { name });
    expect(region.querySelector('h2').textContent).toBe(name);
  });

  it('keeps focus in the panel when a connected system is picked', () => {
    const currentId = game.getState().player.currentSystem;
    const { rerender } = render(panel(currentId));
    const firstConnection = document.querySelector('.connection-item');
    firstConnection.focus();
    const targetId = game.navigationSystem.getConnectedSystems(currentId)[0];
    rerender(panel(targetId));
    const target = STAR_DATA.find((s) => s.id === targetId);
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: target.name })
    );
  });

  it('announces the jump error and links it to the disabled jump button', () => {
    const currentId = game.getState().player.currentSystem;
    const connected = game.navigationSystem.getConnectedSystems(currentId);
    const unconnected = STAR_DATA.find(
      (s) => s.id !== currentId && !connected.includes(s.id)
    );
    render(panel(unconnected.id));
    const alert = screen.getByRole('alert');
    const jumpBtn = screen.getByRole('button', { name: /jump to system/i });
    expect(jumpBtn.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('connection list shows the same fuel and time as the jump view, worn engine included', () => {
    game.getState().ship.engine = 50;
    const currentId = game.getState().player.currentSystem;
    render(panel(currentId));
    const button = document.querySelector('.connection-item');
    const name = button.querySelector('.connection-name').textContent;
    const target = STAR_DATA.find((s) => s.name === name);
    const v = game.navigationSystem.validateJump(
      currentId,
      target.id,
      100,
      50,
      game.applyQuirkModifiers.bind(game),
      game.getState().ship.quirks,
      game.calculateShipCapabilities().fuelConsumption
    );
    const details = button.querySelector('.connection-details').textContent;
    expect(details).toContain(`${Math.round(v.fuelCost)}% fuel`);
    expect(details).toContain(`${v.jumpTime} day`);
  });

  it('names each connection button by system only, with details as its description', () => {
    const currentId = game.getState().player.currentSystem;
    render(panel(currentId));
    const button = document.querySelector('.connection-item');
    const name = button.querySelector('.connection-name').textContent;
    expect(screen.getByRole('button', { name })).toBe(button);
    const describedBy = document.getElementById(
      button.getAttribute('aria-describedby')
    );
    expect(describedBy.textContent).toMatch(
      /light-years, \d+% fuel, \d+ days?/
    );
    expect(button.querySelector('div')).toBeNull();
  });

  it.each([
    ['current system', () => game.getState().player.currentSystem],
    ['another system', () => 4],
  ])(
    'the %s view labels station and network rows separately',
    (_label, getId) => {
      const id = getId();
      render(panel(id));
      const system = STAR_DATA.find((s) => s.id === id);
      const value = (label) =>
        screen.getByText(label).parentElement.querySelector('.value')
          .textContent;
      expect(value('Station:')).toBe(system.st > 0 ? 'Available' : 'None');
      expect(value('Network:')).toBe(
        system.r === 1 ? 'On the wormhole network' : 'Off the wormhole network'
      );
      expect(screen.queryByText('Status:')).toBeNull();
    }
  );

  it('does not steal focus from the star map canvas', () => {
    const canvas = document.createElement('div');
    canvas.className = 'starmap-container';
    canvas.tabIndex = 0;
    document.body.appendChild(canvas);
    canvas.focus();
    render(panel(4));
    expect(document.activeElement).toBe(canvas);
    canvas.remove();
  });

  it('returns focus to the control that opened it when it closes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(panel(4));
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('connections are a list under a Wormhole Connections heading', () => {
    render(panel(game.getState().player.currentSystem));
    const heading = screen.getByRole('heading', {
      name: 'Wormhole Connections',
    });
    const list = screen.getByRole('list', { name: 'Wormhole Connections' });
    expect(heading).toBeTruthy();
    const items = list.querySelectorAll(':scope > li > .connection-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('keeps list semantics on the stars list for Safari', () => {
    render(panel(7));
    expect(
      document.querySelector('.system-stars ul').getAttribute('role')
    ).toBe('list');
  });

  it('names the close button after the system', () => {
    render(panel(4));
    expect(
      screen.getByRole('button', { name: "Close Barnard's Star panel" })
    ).toBeTruthy();
  });

  it('closes on Escape when focus is inside the panel', () => {
    const onClose = vi.fn();
    render(panel(4, { onClose }));
    fireEvent.keyDown(screen.getByRole('heading', { name: "Barnard's Star" }), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]).toEqual([]);
  });
});
