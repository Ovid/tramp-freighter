import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { COMBAT_CONFIG, NEGOTIATION_CONFIG } from '../../game/constants.js';

/**
 * PirateEncounterPanel - React component for pirate encounter resolution
 *
 * Displays pirate threat level and ship status, shows tactical options
 * (fight, flee, negotiate, surrender) with clear success probabilities
 * and consequences for each option.
 *
 * Architecture: danger-system
 * Validates: Requirements 2.2, 2.11, 2.12, 12.1, 12.2, 12.4, 12.5
 *
 * @param {Object} props
 * @param {Object} props.encounter - The pirate encounter object
 * @param {Function} props.onChoice - Callback when player makes a choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function PirateEncounterPanel({ encounter, onChoice, onClose }) {
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to relevant game events for ship status display
  const hull = useGameEvent('hullChanged');
  const engine = useGameEvent('engineChanged');
  const fuel = useGameEvent('fuelChanged');
  const lifeSupport = useGameEvent('lifeSupportChanged');
  const cargo = useGameEvent('cargoChanged');
  const upgrades = useGameEvent('upgradesChanged');
  const quirks = useGameEvent('quirksChanged');
  const karma = useGameEvent('karmaChanged');
  const factions = useGameEvent('factionRepChanged');

  // Local state for selected tactical option
  const [selectedOption, setSelectedOption] = useState(null);

  // Get current game state for probability calculations
  const gameState = gameStateManager.getState();

  // Calculate success probabilities for each tactical option
  const probabilities = calculateTacticalProbabilities(
    encounter,
    gameState,
    hull,
    engine,
    fuel,
    lifeSupport,
    upgrades,
    quirks,
    karma,
    factions
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

  // Determine threat level display
  const threatLevel = encounter.threatLevel || 'moderate';
  const threatColor = getThreatLevelColor(threatLevel);

  return (
    <div id="pirate-encounter-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>Pirate Encounter</h2>

      <div className="encounter-content">
        {/* Threat Assessment Section */}
        <div className="encounter-section threat-assessment">
          <h3>Threat Assessment</h3>
          <div className="threat-info">
            <div className="threat-level">
              <span className="threat-label">Threat Level:</span>
              <span 
                className={`threat-value ${threatLevel}`}
                style={{ color: threatColor }}
              >
                {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
              </span>
            </div>
            <div className="pirate-description">
              {encounter.description || 
                `${encounter.name || 'Pirates'} are demanding ${encounter.demandPercent || 20}% of your cargo as tribute.`
              }
            </div>
          </div>
        </div>

        {/* Ship Status Section */}
        <div className="encounter-section ship-status">
          <h3>Ship Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Hull:</span>
              <span className={`status-value ${getConditionClass(hull)}`}>
                {Math.round(hull || 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Engine:</span>
              <span className={`status-value ${getConditionClass(engine)}`}>
                {Math.round(engine || 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Fuel:</span>
              <span className={`status-value ${getConditionClass(fuel)}`}>
                {Math.round(fuel || 100)}%
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Life Support:</span>
              <span className={`status-value ${getConditionClass(lifeSupport)}`}>
                {Math.round(lifeSupport || 100)}%
              </span>
            </div>
          </div>
          
          {/* Active Modifiers Display */}
          {(upgrades?.length > 0 || quirks?.length > 0) && (
            <div className="active-modifiers">
              <h4>Active Modifiers</h4>
              <div className="modifiers-list">
                {upgrades?.map(upgrade => (
                  <span key={upgrade} className="modifier upgrade">
                    {formatModifierName(upgrade)}
                  </span>
                ))}
                {quirks?.map(quirk => (
                  <span key={quirk} className="modifier quirk">
                    {formatModifierName(quirk)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tactical Options Section */}
        <div className="encounter-section tactical-options">
          <h3>Tactical Options</h3>
          <div className="options-list">
            {/* Fight Option */}
            <div 
              className={`tactical-option ${selectedOption === 'fight' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('fight')}
            >
              <div className="option-header">
                <span className="option-name">Fight</span>
                <span className="option-type">Combat</span>
              </div>
              <div className="option-description">
                Engage the pirates in direct combat using your ship's weapons.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">Return Fire Success:</span>
                  <span className="prob-value">{Math.round(probabilities.returnFire * 100)}%</span>
                </div>
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  Success: Minor hull damage (-10%), drive off pirates, +5 outlaw reputation
                </div>
                <div className="consequence failure">
                  Failure: Heavy hull damage (-30%), lose all cargo and ₡500
                </div>
              </div>
            </div>

            {/* Flee Option */}
            <div 
              className={`tactical-option ${selectedOption === 'flee' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('flee')}
            >
              <div className="option-header">
                <span className="option-name">Flee</span>
                <span className="option-type">Evasion</span>
              </div>
              <div className="option-description">
                Attempt to escape using evasive maneuvers and engine power.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">Evasive Success:</span>
                  <span className="prob-value">{Math.round(probabilities.evasive * 100)}%</span>
                </div>
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  Success: Escape safely, -15% fuel, -5% engine condition
                </div>
                <div className="consequence failure">
                  Failure: Hull damage (-20%), combat continues
                </div>
              </div>
            </div>

            {/* Negotiate Option */}
            <div 
              className={`tactical-option ${selectedOption === 'negotiate' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('negotiate')}
            >
              <div className="option-header">
                <span className="option-name">Negotiate</span>
                <span className="option-type">Dialogue</span>
              </div>
              <div className="option-description">
                Attempt to resolve the situation through conversation and bargaining.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">Counter-Proposal:</span>
                  <span className="prob-value">{Math.round(probabilities.counterProposal * 100)}%</span>
                </div>
                {cargo?.some(item => item.good === 'medicine') && (
                  <div className="probability-item">
                    <span className="prob-label">Medicine Sympathy:</span>
                    <span className="prob-value">{Math.round(probabilities.medicineClaim * 100)}%</span>
                  </div>
                )}
              </div>
              <div className="option-consequences">
                <div className="consequence success">
                  Success: Reduced payment (10% cargo instead of {encounter.demandPercent || 20}%)
                </div>
                <div className="consequence failure">
                  Failure: Pirates become more aggressive (+10% strength)
                </div>
              </div>
            </div>

            {/* Surrender Option */}
            <div 
              className={`tactical-option ${selectedOption === 'surrender' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('surrender')}
            >
              <div className="option-header">
                <span className="option-name">Surrender</span>
                <span className="option-type">Compliance</span>
              </div>
              <div className="option-description">
                Accept the pirates' demands and pay their tribute for safe passage.
              </div>
              <div className="option-probabilities">
                <div className="probability-item">
                  <span className="prob-label">Success Rate:</span>
                  <span className="prob-value">100%</span>
                </div>
              </div>
              <div className="option-consequences">
                <div className="consequence guaranteed">
                  Guaranteed: Pay {encounter.demandPercent || 20}% of cargo, safe passage
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="encounter-actions">
          {selectedOption && (
            <>
              <button 
                className="encounter-btn primary"
                onClick={handleConfirm}
              >
                Confirm {selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)}
              </button>
              <button 
                className="encounter-btn secondary"
                onClick={handleCancel}
              >
                Change Option
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              Select a tactical option to proceed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities for all tactical options
 * 
 * @param {Object} encounter - The pirate encounter
 * @param {Object} gameState - Current game state
 * @param {number} hull - Current hull condition
 * @param {number} engine - Current engine condition
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {Array} upgrades - Active ship upgrades
 * @param {Array} quirks - Active ship quirks
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Probability values for each option
 */
function calculateTacticalProbabilities(
  encounter,
  gameState,
  hull,
  engine,
  fuel,
  lifeSupport,
  upgrades = [],
  quirks = [],
  karma = 0,
  factions = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * 0.0005; // KARMA_CONFIG.SUCCESS_RATE_SCALE

  // Calculate evasive maneuvers probability
  let evasiveChance = COMBAT_CONFIG.EVASIVE.BASE_CHANCE;
  
  // Apply hot_thruster quirk bonus
  if (quirks.includes('hot_thruster')) {
    evasiveChance += COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
  }
  
  // Apply efficient_drive upgrade bonus
  if (upgrades.includes('efficient_drive')) {
    evasiveChance += COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
  }
  
  // Apply karma modifier
  evasiveChance += karmaModifier;
  
  // Clamp to [0, 1]
  evasiveChance = Math.max(0, Math.min(1, evasiveChance));

  // Calculate return fire probability
  let returnFireChance = COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE;
  
  // Apply karma modifier
  returnFireChance += karmaModifier;
  
  // Clamp to [0, 1]
  returnFireChance = Math.max(0, Math.min(1, returnFireChance));

  // Calculate negotiation probabilities
  let counterProposalChance = NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE;
  counterProposalChance += karmaModifier;
  counterProposalChance = Math.max(0, Math.min(1, counterProposalChance));

  let medicineClaimChance = NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE;
  medicineClaimChance += karmaModifier;
  medicineClaimChance = Math.max(0, Math.min(1, medicineClaimChance));

  return {
    evasive: evasiveChance,
    returnFire: returnFireChance,
    counterProposal: counterProposalChance,
    medicineClaim: medicineClaimChance,
  };
}

/**
 * Get color for threat level display
 * 
 * @param {string} threatLevel - The threat level
 * @returns {string} CSS color value
 */
function getThreatLevelColor(threatLevel) {
  switch (threatLevel) {
    case 'weak':
      return '#00ff88'; // Green
    case 'moderate':
      return '#ffaa00'; // Orange
    case 'strong':
      return '#ff6b6b'; // Red
    case 'dangerous':
      return '#ff0000'; // Bright red
    default:
      return '#ffffff'; // White
  }
}

/**
 * Get CSS class for condition display based on value
 * 
 * @param {number} condition - The condition value (0-100)
 * @returns {string} CSS class name
 */
function getConditionClass(condition) {
  if (condition >= 75) return 'good';
  if (condition >= 50) return 'fair';
  if (condition >= 25) return 'poor';
  return 'critical';
}

/**
 * Format modifier names for display
 * 
 * @param {string} modifierName - The modifier name (snake_case)
 * @returns {string} Formatted display name
 */
function formatModifierName(modifierName) {
  return modifierName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}