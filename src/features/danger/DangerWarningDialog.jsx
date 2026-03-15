import { useGameEvent } from '../../hooks/useGameEvent';
import { useDangerZone } from '../../hooks/useDangerZone';
import { useEncounterProbabilities } from '../../hooks/useEncounterProbabilities';
import { EVENT_NAMES } from '../../game/constants.js';
import '../../../css/panel/danger-warning.css';

/**
 * DangerWarningDialog - React component for danger zone warnings
 *
 * Displays danger zone classification, pirate and inspection probabilities,
 * and provides proceed/cancel options for dangerous system jumps.
 *
 * Architecture: danger-system
 * Validates: Requirements 1.3, 12.3
 *
 * @param {Object} props
 * @param {number} props.destinationSystemId - The destination system ID
 * @param {string} props.destinationSystemName - The destination system name
 * @param {Function} props.onProceed - Callback when player chooses to proceed
 * @param {Function} props.onCancel - Callback when player chooses to cancel
 */
export function DangerWarningDialog({
  destinationSystemId,
  destinationSystemName,
  onProceed,
  onCancel,
}) {
  // Subscribe to relevant game events for probability calculations
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Get danger zone classification using Bridge Pattern
  const dangerZone = useDangerZone(destinationSystemId);

  // Build game state object for encounter calculations
  const gameStateForDanger = {
    player: {
      currentSystem: destinationSystemId,
      factions: factions || {
        authorities: 0,
        traders: 0,
        outlaws: 0,
        civilians: 0,
      },
    },
    ship: {
      cargo: cargo || [],
      engine: shipCondition?.engine ?? 100,
      upgrades: upgrades || [],
    },
  };

  // Calculate encounter probabilities using Bridge Pattern
  const { pirateChance, inspectionChance } = useEncounterProbabilities(
    destinationSystemId,
    gameStateForDanger
  );

  const handleProceedClick = () => {
    onProceed();
  };

  // Get zone display properties
  const zoneInfo = getZoneDisplayInfo(dangerZone);

  return (
    <div
      id="danger-warning-dialog"
      className="panel-base visible"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="danger-warning-title"
    >
      <button className="close-btn" onClick={onCancel} aria-label="Close">
        ×
      </button>
      <h2 id="danger-warning-title">Jump Warning</h2>

      <div className="warning-content">
        {/* Destination Info Section */}
        <div className="warning-section destination-info">
          <h3>Destination</h3>
          <div className="destination-details">
            <div className="destination-name">{destinationSystemName}</div>
            <div className="danger-classification">
              <span className="classification-label">Security Level:</span>
              <span
                className={`classification-value ${dangerZone}`}
                style={{ color: zoneInfo.color }}
              >
                {zoneInfo.name}
              </span>
            </div>
            <div className="zone-description">{zoneInfo.description}</div>
          </div>
        </div>

        {/* Risk Assessment Section */}
        <div className="warning-section risk-assessment">
          <h3>Risk Assessment</h3>
          <div className="risk-grid">
            <div className="risk-item">
              <div className="risk-header">
                <span className="risk-label">Pirate Encounters</span>
                <span className={`risk-value ${getRiskLevel(pirateChance)}`}>
                  {Math.round(pirateChance * 100)}%
                </span>
              </div>
              <div className="risk-description">
                Probability of hostile pirate encounters during jump
              </div>
            </div>

            <div className="risk-item">
              <div className="risk-header">
                <span className="risk-label">Customs Inspections</span>
                <span
                  className={`risk-value ${getRiskLevel(inspectionChance)}`}
                >
                  {Math.round(inspectionChance * 100)}%
                </span>
              </div>
              <div className="risk-description">
                Probability of customs inspection upon arrival
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {(cargo?.length > 0 ||
            (shipCondition?.engine && shipCondition.engine < 50) ||
            upgrades?.includes('advanced_sensors') ||
            (factions?.authorities && factions.authorities !== 0) ||
            (factions?.outlaws && factions.outlaws !== 0)) && (
            <div className="risk-factors">
              <h4>Risk Modifiers</h4>
              <div className="factors-list">
                {cargo?.length > 0 && (
                  <div className="factor">
                    <span className="factor-icon">📦</span>
                    <span className="factor-text">
                      Cargo value affects pirate encounter chance
                    </span>
                  </div>
                )}
                {shipCondition?.engine != null && shipCondition.engine < 50 && (
                  <div className="factor warning">
                    <span className="factor-icon">⚠️</span>
                    <span className="factor-text">
                      Poor engine condition increases pirate risk
                    </span>
                  </div>
                )}
                {upgrades?.includes('advanced_sensors') && (
                  <div className="factor positive">
                    <span className="factor-icon">📡</span>
                    <span className="factor-text">
                      Advanced sensors reduce pirate detection
                    </span>
                  </div>
                )}
                {factions?.authorities > 0 && (
                  <div className="factor positive">
                    <span className="factor-icon">🛡️</span>
                    <span className="factor-text">
                      Good authority standing reduces inspection risk
                    </span>
                  </div>
                )}
                {factions?.authorities < 0 && (
                  <div className="factor warning">
                    <span className="factor-icon">🛡️</span>
                    <span className="factor-text">
                      Poor authority standing increases inspection risk
                    </span>
                  </div>
                )}
                {factions?.outlaws > 0 && (
                  <div className="factor positive">
                    <span className="factor-icon">🏴‍☠️</span>
                    <span className="factor-text">
                      Outlaw reputation may deter some pirates
                    </span>
                  </div>
                )}
                {factions?.outlaws < 0 && (
                  <div className="factor warning">
                    <span className="factor-icon">🏴‍☠️</span>
                    <span className="factor-text">
                      Poor outlaw standing increases pirate aggression
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Safety Recommendations */}
        {dangerZone !== 'safe' && (
          <div className="warning-section safety-recommendations">
            <h3>Safety Recommendations</h3>
            <div className="recommendations-list">
              {dangerZone === 'dangerous' && (
                <>
                  <div className="recommendation critical">
                    <span className="rec-icon">⚠️</span>
                    <span className="rec-text">
                      Dangerous zone - high pirate activity expected
                    </span>
                  </div>
                  <div className="recommendation">
                    <span className="rec-icon">🔧</span>
                    <span className="rec-text">
                      Ensure ship systems are in good condition
                    </span>
                  </div>
                </>
              )}
              {dangerZone === 'contested' && (
                <div className="recommendation warning">
                  <span className="rec-icon">⚠️</span>
                  <span className="rec-text">
                    Contested zone - moderate risk of encounters
                  </span>
                </div>
              )}
              <div className="recommendation">
                <span className="rec-icon">💰</span>
                <span className="rec-text">
                  Consider cargo value vs. risk tolerance
                </span>
              </div>
              <div className="recommendation">
                <span className="rec-icon">🛣️</span>
                <span className="rec-text">
                  Alternative routes through safer systems may be available
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="warning-actions">
        <button className="warning-btn primary" onClick={handleProceedClick}>
          {dangerZone === 'dangerous' ? 'Accept Risk & Proceed' : 'Proceed'}
        </button>
        <button className="warning-btn secondary" onClick={onCancel}>
          Cancel Jump
        </button>
      </div>
    </div>
  );
}

/**
 * Get display information for a danger zone classification.
 * Provides consistent naming, colors, and descriptions for each zone type.
 * Used to inform players about the risk level of their destination.
 *
 * @param {string} dangerZone - The danger zone type (safe, contested, dangerous)
 * @returns {Object} Display info with name, color, and description properties
 */
function getZoneDisplayInfo(dangerZone) {
  switch (dangerZone) {
    case 'safe':
      return {
        name: 'Safe',
        color: '#00ff88',
        description:
          'Core systems with strong law enforcement presence and minimal pirate activity.',
      };
    case 'contested':
      return {
        name: 'Contested',
        color: '#ffaa00',
        description:
          'Systems with mixed control, moderate pirate activity, and regular patrols.',
      };
    case 'dangerous':
      return {
        name: 'Dangerous',
        color: '#ff6b6b',
        description:
          'Frontier systems with high pirate activity and limited law enforcement.',
      };
    default:
      return {
        name: 'Unknown',
        color: '#ffffff',
        description: 'System classification unknown.',
      };
  }
}

/**
 * Get risk level classification for probability display.
 * Converts numeric probabilities to categorical risk levels for better UX.
 * Thresholds are tuned to provide meaningful risk assessment to players.
 *
 * @param {number} probability - The probability value (0-1 range)
 * @returns {string} Risk level class name for CSS styling
 */
function getRiskLevel(probability) {
  if (probability >= 0.3) return 'high'; // 30%+ = high risk
  if (probability >= 0.15) return 'moderate'; // 15-29% = moderate risk
  if (probability >= 0.05) return 'low'; // 5-14% = low risk
  return 'minimal'; // <5% = minimal risk
}
