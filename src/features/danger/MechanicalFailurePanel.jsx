import { useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  FAILURE_CONFIG,
  SHIP_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import { getConditionClass } from '../../game/utils/string-utils.js';

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
  // Subscribe to relevant game events for repair context
  const hull = useGameEvent(EVENT_NAMES.HULL_CHANGED);
  const engine = useGameEvent(EVENT_NAMES.ENGINE_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);

  // Local state for selected repair option
  const [selectedOption, setSelectedOption] = useState(null);

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
    <div
      id="mechanical-failure-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mechanical-failure-title"
    >
      <button className="close-btn" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2 id="mechanical-failure-title">Mechanical Failure</h2>

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
            <div className="system-alert">{getSystemAlert(failure.type)}</div>
          </div>
        </div>

        {/* Ship Status Section */}
        <div className="failure-section ship-status">
          <h3>Ship Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Hull Integrity:</span>
              <span className={`status-value ${getConditionClass(hull)}`}>
                {Math.round(hull ?? 100)}%
              </span>
              <span className="status-impact">
                {hull < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.HULL
                  ? 'Structural weakness detected'
                  : 'Hull stable'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Engine Status:</span>
              <span className={`status-value ${getConditionClass(engine)}`}>
                {Math.round(engine ?? 100)}%
              </span>
              <span className="status-impact">
                {engine < SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.ENGINE
                  ? 'Critical engine condition'
                  : 'Engine operational'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Life Support:</span>
              <span
                className={`status-value ${getConditionClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="status-impact">
                {lifeSupport <
                SHIP_CONFIG.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT
                  ? 'Life support failing'
                  : 'Environment stable'}
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
                <button
                  className={`repair-option ${selectedOption === 'emergency_restart' ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect('emergency_restart')}
                >
                  <div className="option-header">
                    <span className="option-name">Emergency Restart</span>
                    <span className="option-type">Quick Fix</span>
                  </div>
                  <div className="option-description">
                    Attempt to restart the engine using emergency protocols.
                    Risky but fast.
                  </div>
                  <div className="option-analysis">
                    <div className="probability-display">
                      <span className="prob-label">Success Rate:</span>
                      <span className="prob-value">
                        {Math.round(
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .CHANCE * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">Engine Wear:</span>
                      <span className="cost-value">
                        -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        %
                      </span>
                    </div>
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome success">
                      <span className="outcome-label">Success:</span>
                      <span className="outcome-text">
                        Engine restarted, -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        % engine condition
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">Failure:</span>
                      <span className="outcome-text">
                        Engine still failed, -
                        {
                          FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART
                            .ENGINE_COST
                        }
                        % engine condition
                      </span>
                    </div>
                  </div>
                </button>

                {/* Call for Help Option */}
                <button
                  className={`repair-option ${selectedOption === 'call_for_help' ? 'selected' : ''} ${credits < FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST ? 'disabled' : ''}`}
                  disabled={
                    credits <
                    FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST
                  }
                  onClick={() => handleOptionSelect('call_for_help')}
                >
                  <div className="option-header">
                    <span className="option-name">Call for Help</span>
                    <span className="option-type">Professional Repair</span>
                  </div>
                  <div className="option-description">
                    Contact emergency services for professional repair
                    assistance.
                  </div>
                  <div className="option-analysis">
                    <div className="guaranteed-success">
                      <span className="prob-label">Success Rate:</span>
                      <span className="prob-value guaranteed">100%</span>
                    </div>
                    <div className="cost-display">
                      <span className="cost-label">Service Cost:</span>
                      <span className="cost-value">
                        ₡
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                    <div className="delay-display">
                      <span className="delay-label">Time Delay:</span>
                      <span className="delay-value">
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY}{' '}
                        days
                      </span>
                    </div>
                    {credits <
                      FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP
                        .CREDITS_COST && (
                      <div className="insufficient-funds">
                        <span className="error-text">Insufficient Credits</span>
                      </div>
                    )}
                  </div>
                  <div className="option-outcomes">
                    <div className="outcome guaranteed">
                      <span className="outcome-label">Guaranteed:</span>
                      <span className="outcome-text">
                        Engine fully repaired, +
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY}{' '}
                        days delay, -₡
                        {FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Jury-Rig Repair Option */}
                <button
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
                        {Math.round(
                          FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE * 100
                        )}
                        %
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
                        Engine operational, -
                        {FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}%
                        engine condition
                      </span>
                    </div>
                    <div className="outcome failure">
                      <span className="outcome-label">Failure:</span>
                      <span className="outcome-text">
                        Repair failed, -
                        {FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST}%
                        engine condition
                      </span>
                    </div>
                  </div>
                </button>
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
                      -{FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE}% hull integrity,
                      some cargo lost to space
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">Recommendation:</span>
                    <span className="outcome-text">
                      Seek repairs at the nearest station to prevent further
                      deterioration
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
                  Life support systems are failing. Emergency protocols
                  activated.
                </div>
                <div className="option-outcomes">
                  <div className="outcome critical">
                    <span className="outcome-label">
                      Immediate Action Required:
                    </span>
                    <span className="outcome-text">
                      Proceed to nearest station immediately for life support
                      repairs
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">Risk:</span>
                    <span className="outcome-text">
                      Continued operation without repair may result in crew
                      casualties
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
                disabled={
                  selectedOption === 'call_for_help' &&
                  credits <
                    FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST
                }
              >
                {getActionButtonText(selectedOption)}
              </button>
              <button className="failure-btn secondary" onClick={handleCancel}>
                Reconsider
              </button>
            </>
          )}
          {failure.type === 'engine_failure' && !selectedOption && (
            <div className="selection-prompt">
              Choose a repair option to address the engine failure
            </div>
          )}
          {(failure.type === 'hull_breach' ||
            failure.type === 'life_support') && (
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
 * Get failure severity based on type and severity value
 *
 * @param {string} failureType - Type of failure
 * @param {number} severity - Severity value (if provided)
 * @returns {string} Severity level
 */
function getFailureSeverity(failureType, severity) {
  if (typeof severity === 'string') return severity;

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
