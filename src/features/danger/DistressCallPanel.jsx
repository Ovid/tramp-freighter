import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { DISTRESS_CONFIG } from '../../game/constants.js';

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
  const fuel = useGameEvent('fuelChanged');
  const lifeSupport = useGameEvent('lifeSupportChanged');
  const credits = useGameEvent('creditsChanged');
  const karma = useGameEvent('karmaChanged');
  const factions = useGameEvent('factionRepChanged');

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
    <div id="distress-call-panel" className="panel-base visible">
      <button className="close-btn" onClick={() => onChoice('ignore')} aria-label="Close">
        ×
      </button>
      <h2>Distress Call</h2>

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
              <span className={`resource-value ${getResourceClass(fuel)}`}>
                {Math.round(fuel)}%
              </span>
              <span className="resource-impact">
                {fuel >= DISTRESS_CONFIG.RESPOND.FUEL_COST
                  ? 'Sufficient for rescue'
                  : 'Insufficient fuel reserves'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Life Support:</span>
              <span
                className={`resource-value ${getResourceClass(lifeSupport)}`}
              >
                {Math.round(lifeSupport)}%
              </span>
              <span className="resource-impact">
                {lifeSupport >= DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
                  ? 'Can support additional crew'
                  : 'Limited life support capacity'}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Credits:</span>
              <span className="resource-value">
                ₡{credits.toLocaleString()}
              </span>
              <span className="resource-impact">
                Potential reward: ₡{DISTRESS_CONFIG.RESPOND.CREDITS_REWARD}
              </span>
            </div>
            <div className="resource-item">
              <span className="resource-label">Current Karma:</span>
              <span className={`resource-value ${getKarmaClass(karma)}`}>
                {karma > 0 ? '+' : ''}
                {karma}
              </span>
              <span className="resource-impact">
                {getKarmaDescription(karma)}
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
                  className={`rep-value ${getReputationClass(factions.civilians)}`}
                >
                  {getReputationTier(factions.civilians)}
                </span>
              </div>
              <div className="rep-item">
                <span className="rep-label">Outlaws:</span>
                <span
                  className={`rep-value ${getReputationClass(factions.outlaws)}`}
                >
                  {getReputationTier(factions.outlaws)}
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
            <div
              className={`moral-choice ${selectedChoice === 'respond' ? 'selected' : ''} ${playerStatus.canRespond ? 'available' : 'unavailable'}`}
              onClick={() =>
                playerStatus.canRespond && handleChoiceSelect('respond')
              }
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
            </div>

            {/* Ignore Option */}
            <div
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
            </div>

            {/* Loot Option */}
            <div
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
            </div>
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
  // Check if player has sufficient resources to respond
  const canRespond =
    fuel >= DISTRESS_CONFIG.RESPOND.FUEL_COST &&
    lifeSupport >= DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST;

  return {
    canRespond,
    fuel,
    lifeSupport,
    credits,
    karma,
    civilianRep: factions.civilians,
    outlawRep: factions.outlaws,
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
  if (resource >= 75) return 'abundant';
  if (resource >= 50) return 'adequate';
  if (resource >= 25) return 'limited';
  return 'critical';
}

/**
 * Get CSS class for karma display based on moral alignment value.
 * Reflects the player's moral standing and affects NPC interactions.
 *
 * @param {number} karma - Current karma value (-100 to +100)
 * @returns {string} CSS class name for karma display styling
 */
function getKarmaClass(karma) {
  if (karma >= 50) return 'saint';
  if (karma >= 20) return 'good';
  if (karma >= -20) return 'neutral';
  if (karma >= -50) return 'bad';
  return 'villain';
}

/**
 * Get karma description for display in resource impact text.
 * Provides context about the player's moral standing.
 *
 * @param {number} karma - Current karma value
 * @returns {string} Human-readable karma description
 */
function getKarmaDescription(karma) {
  if (karma >= 50) return 'Renowned for heroic deeds';
  if (karma >= 20) return 'Known for helping others';
  if (karma >= -20) return 'Morally neutral reputation';
  if (karma >= -50) return 'Reputation for selfishness';
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
  if (reputation >= 60) return 'trusted';
  if (reputation >= 30) return 'friendly';
  if (reputation >= 10) return 'warm';
  if (reputation >= -10) return 'neutral';
  if (reputation >= -50) return 'cold';
  return 'hostile';
}

/**
 * Get reputation tier name for display in faction standing.
 * Converts numeric reputation to human-readable relationship status.
 *
 * @param {number} reputation - Current reputation value
 * @returns {string} Reputation tier name
 */
function getReputationTier(reputation) {
  if (reputation >= 90) return 'Family';
  if (reputation >= 60) return 'Trusted';
  if (reputation >= 30) return 'Friendly';
  if (reputation >= 10) return 'Warm';
  if (reputation >= -10) return 'Neutral';
  if (reputation >= -50) return 'Cold';
  return 'Hostile';
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
