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
import { transformOutcomeForDisplay } from './features/danger/transformOutcome';
import { applyEncounterOutcome } from './features/danger/applyEncounterOutcome';
import { useGameState } from './context/GameContext';
import { useGameEvent } from './hooks/useGameEvent';
import { useEventTriggers } from './hooks/useEventTriggers';
import { EVENT_NAMES, NEGOTIATION_CONFIG } from './game/constants.js';
import { NarrativeEventPanel } from './features/narrative/NarrativeEventPanel';
import { InstructionsModal } from './features/instructions/InstructionsModal';
import { StarmapProvider } from './context/StarmapContext';
import { MissionCompleteNotifier } from './features/missions/MissionCompleteNotifier';
import { RumorAlert } from './features/hud/RumorAlert';
import { AchievementToast } from './features/achievements/AchievementToast';
import { NotificationContainer } from './components/NotificationContainer';
import { PavonisRun } from './features/endgame/PavonisRun.jsx';
import { Epilogue } from './features/endgame/Epilogue.jsx';

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
  PANEL: 'PANEL',
  ENCOUNTER: 'ENCOUNTER',
  PAVONIS_RUN: 'PAVONIS_RUN',
  EPILOGUE: 'EPILOGUE',
};

/**
 * Root application orchestrator.
 *
 * Manages the UI state machine and coordinates between React's declarative
 * rendering and the imperative GameStateManager. Acts as the bridge between
 * the game engine and the user interface.
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5, 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 48.1, 48.7
 *
 * @param {boolean} devMode - Whether dev mode is enabled (from .dev file check)
 */
export default function App({ devMode = false }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const encounterEvent = useGameEvent(EVENT_NAMES.ENCOUNTER_TRIGGERED);
  const narrativeEvent = useGameEvent(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED);
  const pavonisRunEvent = useGameEvent(EVENT_NAMES.PAVONIS_RUN_TRIGGERED);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  useEventTriggers();
  const starmapRef = useRef(null);

  const [viewMode, setViewMode] = useState(VIEW_MODES.TITLE);
  const [activePanel, setActivePanel] = useState(null);
  const [activePanelNpcId, setActivePanelNpcId] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [encounterOutcome, setEncounterOutcome] = useState(null);
  const [encounterPhase, setEncounterPhase] = useState('initial');
  const [combatContext, setCombatContext] = useState(null);
  const lastHandledEncounter = useRef(null);
  const jumpInProgressRef = useRef(false);
  const pendingEncounterRef = useRef(null);
  const [activeNarrativeEvent, setActiveNarrativeEvent] = useState(null);
  const lastHandledNarrative = useRef(null);

  // Starmap methods that will be provided to context
  // These will be set by StarMapCanvas when it initializes
  const starmapMethods = useRef({
    selectStarById: () => {},
    deselectStar: () => {},
  });

  // Determine if system panel should be shown
  // Show when a system is selected (regardless of view mode)
  // System Info should always be accessible, even when panels are open
  const showSystemPanel = viewingSystemId !== null;

  const handleStartGame = (isNewGame) => {
    if (isNewGame) {
      // Initialize new game
      gameStateManager.initNewGame();
      // Show ship naming dialog
      setViewMode(VIEW_MODES.SHIP_NAMING);
    } else {
      // Load existing game
      gameStateManager.loadGame();
      // Transition to game
      setViewMode(VIEW_MODES.ORBIT);
    }
  };

  const handleShipNamed = (shipName) => {
    // Update ship name in game state
    gameStateManager.updateShipName(shipName);
    // Save game with ship name
    gameStateManager.saveGame();
    // Transition to game
    setViewMode(VIEW_MODES.ORBIT);
    setShowInstructions(true);
  };

  const handleDock = () => {
    if (viewMode === VIEW_MODES.STATION || viewMode === VIEW_MODES.PANEL) {
      // If currently in station or panel mode, go back to orbit
      setViewMode(VIEW_MODES.ORBIT);
      setActivePanel(null);
    } else {
      // If in orbit mode, go to station
      gameStateManager.dock();
      setViewMode(VIEW_MODES.STATION);
    }
  };

  const handleUndock = () => {
    gameStateManager.undock();
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
  };

  const handleOpenPanel = (panelName, npcId = null) => {
    setActivePanel(panelName);
    setActivePanelNpcId(npcId);
    setViewMode(VIEW_MODES.PANEL);
  };

  const handleClosePanel = () => {
    setViewMode(VIEW_MODES.STATION);
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
    jumpInProgressRef.current = true;
    // Don't deselect star - keep selection ring visible during jump
  };

  // After jump, deselect star so only current system indicator is visible.
  const handleJumpComplete = () => {
    setViewingSystemId(null);
    jumpInProgressRef.current = false;
    // Deselect star after jump completes - we've arrived at destination
    // Only the current system indicator (green) should be visible
    if (starmapRef.current) {
      starmapRef.current.deselectStar();
    }
    // Safety fallback: show any encounter that wasn't revealed by near-end event
    if (pendingEncounterRef.current) {
      handleEncounterTriggered(pendingEncounterRef.current);
      pendingEncounterRef.current = null;
    }
  };

  // Handle encounter events from the danger system
  const handleEncounterTriggered = (encounterData) => {
    setCurrentEncounter(encounterData);
    setEncounterPhase('initial');
    setViewMode(VIEW_MODES.ENCOUNTER);
  };

  const handleEncounterChoice = (choice) => {
    if (!currentEncounter) return;

    // Flee from initial panel resolves immediately via evasive maneuvers
    if (
      currentEncounter.type === 'pirate' &&
      encounterPhase === 'initial' &&
      choice === 'flee'
    ) {
      try {
        const outcome = gameStateManager.resolveCombatChoice(
          currentEncounter.encounter,
          'evasive'
        );
        handleApplyOutcome(outcome);
        if (outcome.success) {
          const displayOutcome = transformOutcomeForDisplay(
            outcome,
            'pirate',
            'flee'
          );
          setEncounterOutcome(displayOutcome);
        } else {
          setCombatContext({
            fleeAttemptFailed: true,
            hullDamage: outcome.costs?.hull ?? 0,
            description: outcome.description,
          });
          setEncounterPhase('combat');
        }
      } catch (error) {
        console.error('Flee resolution failed:', error);
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setEncounterPhase('initial');
        setViewMode(VIEW_MODES.ORBIT);
      }
      return;
    }

    // Two-step pirate encounter: route to sub-panels
    if (currentEncounter.type === 'pirate' && encounterPhase === 'initial') {
      if (choice === 'fight') {
        setEncounterPhase('combat');
        return;
      }
      if (choice === 'negotiate') {
        setEncounterPhase('negotiation');
        return;
      }
      // Surrender resolves immediately (falls through)
    }

    if (gameStateManager.resolveEncounter) {
      try {
        // Route combat/negotiation sub-choices to their specific resolvers
        let outcome;
        if (encounterPhase === 'combat') {
          // 'flee' from combat/negotiation sub-panels maps to evasive maneuvers
          const combatChoice = choice === 'flee' ? 'evasive' : choice;
          outcome = gameStateManager.resolveCombatChoice(
            currentEncounter.encounter,
            combatChoice
          );
        } else if (encounterPhase === 'negotiation') {
          if (choice === 'flee') {
            // Breaking off negotiation to flee triggers evasive maneuvers
            outcome = gameStateManager.resolveCombatChoice(
              currentEncounter.encounter,
              'evasive'
            );
          } else {
            outcome = gameStateManager.resolveNegotiation(
              currentEncounter.encounter,
              choice
            );
          }
        } else {
          outcome = gameStateManager.resolveEncounter(currentEncounter, choice);
        }

        // Failed negotiation escalates to combat — skip applying empty outcome
        if (outcome.escalate) {
          // Bump threat tier for display and apply strength modifier for combat
          const THREAT_ESCALATION = {
            weak: 'moderate',
            moderate: 'strong',
            strong: 'dangerous',
            dangerous: 'dangerous',
          };
          const current = currentEncounter.encounter.threatLevel || 'moderate';
          currentEncounter.encounter.threatLevel =
            THREAT_ESCALATION[current] || 'strong';
          currentEncounter.encounter.strengthModifier =
            NEGOTIATION_CONFIG.OUTCOME_VALUES.COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE;

          const displayOutcome = transformOutcomeForDisplay(
            outcome,
            currentEncounter.type,
            choice
          );
          setEncounterOutcome(displayOutcome);
          setEncounterPhase('escalated_combat');
          return;
        }

        // Apply the resolution outcome to game state
        handleApplyOutcome(outcome);

        // Transform for OutcomePanel display
        const displayOutcome = transformOutcomeForDisplay(
          outcome,
          currentEncounter.type,
          choice
        );

        // Show OutcomePanel (stay in ENCOUNTER mode)
        setEncounterOutcome(displayOutcome);
        setEncounterPhase('initial');
      } catch (error) {
        console.error('Encounter resolution failed:', error);
        // On error, return to orbit
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setEncounterPhase('initial');
        setViewMode(VIEW_MODES.ORBIT);
      }
    }
  };

  const handleEncounterClose = () => {
    setCurrentEncounter(null);
    setEncounterPhase('initial');
    setCombatContext(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleOutcomeContinue = () => {
    if (encounterPhase === 'escalated_combat') {
      // Transition from negotiation failure to encounter panel with negotiate disabled
      setEncounterOutcome(null);
      setEncounterPhase('initial');
      setCombatContext({ escalated: true });
      return;
    }
    setCurrentEncounter(null);
    setEncounterOutcome(null);
    setEncounterPhase('initial');
    setCombatContext(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleApplyOutcome = (outcome) => {
    applyEncounterOutcome(gameStateManager, outcome);
  };

  // Listen for encounter events (only process each event once)
  // During jump animations, buffer the encounter and wait for the near-end signal
  useEffect(() => {
    if (
      encounterEvent &&
      !currentEncounter &&
      encounterEvent !== lastHandledEncounter.current
    ) {
      lastHandledEncounter.current = encounterEvent;
      if (jumpInProgressRef.current) {
        // Buffer encounter — will be shown when animation nears completion
        pendingEncounterRef.current = encounterEvent;
      } else {
        handleEncounterTriggered(encounterEvent);
      }
    }
  }, [encounterEvent, currentEncounter]);

  // Reveal buffered encounter when jump animation nears completion
  useEffect(() => {
    if (!gameStateManager) return;

    const handleAnimationNearEnd = () => {
      if (pendingEncounterRef.current) {
        handleEncounterTriggered(pendingEncounterRef.current);
        pendingEncounterRef.current = null;
      }
    };

    gameStateManager.subscribe(
      EVENT_NAMES.JUMP_ANIMATION_NEAR_END,
      handleAnimationNearEnd
    );
    return () =>
      gameStateManager.unsubscribe(
        EVENT_NAMES.JUMP_ANIMATION_NEAR_END,
        handleAnimationNearEnd
      );
  }, [gameStateManager]);

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
    gameStateManager.markVictory();
    setViewMode(VIEW_MODES.EPILOGUE);
  };

  const handleReturnToTitle = () => {
    setViewMode(VIEW_MODES.TITLE);
  };

  useEffect(() => {
    if (pavonisRunEvent) {
      handleStartPavonisRun();
    }
  }, [pavonisRunEvent, handleStartPavonisRun]);

  return (
    <ErrorBoundary>
      <div className="app-container">
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
            <StarmapProvider value={starmapMethods.current}>
              {/* Starmap is always rendered (z-index 0) */}
              <ErrorBoundary>
                <StarMapCanvas
                  ref={starmapRef}
                  onSystemSelected={handleSystemSelected}
                  onSystemDeselected={handleSystemDeselected}
                  onStarmapMethodsReady={(methods) => {
                    starmapMethods.current = methods;
                  }}
                />
              </ErrorBoundary>

              {/* HUD is always rendered */}
              <HUD onDock={handleDock} onSystemInfo={handleOpenSystemInfo} />
              <RumorAlert />
              <AchievementToast />
              <NotificationContainer />

              {/* Station menu displayed when docked */}
              {viewMode === VIEW_MODES.STATION && (
                <>
                  <MissionCompleteNotifier />
                  <StationMenu
                    onOpenPanel={handleOpenPanel}
                    onUndock={handleUndock}
                  />
                </>
              )}

              {/* Panel container displayed when a panel is open */}
              {viewMode === VIEW_MODES.PANEL && (
                <PanelContainer
                  activePanel={activePanel}
                  npcId={activePanelNpcId}
                  onClose={handleClosePanel}
                />
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
          <Epilogue onReturnToTitle={handleReturnToTitle} />
        )}
      </div>
    </ErrorBoundary>
  );
}
