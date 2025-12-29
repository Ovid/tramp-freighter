import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  SHIP_CONFIG,
  COMMODITY_TYPES,
  FACTION_CONFIG,
  DANGER_CONFIG,
} from '../../game/constants.js';

/**
 * DevAdminPanel - Development admin panel for danger system testing
 *
 * Provides comprehensive controls to modify game state for testing purposes.
 * Includes ship condition, karma, faction reputation, quirks, upgrades,
 * cargo management, and encounter triggers.
 *
 * Only rendered when dev mode is enabled (detected via .dev file).
 */
export function DevAdminPanel({ onClose }) {
  const gameStateManager = useGameState();

  // Subscribe to game state changes
  const credits = useGameEvent('creditsChanged');
  const debt = useGameEvent('debtChanged');
  const fuel = useGameEvent('fuelChanged');
  const shipCondition = useGameEvent('shipConditionChanged');
  const quirks = useGameEvent('quirksChanged');
  const upgrades = useGameEvent('upgradesChanged');
  const cargo = useGameEvent('cargoChanged');

  // Local state for input fields
  const [creditsInput, setCreditsInput] = useState('0');
  const [debtInput, setDebtInput] = useState('0');
  const [fuelInput, setFuelInput] = useState('100');
  const [hullInput, setHullInput] = useState('100');
  const [engineInput, setEngineInput] = useState('100');
  const [lifeSupportInput, setLifeSupportInput] = useState('100');
  const [karmaInput, setKarmaInput] = useState('0');
  const [factionInputs, setFactionInputs] = useState({
    authorities: '0',
    traders: '0',
    outlaws: '0',
    civilians: '0',
  });
  const [selectedQuirk, setSelectedQuirk] = useState('');
  const [selectedUpgrade, setSelectedUpgrade] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('grain');
  const [cargoQuantity, setCargoQuantity] = useState('5');
  const [useHiddenCargo, setUseHiddenCargo] = useState(false);

  // Get current state values
  const currentQuirks = quirks || gameStateManager.getState()?.ship?.quirks || [];
  const currentUpgrades = upgrades || gameStateManager.getState()?.ship?.upgrades || [];
  const currentCargo = cargo || gameStateManager.getState()?.ship?.cargo || [];
  const hiddenCargo = gameStateManager.getHiddenCargo() || [];
  const hasSmugglersPanel = currentUpgrades.includes('smuggler_panels');

  // Available quirks and upgrades (excluding already installed)
  const availableQuirks = Object.keys(SHIP_CONFIG.QUIRKS).filter(
    (q) => !currentQuirks.includes(q)
  );
  const availableUpgrades = Object.keys(SHIP_CONFIG.UPGRADES).filter(
    (u) => !currentUpgrades.includes(u)
  );

  // Update input fields when game state changes
  useEffect(() => {
    if (credits !== undefined) setCreditsInput(String(credits));
  }, [credits]);

  useEffect(() => {
    if (debt !== undefined) setDebtInput(String(debt));
  }, [debt]);

  useEffect(() => {
    if (fuel !== undefined) setFuelInput(String(Math.round(fuel)));
  }, [fuel]);

  useEffect(() => {
    if (shipCondition) {
      setHullInput(String(Math.round(shipCondition.hull)));
      setEngineInput(String(Math.round(shipCondition.engine)));
      setLifeSupportInput(String(Math.round(shipCondition.lifeSupport)));
    }
  }, [shipCondition]);

  // Initialize values from game state on mount
  useEffect(() => {
    const state = gameStateManager.getState();
    if (state) {
      setCreditsInput(String(state.player.credits));
      setDebtInput(String(state.player.debt));
      setFuelInput(String(Math.round(state.ship.fuel)));
      setHullInput(String(Math.round(state.ship.hull)));
      setEngineInput(String(Math.round(state.ship.engine)));
      setLifeSupportInput(String(Math.round(state.ship.lifeSupport)));
      setKarmaInput(String(state.player.karma || 0));
      setFactionInputs({
        authorities: String(state.player.factions?.authorities || 0),
        traders: String(state.player.factions?.traders || 0),
        outlaws: String(state.player.factions?.outlaws || 0),
        civilians: String(state.player.factions?.civilians || 0),
      });
    }
  }, [gameStateManager]);

  // Handlers for player resources
  const handleSetCredits = () => {
    const amount = parseInt(creditsInput);
    if (!isNaN(amount) && amount >= 0) {
      gameStateManager.setCredits(amount);
    }
  };

  const handleSetDebt = () => {
    const amount = parseInt(debtInput);
    if (!isNaN(amount) && amount >= 0) {
      gameStateManager.setDebt(amount);
    }
  };

  const handleSetFuel = () => {
    const amount = parseInt(fuelInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      gameStateManager.setFuel(amount);
    }
  };

  // Handlers for ship condition
  const handleSetHull = () => {
    const amount = parseInt(hullInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const state = gameStateManager.getState();
      gameStateManager.updateShipCondition(amount, state.ship.engine, state.ship.lifeSupport);
    }
  };

  const handleSetEngine = () => {
    const amount = parseInt(engineInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const state = gameStateManager.getState();
      gameStateManager.updateShipCondition(state.ship.hull, amount, state.ship.lifeSupport);
    }
  };

  const handleSetLifeSupport = () => {
    const amount = parseInt(lifeSupportInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const state = gameStateManager.getState();
      gameStateManager.updateShipCondition(state.ship.hull, state.ship.engine, amount);
    }
  };

  const handleRepairAll = () => {
    gameStateManager.updateShipCondition(100, 100, 100);
  };

  // Handlers for karma
  const handleSetKarma = () => {
    const amount = parseInt(karmaInput);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      gameStateManager.setKarma(amount);
    }
  };

  const handleQuickKarma = (value) => {
    gameStateManager.setKarma(value);
    setKarmaInput(String(value));
  };

  // Handlers for faction reputation
  const handleSetFactionRep = (faction) => {
    const amount = parseInt(factionInputs[faction]);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      gameStateManager.setFactionRep(faction, amount);
    }
  };

  const handleQuickFactionRep = (faction, value) => {
    gameStateManager.setFactionRep(faction, value);
    setFactionInputs((prev) => ({ ...prev, [faction]: String(value) }));
  };

  // Handlers for quirks
  const handleAddQuirk = () => {
    if (selectedQuirk) {
      gameStateManager.addQuirk(selectedQuirk);
      setSelectedQuirk('');
    }
  };

  const handleRemoveQuirk = (quirkId) => {
    gameStateManager.removeQuirk(quirkId);
  };

  // Handlers for upgrades
  const handleAddUpgrade = () => {
    if (selectedUpgrade) {
      gameStateManager.addUpgrade(selectedUpgrade);
      setSelectedUpgrade('');
    }
  };

  const handleRemoveUpgrade = (upgradeId) => {
    gameStateManager.removeUpgrade(upgradeId);
  };

  // Handlers for cargo
  const handleAddCargo = () => {
    const qty = parseInt(cargoQuantity);
    if (!isNaN(qty) && qty > 0 && selectedCommodity) {
      const state = gameStateManager.getState();
      const newCargoItem = {
        type: selectedCommodity,
        quantity: qty,
        purchasePrice: 50, // Default price for testing
        purchaseSystem: state.player.currentSystem,
        purchaseDate: state.player.daysElapsed,
      };

      if (useHiddenCargo && hasSmugglersPanel) {
        // Add to hidden cargo
        const hiddenCargo = [...(state.ship.hiddenCargo || [])];
        const existingIndex = hiddenCargo.findIndex((c) => c.type === selectedCommodity);
        if (existingIndex >= 0) {
          hiddenCargo[existingIndex].quantity += qty;
        } else {
          hiddenCargo.push(newCargoItem);
        }
        state.ship.hiddenCargo = hiddenCargo;
        gameStateManager.emit('hiddenCargoChanged', hiddenCargo);
      } else {
        // Add to regular cargo
        const newCargo = [...state.ship.cargo];
        const existingIndex = newCargo.findIndex((c) => c.type === selectedCommodity);
        if (existingIndex >= 0) {
          newCargo[existingIndex].quantity += qty;
        } else {
          newCargo.push(newCargoItem);
        }
        gameStateManager.updateCargo(newCargo);
      }
      gameStateManager.saveGame();
    }
  };

  const handleClearCargo = () => {
    gameStateManager.updateCargo([]);
    const state = gameStateManager.getState();
    state.ship.hiddenCargo = [];
    gameStateManager.emit('hiddenCargoChanged', []);
    gameStateManager.saveGame();
  };

  // Calculate danger state display values
  const getDangerStateDisplay = () => {
    const state = gameStateManager.getState();
    if (!state) return null;

    const currentSystem = state.player.currentSystem;
    const dangerZone = gameStateManager.getDangerZone(currentSystem);
    const pirateChance = gameStateManager.calculatePirateEncounterChance(currentSystem, state);
    const inspectionChance = gameStateManager.calculateInspectionChance(currentSystem, state);

    return {
      dangerZone,
      pirateChance: (pirateChance * 100).toFixed(1),
      inspectionChance: (inspectionChance * 100).toFixed(1),
      dangerFlags: state.world?.dangerFlags || {},
    };
  };

  const dangerState = getDangerStateDisplay();

  // Encounter trigger handlers
  const handleTriggerPirate = () => {
    // Emit event to trigger pirate encounter panel
    gameStateManager.emit('encounterTriggered', {
      type: 'pirate',
      encounter: {
        id: `pirate_dev_${Date.now()}`,
        type: 'pirate',
        threatLevel: 'moderate',
        demandPercent: 20,
      },
    });
  };

  const handleTriggerInspection = () => {
    gameStateManager.emit('encounterTriggered', {
      type: 'inspection',
      encounter: {
        id: `inspection_dev_${Date.now()}`,
        type: 'inspection',
      },
    });
  };

  const handleTriggerMechanicalFailure = () => {
    const state = gameStateManager.getState();
    // Determine failure type based on ship condition
    let failureType = 'engine_failure';
    if (state.ship.hull < 50) failureType = 'hull_breach';
    else if (state.ship.lifeSupport < 30) failureType = 'life_support';

    gameStateManager.emit('encounterTriggered', {
      type: 'mechanical_failure',
      encounter: {
        id: `failure_dev_${Date.now()}`,
        type: failureType,
        severity: Math.min(state.ship.hull, state.ship.engine, state.ship.lifeSupport),
      },
    });
  };

  const handleTriggerDistressCall = () => {
    const distressCall = gameStateManager.checkDistressCall(0); // Force trigger
    if (distressCall) {
      gameStateManager.emit('encounterTriggered', {
        type: 'distress_call',
        encounter: distressCall,
      });
    } else {
      // Create one manually if checkDistressCall didn't return one
      gameStateManager.emit('encounterTriggered', {
        type: 'distress_call',
        encounter: {
          id: `distress_dev_${Date.now()}`,
          type: 'civilian_distress',
          description: 'A civilian vessel is broadcasting a distress signal.',
          options: ['respond', 'ignore', 'loot'],
        },
      });
    }
  };

  return (
    <div id="dev-admin-panel" className="visible">
      <button className="close-btn" onClick={onClose}>×</button>
      <h2>🔧 Dev Admin Panel</h2>

      {/* Player Resources Section */}
      <div className="dev-admin-section">
        <h3>Player Resources</h3>
        <div className="dev-admin-control">
          <label>Credits:</label>
          <input
            type="number"
            value={creditsInput}
            onChange={(e) => setCreditsInput(e.target.value)}
            min="0"
          />
          <button onClick={handleSetCredits}>Set</button>
        </div>
        <div className="dev-admin-control">
          <label>Debt:</label>
          <input
            type="number"
            value={debtInput}
            onChange={(e) => setDebtInput(e.target.value)}
            min="0"
          />
          <button onClick={handleSetDebt}>Set</button>
        </div>
      </div>

      {/* Ship Condition Section */}
      <div className="dev-admin-section">
        <h3>Ship Condition</h3>
        <div className="dev-admin-control">
          <label>Hull (%):</label>
          <input
            type="number"
            value={hullInput}
            onChange={(e) => setHullInput(e.target.value)}
            min="0"
            max="100"
          />
          <button onClick={handleSetHull}>Set</button>
        </div>
        <div className="dev-admin-control">
          <label>Engine (%):</label>
          <input
            type="number"
            value={engineInput}
            onChange={(e) => setEngineInput(e.target.value)}
            min="0"
            max="100"
          />
          <button onClick={handleSetEngine}>Set</button>
        </div>
        <div className="dev-admin-control">
          <label>Life Support (%):</label>
          <input
            type="number"
            value={lifeSupportInput}
            onChange={(e) => setLifeSupportInput(e.target.value)}
            min="0"
            max="100"
          />
          <button onClick={handleSetLifeSupport}>Set</button>
        </div>
        <div className="dev-admin-control">
          <label>Fuel (%):</label>
          <input
            type="number"
            value={fuelInput}
            onChange={(e) => setFuelInput(e.target.value)}
            min="0"
            max="100"
          />
          <button onClick={handleSetFuel}>Set</button>
        </div>
        <button className="dev-admin-action-btn" onClick={handleRepairAll}>
          Repair All Systems to 100%
        </button>
      </div>

      {/* Karma Section */}
      <div className="dev-admin-section">
        <h3>Karma</h3>
        <div className="dev-admin-control">
          <label>Karma:</label>
          <input
            type="number"
            value={karmaInput}
            onChange={(e) => setKarmaInput(e.target.value)}
            min="-100"
            max="100"
          />
          <button onClick={handleSetKarma}>Set</button>
        </div>
        <div className="dev-admin-quick-buttons">
          <button onClick={() => handleQuickKarma(-100)}>-100</button>
          <button onClick={() => handleQuickKarma(0)}>0</button>
          <button onClick={() => handleQuickKarma(100)}>+100</button>
        </div>
      </div>

      {/* Faction Reputation Section */}
      <div className="dev-admin-section">
        <h3>Faction Reputation</h3>
        {FACTION_CONFIG.FACTIONS.map((faction) => (
          <div key={faction} className="dev-admin-faction-row">
            <div className="dev-admin-control">
              <label>{faction}:</label>
              <input
                type="number"
                value={factionInputs[faction]}
                onChange={(e) =>
                  setFactionInputs((prev) => ({ ...prev, [faction]: e.target.value }))
                }
                min="-100"
                max="100"
              />
              <button onClick={() => handleSetFactionRep(faction)}>Set</button>
            </div>
            <div className="dev-admin-quick-buttons">
              <button onClick={() => handleQuickFactionRep(faction, -100)}>-100</button>
              <button onClick={() => handleQuickFactionRep(faction, 0)}>0</button>
              <button onClick={() => handleQuickFactionRep(faction, 100)}>+100</button>
            </div>
          </div>
        ))}
      </div>

      {/* Ship Quirks Section */}
      <div className="dev-admin-section">
        <h3>Ship Quirks</h3>
        <div className="dev-admin-list">
          {currentQuirks.map((quirkId) => {
            const quirk = SHIP_CONFIG.QUIRKS[quirkId];
            return (
              <div key={quirkId} className="dev-admin-list-item">
                <span title={quirk?.description}>{quirk?.name || quirkId}</span>
                <button onClick={() => handleRemoveQuirk(quirkId)}>×</button>
              </div>
            );
          })}
          {currentQuirks.length === 0 && (
            <div className="dev-admin-empty">No quirks installed</div>
          )}
        </div>
        {availableQuirks.length > 0 && (
          <div className="dev-admin-control">
            <select
              value={selectedQuirk}
              onChange={(e) => setSelectedQuirk(e.target.value)}
            >
              <option value="">Select quirk...</option>
              {availableQuirks.map((quirkId) => (
                <option key={quirkId} value={quirkId}>
                  {SHIP_CONFIG.QUIRKS[quirkId].name}
                </option>
              ))}
            </select>
            <button onClick={handleAddQuirk} disabled={!selectedQuirk}>
              Add
            </button>
          </div>
        )}
      </div>

      {/* Ship Upgrades Section */}
      <div className="dev-admin-section">
        <h3>Ship Upgrades</h3>
        <div className="dev-admin-list">
          {currentUpgrades.map((upgradeId) => {
            const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
            return (
              <div key={upgradeId} className="dev-admin-list-item">
                <span title={upgrade?.description}>{upgrade?.name || upgradeId}</span>
                <button onClick={() => handleRemoveUpgrade(upgradeId)}>×</button>
              </div>
            );
          })}
          {currentUpgrades.length === 0 && (
            <div className="dev-admin-empty">No upgrades installed</div>
          )}
        </div>
        {availableUpgrades.length > 0 && (
          <div className="dev-admin-control">
            <select
              value={selectedUpgrade}
              onChange={(e) => setSelectedUpgrade(e.target.value)}
            >
              <option value="">Select upgrade...</option>
              {availableUpgrades.map((upgradeId) => (
                <option key={upgradeId} value={upgradeId}>
                  {SHIP_CONFIG.UPGRADES[upgradeId].name}
                </option>
              ))}
            </select>
            <button onClick={handleAddUpgrade} disabled={!selectedUpgrade}>
              Add
            </button>
          </div>
        )}
      </div>

      {/* Cargo Management Section */}
      <div className="dev-admin-section">
        <h3>Cargo Management</h3>
        <div className="dev-admin-cargo-display">
          <div className="dev-admin-cargo-header">Regular Cargo:</div>
          {currentCargo.length > 0 ? (
            currentCargo.map((item, idx) => (
              <div key={idx} className="dev-admin-cargo-item">
                {item.type}: {item.quantity} @ ₡{item.purchasePrice}
              </div>
            ))
          ) : (
            <div className="dev-admin-empty">Empty</div>
          )}
          {hasSmugglersPanel && (
            <>
              <div className="dev-admin-cargo-header">Hidden Cargo:</div>
              {hiddenCargo.length > 0 ? (
                hiddenCargo.map((item, idx) => (
                  <div key={idx} className="dev-admin-cargo-item hidden">
                    {item.type}: {item.quantity} @ ₡{item.purchasePrice}
                  </div>
                ))
              ) : (
                <div className="dev-admin-empty">Empty</div>
              )}
            </>
          )}
        </div>
        <div className="dev-admin-control">
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
          >
            {COMMODITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={cargoQuantity}
            onChange={(e) => setCargoQuantity(e.target.value)}
            min="1"
            max="50"
            style={{ width: '60px' }}
          />
          <button onClick={handleAddCargo}>Add</button>
        </div>
        {hasSmugglersPanel && (
          <div className="dev-admin-checkbox">
            <label>
              <input
                type="checkbox"
                checked={useHiddenCargo}
                onChange={(e) => setUseHiddenCargo(e.target.checked)}
              />
              Add to hidden cargo
            </label>
          </div>
        )}
        <button className="dev-admin-action-btn danger" onClick={handleClearCargo}>
          Clear All Cargo
        </button>
      </div>

      {/* Encounter Triggers Section */}
      <div className="dev-admin-section">
        <h3>Trigger Encounters</h3>
        <div className="dev-admin-encounter-buttons">
          <button onClick={handleTriggerPirate}>🏴‍☠️ Pirate</button>
          <button onClick={handleTriggerInspection}>🔍 Inspection</button>
          <button onClick={handleTriggerMechanicalFailure}>⚙️ Mech Failure</button>
          <button onClick={handleTriggerDistressCall}>🆘 Distress Call</button>
        </div>
      </div>

      {/* Danger State Display Section */}
      {dangerState && (
        <div className="dev-admin-section">
          <h3>Danger State</h3>
          <div className="dev-admin-state-display">
            <div className="dev-admin-state-row">
              <span>Danger Zone:</span>
              <span className={`zone-${dangerState.dangerZone}`}>
                {dangerState.dangerZone}
              </span>
            </div>
            <div className="dev-admin-state-row">
              <span>Pirate Chance:</span>
              <span>{dangerState.pirateChance}%</span>
            </div>
            <div className="dev-admin-state-row">
              <span>Inspection Chance:</span>
              <span>{dangerState.inspectionChance}%</span>
            </div>
            {Object.keys(dangerState.dangerFlags).length > 0 && (
              <div className="dev-admin-flags">
                <span>Flags:</span>
                <span>{Object.keys(dangerState.dangerFlags).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dev-admin-warning">
        ⚠ Dev Mode Only - Not visible in production
      </div>
    </div>
  );
}
