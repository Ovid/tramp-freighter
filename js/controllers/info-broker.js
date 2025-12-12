'use strict';

import { INTELLIGENCE_CONFIG, COMMODITY_TYPES } from '../game-constants.js';
import { capitalizeFirst } from '../utils/string-utils.js';

/**
 * InfoBrokerPanelController - Manages the information broker panel
 *
 * Handles intelligence purchases, rumor generation, and market data display.
 * Provides tab switching between purchase interface and market data view.
 */
export class InfoBrokerPanelController {
  constructor(elements, gameStateManager, starData, informationBroker) {
    // Validate required elements
    if (!elements.infoBrokerPanel) {
      throw new Error(
        'InfoBrokerPanelController: infoBrokerPanel element required'
      );
    }
    if (!elements.infoBrokerSystemName) {
      throw new Error(
        'InfoBrokerPanelController: infoBrokerSystemName element required'
      );
    }
    if (!elements.buyRumorBtn) {
      throw new Error(
        'InfoBrokerPanelController: buyRumorBtn element required'
      );
    }
    if (!elements.rumorText) {
      throw new Error('InfoBrokerPanelController: rumorText element required');
    }
    if (!elements.intelligenceList) {
      throw new Error(
        'InfoBrokerPanelController: intelligenceList element required'
      );
    }
    if (!elements.infoBrokerValidationMessage) {
      throw new Error(
        'InfoBrokerPanelController: infoBrokerValidationMessage element required'
      );
    }
    if (!elements.purchaseTab) {
      throw new Error(
        'InfoBrokerPanelController: purchaseTab element required'
      );
    }
    if (!elements.marketDataTab) {
      throw new Error(
        'InfoBrokerPanelController: marketDataTab element required'
      );
    }
    if (!elements.purchaseIntelContent) {
      throw new Error(
        'InfoBrokerPanelController: purchaseIntelContent element required'
      );
    }
    if (!elements.marketDataContent) {
      throw new Error(
        'InfoBrokerPanelController: marketDataContent element required'
      );
    }
    if (!elements.marketDataList) {
      throw new Error(
        'InfoBrokerPanelController: marketDataList element required'
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;
    this.informationBroker = informationBroker;
  }

  show() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in InfoBrokerPanelController.show'
      );
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.elements.infoBrokerSystemName.textContent = system.name;

    // Clear previous rumor
    this.elements.rumorText.textContent = '';
    this.elements.rumorText.classList.remove('visible');

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Show purchase tab by default
    this.switchTab('purchase');

    // Update rumor button state
    this.updateRumorButton();

    // Render intelligence list
    this.refreshInfoBrokerPanel();

    this.elements.infoBrokerPanel.classList.add('visible');
  }

  hide() {
    this.elements.infoBrokerPanel.classList.remove('visible');
  }

  refreshInfoBrokerPanel() {
    this.renderIntelligenceList();
  }

  /**
   * Get intelligence priority for sorting
   *
   * Prioritizes systems where intelligence is most valuable:
   * never visited → stale → recent → current
   *
   * @param {Object} option - Intelligence option with lastVisit property
   * @returns {number} Priority value (lower = higher priority)
   */
  getIntelligencePriority(option) {
    if (option.lastVisit === null) return 0; // Never visited - highest priority
    if (option.lastVisit === 0) return 3; // Current - lowest priority (already have data)
    if (option.lastVisit > INTELLIGENCE_CONFIG.RECENT_THRESHOLD) return 1; // Stale
    return 2; // Recent
  }

  /**
   * Switch between purchase and market data tabs
   *
   * @param {string} tabName - 'purchase' or 'marketData'
   */
  switchTab(tabName) {
    if (tabName === 'purchase') {
      this.elements.purchaseTab.classList.add('active');
      this.elements.marketDataTab.classList.remove('active');
      this.elements.purchaseIntelContent.classList.add('active');
      this.elements.marketDataContent.classList.remove('active');
    } else if (tabName === 'marketData') {
      this.elements.purchaseTab.classList.remove('active');
      this.elements.marketDataTab.classList.add('active');
      this.elements.purchaseIntelContent.classList.remove('active');
      this.elements.marketDataContent.classList.add('active');

      // Render market data when tab is shown
      this.renderMarketData();
    }
  }

  updateRumorButton() {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

    this.elements.buyRumorBtn.disabled = credits < rumorCost;
  }

  handleBuyRumor() {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

    // Validate purchase
    if (credits < rumorCost) {
      this.elements.infoBrokerValidationMessage.textContent =
        'Insufficient credits for rumor';
      this.elements.infoBrokerValidationMessage.className =
        'validation-message error';
      return;
    }

    // Deduct credits
    this.gameStateManager.updateCredits(credits - rumorCost);

    // Generate and display rumor
    const rumor = this.gameStateManager.generateRumor();
    this.elements.rumorText.textContent = rumor;
    this.elements.rumorText.classList.add('visible');

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Update button state
    this.updateRumorButton();

    // Refresh intelligence list (credits changed)
    this.renderIntelligenceList();
  }

  renderIntelligenceList() {
    const state = this.gameStateManager.getState();
    this.elements.intelligenceList.replaceChildren();

    const credits = state.player.credits;

    // Get all systems with their intelligence costs
    const intelligenceOptions =
      this.gameStateManager.listAvailableIntelligence();

    // Sort by information freshness using hoisted priority function
    intelligenceOptions.sort(
      (a, b) =>
        this.getIntelligencePriority(a) - this.getIntelligencePriority(b)
    );

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    intelligenceOptions.forEach((option) => {
      const item = this.createIntelligenceItem(option, credits);
      fragment.appendChild(item);
    });
    this.elements.intelligenceList.appendChild(fragment);
  }

  createIntelligenceItem(option, credits) {
    const item = document.createElement('div');
    item.className = 'intelligence-item';

    const info = document.createElement('div');
    info.className = 'intelligence-info';

    const systemName = document.createElement('div');
    systemName.className = 'intelligence-system-name';
    systemName.textContent = option.systemName;

    const visitInfo = document.createElement('div');
    visitInfo.className = 'intelligence-visit-info';

    if (option.lastVisit === null) {
      visitInfo.textContent = 'Never visited';
    } else if (option.lastVisit === 0) {
      visitInfo.textContent = 'Current prices';
    } else if (option.lastVisit === 1) {
      visitInfo.textContent = 'Last visited 1 day ago';
    } else {
      visitInfo.textContent = `Last visited ${option.lastVisit} days ago`;
    }

    info.appendChild(systemName);
    info.appendChild(visitInfo);

    const actions = document.createElement('div');
    actions.className = 'intelligence-actions';

    const cost = document.createElement('div');
    cost.className = 'intelligence-cost';
    cost.textContent = `₡${option.cost}`;

    const buyBtn = document.createElement('button');
    buyBtn.className = 'info-broker-btn';
    buyBtn.textContent = 'Purchase';
    buyBtn.disabled = credits < option.cost || option.lastVisit === 0;

    if (option.lastVisit === 0) {
      buyBtn.textContent = 'Current';
    }

    buyBtn.addEventListener('click', () =>
      this.handlePurchaseIntelligence(option.systemId)
    );

    actions.appendChild(cost);
    actions.appendChild(buyBtn);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  handlePurchaseIntelligence(systemId) {
    const intelligenceOutcome =
      this.gameStateManager.purchaseIntelligence(systemId);

    if (!intelligenceOutcome.success) {
      this.elements.infoBrokerValidationMessage.textContent =
        intelligenceOutcome.reason;
      this.elements.infoBrokerValidationMessage.className =
        'validation-message error';
      return;
    }

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Refresh the panel to show updated state
    this.updateRumorButton();
    this.renderIntelligenceList();

    // Return success for UIManager to show notification
    return intelligenceOutcome;
  }

  renderMarketData() {
    const state = this.gameStateManager.getState();
    const priceKnowledge = state.world.priceKnowledge || {};

    this.elements.marketDataList.replaceChildren();

    // Get all systems with known prices
    const knownSystems = Object.keys(priceKnowledge).map(Number);

    if (knownSystems.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'market-data-empty';
      emptyMsg.textContent =
        'No market data available. Purchase intelligence or visit systems to gather price information.';
      this.elements.marketDataList.appendChild(emptyMsg);
      return;
    }

    // Sort by staleness (current first, then recent, then stale)
    knownSystems.sort((a, b) => {
      const aLastVisit = priceKnowledge[a].lastVisit;
      const bLastVisit = priceKnowledge[b].lastVisit;
      return aLastVisit - bLastVisit;
    });

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    knownSystems.forEach((systemId) => {
      const system = this.starData.find((s) => s.id === systemId);
      if (!system) return;

      const knowledge = priceKnowledge[systemId];
      const marketDataItem = this.createMarketDataItem(system, knowledge);
      fragment.appendChild(marketDataItem);
    });
    this.elements.marketDataList.appendChild(fragment);
  }

  createMarketDataItem(system, knowledge) {
    const container = document.createElement('div');
    container.className = 'market-data-system';

    // Header with system name and staleness
    const header = document.createElement('div');
    header.className = 'market-data-header';

    const systemName = document.createElement('div');
    systemName.className = 'market-data-system-name';
    systemName.textContent = system.name;

    const staleness = document.createElement('div');
    staleness.className = 'market-data-staleness';

    const stalenessInfo = this.formatStaleness(knowledge.lastVisit);
    staleness.textContent = stalenessInfo.text;
    if (stalenessInfo.cssClass) {
      staleness.classList.add(stalenessInfo.cssClass);
    }

    header.appendChild(systemName);
    header.appendChild(staleness);

    // Prices grid
    const pricesGrid = document.createElement('div');
    pricesGrid.className = 'market-data-prices';

    COMMODITY_TYPES.forEach((commodity) => {
      const priceItem = document.createElement('div');
      priceItem.className = 'market-data-price-item';

      const commodityName = document.createElement('span');
      commodityName.className = 'market-data-commodity';
      commodityName.textContent = capitalizeFirst(commodity);

      const price = document.createElement('span');
      price.className = 'market-data-price';
      price.textContent = `₡${knowledge.prices[commodity]}`;

      priceItem.appendChild(commodityName);
      priceItem.appendChild(price);
      pricesGrid.appendChild(priceItem);
    });

    container.appendChild(header);
    container.appendChild(pricesGrid);

    return container;
  }

  /**
   * Format staleness information for price knowledge display
   *
   * Converts lastVisit days into human-readable text with appropriate CSS class.
   * Centralizes staleness display logic to ensure consistency across UI.
   *
   * @param {number} lastVisit - Days since last visit (0 = current)
   * @returns {Object} { text: string, cssClass: string }
   */
  formatStaleness(lastVisit) {
    if (lastVisit === 0) {
      return { text: 'Current', cssClass: '' };
    } else if (lastVisit === 1) {
      return { text: '1 day old', cssClass: '' };
    } else if (lastVisit <= 10) {
      return { text: `${lastVisit} days old`, cssClass: '' };
    } else if (lastVisit <= 30) {
      return { text: `${lastVisit} days old`, cssClass: 'stale' };
    } else {
      return { text: `${lastVisit} days old`, cssClass: 'very-stale' };
    }
  }
}
