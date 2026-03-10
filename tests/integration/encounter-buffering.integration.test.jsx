import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { NotificationProvider } from '../../src/context/NotificationContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES } from '../../src/game/constants';
import App from '../../src/App';

/**
 * Integration tests for encounter buffering during jump animations.
 *
 * Validates that:
 * - Encounters show immediately when no jump is in progress
 * - Encounters are buffered during jump and revealed on JUMP_ANIMATION_NEAR_END
 * - JUMP_ANIMATION_NEAR_END subscription is wired up and cleaned up
 * - Near-end event with no pending encounter is a safe no-op
 *
 * Feature: encounter-animation-timing
 */

// Mock scene to avoid WebGL in jsdom
vi.mock('../../src/game/engine/scene', () => {
  const mockRenderer = {
    domElement: document.createElement('canvas'),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
  const mockControls = { update: vi.fn() };
  const mockScene = {
    background: null,
    fog: null,
    add: vi.fn(),
    traverse: vi.fn(),
  };
  const mockCamera = {
    aspect: 1,
    position: { set: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
  };
  const mockLights = {
    ambientLight: {},
    directionalLight: {
      position: { set: vi.fn().mockReturnThis(), normalize: vi.fn() },
    },
  };
  const mockStars = [
    {
      data: { id: 1 },
      position: { x: 0, y: 0, z: 0 },
      sprite: { material: { color: { setHex: vi.fn() } } },
      originalColor: 0xffffff,
    },
  ];

  return {
    initScene: vi.fn(() => ({
      scene: mockScene,
      camera: mockCamera,
      renderer: mockRenderer,
      controls: mockControls,
      lights: mockLights,
      stars: mockStars,
      sectorBoundary: { visible: true },
    })),
    onWindowResize: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    toggleBoundary: vi.fn(() => true),
  };
});

// Mock animation system
vi.mock('../../src/game/engine/game-animation', () => {
  return {
    JumpAnimationSystem: vi.fn().mockImplementation(() => ({
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
      playJumpAnimation: vi.fn(),
    })),
  };
});

// Mock SystemPanel to expose onJumpStart and onJumpComplete without needing full starmap context
vi.mock('../../src/features/navigation/SystemPanel', () => ({
  SystemPanel: ({ onJumpStart, onJumpComplete }) => (
    <div data-testid="mock-system-panel">
      <button onClick={onJumpStart} data-testid="mock-jump-start">
        Mock Jump Start
      </button>
      <button onClick={onJumpComplete} data-testid="mock-jump-complete">
        Mock Jump Complete
      </button>
    </div>
  ),
}));

describe('Encounter Buffering During Jump Animations', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function navigateToOrbit() {
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    const shipNameInput = screen.getByPlaceholderText('Enter ship name...');
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });
    fireEvent.keyDown(shipNameInput, { key: 'Enter' });
    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    // Dismiss the auto-shown instructions modal
    const closeModal = screen.queryByLabelText('Close modal');
    if (closeModal) {
      fireEvent.click(closeModal);
    }
  }

  const pirateEncounterData = {
    type: 'pirate',
    encounter: {
      id: 'pirate_test',
      type: 'pirate',
      title: 'Pirate Encounter',
      description: 'Pirates approach your vessel.',
      choices: [
        { id: 'fight', label: 'Fight' },
        { id: 'negotiate', label: 'Negotiate' },
        { id: 'surrender', label: 'Surrender' },
      ],
    },
  };

  it('should show encounter immediately when no jump is in progress', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Emit encounter event directly (no jump in progress)
    act(() => {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, pirateEncounterData);
    });

    // Encounter should appear immediately
    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  });

  it('should buffer encounter during jump and reveal on JUMP_ANIMATION_NEAR_END', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Open SystemPanel via System Info button
    const systemInfoBtn = screen.getByText('System Info');
    fireEvent.click(systemInfoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('mock-system-panel')).toBeInTheDocument();
    });

    // Trigger jump start (sets jumpInProgressRef = true)
    fireEvent.click(screen.getByTestId('mock-jump-start'));

    // Emit encounter while jump is in progress — should be buffered, not shown
    act(() => {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, pirateEncounterData);
    });

    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();

    // Emit near-end event — buffered encounter should now be revealed
    act(() => {
      game.emit(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
    });

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  });

  it('should not show encounter when JUMP_ANIMATION_NEAR_END fires with no pending encounter', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Emit near-end event with no pending encounter — should be a safe no-op
    act(() => {
      game.emit(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
    });

    // No encounter should appear
    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
    expect(screen.queryByText('Customs Inspection')).not.toBeInTheDocument();
  });

  it('should not reveal encounter after near-end if encounter was already resolved', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Trigger and fully resolve an encounter
    act(() => {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, pirateEncounterData);
    });

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Surrender'));
    fireEvent.click(screen.getByText('Confirm Surrender'));

    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
    });

    // Emit near-end after encounter is fully resolved — no ghost encounter
    act(() => {
      game.emit(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
    });

    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
  });

  it('should subscribe to JUMP_ANIMATION_NEAR_END on mount and unsubscribe on unmount', async () => {
    const subscribeSpy = vi.spyOn(game, 'subscribe');
    const unsubscribeSpy = vi.spyOn(game, 'unsubscribe');

    const { unmount } = render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    // Should have subscribed to JUMP_ANIMATION_NEAR_END
    const nearEndSubscriptions = subscribeSpy.mock.calls.filter(
      ([eventName]) => eventName === EVENT_NAMES.JUMP_ANIMATION_NEAR_END
    );
    expect(nearEndSubscriptions.length).toBeGreaterThanOrEqual(1);

    // Capture the handler that was subscribed
    const handler = nearEndSubscriptions[0][1];

    unmount();

    // Should have unsubscribed the same handler
    const nearEndUnsubscriptions = unsubscribeSpy.mock.calls.filter(
      ([eventName, fn]) =>
        eventName === EVENT_NAMES.JUMP_ANIMATION_NEAR_END && fn === handler
    );
    expect(nearEndUnsubscriptions.length).toBeGreaterThanOrEqual(1);
  });

  it('should clear viewingSystemId and deselect star on jump complete', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Open SystemPanel via System Info button
    const systemInfoBtn = screen.getByText('System Info');
    fireEvent.click(systemInfoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('mock-system-panel')).toBeInTheDocument();
    });

    // Trigger jump start (sets jumpInProgressRef = true)
    fireEvent.click(screen.getByTestId('mock-jump-start'));

    // SystemPanel should still be visible during jump (viewingSystemId not yet cleared)
    // Note: viewMode changes to ORBIT but showSystemPanel depends on viewingSystemId
    // After jump start, viewingSystemId is still set

    // Complete the jump — should clear viewingSystemId and deselect star
    fireEvent.click(screen.getByTestId('mock-jump-complete'));

    // SystemPanel should disappear because viewingSystemId is set to null
    await waitFor(() => {
      expect(
        screen.queryByTestId('mock-system-panel')
      ).not.toBeInTheDocument();
    });
  });

  it('should reveal buffered encounter on jump complete as safety fallback', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Open SystemPanel via System Info button
    const systemInfoBtn = screen.getByText('System Info');
    fireEvent.click(systemInfoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('mock-system-panel')).toBeInTheDocument();
    });

    // Trigger jump start (sets jumpInProgressRef = true)
    fireEvent.click(screen.getByTestId('mock-jump-start'));

    // Emit encounter while jump is in progress — should be buffered
    act(() => {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, pirateEncounterData);
    });

    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();

    // Complete the jump without near-end event — safety fallback should reveal encounter
    fireEvent.click(screen.getByTestId('mock-jump-complete'));

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  });

  it('should show salvage notifications when encounter outcome produces salvage messages', async () => {
    render(
      <GameProvider game={game}>
        <NotificationProvider>
          <App devMode={true} />
        </NotificationProvider>
      </GameProvider>
    );

    await navigateToOrbit();

    // Fill the cargo hold to near capacity so salvage messages are triggered
    const state = game.getState();
    const nearFullCargo = [
      { good: 'grain', qty: state.ship.cargoCapacity - 1, buyPrice: 10 },
    ];
    game.updateCargo(nearFullCargo);

    // Emit a distress call encounter
    const distressCallData = {
      type: 'distress_call',
      encounter: {
        id: 'dist_salvage_test',
        severity: 'moderate',
        type: 'mechanical',
        description: 'A civilian transport needs help.',
        vesselType: 'Civilian Transport',
        crewCount: '3 persons',
        timeElapsed: '1 hour',
        choices: [{ id: 'loot', label: 'Loot' }],
      },
    };

    act(() => {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, distressCallData);
    });

    await waitFor(() => {
      expect(screen.getByText('Distress Call')).toBeInTheDocument();
    });

    // Select "Salvage the Wreck" (loot choice)
    fireEvent.click(screen.getByText('Salvage the Wreck'));

    // Confirm the choice
    await waitFor(() => {
      expect(screen.getByText('Salvage the Wreck', { selector: 'button.distress-btn' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Salvage the Wreck', { selector: 'button.distress-btn' }));

    // Salvage notification should appear — only 1 of 2 parts fit
    await waitFor(() => {
      expect(screen.getByText(/Could only fit 1 of 2 units/)).toBeInTheDocument();
    });
  });
});
