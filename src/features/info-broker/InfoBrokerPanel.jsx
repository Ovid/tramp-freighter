import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import {
  validateIntelligencePurchase,
  validateRumorPurchase,
  sortIntelligenceByPriority,
  formatVisitInfo,
  formatStaleness,
  formatSource,
  getKnownSystemsSortedByStaleness,
} from './infoBrokerUtils';
import { INTELLIGENCE_CONFIG, COMMODITY_TYPES } from '../../game/constants';
import { capitalizeFirst } from '../../game/utils/string-utils';

/**
 * InfoBrokerPanel component for purchasing market intelligence.
 *
 * Provides two tabs:
 * - Purchase Intelligence: Buy rumors and system price data
 * - Market Data: View known market prices sorted by staleness
 *
 * React Migration Spec: Requirements 8.5
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element} Information broker panel component
 */
export function InfoBrokerPanel({ onClose }) {
  const gameStateManager = useGameState();
  const credits = useGameEvent('creditsChanged');
  const currentSystemId = useGameEvent('locationChanged');
  const priceKnowledge = useGameEvent('priceKnowledgeChanged');
  const { purchaseIntelligence } = useGameAction();

  const [activeTab, setActiveTab] = useState('purchase');
  const [rumor, setRumor] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');

  const currentSystem = gameStateManager.starData.find(
    (s) => s.id === currentSystemId
  );

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Get available intelligence options
  const intelligenceOptions = gameStateManager.listAvailableIntelligence();
  const sortedIntelligence = sortIntelligenceByPriority(intelligenceOptions);

  const handleBuyRumor = () => {
    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;
    const validation = validateRumorPurchase(credits);

    if (!validation.valid) {
      setValidationMessage(validation.reason);
      setValidationClass('error');
      return;
    }

    // Deduct credits
    gameStateManager.updateCredits(credits - rumorCost);

    // Generate and display rumor
    const generatedRumor = gameStateManager.generateRumor();
    setRumor(generatedRumor);

    // Clear validation message
    setValidationMessage('');
    setValidationClass('');
  };

  const handlePurchaseIntelligence = (systemId) => {
    const intelligenceOutcome = purchaseIntelligence(systemId);

    if (!intelligenceOutcome.success) {
      setValidationMessage(intelligenceOutcome.reason);
      setValidationClass('error');
      return;
    }

    // Clear validation message
    setValidationMessage('');
    setValidationClass('');
  };

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    // Clear validation message when switching tabs
    setValidationMessage('');
    setValidationClass('');
  };

  const renderIntelligenceItem = (option) => {
    const validation = validateIntelligencePurchase(option.cost, credits);
    const isCurrentSystem = option.lastVisit === 0;

    return (
      <div key={option.systemId} className="intelligence-item">
        <div className="intelligence-info">
          <div className="intelligence-system-name">{option.systemName}</div>
          <div className="intelligence-visit-info">
            {formatVisitInfo(option.lastVisit)}
          </div>
        </div>
        <div className="intelligence-actions">
          <div className="intelligence-cost">₡{option.cost}</div>
          <button
            className="info-broker-btn"
            onClick={() => handlePurchaseIntelligence(option.systemId)}
            disabled={!validation.valid || isCurrentSystem}
          >
            {isCurrentSystem ? 'Current' : 'Purchase'}
          </button>
        </div>
      </div>
    );
  };

  const renderMarketData = () => {
    const knownSystems = getKnownSystemsSortedByStaleness(
      priceKnowledge || {},
      gameStateManager.starData
    );

    if (knownSystems.length === 0) {
      return (
        <div className="market-data-empty">
          No market data available. Purchase intelligence or visit systems to
          gather price information.
        </div>
      );
    }

    return knownSystems.map(({ system, knowledge }) => (
      <div key={system.id} className="market-data-system">
        <div className="market-data-header">
          <div className="market-data-system-name">{system.name}</div>
          <div className="market-data-meta">
            <div className="market-data-source">
              {formatSource(knowledge.source)}
            </div>
            <div
              className={`market-data-staleness ${formatStaleness(knowledge.lastVisit).cssClass}`}
            >
              {formatStaleness(knowledge.lastVisit).text}
            </div>
          </div>
        </div>
        <div className="market-data-prices">
          {COMMODITY_TYPES.map((commodity) => (
            <div key={commodity} className="market-data-price-item">
              <span className="market-data-commodity">
                {capitalizeFirst(commodity)}
              </span>
              <span className="market-data-price">
                ₡{knowledge.prices[commodity]}
              </span>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;
  const rumorValidation = validateRumorPurchase(credits);

  return (
    <div id="info-broker-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>
        Information Broker - <span>{currentSystem.name}</span>
      </h2>

      {/* Tab Navigation */}
      <div className="info-broker-tabs">
        <button
          className={`info-broker-tab ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('purchase')}
        >
          Purchase Intelligence
        </button>
        <button
          className={`info-broker-tab ${activeTab === 'marketData' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('marketData')}
        >
          Market Data
        </button>
      </div>

      {/* Purchase Intelligence Tab */}
      {activeTab === 'purchase' && (
        <div className="info-broker-content active">
          {/* Rumor Section */}
          <div className="rumor-section">
            <h3>Market Rumors</h3>
            <p className="rumor-description">
              Buy a rumor for hints about market conditions and opportunities.
            </p>
            <div className="rumor-purchase">
              <button
                id="buy-rumor-btn"
                className="info-broker-btn"
                onClick={handleBuyRumor}
                disabled={!rumorValidation.valid}
              >
                Buy Rumor (₡{rumorCost})
              </button>
            </div>
            {rumor && (
              <div id="rumor-text" className="rumor-text visible">
                {rumor}
              </div>
            )}
          </div>

          {/* Intelligence List */}
          <div className="intelligence-section">
            <h3>System Intelligence</h3>
            <p className="intelligence-description">
              Purchase current market prices for connected systems.
            </p>
            <div id="intelligence-list" className="intelligence-list">
              {sortedIntelligence.length === 0 ? (
                <div className="intelligence-empty">
                  No systems available for intelligence purchase.
                </div>
              ) : (
                sortedIntelligence.map(renderIntelligenceItem)
              )}
            </div>
          </div>

          {/* Validation Message */}
          {validationMessage && (
            <div
              id="info-broker-validation-message"
              className={`validation-message ${validationClass}`}
            >
              {validationMessage}
            </div>
          )}
        </div>
      )}

      {/* Market Data Tab */}
      {activeTab === 'marketData' && (
        <div className="info-broker-content active">
          <div className="market-data-section">
            <h3>Known Market Prices</h3>
            <div id="market-data-list" className="market-data-list">
              {renderMarketData()}
            </div>
          </div>
        </div>
      )}

      <div className="info-broker-actions">
        <button className="station-btn secondary" onClick={onClose}>
          Back to Station
        </button>
      </div>
    </div>
  );
}
