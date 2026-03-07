import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { EVENT_NAMES } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

describe('DevAdminPanel epilogue preview', () => {
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

  it('renders Preview Epilogue button in Endgame section', () => {
    const wrapper = createWrapper(gameStateManager);
    const { container } = render(<DevAdminPanel onClose={() => {}} />, {
      wrapper,
    });
    const headings = Array.from(container.querySelectorAll('h3'));
    expect(headings.find((h) => h.textContent === 'Endgame')).toBeTruthy();

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(
      buttons.find((b) => b.textContent === 'Preview Epilogue')
    ).toBeTruthy();
  });

  it('emits EPILOGUE_PREVIEW_TRIGGERED when Preview Epilogue is clicked', () => {
    const emitSpy = vi.spyOn(gameStateManager, 'emit');
    const wrapper = createWrapper(gameStateManager);
    const { container } = render(<DevAdminPanel onClose={() => {}} />, {
      wrapper,
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const previewBtn = buttons.find(
      (b) => b.textContent === 'Preview Epilogue'
    );
    fireEvent.click(previewBtn);

    expect(emitSpy).toHaveBeenCalledWith(
      EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED,
      expect.any(Number)
    );
  });
});
