import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { PanelContainer } from '../../src/features/station/PanelContainer.jsx';
import { StationMenu } from '../../src/features/station/StationMenu.jsx';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

describe('PanelContainer click-outside-to-dismiss', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should call onClose when clicking the backdrop', () => {
    const onClose = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(
      <PanelContainer activePanel="ship-status" onClose={onClose} />,
      { wrapper }
    );

    const backdrop = container.querySelector('.panel-backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside the panel', () => {
    const onClose = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(
      <PanelContainer activePanel="ship-status" onClose={onClose} />,
      { wrapper }
    );

    const panel = container.querySelector('#ship-status-panel');
    expect(panel).toBeTruthy();
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('StationMenu click-outside-to-dismiss', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should call onUndock when clicking the backdrop', () => {
    const onUndock = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(
      <StationMenu onOpenPanel={() => {}} onUndock={onUndock} />,
      { wrapper }
    );

    const backdrop = container.querySelector('.station-backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onUndock).toHaveBeenCalledTimes(1);
  });

  it('should not call onUndock when clicking inside the station menu', () => {
    const onUndock = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(
      <StationMenu onOpenPanel={() => {}} onUndock={onUndock} />,
      { wrapper }
    );

    const menu = container.querySelector('#station-interface');
    expect(menu).toBeTruthy();
    fireEvent.click(menu);
    expect(onUndock).not.toHaveBeenCalled();
  });
});

describe('DevAdminPanel click-outside-to-dismiss', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should call onClose when clicking the backdrop', () => {
    const onClose = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(<DevAdminPanel onClose={onClose} />, {
      wrapper,
    });

    const backdrop = container.querySelector('.dev-admin-backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside the panel', () => {
    const onClose = vi.fn();
    const wrapper = createWrapper(game);
    const { container } = render(<DevAdminPanel onClose={onClose} />, {
      wrapper,
    });

    const panel = container.querySelector('#dev-admin-panel');
    expect(panel).toBeTruthy();
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});
