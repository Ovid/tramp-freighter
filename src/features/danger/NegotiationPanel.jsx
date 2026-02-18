import { useState, useMemo } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { NEGOTIATION_CONFIG, KARMA_CONFIG } from '../../game/constants.js';

/**
 * NegotiationPanel - React component for pirate negotiation resolution
 *
 * Displays contextual dialogue options with conditional options (medicine claim, intel offer).
 * Shows success probabilities and consequences for each negotiation choice.
 * Provides clear feedback on potential outcomes and karma/reputation effects.
 *
 * Architecture: danger-system
 * Validates: Requirements 4.1, 4.5, 4.8, 4.11, 12.1, 12.5
 *
 * @param {Object} props
 * @param {Object} props.encounter - The pirate encounter object
 * @param {Function} props.onChoice - Callback when player makes a negotiation choice
 * @param {Function} props.onClose - Callback to close the panel
 */
export function NegotiationPanel({ encounter, onChoice, onClose }) {
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to relevant game events for negotiation context
  const cargo = useGameEvent('cargoChanged');
  const karma = useGameEvent('karmaChanged');
  const factions = useGameEvent('factionRepChanged');
  const intelligence = useGameEvent('intelligenceChanged');

  // Local state for selected negotiation option
  const [selectedOption, setSelectedOption] = useState(null);

  // Calculate success probabilities for negotiation options
  const negotiationAnalysis = useMemo(
    () =>
      calculateNegotiationProbabilities(encounter, cargo, karma, intelligence),
    [encounter, cargo, karma, intelligence]
  );

  // Check for conditional options availability
  const hasMedicine = cargo?.some((item) => item.good === 'medicine') || false;
  const hasIntelligence = intelligence && Object.keys(intelligence).length > 0;

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

  // Determine negotiation context for display
  const demandPercent = encounter.demandPercent || 20;
  const pirateDescription =
    encounter.description ||
    `The pirates are demanding ${demandPercent}% of your cargo as tribute.`;

  return (
    <div id="negotiation-panel" className="panel-base visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>Negotiation</h2>

      <div className="negotiation-content">
        {/* Negotiation Context Section */}
        <div className="negotiation-section context-section">
          <h3>Situation</h3>
          <div className="context-info">
            <div className="pirate-demand">
              <span className="demand-label">Pirate Demand:</span>
              <span className="demand-value">{demandPercent}% of cargo</span>
            </div>
            <div className="situation-description">{pirateDescription}</div>
            <div className="negotiation-prompt">
              "Perhaps we can come to a more... reasonable arrangement?"
            </div>
          </div>
        </div>

        {/* Player Status Section */}
        <div className="negotiation-section status-section">
          <h3>Your Position</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Cargo Value:</span>
              <span className="status-value">
                ₡{calculateCargoValue(cargo).toLocaleString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Karma:</span>
              <span className={`status-value ${getKarmaClass(karma)}`}>
                {karma > 0 ? '+' : ''}
                {karma || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Outlaw Standing:</span>
              <span
                className={`status-value ${getReputationClass(factions?.outlaws)}`}
              >
                {getReputationTier(factions?.outlaws || 0)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Available Intel:</span>
              <span className="status-value">
                {hasIntelligence ? 'Yes' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Negotiation Options Section */}
        <div className="negotiation-section options-section">
          <h3>Dialogue Options</h3>
          <div className="options-list">
            {/* Counter-Proposal Option */}
            <div
              className={`negotiation-option ${selectedOption === 'counter_proposal' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('counter_proposal')}
            >
              <div className="option-header">
                <span className="option-name">Counter-Proposal</span>
                <span className="option-type">Bargaining</span>
              </div>
              <div className="option-dialogue">
                "Look, I understand you need to make a living, but that's a
                steep price. How about we settle for something more reasonable?"
              </div>
              <div className="option-analysis">
                <div className="probability-display">
                  <span className="prob-label">Success Chance:</span>
                  <span className="prob-value">
                    {Math.round(
                      negotiationAnalysis.counterProposal.finalChance * 100
                    )}
                    %
                  </span>
                </div>
                {negotiationAnalysis.counterProposal.modifiers.map((mod) => (
                  <div
                    key={mod.name}
                    className={`modifier-display ${mod.type}`}
                  >
                    <span className="modifier-label">{mod.name}:</span>
                    <span className="modifier-value">
                      {mod.value > 0 ? '+' : ''}
                      {Math.round(mod.value * 100)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="option-outcomes">
                <div className="outcome success">
                  <span className="outcome-label">Success:</span>
                  <span className="outcome-text">
                    Pay only{' '}
                    {NEGOTIATION_CONFIG.COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT}%
                    of cargo instead of {demandPercent}%
                  </span>
                </div>
                <div className="outcome failure">
                  <span className="outcome-label">Failure:</span>
                  <span className="outcome-text">
                    Pirates become more aggressive (+
                    {Math.round(
                      NEGOTIATION_CONFIG.COUNTER_PROPOSAL
                        .FAILURE_STRENGTH_INCREASE * 100
                    )}
                    % threat), combat likely
                  </span>
                </div>
              </div>
            </div>

            {/* Medicine Claim Option - Only if player has medicine */}
            {hasMedicine && (
              <div
                className={`negotiation-option conditional ${selectedOption === 'medicine_claim' ? 'selected' : ''}`}
                onClick={() => handleOptionSelect('medicine_claim')}
              >
                <div className="option-header">
                  <span className="option-name">Medicine Claim</span>
                  <span className="option-type">Humanitarian</span>
                </div>
                <div className="option-dialogue">
                  "Wait! I'm carrying medical supplies for civilians in the
                  outer systems. People will die if these don't get through."
                </div>
                <div className="option-analysis">
                  <div className="probability-display">
                    <span className="prob-label">Sympathy Chance:</span>
                    <span className="prob-value">
                      {Math.round(
                        negotiationAnalysis.medicineClaim.finalChance * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="conditional-note">
                    <span className="condition-label">Requires:</span>
                    <span className="condition-text">Medicine in cargo</span>
                  </div>
                </div>
                <div className="option-outcomes">
                  <div className="outcome success">
                    <span className="outcome-label">Success:</span>
                    <span className="outcome-text">
                      Pirates show sympathy, allow free passage
                    </span>
                  </div>
                  <div className="outcome failure">
                    <span className="outcome-label">Failure:</span>
                    <span className="outcome-text">
                      Pirates don't believe you, demand original tribute
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Intel Offer Option - Only if player has intelligence */}
            {hasIntelligence && (
              <div
                className={`negotiation-option conditional ${selectedOption === 'intel_offer' ? 'selected' : ''}`}
                onClick={() => handleOptionSelect('intel_offer')}
              >
                <div className="option-header">
                  <span className="option-name">Intelligence Offer</span>
                  <span className="option-type">Information</span>
                </div>
                <div className="option-dialogue">
                  "I might have information about other ships in the area...
                  valuable cargo routes, if you're interested in a trade."
                </div>
                <div className="option-analysis">
                  <div className="probability-display">
                    <span className="prob-label">Acceptance Chance:</span>
                    <span className="prob-value">
                      {Math.round(
                        NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="conditional-note">
                    <span className="condition-label">Requires:</span>
                    <span className="condition-text">
                      Market intelligence data
                    </span>
                  </div>
                </div>
                <div className="option-outcomes">
                  <div className="outcome success">
                    <span className="outcome-label">Success:</span>
                    <span className="outcome-text">
                      Pirates accept intel, allow passage, +
                      {NEGOTIATION_CONFIG.INTEL_OFFER.OUTLAW_REP_GAIN} outlaw
                      reputation
                    </span>
                  </div>
                  <div className="outcome failure">
                    <span className="outcome-label">Failure:</span>
                    <span className="outcome-text">
                      Pirates suspicious of intel quality, +
                      {Math.round(
                        NEGOTIATION_CONFIG.INTEL_OFFER
                          .SUSPICIOUS_STRENGTH_INCREASE * 100
                      )}
                      % threat
                    </span>
                  </div>
                  <div className="outcome warning">
                    <span className="outcome-label">Risk:</span>
                    <span className="outcome-text">
                      If discovered later:{' '}
                      {NEGOTIATION_CONFIG.INTEL_OFFER.SUCCESS_REP_PENALTY}{' '}
                      reputation with authorities
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Accept Demand Option */}
            <div
              className={`negotiation-option ${selectedOption === 'accept_demand' ? 'selected' : ''}`}
              onClick={() => handleOptionSelect('accept_demand')}
            >
              <div className="option-header">
                <span className="option-name">Accept Demand</span>
                <span className="option-type">Compliance</span>
              </div>
              <div className="option-dialogue">
                "Alright, you've got me. I'll pay your tribute. Just let me get
                on with my business."
              </div>
              <div className="option-analysis">
                <div className="probability-display guaranteed">
                  <span className="prob-label">Success Rate:</span>
                  <span className="prob-value guaranteed">100%</span>
                </div>
              </div>
              <div className="option-outcomes">
                <div className="outcome guaranteed">
                  <span className="outcome-label">Guaranteed:</span>
                  <span className="outcome-text">
                    Pay {NEGOTIATION_CONFIG.ACCEPT_DEMAND.CARGO_PERCENT}% of
                    cargo, safe passage
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="negotiation-actions">
          {selectedOption && (
            <>
              <button
                className="negotiation-btn primary"
                onClick={handleConfirm}
              >
                Say: "{getOptionDialogue(selectedOption)}"
              </button>
              <button
                className="negotiation-btn secondary"
                onClick={handleCancel}
              >
                Reconsider
              </button>
            </>
          )}
          {!selectedOption && (
            <div className="selection-prompt">
              Choose your words carefully - your life may depend on it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate success probabilities for negotiation options
 *
 * @param {Object} encounter - The pirate encounter
 * @param {Array} cargo - Current cargo
 * @param {number} karma - Current karma value
 * @param {Object} intelligence - Available intelligence data
 * @returns {Object} Analysis for each negotiation option
 */
function calculateNegotiationProbabilities(
  encounter,
  cargo = [],
  karma = 0,
  intelligence = {}
) {
  // Calculate karma modifier
  const karmaModifier = karma * (KARMA_CONFIG.SUCCESS_RATE_SCALE || 0.0005);

  // Counter-proposal analysis
  const counterProposalModifiers = [];
  let counterProposalChance = NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    counterProposalChance += karmaModifier;
    counterProposalModifiers.push({
      name: karma > 0 ? 'Good Karma' : 'Bad Karma',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  counterProposalChance = Math.max(0, Math.min(1, counterProposalChance));

  // Medicine claim analysis
  const medicineClaimModifiers = [];
  let medicineClaimChance = NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE;

  // Apply karma modifier
  if (Math.abs(karmaModifier) > 0.001) {
    medicineClaimChance += karmaModifier;
    medicineClaimModifiers.push({
      name: karma > 0 ? 'Good Karma' : 'Bad Karma',
      value: karmaModifier,
      type: karma > 0 ? 'bonus' : 'penalty',
    });
  }

  medicineClaimChance = Math.max(0, Math.min(1, medicineClaimChance));

  return {
    counterProposal: {
      finalChance: counterProposalChance,
      modifiers: counterProposalModifiers,
    },
    medicineClaim: {
      finalChance: medicineClaimChance,
      modifiers: medicineClaimModifiers,
    },
  };
}

/**
 * Calculate total cargo value for display
 *
 * @param {Array} cargo - Current cargo array
 * @returns {number} Total cargo value in credits
 */
function calculateCargoValue(cargo) {
  if (!cargo || cargo.length === 0) return 0;
  return cargo.reduce((total, item) => {
    // Estimate value based on quantity and typical prices
    const estimatedPrice = getEstimatedPrice(item.good);
    return total + (item.qty || 0) * estimatedPrice;
  }, 0);
}

/**
 * Get estimated price for a commodity (simplified for display)
 *
 * @param {string} good - Commodity type
 * @returns {number} Estimated price per unit
 */
function getEstimatedPrice(good) {
  const basePrices = {
    grain: 10,
    ore: 15,
    tritium: 50,
    parts: 30,
    medicine: 40,
    electronics: 35,
  };
  return basePrices[good] || 20;
}

/**
 * Get CSS class for karma display based on value
 *
 * @param {number} karma - Current karma value
 * @returns {string} CSS class name
 */
function getKarmaClass(karma = 0) {
  if (karma >= 50) return 'very-good';
  if (karma >= 20) return 'good';
  if (karma >= -20) return 'neutral';
  if (karma >= -50) return 'bad';
  return 'very-bad';
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
  if (reputation >= 90) return 'Family';
  if (reputation >= 60) return 'Trusted';
  if (reputation >= 30) return 'Friendly';
  if (reputation >= 10) return 'Warm';
  if (reputation >= -10) return 'Neutral';
  if (reputation >= -50) return 'Cold';
  return 'Hostile';
}

/**
 * Get shortened dialogue text for button display
 *
 * @param {string} optionName - The selected option name
 * @returns {string} Shortened dialogue for button
 */
function getOptionDialogue(optionName) {
  switch (optionName) {
    case 'counter_proposal':
      return 'How about something more reasonable?';
    case 'medicine_claim':
      return "I'm carrying medical supplies...";
    case 'intel_offer':
      return 'I have information you might want...';
    case 'accept_demand':
      return "Alright, you've got me.";
    default:
      return 'Continue negotiation';
  }
}
