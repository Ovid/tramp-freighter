import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { TradingSystem } from '../../game/game-trading.js';
import {
  COMMODITY_TYPES,
  TRADE_CONFIG,
  SHIP_CONFIG,
} from '../../game/constants.js';
import { capitalizeFirst } from '../../game/utils/string-utils.js';
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
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to relevant game events
  const cargo = useGameEvent('cargoChanged');
  const credits = useGameEvent('creditsChanged');
  const currentSystemId = useGameEvent('locationChanged');
  const currentDay = useGameEvent('timeChanged');

  // Get game actions
  const { buyGood, sellGood, moveToHiddenCargo, moveToRegularCargo } =
    useGameAction();

  // Get current system
  const system = gameStateManager.starData.find(
    (s) => s.id === currentSystemId
  );

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Get ship data for capacity and upgrades
  const ship = gameStateManager.getShip();

  // Calculate cargo capacity
  const cargoUsed = cargo.reduce((sum, stack) => sum + stack.qty, 0);
  const cargoCapacity = ship.cargoCapacity;
  const cargoRemaining = cargoCapacity - cargoUsed;

  // Check for Smuggler's Panels upgrade
  const hasSmugglersPanel =
    ship.upgrades && ship.upgrades.includes('smuggler_panels');
  const hiddenCargo = ship.hiddenCargo || [];
  const hiddenCargoUsed = hiddenCargo.reduce(
    (sum, stack) => sum + stack.qty,
    0
  );
  const hiddenCargoCapacity =
    ship.hiddenCargoCapacity ||
    SHIP_CONFIG.UPGRADES.smuggler_panels.effects.hiddenCargoCapacity;

  // Local state for hidden cargo section toggle
  const [hiddenCargoCollapsed, setHiddenCargoCollapsed] = useState(false);

  // Get world state for price calculations (non-reactive properties)
  const state = gameStateManager.getState();
  const activeEvents = state.world.activeEvents || [];
  const marketConditions = state.world.marketConditions || {};

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
      <button className="close-btn" onClick={onClose}>
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
              const price = TradingSystem.calculatePrice(
                goodType,
                system,
                currentDay,
                activeEvents,
                marketConditions
              );

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
            <span id="trade-cargo-capacity">{cargoCapacity}</span>
            <span className="capacity-remaining">
              (<span id="trade-cargo-remaining">{cargoRemaining}</span>{' '}
              remaining)
            </span>
          </div>
          <div id="cargo-stacks" className="cargo-list">
            {cargo.length === 0 ? (
              <div className="cargo-empty">No cargo</div>
            ) : (
              cargo.map((stack, index) => {
                const currentPrice = TradingSystem.calculatePrice(
                  stack.good,
                  system,
                  currentDay,
                  activeEvents,
                  marketConditions
                );
                const profit = calculateProfit(stack, currentPrice);

                let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.buyPrice} cr/unit`;

                if (
                  stack.buySystem !== undefined &&
                  stack.buyDate !== undefined
                ) {
                  const purchaseSystem = gameStateManager.starData.find(
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
                        {capitalizeFirst(stack.good)}
                      </div>
                      <div className="stack-details">{detailsText}</div>
                      <div className={`stack-profit ${profit.direction}`}>
                        {profitText}
                      </div>
                    </div>

                    <div className="stack-actions">
                      <button
                        className="sell-btn"
                        disabled={stack.qty < 1}
                        onClick={() => handleSellStack(index, 1, currentPrice)}
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
                {hiddenCargo.length === 0 ? (
                  <div className="cargo-empty">No hidden cargo</div>
                ) : (
                  hiddenCargo.map((stack, index) => {
                    const currentPrice = TradingSystem.calculatePrice(
                      stack.good,
                      system,
                      currentDay,
                      activeEvents,
                      marketConditions
                    );
                    const profit = calculateProfit(stack, currentPrice);

                    let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.buyPrice} cr/unit`;

                    if (
                      stack.buySystem !== undefined &&
                      stack.buyDate !== undefined
                    ) {
                      const purchaseSystem = gameStateManager.starData.find(
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
                            {capitalizeFirst(stack.good)}
                          </div>
                          <div className="stack-details">{detailsText}</div>
                          <div className={`stack-profit ${profit.direction}`}>
                            {profitText}
                          </div>
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
