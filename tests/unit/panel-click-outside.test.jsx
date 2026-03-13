import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { PanelContainer } from '../../src/features/station/PanelContainer.jsx';
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
