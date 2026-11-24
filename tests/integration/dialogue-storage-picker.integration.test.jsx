import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { NotificationProvider } from '../../src/context/NotificationContext.jsx';
import { NotificationContainer } from '../../src/components/NotificationContainer.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { createTestGame } from '../test-utils.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;

describe('DialoguePanel cargo storage picker', () => {
  let game;
  let npcState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPanel = () =>
    render(
      <GameProvider game={game}>
        <NotificationProvider>
          <NotificationContainer />
          <DialoguePanel npcId={NPC_ID} onClose={vi.fn()} />
        </NotificationProvider>
      </GameProvider>
    );

  const openStorePicker = async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByText('Can you store some cargo for me?')
    );
    fireEvent.click(await screen.findByText('That would be a huge help.'));
    return screen.findByRole('dialog', {
      name: `Store cargo with ${NPC_NAME}`,
    });
  };

  it('opens the picker in a named dialog without advancing', async () => {
    const repBefore = npcState.rep;
    expect(await openStorePicker()).toBeInTheDocument();
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
    expect(npcState.rep).toBe(repBefore);
  });
  it('Cancel stays on the same node and grants nothing', async () => {
    await openStorePicker();
    const repBefore = npcState.rep;
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
    expect(npcState.rep).toBe(repBefore);
    expect(npcState.lastFavorDay).toBeNull();
  });
  it('Confirm stores, shows the message, then advances with repGain', async () => {
    await openStorePicker();
    const repBefore = npcState.rep;
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Store one more Grain bought at 10 credits',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));

    expect(
      await screen.findByText(`Stored 1 unit with ${NPC_NAME}`, {
        exact: false,
      })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(game.getDialogueState().currentNodeId).toBe('greeting');
    expect(npcState.rep).toBe(repBefore + 2);
    expect(npcState.storedCargo).toEqual([
      { good: 'grain', qty: 1, buyPrice: 10 },
    ]);
  });
  it('a failure keeps the modal open and shows the message', async () => {
    await openStorePicker();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Store one more Grain bought at 10 credits',
      })
    );
    // The favor gets used up while the picker is open
    npcState.lastFavorDay = game.getState().player.daysElapsed;
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Favor used recently/
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
  });
  it('retrieving shows the retrieve message', async () => {
    npcState.storedCargo = [{ good: 'ore', qty: 3, buyPrice: 20 }];
    renderPanel();
    fireEvent.click(
      await screen.findByText('I want to retrieve my stored cargo.')
    );
    fireEvent.click(await screen.findByText('Let me choose what to take.'));
    await screen.findByRole('dialog', {
      name: `Retrieve cargo from ${NPC_NAME}`,
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retrieve as many Ore bought at 20 credits as fit',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retrieve 3 units' }));

    expect(
      await screen.findByText(`Retrieved 3 units from ${NPC_NAME}`, {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(npcState.storedCargo).toEqual([]);
  });
});
