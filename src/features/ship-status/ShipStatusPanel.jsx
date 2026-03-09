import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';

/**
 * ShipStatusPanel - React component for displaying ship status
 *
 * Displays ship name, condition (hull, engine, life support), upgrades, and quirks.
 * Provides a comprehensive view of the ship's current state and personality.
 *
 * Architecture: react-migration
 * Validates: Requirements 8.7
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function ShipStatusPanel({ onClose }) {
  // Access GameCoordinator
  const game = useGame();

  // Subscribe to game events
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);

  /**
   * Render a single condition bar
   *
   * @param {string} label - Condition label (Hull, Engine, Life Support)
   * @param {number} value - Condition value (0-100)
   * @returns {JSX.Element} Condition bar element
   */
  const renderConditionBar = (label, value, systemClass) => {
    return (
      <div className="ship-status-condition-item" key={label}>
        <div className="info-label">{label}</div>
        <div className={`condition-bar ${systemClass}`}>
          <div className="condition-fill" style={{ width: `${value}%` }}>
            <span className="condition-value">{value.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render a single quirk item
   *
   * @param {string} quirkId - Quirk identifier
   * @returns {JSX.Element} Quirk item element
   */
  const renderQuirk = (quirkId) => {
    const quirk = game.getQuirkDefinition(quirkId);

    if (!quirk) {
      return null;
    }

    return (
      <div className="quirk-item" key={quirkId}>
        <div className="quirk-header">
          <span className="quirk-icon">⚙</span>
          <span className="quirk-name">{quirk.name}</span>
        </div>
        <div className="quirk-description">{quirk.description}</div>
        {quirk.effectLabel && (
          <div className="quirk-effect">{quirk.effectLabel}</div>
        )}
        <div className="quirk-flavor">{quirk.flavor}</div>
      </div>
    );
  };

  /**
   * Render a single upgrade item
   *
   * @param {string} upgradeId - Upgrade identifier
   * @returns {JSX.Element} Upgrade item element
   */
  const renderUpgrade = (upgradeId) => {
    const upgrade = game.getUpgradeDefinition(upgradeId);

    if (!upgrade) {
      return null;
    }

    return (
      <div className="quirk-item" key={upgradeId}>
        <div className="quirk-header">
          <span className="quirk-icon">🔧</span>
          <span className="quirk-name">{upgrade.name}</span>
        </div>
        <div className="quirk-description">{upgrade.description}</div>
        {upgrade.tradeoff && (
          <div className="quirk-flavor">Tradeoff: {upgrade.tradeoff}</div>
        )}
      </div>
    );
  };

  return (
    <div id="ship-status-panel" className="ship-status-panel visible">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2>SHIP STATUS — {shipName}</h2>

      {/* Ship Condition Section */}
      <div className="ship-status-section">
        <h3>Condition</h3>
        <div className="ship-status-conditions">
          {renderConditionBar('Hull', shipCondition.hull, 'hull')}
          {renderConditionBar('Engine', shipCondition.engine, 'engine')}
          {renderConditionBar(
            'Life Support',
            shipCondition.lifeSupport,
            'life-support'
          )}
        </div>
      </div>

      {/* Upgrades Section */}
      <div className="ship-status-section">
        <h3>Upgrades</h3>
        <div className="ship-quirks-list">
          {upgrades.length === 0 ? (
            <div className="ship-quirks-empty">No upgrades installed</div>
          ) : (
            upgrades.map((upgradeId) => renderUpgrade(upgradeId))
          )}
        </div>
      </div>

      {/* Quirks Section */}
      <div className="ship-status-section">
        <h3>Ship Quirks</h3>
        <div className="ship-quirks-list">
          {quirks.length === 0 ? (
            <div className="ship-quirks-empty">No quirks</div>
          ) : (
            quirks.map((quirkId) => renderQuirk(quirkId))
          )}
        </div>
      </div>
    </div>
  );
}
