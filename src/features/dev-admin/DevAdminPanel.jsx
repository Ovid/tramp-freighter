import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  SHIP_CONFIG,
  COMMODITY_TYPES,
  FACTION_CONFIG,
  REPUTATION_TIERS,
  REPUTATION_TIER_PRESETS,
  EVENT_NAMES,
  ENDGAME_CONFIG,
} from '../../game/constants.js';
import { ALL_NPCS } from '../../game/data/npc-data.js';
import { STAR_DATA } from '../../game/data/star-data.js';
import { CustomSelect } from '../../components/CustomSelect';
import { DevPanelPreview } from './DevPanelPreview';

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
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  const game = useGame();

  // Subscribe to game state changes
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const debt = useGameEvent(EVENT_NAMES.DEBT_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const npcs = useGameEvent(EVENT_NAMES.NPCS_CHANGED);

  // NPC reputation: selected NPC and input fields keyed by npcId
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [selectedTeleportSystem, setSelectedTeleportSystem] = useState('');
  const [npcRepInputs, setNpcRepInputs] = useState({});

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
  const [showPreview, setShowPreview] = useState(false);

  // Dev tool: direct state access is acceptable here since this panel is for
  // debugging and testing, not production gameplay. Bridge Pattern not required.
  const currentQuirks = quirks || game.getShip()?.quirks || [];
  const currentUpgrades = upgrades || game.getShip()?.upgrades || [];
  const currentCargo = cargo || game.getShip()?.cargo || [];
  const hiddenCargo = game.getHiddenCargo() || [];
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

  useEffect(() => {
    if (npcs) {
      const npcInputs = {};
      ALL_NPCS.forEach((npc) => {
        const npcState = npcs[npc.id];
        if (npcState) {
          npcInputs[npc.id] = String(npcState.rep);
        }
      });
      setNpcRepInputs(npcInputs);
    }
  }, [npcs]);

  // Initialize values from game state on mount.
  // Dev-only panel: getPlayer/getShip guard ensures state is initialized;
  // getKarma/getFactionReps always return safe defaults (0 / {}).
  useEffect(() => {
    const player = game.getPlayer();
    const ship = game.getShip();
    if (player && ship) {
      setCreditsInput(String(player.credits));
      setDebtInput(String(player.debt));
      setFuelInput(String(Math.round(ship.fuel)));
      setHullInput(String(Math.round(ship.hull)));
      setEngineInput(String(Math.round(ship.engine)));
      setLifeSupportInput(String(Math.round(ship.lifeSupport)));
      setKarmaInput(String(game.getKarma()));
      const factionReps = game.getFactionReps();
      setFactionInputs({
        authorities: String(factionReps.authorities || 0),
        traders: String(factionReps.traders || 0),
        outlaws: String(factionReps.outlaws || 0),
        civilians: String(factionReps.civilians || 0),
      });

      // Initialize NPC rep inputs from existing state only (avoid getNPCState
      // which creates entries and sets lastInteraction as a side effect)
      const npcInputs = {};
      const state = game.getState();
      ALL_NPCS.forEach((npc) => {
        const existingState = state.npcs[npc.id];
        npcInputs[npc.id] = String(
          existingState ? existingState.rep : npc.initialRep
        );
      });
      setNpcRepInputs(npcInputs);
    }
  }, [game]);

  // Handlers for player resources
  const handleSetCredits = () => {
    const amount = parseInt(creditsInput);
    if (!isNaN(amount) && amount >= 0) {
      game.setCredits(amount);
    }
  };

  const handleSetDebt = () => {
    const amount = parseInt(debtInput);
    if (!isNaN(amount) && amount >= 0) {
      game.setDebt(amount);
    }
  };

  const handleSetFuel = () => {
    const amount = parseInt(fuelInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      game.setFuel(amount);
    }
  };

  // Handlers for ship condition
  const handleSetHull = () => {
    const amount = parseInt(hullInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const condition = game.getShipCondition();
      game.updateShipCondition(amount, condition.engine, condition.lifeSupport);
    }
  };

  const handleSetEngine = () => {
    const amount = parseInt(engineInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const condition = game.getShipCondition();
      game.updateShipCondition(condition.hull, amount, condition.lifeSupport);
    }
  };

  const handleSetLifeSupport = () => {
    const amount = parseInt(lifeSupportInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      const condition = game.getShipCondition();
      game.updateShipCondition(condition.hull, condition.engine, amount);
    }
  };

  const handleRepairAll = () => {
    game.updateShipCondition(100, 100, 100);
    game.setFuel(100);
  };

  // Handlers for karma
  const handleSetKarma = () => {
    const amount = parseInt(karmaInput);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      game.setKarma(amount);
    }
  };

  const handleQuickKarma = (value) => {
    game.setKarma(value);
    setKarmaInput(String(value));
  };

  // Handlers for faction reputation
  const handleSetFactionRep = (faction) => {
    const amount = parseInt(factionInputs[faction]);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      game.setFactionRep(faction, amount);
    }
  };

  const handleQuickFactionRep = (faction, value) => {
    game.setFactionRep(faction, value);
    setFactionInputs((prev) => ({ ...prev, [faction]: String(value) }));
  };

  // Handlers for NPC reputation
  const handleSetNpcRep = (npcId) => {
    const amount = parseInt(npcRepInputs[npcId]);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      game.setNpcRep(npcId, amount);
    }
  };

  const handleQuickNpcRep = (npcId, value) => {
    game.setNpcRep(npcId, value);
    setNpcRepInputs((prev) => ({ ...prev, [npcId]: String(value) }));
  };

  // Handlers for quirks
  const handleAddQuirk = () => {
    if (selectedQuirk) {
      game.addQuirk(selectedQuirk);
      setSelectedQuirk('');
    }
  };

  const handleRemoveQuirk = (quirkId) => {
    game.removeQuirk(quirkId);
  };

  // Handlers for upgrades
  const handleAddUpgrade = () => {
    if (selectedUpgrade) {
      game.addUpgrade(selectedUpgrade);
      setSelectedUpgrade('');
    }
  };

  const handleRemoveUpgrade = (upgradeId) => {
    game.removeUpgrade(upgradeId);
  };

  // Handlers for cargo
  const handleAddCargo = () => {
    const qty = parseInt(cargoQuantity);
    if (!isNaN(qty) && qty > 0 && selectedCommodity) {
      const currentSystem = game.getCurrentSystem();
      const daysElapsed = game.getDaysElapsed();
      const ship = game.getShip();
      const newCargoItem = {
        good: selectedCommodity,
        qty,
        buyPrice: 50, // Default price for testing
        buySystem: currentSystem,
        buySystemName: 'Dev Admin',
        buyDate: daysElapsed,
      };

      if (useHiddenCargo && hasSmugglersPanel) {
        // Add to hidden cargo
        const updatedHidden = [...(ship.hiddenCargo || [])];
        const existingIndex = updatedHidden.findIndex(
          (c) => c.good === selectedCommodity
        );
        if (existingIndex >= 0) {
          updatedHidden[existingIndex].qty += qty;
        } else {
          updatedHidden.push(newCargoItem);
        }
        ship.hiddenCargo = updatedHidden;
        game.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, updatedHidden);
      } else {
        // Add to regular cargo
        const newCargo = [...ship.cargo];
        const existingIndex = newCargo.findIndex(
          (c) => c.good === selectedCommodity
        );
        if (existingIndex >= 0) {
          newCargo[existingIndex].qty += qty;
        } else {
          newCargo.push(newCargoItem);
        }
        game.updateCargo(newCargo);
      }
      game.markDirty();
    }
  };

  const handleClearCargo = () => {
    game.updateCargo([]);
    const ship = game.getShip();
    ship.hiddenCargo = [];
    game.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, []);
    game.markDirty();
  };

  // Calculate danger state display values
  const getDangerStateDisplay = () => {
    const currentSystem = game.getCurrentSystem();
    if (currentSystem == null) return null;

    const dangerZone = game.getDangerZone(currentSystem);
    const pirateChance = game.calculatePirateEncounterChance(currentSystem);
    const inspectionChance = game.calculateInspectionChance(currentSystem);

    return {
      dangerZone,
      pirateChance: (pirateChance * 100).toFixed(1),
      inspectionChance: (inspectionChance * 100).toFixed(1),
      dangerFlags: game.getDangerFlags(),
    };
  };

  const dangerState = getDangerStateDisplay();

  // Encounter trigger handlers
  const handleTriggerPirate = () => {
    const encounterData = {
      type: 'pirate',
      encounter: {
        id: `pirate_dev_${Date.now()}`,
        type: 'pirate',
        threatLevel: 'moderate',
        demandPercent: 20,
      },
    };

    // Emit event to trigger pirate encounter panel
    game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, encounterData);
  };

  const handleTriggerInspection = () => {
    game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, {
      type: 'inspection',
      encounter: {
        id: `inspection_dev_${Date.now()}`,
        type: 'inspection',
      },
    });
  };

  const handleTriggerMechanicalFailure = () => {
    const condition = game.getShipCondition();
    // Determine failure type based on ship condition
    let failureType = 'engine_failure';
    if (condition.hull < 50) failureType = 'hull_breach';
    else if (condition.lifeSupport < 30) failureType = 'life_support';

    game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, {
      type: 'mechanical_failure',
      encounter: {
        id: `failure_dev_${Date.now()}`,
        type: failureType,
        severity: Math.min(
          condition.hull,
          condition.engine,
          condition.lifeSupport
        ),
      },
    });
  };

  const handleTriggerDistressCall = () => {
    const distressCall = game.checkDistressCall(0); // Force trigger
    if (distressCall) {
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, {
        type: 'distress_call',
        encounter: distressCall,
      });
    } else {
      // Create one manually if checkDistressCall didn't return one
      game.emit(EVENT_NAMES.ENCOUNTER_TRIGGERED, {
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
    <div
      id="dev-admin-panel"
      className="visible"
      ref={ref}
      data-panel
    >
        <div className="dev-admin-header">
          <h2>🔧 Dev Admin Panel</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

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
                    setFactionInputs((prev) => ({
                      ...prev,
                      [faction]: e.target.value,
                    }))
                  }
                  min="-100"
                  max="100"
                />
                <button onClick={() => handleSetFactionRep(faction)}>
                  Set
                </button>
              </div>
              <div className="dev-admin-quick-buttons">
                <button onClick={() => handleQuickFactionRep(faction, -100)}>
                  -100
                </button>
                <button onClick={() => handleQuickFactionRep(faction, 0)}>
                  0
                </button>
                <button onClick={() => handleQuickFactionRep(faction, 100)}>
                  +100
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* NPC Reputation Section */}
        <div className="dev-admin-section">
          <h3>NPC Reputation</h3>
          <div className="dev-admin-control">
            <CustomSelect
              value={selectedNpcId}
              onChange={(val) => setSelectedNpcId(val)}
              placeholder="Select NPC..."
              options={[...ALL_NPCS]
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, {
                    sensitivity: 'base',
                  })
                )
                .map((npc) => ({
                  value: npc.id,
                  label: `${npc.name} — ${npc.role}`,
                }))}
            />
          </div>
          {selectedNpcId &&
            (() => {
              const npc = ALL_NPCS.find((n) => n.id === selectedNpcId);
              const rep = parseInt(npcRepInputs[selectedNpcId]) || 0;
              const tierName =
                Object.values(REPUTATION_TIERS).find(
                  (t) => rep >= t.min && rep <= t.max
                )?.name || 'Unknown';
              return (
                <div className="dev-admin-faction-row">
                  <div className="dev-admin-npc-label">
                    {npc.name}{' '}
                    <span className="dev-admin-npc-tier">
                      {rep} ({tierName})
                    </span>
                  </div>
                  <div className="dev-admin-control">
                    <input
                      type="number"
                      value={npcRepInputs[selectedNpcId] || '0'}
                      onChange={(e) =>
                        setNpcRepInputs((prev) => ({
                          ...prev,
                          [selectedNpcId]: e.target.value,
                        }))
                      }
                      min="-100"
                      max="100"
                    />
                    <button onClick={() => handleSetNpcRep(selectedNpcId)}>
                      Set
                    </button>
                  </div>
                  <div className="dev-admin-quick-buttons npc">
                    {Object.entries(REPUTATION_TIER_PRESETS).map(
                      ([tierKey, presetValue]) => (
                        <button
                          key={tierKey}
                          onClick={() =>
                            handleQuickNpcRep(selectedNpcId, presetValue)
                          }
                        >
                          {REPUTATION_TIERS[tierKey].name}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Teleport Section */}
        <div className="dev-admin-section">
          <h3>Teleport</h3>
          <div className="dev-admin-control">
            <CustomSelect
              value={selectedTeleportSystem}
              onChange={(val) => setSelectedTeleportSystem(val)}
              placeholder="Select star..."
              options={[...STAR_DATA]
                .filter(
                  (s) => s.r === 1 || s.id === ENDGAME_CONFIG.DELTA_PAVONIS_ID
                )
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, {
                    sensitivity: 'base',
                  })
                )
                .map((star) => ({
                  value: String(star.id),
                  label: `${star.name}${star.id === ENDGAME_CONFIG.DELTA_PAVONIS_ID ? ' (endgame)' : ''}`,
                }))}
            />
            <button
              onClick={() => {
                if (selectedTeleportSystem !== '') {
                  game.devTeleport(Number(selectedTeleportSystem));
                }
              }}
            >
              Go
            </button>
          </div>
        </div>

        {/* Ship Quirks Section */}
        <div className="dev-admin-section">
          <h3>Ship Quirks</h3>
          <div className="dev-admin-list">
            {currentQuirks.map((quirkId) => {
              const quirk = SHIP_CONFIG.QUIRKS[quirkId];
              return (
                <div key={quirkId} className="dev-admin-list-item">
                  <span title={quirk?.description}>
                    {quirk?.name || quirkId}
                  </span>
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
              <CustomSelect
                value={selectedQuirk}
                onChange={(val) => setSelectedQuirk(val)}
                placeholder="Select quirk..."
                options={availableQuirks.map((quirkId) => ({
                  value: quirkId,
                  label: SHIP_CONFIG.QUIRKS[quirkId].name,
                }))}
              />
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
                  <span title={upgrade?.description}>
                    {upgrade?.name || upgradeId}
                  </span>
                  <button onClick={() => handleRemoveUpgrade(upgradeId)}>
                    ×
                  </button>
                </div>
              );
            })}
            {currentUpgrades.length === 0 && (
              <div className="dev-admin-empty">No upgrades installed</div>
            )}
          </div>
          {availableUpgrades.length > 0 && (
            <div className="dev-admin-control">
              <CustomSelect
                value={selectedUpgrade}
                onChange={(val) => setSelectedUpgrade(val)}
                placeholder="Select upgrade..."
                options={availableUpgrades.map((upgradeId) => ({
                  value: upgradeId,
                  label: SHIP_CONFIG.UPGRADES[upgradeId].name,
                }))}
              />
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
                  {item.good}: {item.qty} @ ₡{item.buyPrice}
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
                      {item.good}: {item.qty} @ ₡{item.buyPrice}
                    </div>
                  ))
                ) : (
                  <div className="dev-admin-empty">Empty</div>
                )}
              </>
            )}
          </div>
          <div className="dev-admin-control">
            <CustomSelect
              value={selectedCommodity}
              onChange={(val) => setSelectedCommodity(val)}
              options={COMMODITY_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
            />
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
          <button
            className="dev-admin-action-btn danger"
            onClick={handleClearCargo}
          >
            Clear All Cargo
          </button>
        </div>

        {/* Encounter Triggers Section */}
        <div className="dev-admin-section">
          <h3>Trigger Encounters</h3>
          <div className="dev-admin-encounter-buttons">
            <button onClick={handleTriggerPirate}>🏴‍☠️ Pirate</button>
            <button onClick={handleTriggerInspection}>🔍 Inspection</button>
            <button onClick={handleTriggerMechanicalFailure}>
              ⚙️ Mech Failure
            </button>
            <button onClick={handleTriggerDistressCall}>
              🆘 Distress Call
            </button>
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
                  <span>
                    {Object.entries(dangerState.dangerFlags)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Endgame Section */}
        <div className="dev-admin-section">
          <h3>Endgame</h3>
          <div className="dev-admin-encounter-buttons">
            <button
              onClick={() =>
                game.emit(EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED, Date.now())
              }
            >
              Preview Epilogue
            </button>
          </div>
        </div>

        {/* Panel Preview Section */}
        <div className="dev-admin-section">
          <h3>Panel Preview</h3>
          <div className="dev-admin-encounter-buttons">
            <button onClick={() => setShowPreview(true)}>
              Preview All Panels
            </button>
          </div>
        </div>

        <div className="dev-admin-warning">
          ⚠ Dev Mode Only - Not visible in production
        </div>

        {showPreview && (
          <DevPanelPreview onClose={() => setShowPreview(false)} />
        )}
    </div>
  );
}
