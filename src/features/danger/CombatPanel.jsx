import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { COMBAT_CONFIG, EVENT_NAMES } from '../../game/constants.js';

/**
 * CombatPanel - React component for combat resolution
 *
 * Displays combat options (evasive, return fire, dump cargo, distress)
 * with current ship status affecting outcomes, success probabilities
 * with modifier breakdown, and potential outcomes for each choice.
 *
 * Architecture: danger-system
 * Validates: Requirements 3.1, 12.1, 12.2, 12.4, 12.5
 *
 * @param {Object} props
 * @param {Object} props.combat - The combat encounter object
 * @param {Function} props.onChoice - Callback when player makes a choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function CombatPanel({ combat, onChoice, onClose: _onClose, fleeContext }) {
  // Subscribe to relevant game events for ship status and modifiers
  const hull = useGameEvent(EVENT_NAMES.HULL_CHANGED);
  const engine = useGameEvent(EVENT_NAMES.ENGINE_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Local state for selected combat option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate success probabilities and modifiers for each combat option
  const combatAnalysis = useMemo(
    () =>
      calculateCombatProbabilities(
        combat,
        hull,
        engine,
        fuel,
        lifeSupport,
        cargo,
        upgrades,
        quirks,
        karma,
        factions
      ),
    [
      combat,
      hull,
      engine,
      fuel,
      lifeSupport,
      cargo,
      upgrades,
      quirks,
      karma,
      factions,
    ]
  );

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption && onChoice) {
      onChoice(selectedOption);
    }
  };

  const handleCancel = () => {
    setSelectedOption(null);
  };

  // Determine combat intensity for display
  const intensity = combat.intensity || 'moderate';
  const intensityColor = getCombatIntensityColor(intensity);

  return (
    <div id="combat-panel" className="panel-base visible">
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="Close"
      >
        ×
      </button>
      <h2>Combat Resolution</h2>

      <div className="combat-content">
        {/* Flee failed alert — shown when evasion was attempted and failed */}
        {fleeContext?.fleeAttemptFailed && (
          <div className="flee-failed-alert" role="alert">
            <div className="flee-failed-title">EVASION FAILED — YOU COULD NOT FLEE</div>
            <div className="flee-failed-body">
              <p>{fleeContext.description}</p>
              {fleeContext.hullDamage > 0 && (
                <p className="flee-failed-damage">
                  Hull took <strong>-{fleeContext.hullDamage}%</strong> damage during the failed escape attempt.
                  You are still engaged — choose how to fight back.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Combat Status Section */}
        <div className="combat-section combat-status">
          <h3>Combat Status</h3>
          <div className="combat-info">
            <div className="combat-intensity">
              <span className="intensity-label">Combat Intensity:</span>
              <span
                className={`intensity-value ${intensity}`}
                style={{ color: intensityColor }}
              >
                {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
              </span>
            </div>
            <div className="combat-description">
              {combat.description ||
                'You are engaged in combat. Choose your tactical response carefully.'}
            </div>
          </div>
        </div>

        {/* Ship Condition Section */}
        <div className="combat-section ship-condition">
          <h3>Ship Condition</h3>
          <div className="condition-grid">
            <div className="condition-item">
              <span className="condition-label">Hull Integrity:</span>
              <span className={`condition-value ${getConditionClass(hull)}`}>
                {Math.round(hull ?? 100)}%
              </span>
              <span className="condition-impact">
                {hull < 50 ? 'Reduced maneuverability' : 'Normal operation'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Engine Status:</span>
              <span className={`condition-value ${getConditionClass(engine)}`}>
                {Math.round(engine ?? 100)}%
              </span>
              <span className="condition-impact">
                {engine < 50
                  ? 'Reduced evasion capability'
                  : 'Full power available'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Fuel Reserves:</span>
              <span className={`condition-value ${getConditionClass(fuel)}`}>
                {Math.round(fuel ?? 100)}%
              </span>
              <span className="condition-impact">
                {fuel < 25 ? 'Limited maneuvering' : 'Sufficient for combat'}
              </span>
            </div>
            <div className="condition-item">
              <span className="condition-label">Life Support:</span>
              <span
                className={`condition-value ${getConditionClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="condition-impact">
                {lifeSupport < 30
                  ? 'Emergency protocols active'
                  : 'Stable environment'}
              </span>
            </div>
          </div>

          {/* Combat Modifiers Display */}
          {(upgrades?.length > 0 || quirks?.length > 0) && (
            <div className="combat-modifiers">
              <h4>Combat Modifiers</h4>
              <div className="modifiers-grid">
                {upgrades?.map((upgrade) => {
                  const modifier = COMBAT_CONFIG.MODIFIERS[upgrade];
                  if (!modifier) return null;
                  return (
                    <div key={upgrade} className="modifier-item upgrade">
                      <span className="modifier-name">
                        {formatModifierName(upgrade)}
                      </span>
                      <span className="modifier-effects">
                        {getModifierEffectsText(upgrade, modifier)}
                      </span>
                    </div>
                  );
                })}
                {quirks?.map((quirk) => {
                  const modifier = COMBAT_CONFIG.MODIFIERS[quirk];
                  if (!modifier) return null;
                  return (
                    <div key={quirk} className="modifier-item quirk">
                      <span className="modifier-name">
                        {formatModifierName(quirk)}
                      </span>
                      <span className="modifier-effects">
                        {getModifierEffectsText(quirk, modifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Combat Options Section */}
        <div className="combat-section combat-options">
          <h3>Combat Options</h3>
          <div className="options-list">
            {/* Evasive Maneuvers Option */}
            <div
              className={`combat-option ${selectedOption === 'evasive' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('evasive')}
            >
              <div className="option-header">
                <span className="option-name">Evasive Maneuvers</span>
                <span className="option-type">Defensive</span>
              </div>
              <div className="option-description">
                Use your ship's agility and engine power to avoid enemy fire and
                escape.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">Base Success Rate:</span>
                    <span className="breakdown-value">
                      {Math.round(COMBAT_CONFIG.EVASIVE.BASE_CHANCE * 100)}%
                    </span>
                  </div>
                  {combatAnalysis.evasive.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">Final Success Rate:</span>
                    <span className="breakdown-value final">
                      {Math.round(combatAnalysis.evasive.finalChance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">Success:</span>
                  <span className="outcome-text">
                    Escape combat, -15% fuel, -5% engine condition
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">Failure:</span>
                  <span className="outcome-text">
                    Take hull damage (-20%), combat continues
                  </span>
                </div>
              </div>
            </div>

            {/* Return Fire Option */}
            <div
              className={`combat-option ${selectedOption === 'return_fire' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('return_fire')}
            >
              <div className="option-header">
                <span className="option-name">Return Fire</span>
                <span className="option-type">Offensive</span>
              </div>
              <div className="option-description">
                Engage the enemy directly with your ship's weapons systems.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">Base Success Rate:</span>
                    <span className="breakdown-value">
                      {Math.round(COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE * 100)}%
                    </span>
                  </div>
                  {combatAnalysis.returnFire.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">Final Success Rate:</span>
                    <span className="breakdown-value final">
                      {Math.round(combatAnalysis.returnFire.finalChance * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">Success:</span>
                  <span className="outcome-text">
                    Drive off enemy, -10% hull, +5 outlaw reputation
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">Failure:</span>
                  <span className="outcome-text">
                    Heavy damage (-30% hull), lose cargo and ₡500
                  </span>
                </div>
              </div>
            </div>

            {/* Dump Cargo Option */}
            <div
              className={`combat-option ${selectedOption === 'dump_cargo' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('dump_cargo')}
            >
              <div className="option-header">
                <span className="option-name">Dump Cargo</span>
                <span className="option-type">Sacrifice</span>
              </div>
              <div className="option-description">
                Jettison cargo to distract the enemy and facilitate escape.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="guaranteed-success">
                    <span className="breakdown-label">Success Rate:</span>
                    <span className="breakdown-value guaranteed">100%</span>
                  </div>
                  <div className="cargo-cost">
                    <span className="breakdown-label">Cargo Lost:</span>
                    <span className="breakdown-value">
                      {COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT}% of cargo,{' '}
                      {COMBAT_CONFIG.DUMP_CARGO.FUEL_COST}% fuel
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome guaranteed">
                  <span className="outcome-label">Guaranteed:</span>
                  <span className="outcome-text">
                    Escape combat, lose{' '}
                    {COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT}% of cargo, no
                    hull damage
                  </span>
                </div>
              </div>
            </div>

            {/* Distress Call Option */}
            <div
              className={`combat-option ${selectedOption === 'distress_call' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('distress_call')}
            >
              <div className="option-header">
                <span className="option-name">Distress Call</span>
                <span className="option-type">Emergency</span>
              </div>
              <div className="option-description">
                Broadcast an emergency signal hoping for rescue or intervention.
              </div>
              <div className="option-analysis">
                <div className="probability-breakdown">
                  <div className="base-chance">
                    <span className="breakdown-label">Base Success Rate:</span>
                    <span className="breakdown-value">
                      {Math.round(
                        COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE * 100
                      )}
                      %
                    </span>
                  </div>
                  {combatAnalysis.distressCall.modifiers.map((mod) => (
                    <div
                      key={mod.name}
                      className={`modifier-breakdown ${mod.type}`}
                    >
                      <span className="breakdown-label">{mod.name}:</span>
                      <span className="breakdown-value">
                        {mod.value > 0 ? '+' : ''}
                        {Math.round(mod.value * 100)}%
                      </span>
                    </div>
                  ))}
                  <div className="final-chance">
                    <span className="breakdown-label">Final Success Rate:</span>
                    <span className="breakdown-value final">
                      {Math.round(
                        combatAnalysis.distressCall.finalChance * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">Success:</span>
                  <span className="outcome-text">
                    Rescue arrives, escape combat, +10 authority reputation
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">Failure:</span>
                  <span className="outcome-text">
                    No response, combat continues with -10% morale
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="combat-actions">
          {selectedOption && (
            <>
              <button className="combat-btn primary" onClick={handleConfirm}>
                Execute {formatOptionName(selectedOption)}
              </button>
              <button className="combat-btn secondary" onClick={handleCancel}>
                Change Option
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              Select a combat option to proceed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities and modifiers for all combat options
 *
 * @param {Object} combat - The combat encounter
 * @param {number} hull - Current hull condition
 * @param {number} engine - Current engine condition
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {Array} cargo - Current cargo
 * @param {Array} upgrades - Active ship upgrades
 * @param {Array} quirks - Active ship quirks
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Analysis for each combat option
 */
function calculateCombatProbabilities(
  combat,
  _hull = 100,
  engine = 100,
  _fuel = 100,
  _lifeSupport = 100,
  _cargo = [],
  upgrades = [],
  quirks = [],
  karma = 0,
  _factions = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * 0.0005; // KARMA_CONFIG.SUCCESS_RATE_SCALE

  // Evasive Maneuvers Analysis
  const evasiveModifiers = [];
  let evasiveChance = COMBAT_CONFIG.EVASIVE.BASE_CHANCE;

  // Apply engine condition modifier
  if (engine < 50) {
    const enginePenalty = -0.1;
    evasiveChance += enginePenalty;
    evasiveModifiers.push({
      name: 'Poor Engine Condition',
      value: enginePenalty,
      type: 'penalty',
    });
  }

  // Apply hot_thruster quirk bonus
  if (quirks.includes('hot_thruster')) {
    const hotThrusterBonus = COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
    evasiveChance += hotThrusterBonus;
    evasiveModifiers.push({
      name: 'Hot Thruster Quirk',
      value: hotThrusterBonus,
      type: 'bonus',
    });
  }

  // Apply efficient_drive upgrade bonus
  if (upgrades.includes('efficient_drive')) {
    const efficientDriveBonus =
      COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
    evasiveChance += efficientDriveBonus;
    evasiveModifiers.push({
      name: 'Efficient Drive Upgrade',
      value: efficientDriveBonus,
      type: 'bonus',
    });
  }

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    evasiveChance += karmaModifier;
    evasiveModifiers.push({
      name: karma > 0 ? 'Good Karma' : 'Bad Karma',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  evasiveChance = Math.max(0, Math.min(1, evasiveChance));

  // Return Fire Analysis
  const returnFireModifiers = [];
  let returnFireChance = COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    returnFireChance += karmaModifier;
    returnFireModifiers.push({
      name: karma > 0 ? 'Good Karma' : 'Bad Karma',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  returnFireChance = Math.max(0, Math.min(1, returnFireChance));

  // Distress Call Analysis
  const distressCallModifiers = [];
  let distressCallChance = COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    distressCallChance += karmaModifier;
    distressCallModifiers.push({
      name: karma > 0 ? 'Good Karma' : 'Bad Karma',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  distressCallChance = Math.max(0, Math.min(1, distressCallChance));

  return {
    evasive: {
      finalChance: evasiveChance,
      modifiers: evasiveModifiers,
    },
    returnFire: {
      finalChance: returnFireChance,
      modifiers: returnFireModifiers,
    },
    distressCall: {
      finalChance: distressCallChance,
      modifiers: distressCallModifiers,
    },
  };
}

/**
 * Get color for combat intensity display based on threat level.
 * Colors follow the game's visual hierarchy: green (safe) to red (critical).
 *
 * @param {string} intensity - The combat intensity level
 * @returns {string} CSS color value for the intensity level
 */
function getCombatIntensityColor(intensity) {
  switch (intensity) {
    case 'light':
      return '#00ff88'; // Green - minimal threat
    case 'moderate':
      return '#ffaa00'; // Orange - standard engagement
    case 'heavy':
      return '#ff6b6b'; // Red - serious threat
    case 'intense':
      return '#ff0000'; // Bright red - maximum danger
    default:
      return '#ffffff'; // White - unknown/default
  }
}

/**
 * Get CSS class for ship condition display based on percentage value.
 * Thresholds reflect game balance: 75%+ good, 50%+ fair, 25%+ poor, <25% critical.
 * These thresholds align with gameplay mechanics where systems start failing below 50%.
 *
 * @param {number} condition - The condition value (0-100 percentage)
 * @returns {string} CSS class name for styling the condition display
 */
function getConditionClass(condition) {
  if (condition >= 75) return 'good';
  if (condition >= 50) return 'fair';
  if (condition >= 25) return 'poor';
  return 'critical';
}

/**
 * Format modifier names from snake_case to human-readable format.
 * Converts internal identifier format (hot_thruster) to display format (Hot Thruster).
 * Used for showing ship upgrades and quirks in the UI.
 *
 * @param {string} modifierName - The modifier name in snake_case format
 * @returns {string} Formatted display name with proper capitalization
 */
function formatModifierName(modifierName) {
  return modifierName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format option names from snake_case to human-readable format for button labels.
 * Converts internal action identifiers to user-facing text.
 *
 * @param {string} optionName - The option name in snake_case format
 * @returns {string} Formatted display name for UI buttons
 */
function formatOptionName(optionName) {
  return optionName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get modifier effects text for display in the combat modifiers section.
 * Translates numeric bonuses into human-readable descriptions.
 * Shows percentage bonuses for different combat actions (evasion, combat, flee).
 *
 * @param {string} modifierName - The modifier identifier (for debugging)
 * @param {Object} modifier - The modifier configuration object
 * @returns {string} Human-readable effects description or fallback text
 */
function getModifierEffectsText(modifierName, modifier) {
  const effects = [];

  if (modifier.evasiveBonus) {
    effects.push(`+${Math.round(modifier.evasiveBonus * 100)}% evasion`);
  }

  if (modifier.fleeBonus) {
    effects.push(`+${Math.round(modifier.fleeBonus * 100)}% flee`);
  }

  if (modifier.returnFireBonus) {
    effects.push(`+${Math.round(modifier.returnFireBonus * 100)}% combat`);
  }

  return effects.join(', ') || 'Combat modifier';
}
