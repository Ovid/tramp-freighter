import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import {
  validateUpgradePurchase,
  formatUpgradeEffects,
  getAvailableUpgrades,
  getInstalledUpgrades,
  calculateCreditsAfterPurchase,
} from './upgradesUtils';
import { SHIP_CONFIG } from '../../game/constants';

/**
 * UpgradesPanel component for purchasing ship upgrades.
 *
 * Displays available and installed upgrades with their effects, costs,
 * and tradeoffs. Provides confirmation dialog for permanent upgrades.
 *
 * React Migration Spec: Requirements 8.4
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element} Upgrades panel component
 */
export function UpgradesPanel({ onClose }) {
  const gameStateManager = useGameState();
  const credits = useGameEvent('creditsChanged');
  const currentSystemId = useGameEvent('locationChanged');
  const { purchaseUpgrade } = useGameAction();

  const [pendingUpgradeId, setPendingUpgradeId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const state = gameStateManager.getState();
  const availableUpgradeIds = getAvailableUpgrades(state);
  const installedUpgradeIds = getInstalledUpgrades(state);

  const handlePurchaseClick = (upgradeId) => {
    setPendingUpgradeId(upgradeId);
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = () => {
    if (!pendingUpgradeId) return;

    const purchaseOutcome = purchaseUpgrade(pendingUpgradeId);

    if (purchaseOutcome.success) {
      setShowConfirmation(false);
      setPendingUpgradeId(null);
    }
  };

  const handleCancelPurchase = () => {
    setShowConfirmation(false);
    setPendingUpgradeId(null);
  };

  const renderUpgradeCard = (upgradeId, isInstalled) => {
    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
    if (!upgrade) return null;

    const effectsText = formatUpgradeEffects(upgrade.effects);
    const hasTradeoff = upgrade.tradeoff && upgrade.tradeoff !== 'None';
    const validation = validateUpgradePurchase(upgradeId, state);

    return (
      <div key={upgradeId} className="upgrade-card">
        <div className="upgrade-header">
          <div className="upgrade-name-container">
            <span className="upgrade-name">{upgrade.name}</span>
            {hasTradeoff && (
              <span
                className="upgrade-warning-symbol"
                title="This upgrade has tradeoffs"
              >
                {' '}
                ⚠
              </span>
            )}
          </div>
          <span className="upgrade-cost">₡{upgrade.cost.toLocaleString()}</span>
        </div>

        <div className="upgrade-description">{upgrade.description}</div>

        <div className="upgrade-effects">
          <div className="upgrade-effects-label">Effects:</div>
          <ul className="upgrade-effects-list">
            {effectsText.map((effect, index) => (
              <li key={index}>{effect}</li>
            ))}
          </ul>
        </div>

        {hasTradeoff && (
          <div className="upgrade-tradeoff">
            <div className="upgrade-tradeoff-label">Tradeoff:</div>
            <div className="upgrade-tradeoff-text">{upgrade.tradeoff}</div>
          </div>
        )}

        {!isInstalled && (
          <>
            <div className="upgrade-actions">
              <button
                className="upgrade-purchase-btn"
                onClick={() => handlePurchaseClick(upgradeId)}
                disabled={!validation.valid}
              >
                Purchase
              </button>
            </div>
            {!validation.valid && (
              <div className="validation-message error">
                {validation.reason}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderConfirmationDialog = () => {
    if (!showConfirmation || !pendingUpgradeId) return null;

    const upgrade = SHIP_CONFIG.UPGRADES[pendingUpgradeId];
    if (!upgrade) return null;

    const effectsText = formatUpgradeEffects(upgrade.effects);
    const hasTradeoff = upgrade.tradeoff && upgrade.tradeoff !== 'None';
    const creditsAfter = calculateCreditsAfterPurchase(
      pendingUpgradeId,
      credits
    );

    return (
      <div className="upgrade-confirmation-overlay">
        <div className="upgrade-confirmation-dialog">
          <h3 className="upgrade-confirmation-title">{upgrade.name}</h3>

          <div className="upgrade-confirmation-effects">
            {effectsText.map((effect, index) => (
              <div key={index} className="upgrade-effect-item">
                • {effect}
              </div>
            ))}
            {hasTradeoff && (
              <div className="upgrade-effect-item upgrade-tradeoff-item">
                ⚠ {upgrade.tradeoff}
              </div>
            )}
          </div>

          <div className="upgrade-confirmation-cost">
            <div className="cost-breakdown">
              <div className="cost-row">
                <span>Current Credits:</span>
                <span className="upgrade-current-credits">
                  ₡{credits.toLocaleString()}
                </span>
              </div>
              <div className="cost-row">
                <span>Cost:</span>
                <span className="upgrade-cost-value">
                  -₡{upgrade.cost.toLocaleString()}
                </span>
              </div>
              <div className="cost-row total">
                <span>After Purchase:</span>
                <span className="upgrade-credits-after">
                  ₡{creditsAfter.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="upgrade-confirmation-warning">
            ⚠ Upgrades are permanent and cannot be removed
          </div>

          <div className="upgrade-confirmation-actions">
            <button
              className="upgrade-cancel-btn"
              onClick={handleCancelPurchase}
            >
              Cancel
            </button>
            <button
              className="upgrade-confirm-btn"
              onClick={handleConfirmPurchase}
            >
              Confirm Purchase
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Sort available upgrades by cost (cheapest first)
  const sortedAvailableUpgrades = [...availableUpgradeIds].sort(
    (a, b) => SHIP_CONFIG.UPGRADES[a].cost - SHIP_CONFIG.UPGRADES[b].cost
  );

  const currentSystem = gameStateManager.starData.find(
    (s) => s.id === currentSystemId
  );

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  const currentSystemName = currentSystem.name;

  return (
    <div id="upgrades-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>
        Ship Upgrades - <span>{currentSystemName}</span>
      </h2>

      <div className="upgrades-content">
        {/* Credits Display */}
        <div className="upgrades-credits">
          Credits:{' '}
          <span id="upgrades-credits-value">₡{credits.toLocaleString()}</span>
        </div>

        {/* Available Upgrades Section */}
        <div className="upgrades-section">
          <h3>Available Upgrades</h3>
          <div id="available-upgrades-list" className="upgrades-list">
            {sortedAvailableUpgrades.length === 0 ? (
              <div className="upgrades-empty">All upgrades installed</div>
            ) : (
              sortedAvailableUpgrades.map((upgradeId) =>
                renderUpgradeCard(upgradeId, false)
              )
            )}
          </div>
        </div>

        {/* Installed Upgrades Section */}
        <div className="upgrades-section">
          <h3>Installed Upgrades</h3>
          <div id="installed-upgrades-list" className="upgrades-list">
            {installedUpgradeIds.length === 0 ? (
              <div className="upgrades-empty">No upgrades installed</div>
            ) : (
              installedUpgradeIds.map((upgradeId) =>
                renderUpgradeCard(upgradeId, true)
              )
            )}
          </div>
        </div>
      </div>

      <div className="upgrades-actions">
        <button className="station-btn secondary" onClick={onClose}>
          Back to Station
        </button>
      </div>

      {renderConfirmationDialog()}
    </div>
  );
}
