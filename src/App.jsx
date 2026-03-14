import { useState, useRef, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TitleScreen } from './features/title-screen/TitleScreen';
import { ShipNamingDialog } from './features/title-screen/ShipNamingDialog';
import { StarMapCanvas } from './features/navigation/StarMapCanvas';
import { HUD } from './features/hud/HUD';
import { StationMenu } from './features/station/StationMenu';
import { PanelContainer } from './features/station/PanelContainer';
import { DevAdminPanel } from './features/dev-admin/DevAdminPanel';
import { SystemPanel } from './features/navigation/SystemPanel';
import { PirateEncounterPanel } from './features/danger/PirateEncounterPanel';
import { CombatPanel } from './features/danger/CombatPanel';
import { NegotiationPanel } from './features/danger/NegotiationPanel';
import { InspectionPanel } from './features/danger/InspectionPanel';
import { MechanicalFailurePanel } from './features/danger/MechanicalFailurePanel';
import { DistressCallPanel } from './features/danger/DistressCallPanel';
import { OutcomePanel } from './features/danger/OutcomePanel';
import { useGame } from './context/GameContext';
import { useNotificationContext } from './context/NotificationContext';
import { useGameEvent } from './hooks/useGameEvent';
import { useEventTriggers } from './hooks/useEventTriggers';
import { useEncounterOrchestration } from './hooks/useEncounterOrchestration';
import { EVENT_NAMES, ENDGAME_CONFIG } from './game/constants.js';
import { NarrativeEventPanel } from './features/narrative/NarrativeEventPanel';
import { InstructionsModal } from './features/instructions/InstructionsModal';
import { StarmapProvider } from './context/StarmapContext';
import { MissionCompleteNotifier } from './features/missions/MissionCompleteNotifier';
import { RumorAlert } from './features/hud/RumorAlert';
import { AchievementToast } from './features/achievements/AchievementToast';
import { NotificationContainer } from './components/NotificationContainer';
import { PavonisRun } from './features/endgame/PavonisRun.jsx';
import { Epilogue } from './features/endgame/Epilogue.jsx';
import { PostCreditsStation } from './features/endgame/PostCreditsStation.jsx';

/**
 * Application state machine modes.
 * Controls which UI components are rendered and manages the game flow
 * from initial load through gameplay without complex conditional logic.
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 47.1, 48.1
 */
const VIEW_MODES = {
  TITLE: 'TITLE',
  SHIP_NAMING: 'SHIP_NAMING',
  ORBIT: 'ORBIT',
  STATION: 'STATION',
  ENCOUNTER: 'ENCOUNTER',
  PAVONIS_RUN: 'PAVONIS_RUN',
  EPILOGUE: 'EPILOGUE',
};

/**
 * Root application orchestrator.
 *
 * Manages the UI state machine and coordinates between React's declarative
 * rendering and the imperative GameCoordinator. Acts as the bridge between
 * the game engine and the user interface.
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5, 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 48.1, 48.7
 *
 * @param {boolean} devMode - Whether dev mode is enabled (from .dev file check)
 */
export default function App({ devMode = false }) {
  const game = useGame();
  const notificationCtx = useNotificationContext();
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const encounterEvent = useGameEvent(EVENT_NAMES.ENCOUNTER_TRIGGERED);
  const narrativeEvent = useGameEvent(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED);
  const pavonisRunEvent = useGameEvent(EVENT_NAMES.PAVONIS_RUN_TRIGGERED);
  const epiloguePreviewEvent = useGameEvent(
    EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED
  );
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const saveFailedEvent = useGameEvent(EVENT_NAMES.SAVE_FAILED);
  useEventTriggers();

  const {
    currentEncounter,
    encounterOutcome,
    encounterPhase,
    combatContext,
    handleEncounterChoice,
    handleEncounterClose,
    handleOutcomeContinue,
    handleJumpStart: encounterJumpStart,
    handleJumpComplete: encounterJumpComplete,
    registerSetViewMode,
  } = useEncounterOrchestration(game, notificationCtx, encounterEvent);

  const starmapRef = useRef(null);

  const [viewMode, setViewMode] = useState(VIEW_MODES.TITLE);
  const [activePanel, setActivePanel] = useState(null);
  const [activePanelNpcId, setActivePanelNpcId] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);
  const [activeNarrativeEvent, setActiveNarrativeEvent] = useState(null);
  const lastHandledNarrative = useRef(null);
  const [postCredits, setPostCredits] = useState(() => {
    try {
      return !!game.getNarrativeFlags()?.post_credits;
    } catch {
      // State not yet initialized during first render — safe to default to false
      return false;
    }
  });

  // Starmap methods that will be provided to context.
  // Uses state (not ref) so that updating methods triggers a re-render,
  // propagating the real functions to context consumers.
  const [starmapMethods, setStarmapMethods] = useState({
    selectStarById: () => {},
    deselectStar: () => {},
  });

  // Register setViewMode with the encounter orchestration hook
  useEffect(() => {
    registerSetViewMode(setViewMode);
  }, [registerSetViewMode]);

  // Surface save failures to the player
  useEffect(() => {
    if (saveFailedEvent?.message && notificationCtx) {
      notificationCtx.showError(saveFailedEvent.message);
    }
  }, [saveFailedEvent, notificationCtx]);

  // Exotic matter scanner feedback during docking
  useEffect(() => {
    if (!game || !notificationCtx) return;

    const handleCollected = (data) => {
      notificationCtx.showInfo(
        `Scanner: Exotic matter detected. Sample collected. [${data.count}/${data.total}]`
      );
    };
    const handleAlreadySampled = () => {
      notificationCtx.showInfo('Scanner: Already sampled this station.');
    };

    game.subscribe(EVENT_NAMES.EXOTIC_MATTER_COLLECTED, handleCollected);
    game.subscribe(
      EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED,
      handleAlreadySampled
    );
    return () => {
      game.unsubscribe(EVENT_NAMES.EXOTIC_MATTER_COLLECTED, handleCollected);
      game.unsubscribe(
        EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED,
        handleAlreadySampled
      );
    };
  }, [game, notificationCtx]);

  // Determine if system panel should be shown
  // Show when a system is selected (regardless of view mode)
  // System Info should always be accessible, even when panels are open
  const showSystemPanel = viewingSystemId !== null;

  const handleStartGame = (isNewGame) => {
    if (isNewGame) {
      // Initialize new game
      game.initNewGame();
      setPostCredits(false);
      // Show ship naming dialog
      setViewMode(VIEW_MODES.SHIP_NAMING);
    } else {
      // Load existing game
      game.loadGame();
      const isPostCredits = !!game.getNarrativeFlags()?.post_credits;
      if (isPostCredits) {
        // Reset Yumi's interaction counter so the full dialogue progression
        // is available when returning from the title screen
        const yumiState = game.getNPCState('yumi_delta_pavonis');
        yumiState.interactions = 0;
        game.markDirty();
      }
      setPostCredits(isPostCredits);
      // Transition to game
      setViewMode(VIEW_MODES.ORBIT);
    }
  };

  const handleShipNamed = (shipName) => {
    // Update ship name in game state
    game.updateShipName(shipName);
    // Save game with ship name
    game.saveGame();
    // Transition to game
    setViewMode(VIEW_MODES.ORBIT);
    setShowInstructions(true);
  };

  const handleDock = () => {
    if (viewMode === VIEW_MODES.STATION) {
      // If currently in station mode, go back to orbit
      setViewMode(VIEW_MODES.ORBIT);
      setActivePanel(null);
    } else {
      // If in orbit mode, go to station
      game.dock();
      setViewMode(VIEW_MODES.STATION);
    }
  };

  const handleUndock = () => {
    game.undock();
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
    setViewingSystemId(null);
  };

  const handleOpenPanel = (panelName, npcId = null) => {
    setActivePanel(panelName);
    setActivePanelNpcId(npcId);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
    setActivePanelNpcId(null);
  };

  const handleOpenDevAdmin = () => {
    setShowDevAdmin(true);
  };

  const handleCloseDevAdmin = () => {
    setShowDevAdmin(false);
  };

  const handleOpenSystemInfo = () => {
    if (viewingSystemId === currentSystemId) {
      // If already viewing current system, close the panel
      setViewingSystemId(null);
    } else {
      // Open system panel for current system
      setViewingSystemId(currentSystemId);
    }
  };

  const handleSystemSelected = (systemId) => {
    setViewingSystemId(systemId);
  };

  const handleSystemDeselected = () => {
    setViewingSystemId(null);
  };

  /**
   * @param {boolean} keepSelection - If true, don't deselect star (used during jump)
   */
  const handleCloseSystemPanel = (keepSelection = false) => {
    setViewingSystemId(null);
    // Deselect star in scene unless we're keeping it for jump animation
    if (!keepSelection && starmapRef.current) {
      starmapRef.current.deselectStar();
    }
  };

  // Close station menu immediately so user can see the animation.
  // Keep selection ring visible during animation to show destination.
  const handleJumpStart = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
    encounterJumpStart();
  };

  // After jump, deselect star so only current system indicator is visible.
  const handleJumpComplete = () => {
    setViewingSystemId(null);
    if (starmapRef.current) {
      starmapRef.current.deselectStar();
    }
    encounterJumpComplete();
  };

  // Listen for narrative events (overlay — does not change viewMode)
  useEffect(() => {
    if (
      narrativeEvent &&
      !activeNarrativeEvent &&
      narrativeEvent !== lastHandledNarrative.current
    ) {
      lastHandledNarrative.current = narrativeEvent;
      setActiveNarrativeEvent(narrativeEvent);
    }
  }, [narrativeEvent, activeNarrativeEvent]);

  const handleNarrativeClose = () => {
    setActiveNarrativeEvent(null);
  };

  const handleStartPavonisRun = useCallback(() => {
    setViewMode(VIEW_MODES.PAVONIS_RUN);
  }, []);

  const handlePavonisComplete = () => {
    game.markVictory();
    setViewMode(VIEW_MODES.EPILOGUE);
  };

  const handleCreditsComplete = useCallback(() => {
    game.setNarrativeFlag('post_credits');
    // Reset Yumi's interaction counter so the full dialogue progression
    // (rounds 0→1→2→loop) is available from the start
    const yumiState = game.getNPCState('yumi_delta_pavonis');
    yumiState.interactions = 0;
    game.markDirty();
    setPostCredits(true);
    setViewMode(VIEW_MODES.STATION);
  }, [game]);

  const handleReturnToTitle = () => {
    setPostCredits(false);
    setViewMode(VIEW_MODES.TITLE);
  };

  useEffect(() => {
    if (pavonisRunEvent) {
      handleStartPavonisRun();
    }
  }, [pavonisRunEvent, handleStartPavonisRun]);

  useEffect(() => {
    if (epiloguePreviewEvent) {
      setShowDevAdmin(false);
      game.devTeleport(ENDGAME_CONFIG.DELTA_PAVONIS_ID);
      setViewMode(VIEW_MODES.EPILOGUE);
    }
  }, [epiloguePreviewEvent, game]);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Title screen displayed on initial load */}
        {viewMode === VIEW_MODES.TITLE && (
          <TitleScreen onStartGame={handleStartGame} />
        )}

        {/* Ship naming dialog displayed when starting a new game */}
        {viewMode === VIEW_MODES.SHIP_NAMING && (
          <ShipNamingDialog onSubmit={handleShipNamed} />
        )}

        {/* Game components only rendered after title screen flow completes */}
        {viewMode !== VIEW_MODES.TITLE &&
          viewMode !== VIEW_MODES.SHIP_NAMING && (
            <StarmapProvider value={starmapMethods}>
              {/* Starmap is always rendered (z-index 0) */}
              <ErrorBoundary>
                <StarMapCanvas
                  ref={starmapRef}
                  onSystemSelected={handleSystemSelected}
                  onSystemDeselected={handleSystemDeselected}
                  onStarmapMethodsReady={(methods) => {
                    setStarmapMethods(methods);
                  }}
                />
              </ErrorBoundary>

              {/* HUD is always rendered */}
              <nav aria-label="Game HUD">
                <HUD onDock={handleDock} onSystemInfo={handleOpenSystemInfo} />
              </nav>
              <RumorAlert />
              <AchievementToast />
              <NotificationContainer />

              <main id="main-content">
              {/* Station menu displayed when docked */}
              {viewMode === VIEW_MODES.STATION && (
                <>
                  <MissionCompleteNotifier />
                  {postCredits ? (
                    <PostCreditsStation
                      onOpenPanel={handleOpenPanel}
                      onReturnToTitle={handleReturnToTitle}
                    />
                  ) : (
                    <StationMenu
                      onOpenPanel={handleOpenPanel}
                      onUndock={handleUndock}
                    />
                  )}
                  {/* Panel container displayed alongside station menu */}
                  {activePanel && (
                    <PanelContainer
                      activePanel={activePanel}
                      npcId={activePanelNpcId}
                      onClose={handleClosePanel}
                    />
                  )}
                </>
              )}

              {/* Dev admin button (only visible in dev mode) */}
              {devMode && (
                <button
                  id="dev-admin-btn"
                  onClick={handleOpenDevAdmin}
                  style={{ display: 'flex' }}
                >
                  ⚙
                </button>
              )}

              {/* Dev admin panel (only rendered in dev mode when open) */}
              {devMode && showDevAdmin && (
                <DevAdminPanel onClose={handleCloseDevAdmin} />
              )}

              {/* System panel (rendered when viewing a system) */}
              {showSystemPanel && (
                <SystemPanel
                  viewingSystemId={viewingSystemId}
                  onClose={handleCloseSystemPanel}
                  onJumpStart={handleJumpStart}
                  onJumpComplete={handleJumpComplete}
                />
              )}

              {/* Encounter panels (rendered when an encounter is active) */}
              <ErrorBoundary>
                {viewMode === VIEW_MODES.ENCOUNTER &&
                  currentEncounter &&
                  !encounterOutcome && (
                    <>
                      {currentEncounter.type === 'pirate' &&
                        encounterPhase === 'initial' && (
                          <PirateEncounterPanel
                            encounter={currentEncounter.encounter}
                            onChoice={handleEncounterChoice}
                            onClose={handleEncounterClose}
                            escalated={combatContext?.escalated || false}
                          />
                        )}
                      {currentEncounter.type === 'pirate' &&
                        encounterPhase === 'combat' && (
                          <CombatPanel
                            combat={currentEncounter.encounter}
                            onChoice={handleEncounterChoice}
                            onClose={handleEncounterClose}
                            fleeContext={combatContext}
                          />
                        )}
                      {currentEncounter.type === 'pirate' &&
                        encounterPhase === 'negotiation' && (
                          <NegotiationPanel
                            encounter={currentEncounter.encounter}
                            onChoice={handleEncounterChoice}
                            onClose={handleEncounterClose}
                          />
                        )}
                      {currentEncounter.type === 'inspection' && (
                        <InspectionPanel
                          inspection={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
                      {currentEncounter.type === 'mechanical_failure' && (
                        <MechanicalFailurePanel
                          failure={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
                      {currentEncounter.type === 'distress_call' && (
                        <DistressCallPanel
                          distressCall={currentEncounter.encounter}
                          onChoice={handleEncounterChoice}
                          onClose={handleEncounterClose}
                        />
                      )}
                    </>
                  )}

                {/* Outcome panel (shown after encounter choice is resolved) */}
                {viewMode === VIEW_MODES.ENCOUNTER && encounterOutcome && (
                  <OutcomePanel
                    outcome={encounterOutcome}
                    onContinue={handleOutcomeContinue}
                    onClose={handleOutcomeContinue}
                  />
                )}
              </ErrorBoundary>

              {/* Narrative event overlay (renders on top of any view mode) */}
              {activeNarrativeEvent && (
                <NarrativeEventPanel
                  event={activeNarrativeEvent}
                  onClose={handleNarrativeClose}
                />
              )}

              <InstructionsModal
                isOpen={showInstructions}
                onClose={() => setShowInstructions(false)}
                shipName={shipName}
              />
              </main>
            </StarmapProvider>
          )}

        {/* Pavonis Run endgame sequence */}
        {viewMode === VIEW_MODES.PAVONIS_RUN && (
          <PavonisRun
            onComplete={handlePavonisComplete}
            onCancel={() => setViewMode(VIEW_MODES.STATION)}
          />
        )}

        {/* Epilogue after Pavonis Run */}
        {viewMode === VIEW_MODES.EPILOGUE && (
          <Epilogue onCreditsComplete={handleCreditsComplete} />
        )}
      </div>
    </ErrorBoundary>
  );
}
