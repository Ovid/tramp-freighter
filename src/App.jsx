import { useState, useRef } from 'react';
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
import { InspectionPanel } from './features/danger/InspectionPanel';
import { MechanicalFailurePanel } from './features/danger/MechanicalFailurePanel';
import { DistressCallPanel } from './features/danger/DistressCallPanel';
import { OutcomePanel } from './features/danger/OutcomePanel';
import { transformOutcomeForDisplay } from './features/danger/transformOutcome';
import { useGameState } from './context/GameContext';
import { useGameEvent } from './hooks/useGameEvent';
import { useJumpEncounters } from './hooks/useJumpEncounters';
import { StarmapProvider } from './context/StarmapContext';

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
  const currentSystemId = useGameEvent('locationChanged');
  const encounterEvent = useGameEvent('encounterTriggered');
  useJumpEncounters();
  const starmapRef = useRef(null);

  const [viewMode, setViewMode] = useState(VIEW_MODES.TITLE);
  const [activePanel, setActivePanel] = useState(null);
  const [activePanelNpcId, setActivePanelNpcId] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [encounterOutcome, setEncounterOutcome] = useState(null);
  const lastHandledEncounter = useRef(null);

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
  };

  const handleDock = () => {
    if (viewMode === VIEW_MODES.STATION || viewMode === VIEW_MODES.PANEL) {
      // If currently in station or panel mode, go back to orbit
      setViewMode(VIEW_MODES.ORBIT);
      setActivePanel(null);
    } else {
      // If in orbit mode, go to station
      setViewMode(VIEW_MODES.STATION);
    }
  };

  const handleUndock = () => {
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
    // Don't deselect star - keep selection ring visible during jump
  };

  // After jump, deselect star so only current system indicator is visible.
  const handleJumpComplete = () => {
    setViewingSystemId(null);
    // Deselect star after jump completes - we've arrived at destination
    // Only the current system indicator (green) should be visible
    if (starmapRef.current) {
      starmapRef.current.deselectStar();
    }
  };

  // Handle encounter events from the danger system
  const handleEncounterTriggered = (encounterData) => {
    setCurrentEncounter(encounterData);
    setViewMode(VIEW_MODES.ENCOUNTER);
  };

  const handleEncounterChoice = (choice) => {
    if (currentEncounter && gameStateManager.resolveEncounter) {
      try {
        const outcome = gameStateManager.resolveEncounter(
          currentEncounter,
          choice
        );

        // Apply the resolution outcome to game state
        applyEncounterOutcome(outcome);

        // Transform for OutcomePanel display
        const displayOutcome = transformOutcomeForDisplay(
          outcome,
          currentEncounter.type,
          choice
        );

        // Show OutcomePanel (stay in ENCOUNTER mode)
        setEncounterOutcome(displayOutcome);
      } catch (error) {
        console.error('Encounter resolution failed:', error);
        // On error, return to orbit
        setCurrentEncounter(null);
        setEncounterOutcome(null);
        setViewMode(VIEW_MODES.ORBIT);
      }
    }
  };

  const handleEncounterClose = () => {
    setCurrentEncounter(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  const handleOutcomeContinue = () => {
    setCurrentEncounter(null);
    setEncounterOutcome(null);
    setViewMode(VIEW_MODES.ORBIT);
  };

  /**
   * Apply encounter resolution outcome to game state
   * Handles costs (fuel, hull, credits, cargo loss) and rewards (credits, reputation, karma)
   */
  const applyEncounterOutcome = (outcome) => {
    const state = gameStateManager.getState();

    // Apply costs
    if (outcome.costs) {
      // Handle fuel costs
      if (outcome.costs.fuel) {
        const newFuel = Math.max(0, state.ship.fuel - outcome.costs.fuel);
        gameStateManager.updateFuel(newFuel);
      }

      // Handle hull damage
      if (outcome.costs.hull) {
        const newHull = Math.max(0, state.ship.hull - outcome.costs.hull);
        gameStateManager.updateShipCondition(
          newHull,
          state.ship.engine,
          state.ship.lifeSupport
        );
      }

      // Handle engine damage
      if (outcome.costs.engine) {
        const newEngine = Math.max(0, state.ship.engine - outcome.costs.engine);
        gameStateManager.updateShipCondition(
          state.ship.hull,
          newEngine,
          state.ship.lifeSupport
        );
      }

      // Handle life support damage
      if (outcome.costs.lifeSupport) {
        const newLifeSupport = Math.max(
          0,
          state.ship.lifeSupport - outcome.costs.lifeSupport
        );
        gameStateManager.updateShipCondition(
          state.ship.hull,
          state.ship.engine,
          newLifeSupport
        );
      }

      // Handle credit costs
      if (outcome.costs.credits) {
        const newCredits = Math.max(
          0,
          state.player.credits - outcome.costs.credits
        );
        gameStateManager.updateCredits(newCredits);
      }

      // Handle cargo loss
      if (outcome.costs.cargoLoss === true) {
        // Lose all cargo
        gameStateManager.updateCargo([]);
      } else if (outcome.costs.cargoPercent) {
        // Lose percentage of cargo
        const cargo = [...state.ship.cargo];
        const lossPercent = outcome.costs.cargoPercent / 100;

        cargo.forEach((item) => {
          const lostQuantity = Math.floor(item.quantity * lossPercent);
          item.quantity = Math.max(0, item.quantity - lostQuantity);
        });

        // Remove empty cargo stacks
        const filteredCargo = cargo.filter((item) => item.quantity > 0);
        gameStateManager.updateCargo(filteredCargo);
      }

      // Handle time costs
      if (outcome.costs.days) {
        const newDays = state.player.daysElapsed + outcome.costs.days;
        gameStateManager.updateTime(newDays);
      }
    }

    // Apply rewards
    if (outcome.rewards) {
      // Handle credit rewards
      if (outcome.rewards.credits) {
        const newCredits = state.player.credits + outcome.rewards.credits;
        gameStateManager.updateCredits(newCredits);
      }

      // Handle karma rewards/penalties
      if (outcome.rewards.karma) {
        gameStateManager.modifyKarma(
          outcome.rewards.karma,
          'encounter_resolution'
        );
      }

      // Handle faction reputation changes
      if (outcome.rewards.factionRep) {
        Object.entries(outcome.rewards.factionRep).forEach(
          ([faction, change]) => {
            gameStateManager.modifyFactionRep(
              faction,
              change,
              'encounter_resolution'
            );
          }
        );
      }

      // Handle cargo rewards
      if (outcome.rewards.cargo) {
        const currentCargo = [...state.ship.cargo];
        outcome.rewards.cargo.forEach((rewardItem) => {
          // Try to stack with existing cargo
          const existingStack = currentCargo.find(
            (item) =>
              item.good === rewardItem.type &&
              item.purchasePrice === rewardItem.purchasePrice
          );

          if (existingStack) {
            existingStack.quantity += rewardItem.quantity;
          } else {
            currentCargo.push({
              good: rewardItem.type,
              quantity: rewardItem.quantity,
              purchasePrice: rewardItem.purchasePrice,
            });
          }
        });

        gameStateManager.updateCargo(currentCargo);
      }
    }

    // Save game after applying changes
    gameStateManager.saveGame();
  };

  // Listen for encounter events (only process each event once)
  if (
    encounterEvent &&
    !currentEncounter &&
    encounterEvent !== lastHandledEncounter.current
  ) {
    lastHandledEncounter.current = encounterEvent;
    handleEncounterTriggered(encounterEvent);
  }

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

              {/* Station menu displayed when docked */}
              {viewMode === VIEW_MODES.STATION && (
                <StationMenu
                  onOpenPanel={handleOpenPanel}
                  onUndock={handleUndock}
                />
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
              {viewMode === VIEW_MODES.ENCOUNTER &&
                currentEncounter &&
                !encounterOutcome && (
                  <>
                    {currentEncounter.type === 'pirate' && (
                      <PirateEncounterPanel
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
            </StarmapProvider>
          )}
      </div>
    </ErrorBoundary>
  );
}
