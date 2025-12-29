import { useState, useMemo } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { FAILURE_CONFIG } from '../../game/constants.js';

/**
 * MechanicalFailurePanel - React component for mechanical failure resolution
 *
 * Displays failure type and severity, shows repair options with success rates
 * and costs. Provides clear feedback on potential outcomes and resource costs.
 *
 * Architecture: danger-system
 * Validates: Requirements 6.6, 6.11, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.failure - The mechanical failure object
 * @param {Function} props.onChoice - Callback when player makes a repair choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function MechanicalFailurePanel({ failure, onChoice, onClose }) {
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to relevant game events for repair context
  const hull = useGameEvent('hullChanged');
  const engine = useGameEvent('engineChanged');
  const fuel = useGameEvent('fuelChanged');
  const lifeSupport = useGameEvent('lifeSupportChanged');
  const credits = useGameEvent('creditsChanged');
  const currentSystem = useGameEvent('currentSystemChanged');

  // Local state for selected repair option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate repair analysis based on failure type
  const repairAnalysis = useMemo(
    () => calculateRepairAnalysis(failure, credits, hull, engine, lifeSupport),
    [failure, credits, hull, engine, lifeSupport]
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

  // Determine failure severity for display
  const severity = getFailureSeverity(failure.type, failure.severity);
  const severityColor = getFailureSeverityColor(severity);

  return (
    <div id="mechanical-failure-panel" className="panel-base visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>Mechanical Failure</h2>

      <div className="failure-content">
        {/* Failure Status Section */}
        <div className="failure-section failure-status">
          <h3>System Failure</h3>
          <div className="failure-info">
            <div className="failure-type">
              <span className="type-label">Failure Type:</span>
              <span className="type-value">
                {formatFailureType(failure.type)}
              </span>
            </div>
            <div className="failure-severity">
              <span className="severity-label">Severity:</span>
              <span
                className={`severity-value ${severity}`}
                style={{ color: severityColor }}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            </div>
            <div className="failure-description">
              {getFailureDescription(failure.type)}
            </div>
            <div className="system-alert">
              {getSystemAlert(failure.type)}
            </div>
          </div>
        </div>

        {/* Ship Status Section */}
        <div className="failure-section ship-status">
          <h3>Ship Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Hull Integrity:</span>
              <span className={`status-value ${getConditionClass(hull)}`}>
                {Math.round(hull || 100)}%
              </span>
              <span className="status-impact">
                {hull < 50 ? 'Structural weakness detected' : 'Hull stable'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Engine Status:</span>
              <span className={`status-value ${getConditionClass(engine)}`}>
                {Math.round(engine || 100)}%
              </span>
              <span className="status-impact">
                {engine < 30 ? 'Critical engine condition' : 'Engine operational'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Life Support:</span>
              <span className={`status-value ${getConditionClass(lifeSupport)}`}>
                {Math.round(lifeSupport || 100)}%
              </span>
              <span className="status-impact">
                {lifeSupport < 30 ? 'Life support failing' : 'Environment stable'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Credits Available:</span>
              <span className="status-value">
                ₡{(credits || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Repair Options Section */}
        <div className="failure-section repair-options">
          <h3>Repair Options</h3>
          <div className="options-list">
            
            {/* Engine Failure Specific Options */}
            {failure.type === 'engine_failure' && (
              <>
                {/* Emergency Restart Option */}
                <div
                  className={`repair-option ${selectedOption === 'emergency_restart' ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('emergency_restart')}
                >
                  <div className="option-header">
                    <span className="option-name">Emergency Restart</span>
                    <span className="option-type">Quick Fix</span>
                  </div>
                  <div className="option-description">
                    Attempt to restart the engine using emergency protocols. Risky but fast.
                  </div>
                  <div className="option-analysis">
                    <div className="probability-display">
                      <span className="prob-label">Success Rate:</span>
                      <span className="prob-value">
                        {Math.round(FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE * 100)}%
                      </span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">Engine Wear:</span>
                      <span className="cost-value">
                        -{FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST}%
                      </span>
                    </div>
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome success">
                      <span className="outcome-label">Success:</span>
                      <span className="outcome-text">
                        Engine restarted, -{FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST}% engine condition
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">Failure:</span>
                      <span className="outcome-text">
                        Engine still failed, -{FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST}% engine condition
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call for Help Option */}
                <div
                  className={`repair-option ${selectedOption === 'call_for_help' ? 'selected' : ''} ${credits < FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST ? 'disabled' : ''}`}
                  onClick={() => credits >= FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST && handleOptionSelect('call_for_help')}
                >
                  <div className="option-header">
                    <span className="option-name">Call for Help</span>
                    <span className="option-type">Professional Repair</span>
                  </div>
                  <div className="option-description">
                    Contact emergency services for professional repair assistance.
                  </div>
                  <div className="option-analysis">
                    <div className="guaranteed-success">
                      <span className="prob-label">Success Rate:</span>
                      <span className="prob-value guaranteed">100%</span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">Service Cost:</span>
                      <span className="cost-value">
                        ₡{FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                    <div className="delay-display">
                      <span className="delay-label">Time Delay:</span>
                      <span className="delay-value">
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY} days
                      </span>
                    </div>
                    {credits < FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST && (
                      <div className="insufficient-funds">
                        <span className="error-text">Insufficient Credits</span>
                      </div>
                    )}
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome guaranteed">
                      <span className="outcome-label">Guaranteed:</span>
                      <span className="outcome-text">
                        Engine fully repaired, +{FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY} days delay, 
                        -₡{FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jury-Rig Repair Option */}
                <div
                  className={`repair-option ${selectedOption === 'jury_rig' ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('jury_rig')}
                >
                  <div className="option-header">
                    <span className="option-name">Jury-Rig Repair</span>
                    <span className="option-type">Field Repair</span>
                  </div>
                  <div className="option-description">
                    Attempt a makeshift repair using available parts and tools.
                  </div>
                  <div className="option-analysis">
                    <div className="probability-display">
                      <span className="prob-label">Success Rate:</span>
                      <span className="prob-value">
                        {Math.round(FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE * 100)}%
                      </span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">Engine Wear:</span>
                      <span className="cost-value">
                        -{FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}%
                      </span>
                    </div>
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome success">
                      <span className="outcome-label">Success:</span>
                      <span className="outcome-text">
                        Engine operational, -{FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}% engine condition
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">Failure:</span>
                      <span className="outcome-text">
                        Repair failed, -{FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}% engine condition
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Hull Breach - No repair options, just consequences */}
            {failure.type === 'hull_breach' && (
              <div className="repair-option hull-breach-info">
                <div className="option-header">
                  <span className="option-name">Hull Breach Damage</span>
                  <span className="option-type">Automatic</span>
                </div>
                <div className="option-description">
                  The hull breach has caused immediate damage and cargo loss.
                </div>
                <div className="option-outcomes">
                  <div className="outcome damage">
                    <span className="outcome-label">Immediate Effects:</span>
                    <span className="outcome-text">
                      -{FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE}% hull integrity, some cargo lost to space
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">Recommendation:</span>
                    <span className="outcome-text">
                      Seek repairs at the nearest station to prevent further deterioration
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Life Support Emergency - No repair options, just consequences */}
            {failure.type === 'life_support' && (
              <div className="repair-option life-support-info">
                <div className="option-header">
                  <span className="option-name">Life Support Emergency</span>
                  <span className="option-type">Critical</span>
                </div>
                <div className="option-description">
                  Life support systems are failing. Emergency protocols activated.
                </div>
                <div className="option-outcomes">
                  <div className="outcome critical">
                    <span className="outcome-label">Immediate Action Required:</span>
                    <span className="outcome-text">
                      Proceed to nearest station immediately for life support repairs
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">Risk:</span>
                    <span className="outcome-text">
                      Continued operation without repair may result in crew casualties
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Action Buttons */}
        <div className="failure-actions">
          {failure.type === 'engine_failure' && selectedOption && (
            <>
              <button 
                className="failure-btn primary" 
                onClick={handleConfirm}
                disabled={selectedOption === 'call_for_help' && credits < FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST}
              >
                {getActionButtonText(selectedOption)}
              </button>
              <button
                className="failure-btn secondary"
                onClick={handleCancel}
              >
                Reconsider
              </button>
            </>
          )}
          {failure.type === 'engine_failure' && !selectedOption && (
            <div className="selection-prompt">
              Choose a repair option to address the engine failure
            </div>
          )}
          {(failure.type === 'hull_breach' || failure.type === 'life_support') && (
            <button className="failure-btn primary" onClick={onClose}>
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate repair analysis based on failure type and current resources
 *
 * @param {Object} failure - The mechanical failure object
 * @param {number} credits - Current credits
 * @param {number} hull - Current hull condition
 * @param {number} engine - Current engine condition
 * @param {number} lifeSupport - Current life support condition
 * @returns {Object} Analysis of repair options and costs
 */
function calculateRepairAnalysis(failure, credits = 0, hull = 100, engine = 100, lifeSupport = 100) {
  const analysis = {
    failureType: failure.type,
    canAffordHelp: false,
    repairOptions: [],
  };

  if (failure.type === 'engine_failure') {
    analysis.canAffordHelp = credits >= FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST;
    analysis.repairOptions = [
      {
        id: 'emergency_restart',
        name: 'Emergency Restart',
        successRate: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE,
        cost: { engine: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST },
        available: true,
      },
      {
        id: 'call_for_help',
        name: 'Call for Help',
        successRate: 1.0,
        cost: { 
          credits: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST,
          days: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY,
        },
        available: analysis.canAffordHelp,
      },
      {
        id: 'jury_rig',
        name: 'Jury-Rig Repair',
        successRate: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE,
        cost: { engine: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST },
        available: true,
      },
    ];
  }

  return analysis;
}

/**
 * Get failure severity based on type and severity value
 *
 * @param {string} failureType - Type of failure
 * @param {number} severity - Severity value (if provided)
 * @returns {string} Severity level
 */
function getFailureSeverity(failureType, severity) {
  if (severity) return severity;
  
  switch (failureType) {
    case 'hull_breach':
      return 'serious';
    case 'engine_failure':
      return 'critical';
    case 'life_support':
      return 'emergency';
    default:
      return 'moderate';
  }
}

/**
 * Get color for failure severity display
 *
 * @param {string} severity - The failure severity level
 * @returns {string} CSS color value
 */
function getFailureSeverityColor(severity) {
  switch (severity) {
    case 'minor':
      return '#ffaa00'; // Orange - manageable issue
    case 'moderate':
      return '#ff6b6b'; // Red - significant problem
    case 'serious':
      return '#ff4444'; // Bright red - major concern
    case 'critical':
      return '#ff0000'; // Bright red - system failure
    case 'emergency':
      return '#ff0000'; // Bright red - life threatening
    default:
      return '#ffffff'; // White - unknown
  }
}

/**
 * Format failure type for display
 *
 * @param {string} failureType - The failure type
 * @returns {string} Formatted display name
 */
function formatFailureType(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return 'Hull Breach';
    case 'engine_failure':
      return 'Engine Failure';
    case 'life_support':
      return 'Life Support Emergency';
    default:
      return 'System Malfunction';
  }
}

/**
 * Get failure description based on type
 *
 * @param {string} failureType - The failure type
 * @returns {string} Description of the failure
 */
function getFailureDescription(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return 'A breach in the hull has been detected. Structural integrity is compromised and cargo may be lost to space.';
    case 'engine_failure':
      return 'The main engine has suffered a critical failure and is no longer operational. The ship is stranded until repairs are completed.';
    case 'life_support':
      return 'Life support systems are experiencing critical failures. Atmospheric processing and environmental controls are failing.';
    default:
      return 'An unspecified system malfunction has occurred.';
  }
}

/**
 * Get system alert message based on failure type
 *
 * @param {string} failureType - The failure type
 * @returns {string} Alert message
 */
function getSystemAlert(failureType) {
  switch (failureType) {
    case 'hull_breach':
      return 'ALERT: Hull breach detected. Emergency bulkheads activated.';
    case 'engine_failure':
      return 'ALERT: Main engine offline. Ship propulsion systems non-functional.';
    case 'life_support':
      return 'ALERT: Life support critical. Emergency oxygen reserves activated.';
    default:
      return 'ALERT: System malfunction detected.';
  }
}

/**
 * Get CSS class for ship condition display based on percentage value
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
 * Get action button text based on selected repair option
 *
 * @param {string} optionName - The selected repair option name
 * @returns {string} Button text
 */
function getActionButtonText(optionName) {
  switch (optionName) {
    case 'emergency_restart':
      return 'Attempt Emergency Restart';
    case 'call_for_help':
      return 'Call for Professional Help';
    case 'jury_rig':
      return 'Attempt Jury-Rig Repair';
    default:
      return 'Proceed';
  }
}