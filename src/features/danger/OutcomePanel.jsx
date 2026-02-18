import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { FACTION_CONFIG } from '../../game/constants.js';

/**
 * OutcomePanel - React component for displaying encounter outcomes
 *
 * Displays encounter outcome with explanation, shows what modifiers
 * affected the result, and displays karma/reputation changes.
 * Provides feedback on why specific outcomes occurred.
 *
 * Architecture: danger-system
 * Validates: Requirements 9.9, 12.6
 *
 * @param {Object} props
 * @param {Object} props.outcome - The encounter outcome object
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Function} props.onContinue - Callback to continue after reviewing outcome
 */
export function OutcomePanel({ outcome, onClose, onContinue }) {
  // Subscribe to current karma and faction reputation for display
  const karma = useGameEvent('karmaChanged');
  const factions = useGameEvent('factionRepChanged');

  // Process outcome data for display
  const outcomeAnalysis = useMemo(() => {
    if (!outcome) return null;

    return {
      success: outcome.success || false,
      encounterType: outcome.encounterType || 'unknown',
      choiceMade: outcome.choiceMade || 'unknown',
      explanation: outcome.explanation || 'Encounter resolved.',
      modifiers: outcome.modifiers || [],
      consequences: outcome.consequences || {},
      karmaChanges: outcome.karmaChanges || [],
      reputationChanges: outcome.reputationChanges || [],
      resourceChanges: outcome.resourceChanges || {},
    };
  }, [outcome]);

  if (!outcomeAnalysis) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div id="outcome-panel" className="panel-base visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>Encounter Outcome</h2>

      <div className="outcome-content">
        {/* Outcome Summary Section */}
        <div className="outcome-section outcome-summary">
          <h3>Result</h3>
          <div className="outcome-result">
            <div className="result-header">
              <span className="encounter-type">
                {formatEncounterType(outcomeAnalysis.encounterType)}
              </span>
              <span
                className={`result-status ${outcomeAnalysis.success ? 'success' : 'failure'}`}
              >
                {outcomeAnalysis.success ? 'Success' : 'Failure'}
              </span>
            </div>
            <div className="choice-made">
              <span className="choice-label">Your Choice:</span>
              <span className="choice-value">
                {formatChoiceName(outcomeAnalysis.choiceMade)}
              </span>
            </div>
            <div className="outcome-explanation">
              {outcomeAnalysis.explanation}
            </div>
          </div>
        </div>

        {/* Modifiers That Affected Result */}
        {outcomeAnalysis.modifiers.length > 0 && (
          <div className="outcome-section modifiers-section">
            <h3>Factors That Influenced the Outcome</h3>
            <div className="modifiers-list">
              {outcomeAnalysis.modifiers.map((modifier, index) => (
                <div
                  key={index}
                  className={`modifier-item ${modifier.type || 'neutral'}`}
                >
                  <div className="modifier-header">
                    <span className="modifier-name">{modifier.name}</span>
                    <span className="modifier-impact">
                      {formatModifierImpact(modifier.value, modifier.type)}
                    </span>
                  </div>
                  {modifier.description && (
                    <div className="modifier-description">
                      {modifier.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consequences Section */}
        <div className="outcome-section consequences-section">
          <h3>Consequences</h3>
          <div className="consequences-grid">
            {/* Resource Changes */}
            {Object.keys(outcomeAnalysis.resourceChanges).length > 0 && (
              <div className="consequence-category resource-changes">
                <h4>Ship & Resources</h4>
                <div className="changes-list">
                  {Object.entries(outcomeAnalysis.resourceChanges).map(
                    ([resource, change]) => (
                      <div key={resource} className="change-item">
                        <span className="change-label">
                          {formatResourceName(resource)}:
                        </span>
                        <span
                          className={`change-value ${change >= 0 ? 'positive' : 'negative'}`}
                        >
                          {formatResourceChange(resource, change)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Karma Changes */}
            {outcomeAnalysis.karmaChanges.length > 0 && (
              <div className="consequence-category karma-changes">
                <h4>Moral Standing</h4>
                <div className="changes-list">
                  {outcomeAnalysis.karmaChanges.map((change, index) => (
                    <div key={index} className="change-item karma">
                      <span className="change-label">Karma:</span>
                      <span
                        className={`change-value ${change.amount >= 0 ? 'positive' : 'negative'}`}
                      >
                        {change.amount >= 0 ? '+' : ''}
                        {change.amount}
                      </span>
                      <span className="change-reason">({change.reason})</span>
                    </div>
                  ))}
                  <div className="current-karma">
                    <span className="current-label">Current Karma:</span>
                    <span className={`current-value ${getKarmaClass(karma)}`}>
                      {karma}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reputation Changes */}
            {outcomeAnalysis.reputationChanges.length > 0 && (
              <div className="consequence-category reputation-changes">
                <h4>Faction Standing</h4>
                <div className="changes-list">
                  {outcomeAnalysis.reputationChanges.map((change, index) => (
                    <div key={index} className="change-item reputation">
                      <span className="change-label">
                        {formatFactionName(change.faction)}:
                      </span>
                      <span
                        className={`change-value ${change.amount >= 0 ? 'positive' : 'negative'}`}
                      >
                        {change.amount >= 0 ? '+' : ''}
                        {change.amount}
                      </span>
                      <span className="change-reason">({change.reason})</span>
                    </div>
                  ))}
                  {/* Current Faction Standings */}
                  <div className="current-standings">
                    <h5>Current Standing:</h5>
                    {FACTION_CONFIG.FACTIONS.map((faction) => (
                      <div key={faction} className="current-standing">
                        <span className="faction-name">
                          {formatFactionName(faction)}:
                        </span>
                        <span
                          className={`faction-value ${getReputationClass(
                            factions[faction]
                          )}`}
                        >
                          {factions[faction]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Consequences */}
        {outcomeAnalysis.consequences.additionalEffects && (
          <div className="outcome-section additional-effects">
            <h3>Additional Effects</h3>
            <div className="effects-list">
              {outcomeAnalysis.consequences.additionalEffects.map(
                (effect, index) => (
                  <div key={index} className="effect-item">
                    <span className="effect-icon">•</span>
                    <span className="effect-text">{effect}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="outcome-actions">
          <button className="outcome-btn primary" onClick={handleContinue}>
            Continue
          </button>
          {onClose && (
            <button className="outcome-btn secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format encounter type for display
 *
 * @param {string} encounterType - The encounter type identifier
 * @returns {string} Formatted display name
 */
function formatEncounterType(encounterType) {
  switch (encounterType) {
    case 'pirate_encounter':
      return 'Pirate Encounter';
    case 'customs_inspection':
      return 'Customs Inspection';
    case 'mechanical_failure':
      return 'Mechanical Failure';
    case 'distress_call':
      return 'Distress Call';
    case 'combat':
      return 'Combat';
    case 'negotiation':
      return 'Negotiation';
    default:
      return 'Encounter';
  }
}

/**
 * Format choice name for display
 *
 * @param {string} choice - The choice identifier
 * @returns {string} Formatted display name
 */
function formatChoiceName(choice) {
  return choice
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format modifier impact for display
 *
 * @param {number} value - The modifier value
 * @param {string} type - The modifier type (bonus, penalty, neutral)
 * @returns {string} Formatted impact display
 */
function formatModifierImpact(value, type) {
  if (typeof value === 'number') {
    const percentage = Math.round(Math.abs(value) * 100);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${percentage}%`;
  }

  switch (type) {
    case 'bonus':
      return 'Positive';
    case 'penalty':
      return 'Negative';
    default:
      return 'Neutral';
  }
}

/**
 * Format resource name for display
 *
 * @param {string} resource - The resource identifier
 * @returns {string} Formatted display name
 */
function formatResourceName(resource) {
  switch (resource) {
    case 'hull':
      return 'Hull Integrity';
    case 'engine':
      return 'Engine Condition';
    case 'fuel':
      return 'Fuel';
    case 'lifeSupport':
      return 'Life Support';
    case 'credits':
      return 'Credits';
    case 'cargo':
      return 'Cargo';
    case 'days':
      return 'Time Delay';
    default:
      return resource.charAt(0).toUpperCase() + resource.slice(1);
  }
}

/**
 * Format resource change for display
 *
 * @param {string} resource - The resource type
 * @param {number} change - The change amount
 * @returns {string} Formatted change display
 */
function formatResourceChange(resource, change) {
  if (resource === 'credits') {
    return `${change >= 0 ? '+' : '-'}₡${Math.abs(change)}`;
  }

  if (resource === 'days') {
    const days = Math.abs(change);
    return `${change >= 0 ? '+' : ''}${days} day${days !== 1 ? 's' : ''}`;
  }

  if (resource === 'cargo') {
    const percent = Math.abs(change);
    if (percent >= 100) return 'All cargo lost';
    return `-${percent}% cargo`;
  }

  // For percentage-based resources (hull, engine, fuel, lifeSupport)
  return `${change >= 0 ? '+' : ''}${change}%`;
}

/**
 * Format faction name for display
 *
 * @param {string} faction - The faction identifier
 * @returns {string} Formatted display name
 */
function formatFactionName(faction) {
  switch (faction) {
    case 'authorities':
      return 'Authorities';
    case 'traders':
      return 'Traders';
    case 'outlaws':
      return 'Outlaws';
    case 'civilians':
      return 'Civilians';
    default:
      return faction.charAt(0).toUpperCase() + faction.slice(1);
  }
}

/**
 * Get CSS class for karma value display
 *
 * @param {number} karma - The karma value
 * @returns {string} CSS class name
 */
function getKarmaClass(karma) {
  if (karma >= 50) return 'very-good';
  if (karma >= 25) return 'good';
  if (karma >= -25) return 'neutral';
  if (karma >= -50) return 'bad';
  return 'very-bad';
}

/**
 * Get CSS class for reputation value display
 *
 * @param {number} reputation - The reputation value
 * @returns {string} CSS class name
 */
function getReputationClass(reputation) {
  if (reputation >= 50) return 'very-good';
  if (reputation >= 25) return 'good';
  if (reputation >= -25) return 'neutral';
  if (reputation >= -50) return 'bad';
  return 'very-bad';
}
