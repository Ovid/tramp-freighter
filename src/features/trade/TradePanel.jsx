import { useState, useEffect, useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import {
  COMMODITY_TYPES,
  TRADE_CONFIG,
  SHIP_CONFIG,
  UI_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';
import {
  capitalizeFirst,
  formatCargoDisplayName,
} from '../../game/utils/string-utils.js';
import {
  validateBuy,
  calculateMaxBuyQuantity,
  calculateProfit,
  formatCargoAge,
} from './tradeUtils';

/**
 * TradePanel - React component for trading goods at stations
 *
 * Displays market goods with current prices and cargo stacks with profit calculations.
 * Handles buy/sell transactions through GameStateManager.
 *
 * Architecture: react-migration
 * Validates: Requirements 8.1, 26.1, 26.2, 26.3, 26.5
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function TradePanel({ onClose }) {
  const starData = useStarData();

  // Subscribe to relevant game events
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const currentDay = useGameEvent(EVENT_NAMES.TIME_CHANGED);
  const cargoCapacity = useGameEvent(EVENT_NAMES.CARGO_CAPACITY_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const hiddenCargo = useGameEvent(EVENT_NAMES.HIDDEN_CARGO_CHANGED);
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);

  // Get game actions
  const {
    buyGood,
    sellGood,
    moveToHiddenCargo,
    moveToRegularCargo,
    recordVisitedPrices,
    getCurrentSystemPrices,
  } = useGameAction();

  // Update price knowledge when panel opens (records "Visited" data)
  useEffect(() => {
    recordVisitedPrices();
  }, [recordVisitedPrices]);

  // Get current system
  const system = starData.find((s) => s.id === currentSystemId);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Use Bridge Pattern events exclusively - no direct state access
  // Use centralized defaults to handle cases where events haven't fired yet
  const safeCargoCapacity =
    cargoCapacity ?? UI_CONFIG.DEFAULT_VALUES.CARGO_CAPACITY;
  const safeUpgrades = upgrades ?? [];
  const safeHiddenCargo = hiddenCargo ?? [];
  const safeCargo = cargo ?? [];

  // Calculate cargo capacity including passenger space
  const tradeCargoUsed = safeCargo.reduce((sum, stack) => sum + stack.qty, 0);

  const passengerSpace = useMemo(() => {
    if (!missions || !missions.active) return 0;
    return missions.active
      .filter((m) => m.type === 'passenger' && m.requirements?.cargoSpace)
      .reduce((sum, m) => sum + m.requirements.cargoSpace, 0);
  }, [missions]);

  const cargoUsed = tradeCargoUsed + passengerSpace;
  const cargoRemaining = safeCargoCapacity - cargoUsed;

  // Check for Smuggler's Panels upgrade
  const hasSmugglersPanel = safeUpgrades.includes('smuggler_panels');
  const hiddenCargoUsed = safeHiddenCargo.reduce(
    (sum, stack) => sum + stack.qty,
    0
  );
  const hiddenCargoCapacity = hasSmugglersPanel
    ? SHIP_CONFIG.UPGRADES.smuggler_panels.effects.hiddenCargoCapacity
    : 0;

  // Local state for hidden cargo section toggle
  const [hiddenCargoCollapsed, setHiddenCargoCollapsed] = useState(false);

  // Sale feedback message (e.g., Cole's withholding notice)
  // Persists until the next sale or panel close — no auto-dismiss timer
  const [saleFeedback, setSaleFeedback] = useState(null);

  // Get locked prices for current system (prevents intra-system arbitrage)
  const currentSystemPrices = getCurrentSystemPrices();

  // Create state object for validation functions using Bridge Pattern data
  const state = {
    player: { credits },
    ship: {
      cargo: safeCargo,
      cargoCapacity: safeCargoCapacity,
      upgrades: safeUpgrades,
    },
    missions: missions || { active: [] },
  };

  const handleBuyGood = (goodType, quantity, price) => {
    const purchaseOutcome = buyGood(goodType, quantity, price);

    if (!purchaseOutcome.success) {
      throw new Error(`Purchase failed: ${purchaseOutcome.reason}`);
    }
  };

  const handleSellStack = (stackIndex, quantity, salePrice) => {
    const saleOutcome = sellGood(stackIndex, quantity, salePrice);

    if (!saleOutcome.success) {
      throw new Error(`Sale failed: ${saleOutcome.reason}`);
    }

    if (saleOutcome.withheld > 0) {
      setSaleFeedback(
        `Revenue: ₡${saleOutcome.totalRevenue.toLocaleString()} · Cole's cut: -₡${saleOutcome.withheld.toLocaleString()} · You receive: ₡${saleOutcome.playerReceives.toLocaleString()}`
      );
    }
  };

  const handleMoveToHidden = (goodType, quantity) => {
    const result = moveToHiddenCargo(goodType, quantity);

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.reason}`);
    }
  };

  const handleMoveToRegular = (goodType, quantity) => {
    const result = moveToRegularCargo(goodType, quantity);

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.reason}`);
    }
  };

  return (
    <div id="trade-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2>
        Trade - <span id="trade-system-name">{system.name}</span>
      </h2>

      <div className="trade-content">
        {/* Market Goods Section */}
        <div className="trade-section">
          <h3>Market Goods</h3>
          <div id="market-goods" className="goods-list">
            {COMMODITY_TYPES.map((goodType) => {
              const price = currentSystemPrices[goodType];

              const maxQuantity = calculateMaxBuyQuantity(price, state);
              const validation = validateBuy(goodType, 1, price, state);

              return (
                <div key={goodType} className="good-item">
                  <div className="good-info">
                    <div className="good-name">{capitalizeFirst(goodType)}</div>
                    <div className="good-price">{price} cr/unit</div>
                  </div>

                  <div className="good-actions">
                    <button
                      className="buy-btn"
                      disabled={credits < price || cargoRemaining < 1}
                      onClick={() => handleBuyGood(goodType, 1, price)}
                    >
                      Buy 1
                    </button>
                    <button
                      className="buy-btn"
                      disabled={
                        credits < price * TRADE_CONFIG.QUICK_BUY_QUANTITY ||
                        cargoRemaining < TRADE_CONFIG.QUICK_BUY_QUANTITY
                      }
                      onClick={() =>
                        handleBuyGood(
                          goodType,
                          TRADE_CONFIG.QUICK_BUY_QUANTITY,
                          price
                        )
                      }
                    >
                      Buy {TRADE_CONFIG.QUICK_BUY_QUANTITY}
                    </button>
                    <button
                      className="buy-btn"
                      disabled={maxQuantity < 1}
                      onClick={() =>
                        handleBuyGood(goodType, maxQuantity, price)
                      }
                    >
                      Buy Max
                    </button>
                  </div>

                  <div
                    className={`validation-message ${
                      !validation.valid ? 'error' : ''
                    }`}
                  >
                    {!validation.valid && validation.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cargo Section */}
        <div className="trade-section">
          <h3>Your Cargo</h3>
          <div className="cargo-capacity-display">
            <span className="capacity-label">Capacity:</span>
            <span id="trade-cargo-used">{cargoUsed}</span> /
            <span id="trade-cargo-capacity">{safeCargoCapacity}</span>
            <span className="capacity-remaining">
              (<span id="trade-cargo-remaining">{cargoRemaining}</span>{' '}
              remaining)
            </span>
          </div>
          {saleFeedback && (
            <div className="validation-message warning">{saleFeedback}</div>
          )}
          <div id="cargo-stacks" className="cargo-list">
            {safeCargo.length === 0 ? (
              <div className="cargo-empty">No cargo</div>
            ) : (
              safeCargo.map((stack, index) => {
                const currentPrice = currentSystemPrices[stack.good];
                const profit = calculateProfit(stack, currentPrice);

                let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.buyPrice} cr/unit`;

                if (
                  stack.buySystem !== undefined &&
                  stack.buyDate !== undefined
                ) {
                  const purchaseSystem = starData.find(
                    (s) => s.id === stack.buySystem
                  );
                  if (!purchaseSystem) {
                    throw new Error(
                      `Invalid cargo stack: purchase system ID ${stack.buySystem} not found in star data`
                    );
                  }

                  const ageText = formatCargoAge(currentDay, stack.buyDate);
                  detailsText += ` in ${purchaseSystem.name} (${ageText})`;
                }

                let profitText = '';
                if (profit.direction === 'positive') {
                  profitText = `Sell at: ${currentPrice} cr/unit | Profit: +${profit.margin} cr/unit (+${profit.percentage}%)`;
                } else if (profit.direction === 'negative') {
                  profitText = `Sell at: ${currentPrice} cr/unit | Loss: ${profit.margin} cr/unit (${profit.percentage}%)`;
                } else {
                  profitText = `Sell at: ${currentPrice} cr/unit | Break even`;
                }

                return (
                  <div key={index} className="cargo-stack">
                    <div className="stack-info">
                      <div className="stack-name">
                        {formatCargoDisplayName(stack.good)}
                      </div>
                      <div className="stack-details">{detailsText}</div>
                      {!stack.missionId && (
                        <div className={`stack-profit ${profit.direction}`}>
                          {profitText}
                        </div>
                      )}
                    </div>

                    {stack.missionId ? (
                      <div className="stack-actions">
                        <span className="mission-cargo-label">
                          Mission Cargo
                        </span>
                      </div>
                    ) : (
                      <div className="stack-actions">
                        <button
                          className="sell-btn"
                          disabled={stack.qty < 1}
                          onClick={() =>
                            handleSellStack(index, 1, currentPrice)
                          }
                        >
                          Sell 1
                        </button>
                        <button
                          className="sell-btn"
                          onClick={() =>
                            handleSellStack(index, stack.qty, currentPrice)
                          }
                        >
                          Sell All ({stack.qty})
                        </button>
                        {hasSmugglersPanel && (
                          <button
                            className="transfer-btn"
                            onClick={() =>
                              handleMoveToHidden(stack.good, stack.qty)
                            }
                          >
                            Move to Hidden
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hidden Cargo Section */}
        {hasSmugglersPanel && (
          <div
            id="hidden-cargo-section"
            className="trade-section hidden-cargo-section"
          >
            <div className="hidden-cargo-header">
              <h3>Hidden Cargo</h3>
              <button
                id="toggle-hidden-cargo-btn"
                className="toggle-hidden-cargo-btn"
                onClick={() => setHiddenCargoCollapsed(!hiddenCargoCollapsed)}
              >
                {hiddenCargoCollapsed ? 'Show' : 'Hide'}
              </button>
            </div>
            <div
              id="hidden-cargo-content"
              className={`hidden-cargo-content ${
                hiddenCargoCollapsed ? 'collapsed' : ''
              }`}
            >
              <div className="cargo-capacity-display">
                <span className="capacity-label">Hidden Capacity:</span>
                <span id="hidden-cargo-used">{hiddenCargoUsed}</span> /
                <span id="hidden-cargo-capacity">{hiddenCargoCapacity}</span>
                <span className="capacity-units">units</span>
              </div>
              <div id="hidden-cargo-stacks" className="cargo-list">
                {safeHiddenCargo.length === 0 ? (
                  <div className="cargo-empty">No hidden cargo</div>
                ) : (
                  safeHiddenCargo.map((stack, index) => {
                    const currentPrice = currentSystemPrices[stack.good];
                    const profit = calculateProfit(stack, currentPrice);

                    let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.buyPrice} cr/unit`;

                    if (
                      stack.buySystem !== undefined &&
                      stack.buyDate !== undefined
                    ) {
                      const purchaseSystem = starData.find(
                        (s) => s.id === stack.buySystem
                      );
                      if (!purchaseSystem) {
                        throw new Error(
                          `Invalid hidden cargo stack: purchase system ID ${stack.buySystem} not found in star data`
                        );
                      }

                      const ageText = formatCargoAge(currentDay, stack.buyDate);
                      detailsText += ` in ${purchaseSystem.name} (${ageText})`;
                    }

                    let profitText = '';
                    if (profit.direction === 'positive') {
                      profitText = `Sell at: ${currentPrice} cr/unit | Profit: +${profit.margin} cr/unit (+${profit.percentage}%)`;
                    } else if (profit.direction === 'negative') {
                      profitText = `Sell at: ${currentPrice} cr/unit | Loss: ${profit.margin} cr/unit (${profit.percentage}%)`;
                    } else {
                      profitText = `Sell at: ${currentPrice} cr/unit | Break even`;
                    }

                    return (
                      <div key={index} className="cargo-stack">
                        <div className="stack-info">
                          <div className="stack-name">
                            {formatCargoDisplayName(stack.good)}
                          </div>
                          <div className="stack-details">{detailsText}</div>
                          {!stack.missionId && (
                            <div className={`stack-profit ${profit.direction}`}>
                              {profitText}
                            </div>
                          )}
                        </div>

                        <div className="stack-actions">
                          <button
                            className="transfer-btn"
                            onClick={() =>
                              handleMoveToRegular(stack.good, stack.qty)
                            }
                          >
                            Move to Regular
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
