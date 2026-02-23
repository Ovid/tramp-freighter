import { useState, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  INSPECTION_CONFIG,
  RESTRICTED_GOODS_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';

/**
 * InspectionPanel - React component for customs inspection resolution
 *
 * Displays cargo manifest with restricted items marked, shows inspection options
 * (cooperate, bribe, flee) with clear costs and consequences for each option.
 * Provides detailed feedback on potential outcomes and reputation effects.
 *
 * Architecture: danger-system
 * Validates: Requirements 5.3, 5.13, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.inspection - The inspection encounter object
 * @param {Function} props.onChoice - Callback when player makes an inspection choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function InspectionPanel({ inspection, onChoice, onClose: _onClose }) {
  // Subscribe to relevant game events for inspection context
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const hiddenCargo = useGameEvent(EVENT_NAMES.HIDDEN_CARGO_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystem = useGameEvent(EVENT_NAMES.CURRENT_SYSTEM_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED);

  // Local state for selected inspection option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate inspection analysis and restricted goods
  const inspectionAnalysis = useMemo(
    () =>
      calculateInspectionAnalysis(
        inspection,
        cargo,
        hiddenCargo,
        currentSystem,
        credits
      ),
    [inspection, cargo, hiddenCargo, currentSystem, credits]
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

  // Determine inspection severity for display
  const severity = inspection.severity || 'routine';
  const severityColor = getInspectionSeverityColor(severity);

  return (
    <div id="inspection-panel" className="panel-base visible">
      <button
        className="close-btn"
        onClick={() => onChoice('flee')}
        aria-label="Close"
      >
        ×
      </button>
      <h2>Customs Inspection</h2>

      <div className="inspection-content">
        {/* Inspection Status Section */}
        <div className="inspection-section inspection-status">
          <h3>Inspection Status</h3>
          <div className="inspection-info">
            <div className="inspection-severity">
              <span className="severity-label">Inspection Type:</span>
              <span
                className={`severity-value ${severity}`}
                style={{ color: severityColor }}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </span>
            </div>
            <div className="inspection-description">
              {inspection.description ||
                'Customs officials are conducting a standard cargo inspection. Cooperation is expected.'}
            </div>
            <div className="inspector-dialogue">
              "Please prepare your cargo manifest for inspection. Any restricted
              items must be declared."
            </div>
          </div>
        </div>

        {/* Cargo Manifest Section */}
        <div className="inspection-section cargo-manifest">
          <h3>Cargo Manifest</h3>
          <div className="manifest-content">
            {/* Regular Cargo Display */}
            <div className="regular-cargo">
              <h4>Declared Cargo</h4>
              {cargo && cargo.length > 0 ? (
                <div className="cargo-list">
                  {cargo.map((item, index) => {
                    const isRestricted =
                      inspectionAnalysis.restrictedItems.includes(item.good);
                    return (
                      <div
                        key={`${item.good}-${item.qty}-${index}`}
                        className={`cargo-item ${isRestricted ? 'restricted' : 'legal'}`}
                      >
                        <div className="item-info">
                          <span className="item-name">
                            {formatCommodityName(item.good)}
                          </span>
                          <span className="item-quantity">
                            {item.qty} units
                          </span>
                        </div>
                        <div className="item-status">
                          {isRestricted ? (
                            <span className="status-restricted">
                              RESTRICTED
                            </span>
                          ) : (
                            <span className="status-legal">Legal</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-cargo">
                  <span className="empty-message">No declared cargo</span>
                </div>
              )}
            </div>

            {/* Hidden Cargo Indicator (not shown to inspector) */}
            {hiddenCargo && hiddenCargo.length > 0 && (
              <div className="hidden-cargo-indicator">
                <div className="hidden-status">
                  <span className="hidden-label">Hidden Compartments:</span>
                  <span className="hidden-count">
                    {hiddenCargo.length} concealed item
                    {hiddenCargo.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="discovery-risk">
                  <span className="risk-label">Discovery Risk:</span>
                  <span className="risk-value">
                    {Math.round(
                      inspectionAnalysis.hiddenCargoDiscoveryChance * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inspection Summary */}
          <div className="inspection-summary">
            <div className="summary-item">
              <span className="summary-label">Restricted Items:</span>
              <span
                className={`summary-value ${inspectionAnalysis.restrictedItems.length > 0 ? 'warning' : 'clear'}`}
              >
                {inspectionAnalysis.restrictedItems.length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Security Level:</span>
              <span className="summary-value">
                {getSecurityLevelName(inspectionAnalysis.securityLevel)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Authority Standing:</span>
              <span
                className={`summary-value ${getReputationClass(factions?.authorities)}`}
              >
                {getReputationTier(factions?.authorities || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Inspection Options Section */}
        <div className="inspection-section inspection-options">
          <h3>Response Options</h3>
          <div className="options-list">
            {/* Cooperate Option */}
            <div
              className={`inspection-option ${selectedOption === 'cooperate' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('cooperate')}
            >
              <div className="option-header">
                <span className="option-name">Cooperate</span>
                <span className="option-type">Compliance</span>
              </div>
              <div className="option-description">
                Comply fully with the inspection and declare all cargo honestly.
              </div>
              <div className="option-analysis">
                <div className="guaranteed-outcome">
                  <span className="outcome-label">Outcome:</span>
                  <span className="outcome-value guaranteed">
                    Guaranteed Success
                  </span>
                </div>
                {inspectionAnalysis.restrictedItems.length > 0 && (
                  <div className="violation-warning">
                    <span className="warning-label">
                      Restricted Goods Detected:
                    </span>
                    <span className="warning-text">
                      {inspectionAnalysis.restrictedItems.join(', ')}
                    </span>
                  </div>
                )}
                {hiddenCargo && hiddenCargo.length > 0 && (
                  <div className="hidden-risk">
                    <span className="risk-label">Hidden Cargo Discovery:</span>
                    <span className="risk-value">
                      {Math.round(
                        inspectionAnalysis.hiddenCargoDiscoveryChance * 100
                      )}
                      % chance
                    </span>
                  </div>
                )}
              </div>
              <div className="option-outcomes">
                <div className="outcome base">
                  <span className="outcome-label">Base Result:</span>
                  <span className="outcome-text">
                    +{INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN} authority
                    reputation for cooperation
                  </span>
                </div>
                {inspectionAnalysis.restrictedItems.length > 0 && (
                  <div className="outcome penalty">
                    <span className="outcome-label">Restricted Goods:</span>
                    <span className="outcome-text">
                      ₡
                      {INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE.toLocaleString()}{' '}
                      fine,
                      {
                        INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS
                      }{' '}
                      authority reputation
                    </span>
                  </div>
                )}
                {hiddenCargo && hiddenCargo.length > 0 && (
                  <div className="outcome risk">
                    <span className="outcome-label">
                      If Hidden Cargo Found:
                    </span>
                    <span className="outcome-text">
                      ₡
                      {INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE.toLocaleString()}{' '}
                      fine,
                      {INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO}{' '}
                      authority reputation, +
                      {
                        INSPECTION_CONFIG.REPUTATION_PENALTIES
                          .SMUGGLING_OUTLAW_BONUS
                      }{' '}
                      outlaw reputation
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bribe Option */}
            <div
              className={`inspection-option ${selectedOption === 'bribe' ? 'selected' : ''} ${credits < INSPECTION_CONFIG.BRIBE.COST ? 'disabled' : ''}`}
              onClick={() =>
                credits >= INSPECTION_CONFIG.BRIBE.COST &&
                handleOptionSelect('bribe')
              }
            >
              <div className="option-header">
                <span className="option-name">Attempt Bribery</span>
                <span className="option-type">Corruption</span>
              </div>
              <div className="option-description">
                Offer credits to the inspector to avoid a thorough inspection.
              </div>
              <div className="option-analysis">
                <div className="probability-display">
                  <span className="prob-label">Success Chance:</span>
                  <span className="prob-value">
                    {Math.round(INSPECTION_CONFIG.BRIBE.BASE_CHANCE * 100)}%
                  </span>
                </div>
                <div className="cost-display">
                  <span className="cost-label">Attempt Cost:</span>
                  <span className="cost-value">
                    ₡{INSPECTION_CONFIG.BRIBE.COST.toLocaleString()}
                  </span>
                </div>
                {credits < INSPECTION_CONFIG.BRIBE.COST && (
                  <div className="insufficient-funds">
                    <span className="error-text">Insufficient Credits</span>
                  </div>
                )}
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">Success:</span>
                  <span className="outcome-text">
                    Avoid inspection, pay ₡
                    {INSPECTION_CONFIG.BRIBE.COST.toLocaleString()},
                    {INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY} authority
                    reputation
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">Failure:</span>
                  <span className="outcome-text">
                    Pay ₡
                    {(
                      INSPECTION_CONFIG.BRIBE.COST +
                      INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE
                    ).toLocaleString()}
                    , full inspection proceeds,{' '}
                    {INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY} authority
                    reputation
                  </span>
                </div>
              </div>
            </div>

            {/* Flee Option */}
            <div
              className={`inspection-option ${selectedOption === 'flee' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('flee')}
            >
              <div className="option-header">
                <span className="option-name">Flee</span>
                <span className="option-type">Evasion</span>
              </div>
              <div className="option-description">
                Attempt to escape the inspection by fleeing the area.
              </div>
              <div className="option-analysis">
                <div className="consequence-warning">
                  <span className="warning-label">Warning:</span>
                  <span className="warning-text">
                    Triggers patrol combat encounter
                  </span>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome guaranteed">
                  <span className="outcome-label">Immediate Result:</span>
                  <span className="outcome-text">
                    {INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY} authority
                    reputation for resisting inspection
                  </span>
                </div>
                <div className="outcome combat">
                  <span className="outcome-label">Combat Encounter:</span>
                  <span className="outcome-text">
                    Patrol vessels will pursue and engage in combat
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="inspection-actions">
          {selectedOption && (
            <>
              <button
                className="inspection-btn primary"
                onClick={handleConfirm}
                disabled={
                  selectedOption === 'bribe' &&
                  credits < INSPECTION_CONFIG.BRIBE.COST
                }
              >
                {getActionButtonText(selectedOption)}
              </button>
              <button
                className="inspection-btn secondary"
                onClick={handleCancel}
              >
                Reconsider
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              Choose your response to the customs inspection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate inspection analysis including restricted goods and discovery chances
 *
 * @param {Object} inspection - The inspection encounter
 * @param {Array} cargo - Current regular cargo
 * @param {Array} hiddenCargo - Current hidden cargo
 * @param {number} currentSystem - Current system ID
 * @param {number} credits - Current credits
 * @returns {Object} Analysis of the inspection situation
 */
function calculateInspectionAnalysis(
  inspection,
  cargo = [],
  _hiddenCargo = [],
  currentSystem = 0,
  credits = 0
) {
  // Determine danger zone for the current system
  const dangerZone = getDangerZoneForSystem(currentSystem);

  // Find restricted items in regular cargo
  const restrictedItems = cargo
    .filter((item) =>
      isGoodRestrictedInZone(item.good, dangerZone, currentSystem)
    )
    .map((item) => item.good);

  // Calculate security level and hidden cargo discovery chance
  let securityMultiplier;
  if (currentSystem === 0 || currentSystem === 1) {
    // Core systems (Sol, Alpha Centauri)
    securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
  } else {
    // Use zone-based multiplier
    securityMultiplier =
      INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[dangerZone];
  }

  const hiddenCargoDiscoveryChance =
    INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

  return {
    restrictedItems,
    hiddenCargoDiscoveryChance,
    securityLevel: securityMultiplier,
    dangerZone,
    canAffordBribe: credits >= INSPECTION_CONFIG.BRIBE.COST,
  };
}

/**
 * Determine danger zone for a system (simplified version for UI)
 * This should match the logic in DangerManager.getDangerZone()
 *
 * @param {number} systemId - System ID
 * @returns {string} Danger zone classification
 */
function getDangerZoneForSystem(systemId) {
  // Safe systems
  if ([0, 1, 4].includes(systemId)) {
    return 'safe';
  }

  // Contested systems
  if ([7, 10].includes(systemId)) {
    return 'contested';
  }

  // For now, assume other systems are dangerous
  // In a full implementation, this would check distance from Sol
  return 'dangerous';
}

/**
 * Check if a good is restricted in a specific zone
 * This should match the logic in TradingManager.isGoodRestricted()
 *
 * @param {string} goodType - Commodity type
 * @param {string} dangerZone - Danger zone classification
 * @param {number} systemId - System ID
 * @returns {boolean} Whether the good is restricted
 */
function isGoodRestrictedInZone(goodType, dangerZone, systemId) {
  // Check zone-based restrictions
  const zoneRestricted =
    RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[dangerZone]?.includes(goodType) ||
    false;

  // Check core system restrictions
  const coreSystemRestricted =
    (systemId === 0 || systemId === 1) &&
    RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);

  return zoneRestricted || coreSystemRestricted;
}

/**
 * Get color for inspection severity display
 *
 * @param {string} severity - The inspection severity level
 * @returns {string} CSS color value
 */
function getInspectionSeverityColor(severity) {
  switch (severity) {
    case 'routine':
      return '#00ff88'; // Green - standard inspection
    case 'thorough':
      return '#ffaa00'; // Orange - detailed inspection
    case 'intensive':
      return '#ff6b6b'; // Red - comprehensive search
    default:
      return '#ffffff'; // White - unknown
  }
}

/**
 * Get security level name for display
 *
 * @param {number} securityLevel - Security level multiplier
 * @returns {string} Human-readable security level
 */
function getSecurityLevelName(securityLevel) {
  if (securityLevel >= 2.0) return 'Maximum';
  if (securityLevel >= 1.5) return 'High';
  if (securityLevel >= 1.0) return 'Standard';
  if (securityLevel >= 0.5) return 'Minimal';
  return 'Low';
}

/**
 * Get CSS class for reputation display based on value
 *
 * @param {number} reputation - Current reputation value
 * @returns {string} CSS class name
 */
function getReputationClass(reputation = 0) {
  if (reputation >= 60) return 'trusted';
  if (reputation >= 30) return 'friendly';
  if (reputation >= 10) return 'warm';
  if (reputation >= -10) return 'neutral';
  if (reputation >= -50) return 'cold';
  return 'hostile';
}

/**
 * Get reputation tier name for display
 *
 * @param {number} reputation - Current reputation value
 * @returns {string} Reputation tier name
 */
function getReputationTier(reputation = 0) {
  if (reputation >= 90) return 'Exemplary';
  if (reputation >= 60) return 'Trusted';
  if (reputation >= 30) return 'Respected';
  if (reputation >= 10) return 'Good Standing';
  if (reputation >= -10) return 'Neutral';
  if (reputation >= -50) return 'Suspicious';
  return 'Wanted';
}

/**
 * Format commodity names for display
 *
 * @param {string} commodityName - The commodity name
 * @returns {string} Formatted display name
 */
function formatCommodityName(commodityName) {
  if (!commodityName || typeof commodityName !== 'string') return 'Unknown';
  return commodityName.charAt(0).toUpperCase() + commodityName.slice(1);
}

/**
 * Get action button text based on selected option
 *
 * @param {string} optionName - The selected option name
 * @returns {string} Button text
 */
function getActionButtonText(optionName) {
  switch (optionName) {
    case 'cooperate':
      return 'Comply with Inspection';
    case 'bribe':
      return 'Offer Bribe';
    case 'flee':
      return 'Attempt to Flee';
    default:
      return 'Proceed';
  }
}
