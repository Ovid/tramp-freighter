import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  DISTRESS_CONFIG,
  KARMA_CONFIG,
  REPUTATION_BOUNDS,
  SHIP_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import { getKarmaClass, getReputationTier } from './dangerDisplayUtils';

/**
 * DistressCallPanel - React component for distress call moral choice resolution
 *
 * Displays distress call description and shows moral choice options (respond, ignore, loot)
 * with clear costs and consequences for each choice. Provides feedback on karma and
 * reputation effects to help players make informed moral decisions.
 *
 * Architecture: danger-system
 * Validates: Requirements 7.2, 7.6, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.distressCall - The distress call encounter object
 * @param {Function} props.onChoice - Callback when player makes a moral choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function DistressCallPanel({
  distressCall,
  onChoice,
  onClose: _onClose,
}) {
  // Subscribe to relevant game events for moral choice context
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const lifeSupport = useGameEvent(EVENT_NAMES.LIFE_SUPPORT_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Local state for selected moral choice
  const [selectedChoice, setSelectedChoice] = useState(null);

  // Calculate resource availability and moral standing
  const playerStatus = useMemo(
    () => calculatePlayerStatus(fuel, lifeSupport, credits, karma, factions),
    [fuel, lifeSupport, credits, karma, factions]
  );

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
  };

  const handleConfirm = () => {
    if (selectedChoice && onChoice) {
      onChoice(selectedChoice);
    }
  };

  const handleCancel = () => {
    setSelectedChoice(null);
  };

  // Determine distress call severity and type for display
  const severity = distressCall.severity || 'moderate';
  const callType = distressCall.type || 'general';
  const severityColor = getDistressSeverityColor(severity);

  return (
    <div
      id="distress-call-panel"
      className="panel-base visible"
      role="dialog"
      aria-modal="true"
      aria-labelledby="distress-call-title"
    >
      <button
        className="close-btn"
        onClick={() => onChoice('ignore')}
        aria-label="Ignore distress call"
      >
        ×
      </button>
      <h2 id="distress-call-title">Distress Call</h2>

      <div className="distress-content">
        {/* Distress Call Information Section */}
        <div className="distress-section call-info">
          <h3>Emergency Signal</h3>
          <div className="call-details">
            <div className="signal-header">
              <div className="signal-strength">
                <span className="signal-label">Signal Strength:</span>
                <span
                  className={`signal-value ${severity}`}
                  style={{ color: severityColor }}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </span>
              </div>
              <div className="call-type">
                <span className="type-label">Emergency Type:</span>
                <span className="type-value">{formatCallType(callType)}</span>
              </div>
            </div>
            <div className="distress-message">
              <div className="message-header">Transmission:</div>
              <div className="message-text">
                {distressCall.description ||
                  '"Mayday, mayday! This is civilian transport vessel requesting immediate assistance. We have suffered critical system failures and are stranded. Please respond if you can hear this transmission."'}
              </div>
            </div>
            <div className="signal-analysis">
              <div className="analysis-item">
                <span className="analysis-label">Vessel Type:</span>
                <span className="analysis-value">
                  {distressCall.vesselType || 'Civilian Transport'}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Estimated Crew:</span>
                <span className="analysis-value">
                  {distressCall.crewCount || '3-5 persons'}
                </span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Time Since Signal:</span>
                <span className="analysis-value">
                  {distressCall.timeElapsed || '2.3 hours'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Resources Section */}
        <div className="distress-section player-resources">
          <h3>Your Resources</h3>
          <div className="resources-grid">
            <div className="resource-item">
              <span className="resource-label">Fuel Reserves:</span>
              <span
                className={`resource-value ${getResourceClass(fuel ?? 100)}`}
              >
                {Math.round(fuel ?? 100)}%
              </span>
              <span className="resource-impact">
                {(fuel ?? 100) >= DISTRESS_CONFIG.RESPOND.FUEL_COST
                  ? 'Sufficient for rescue'
                  : 'Insufficient fuel reserves'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Life Support:</span>
              <span
                className={`resource-value ${getResourceClass(lifeSupport ?? 100)}`}
              >
                {Math.round(lifeSupport ?? 100)}%
              </span>
              <span className="resource-impact">
                {(lifeSupport ?? 100) >=
                DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
                  ? 'Can support additional crew'
                  : 'Limited life support capacity'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Credits:</span>
              <span className="resource-value">
                ₡{(credits ?? 0).toLocaleString()}
              </span>
              <span className="resource-impact">
                Potential reward: ₡{DISTRESS_CONFIG.RESPOND.CREDITS_REWARD}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Current Karma:</span>
              <span className={`resource-value ${getKarmaClass(karma ?? 0)}`}>
                {(karma ?? 0) > 0 ? '+' : ''}
                {karma ?? 0}
              </span>
              <span className="resource-impact">
                {getKarmaDescription(karma ?? 0)}
              </span>
            </div>
          </div>

          {/* Moral Standing Display */}
          <div className="moral-standing">
            <h4>Reputation Standing</h4>
            <div className="reputation-grid">
              <div className="rep-item">
                <span className="rep-label">Civilians:</span>
                <span
                  className={`rep-value ${getReputationClass(factions?.civilians ?? 0)}`}
                >
                  {getReputationTier(factions?.civilians ?? 0)}
                </span>
              </div>
              <div className="rep-item">
                <span className="rep-label">Outlaws:</span>
                <span
                  className={`rep-value ${getReputationClass(factions?.outlaws ?? 0)}`}
                >
                  {getReputationTier(factions?.outlaws ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Moral Choice Options Section */}
        <div className="distress-section choice-options">
          <h3>Your Response</h3>
          <div className="choices-list">
            {/* Respond Option */}
            <button
              className={`moral-choice ${selectedChoice === 'respond' ? 'selected' : ''} ${playerStatus.canRespond ? 'available' : 'unavailable'}`}
              disabled={!playerStatus.canRespond}
              onClick={() => handleChoiceSelect('respond')}
            >
              <div className="choice-header">
                <span className="choice-name">Respond to Distress Call</span>
                <span className="choice-type moral-good">Heroic</span>
              </div>
              <div className="choice-description">
                "We hear your distress call and are moving to assist. Hold
                tight, help is on the way."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>Resource Costs:</h5>
                  <div className="cost-item">
                    <span className="cost-label">Time Delay:</span>
                    <span className="cost-value">
                      +{DISTRESS_CONFIG.RESPOND.DAYS_COST} days
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Fuel Consumption:</span>
                    <span className="cost-value">
                      -{DISTRESS_CONFIG.RESPOND.FUEL_COST}%
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Life Support Strain:</span>
                    <span className="cost-value">
                      -{DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST}%
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>Rewards:</h5>
                  <div className="reward-item">
                    <span className="reward-label">Credits:</span>
                    <span className="reward-value positive">
                      +₡{DISTRESS_CONFIG.RESPOND.CREDITS_REWARD}
                    </span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Civilian Reputation:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.RESPOND.REP_REWARD}
                    </span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Karma:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.RESPOND.KARMA_REWARD}
                    </span>
                  </div>
                </div>
              </div>
              {!playerStatus.canRespond && (
                <div className="choice-restriction">
                  <span className="restriction-text">
                    Insufficient resources to safely conduct rescue operation
                  </span>
                </div>
              )}
            </button>

            {/* Ignore Option */}
            <button
              className={`moral-choice ${selectedChoice === 'ignore' ? 'selected' : ''} available`}
              onClick={() => handleChoiceSelect('ignore')}
            >
              <div className="choice-header">
                <span className="choice-name">Ignore the Call</span>
                <span className="choice-type moral-neutral">Pragmatic</span>
              </div>
              <div className="choice-description">
                "We cannot afford to get involved. Continue on our planned
                course."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>Consequences:</h5>
                  <div className="cost-item">
                    <span className="cost-label">Karma:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.IGNORE.KARMA_PENALTY}
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>Benefits:</h5>
                  <div className="reward-item">
                    <span className="reward-label">Resources:</span>
                    <span className="reward-value neutral">No cost</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Time:</span>
                    <span className="reward-value neutral">No delay</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Loot Option */}
            <button
              className={`moral-choice ${selectedChoice === 'loot' ? 'selected' : ''} available`}
              onClick={() => handleChoiceSelect('loot')}
            >
              <div className="choice-header">
                <span className="choice-name">Salvage the Wreck</span>
                <span className="choice-type moral-evil">Predatory</span>
              </div>
              <div className="choice-description">
                "Looks like they won't be needing their cargo anymore. Might as
                well make this trip profitable."
              </div>
              <div className="choice-analysis">
                <div className="costs-section">
                  <h5>Moral Costs:</h5>
                  <div className="cost-item">
                    <span className="cost-label">Time Delay:</span>
                    <span className="cost-value">
                      +{DISTRESS_CONFIG.LOOT.DAYS_COST} day
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Karma:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.LOOT.KARMA_PENALTY}
                    </span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Civilian Reputation:</span>
                    <span className="cost-value negative">
                      {DISTRESS_CONFIG.LOOT.REP_PENALTY}
                    </span>
                  </div>
                </div>
                <div className="rewards-section">
                  <h5>Material Gains:</h5>
                  <div className="reward-item">
                    <span className="reward-label">Salvaged Cargo:</span>
                    <span className="reward-value positive">Random goods</span>
                  </div>
                  <div className="reward-item">
                    <span className="reward-label">Outlaw Reputation:</span>
                    <span className="reward-value positive">
                      +{DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN}
                    </span>
                  </div>
                </div>
              </div>
              <div className="choice-warning">
                <span className="warning-text">
                  ⚠ This action will be remembered by the sector
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="distress-actions">
          {selectedChoice && (
            <>
              <button className="distress-btn primary" onClick={handleConfirm}>
                {getChoiceActionText(selectedChoice)}
              </button>
              <button className="distress-btn secondary" onClick={handleCancel}>
                Reconsider
              </button>
            </>
          )}
          {!selectedChoice && (
            <div className="selection-prompt">
              The distress signal continues to broadcast. What will you do?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate player's ability to respond to distress calls based on resources
 *
 * @param {number} fuel - Current fuel level
 * @param {number} lifeSupport - Current life support condition
 * @param {number} credits - Current credits
 * @param {number} karma - Current karma value
 * @param {Object} factions - Current faction reputation
 * @returns {Object} Player status analysis
 */
function calculatePlayerStatus(fuel, lifeSupport, credits, karma, factions) {
  const safeFuel = fuel ?? 100;
  const safeLifeSupport = lifeSupport ?? 100;

  // Check if player has sufficient resources to respond
  const canRespond =
    safeFuel >= DISTRESS_CONFIG.RESPOND.FUEL_COST &&
    safeLifeSupport >= DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST;

  return {
    canRespond,
    fuel: safeFuel,
    lifeSupport: safeLifeSupport,
    credits: credits ?? 0,
    karma: karma ?? 0,
    civilianRep: factions?.civilians ?? 0,
    outlawRep: factions?.outlaws ?? 0,
  };
}

/**
 * Get color for distress call severity display based on urgency level.
 * Colors follow the game's visual hierarchy: green (routine) to red (critical).
 *
 * @param {string} severity - The distress call severity level
 * @returns {string} CSS color value for the severity level
 */
function getDistressSeverityColor(severity) {
  return (
    DISTRESS_CONFIG.SEVERITY_COLORS[severity] ||
    DISTRESS_CONFIG.SEVERITY_COLORS.unknown
  );
}

/**
 * Get CSS class for resource display based on percentage value.
 * Thresholds reflect resource availability for distress response operations.
 *
 * @param {number} resource - The resource value (0-100 percentage)
 * @returns {string} CSS class name for styling the resource display
 */
function getResourceClass(resource) {
  const thresholds = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS;
  if (resource >= thresholds.EXCELLENT) return 'abundant';
  if (resource >= thresholds.FAIR) return 'adequate';
  if (resource >= thresholds.POOR) return 'limited';
  return 'critical';
}

/**
 * Get karma description for display in resource impact text.
 * Provides context about the player's moral standing.
 *
 * @param {number} karma - Current karma value
 * @returns {string} Human-readable karma description
 */
function getKarmaDescription(karma) {
  const thresholds = KARMA_CONFIG.DISPLAY_THRESHOLDS;
  if (karma >= thresholds.SAINT) return 'Renowned for heroic deeds';
  if (karma >= thresholds.GOOD) return 'Known for helping others';
  if (karma >= thresholds.BAD) return 'Morally neutral reputation';
  if (karma >= thresholds.VILLAIN) return 'Reputation for selfishness';
  return 'Feared as ruthless and cruel';
}

/**
 * Get CSS class for reputation display based on faction standing value.
 * Reflects relationship quality with different sector factions.
 *
 * @param {number} reputation - Current reputation value (-100 to +100)
 * @returns {string} CSS class name for reputation display styling
 */
function getReputationClass(reputation) {
  if (reputation >= REPUTATION_BOUNDS.TRUSTED_MIN) return 'trusted';
  if (reputation >= REPUTATION_BOUNDS.FRIENDLY_MIN) return 'friendly';
  if (reputation >= REPUTATION_BOUNDS.WARM_MIN) return 'warm';
  if (reputation >= REPUTATION_BOUNDS.NEUTRAL_MIN) return 'neutral';
  if (reputation >= REPUTATION_BOUNDS.COLD_MIN) return 'cold';
  return 'hostile';
}

/**
 * Format call type for display in emergency signal header.
 * Converts internal call type identifiers to user-facing descriptions.
 *
 * @param {string} callType - The distress call type identifier
 * @returns {string} Formatted call type for display
 */
function formatCallType(callType) {
  switch (callType) {
    case 'mechanical':
      return 'Mechanical Failure';
    case 'medical':
      return 'Medical Emergency';
    case 'pirate':
      return 'Pirate Attack';
    case 'navigation':
      return 'Navigation Failure';
    case 'general':
      return 'General Distress';
    default:
      return 'Unknown Emergency';
  }
}

/**
 * Get action button text based on selected moral choice.
 * Provides clear, action-oriented button labels for each choice.
 *
 * @param {string} choice - The selected moral choice
 * @returns {string} Button text for the choice
 */
function getChoiceActionText(choice) {
  switch (choice) {
    case 'respond':
      return 'Launch Rescue Operation';
    case 'ignore':
      return 'Continue on Course';
    case 'loot':
      return 'Salvage the Wreck';
    default:
      return 'Confirm Choice';
  }
}
