import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { TradingSystem } from '../../game/game-trading.js';
import { capitalizeFirst } from '../../game/utils/string-utils.js';
import { formatCargoAge } from './cargoUtils';

/**
 * CargoManifestPanel - React component for displaying cargo manifest
 *
 * Displays ship name, cargo capacity usage, all cargo stacks with purchase metadata,
 * and total cargo value. Provides a detailed view of all cargo holdings.
 *
 * Architecture: react-migration
 * Validates: Requirements 8.6
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function CargoManifestPanel({ onClose }) {
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to cargo changes
  const cargo = useGameEvent('cargoChanged');

  // Get current state
  const state = gameStateManager.getState();
  const ship = state.ship;
  const currentDay = state.player.daysElapsed;

  // Calculate cargo usage
  const cargoUsed = cargo.reduce((sum, stack) => sum + stack.qty, 0);
  const cargoCapacity = ship.cargoCapacity;

  // Calculate total value
  const totals =
    cargo.length > 0
      ? TradingSystem.calculateCargoTotals(cargo)
      : { totalCapacityUsed: 0, totalValue: 0 };

  /**
   * Render a single cargo manifest item
   *
   * @param {Object} cargoEntry - Cargo stack with metadata
   * @param {number} index - Index in cargo array
   * @returns {JSX.Element} Cargo manifest item
   */
  const renderCargoItem = (cargoEntry, index) => {
    const cargoValue = TradingSystem.calculateCargoValue(cargoEntry);
    const locationName = cargoEntry.buySystemName || 'Unknown';
    const ageText = formatCargoAge(currentDay, cargoEntry.buyDate || 0);

    return (
      <div key={index} className="cargo-manifest-item">
        <div className="cargo-manifest-name">
          {capitalizeFirst(cargoEntry.good)}
        </div>
        <div className="cargo-manifest-details">
          <div className="cargo-manifest-detail">
            <span className="detail-label">Quantity:</span>
            <span className="detail-value">{cargoEntry.qty} units</span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">Purchased at:</span>
            <span className="detail-value">{locationName}</span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">Purchase price:</span>
            <span className="detail-value">₡{cargoEntry.buyPrice}/unit</span>
          </div>
          <div className="cargo-manifest-detail">
            <span className="detail-label">Purchased:</span>
            <span className="detail-value">{ageText}</span>
          </div>
          <div className="cargo-manifest-detail cargo-manifest-value">
            <span className="detail-label">Current value:</span>
            <span className="detail-value">₡{cargoValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="cargo-manifest-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>
        CARGO MANIFEST — <span id="cargo-manifest-ship-name">{ship.name}</span>
      </h2>

      <div className="cargo-manifest-content">
        {/* Capacity Display */}
        <div className="cargo-manifest-section">
          <div className="cargo-capacity-display">
            <span className="capacity-label">Capacity:</span>
            <span id="cargo-manifest-used">{cargoUsed}</span>
            <span> / </span>
            <span id="cargo-manifest-capacity">{cargoCapacity}</span>
            <span className="capacity-units"> units</span>
          </div>
        </div>

        {/* Cargo List */}
        <div className="cargo-manifest-section">
          <h3>Cargo</h3>
          <div id="cargo-manifest-list" className="cargo-manifest-list">
            {cargo.length === 0 ? (
              <div className="cargo-manifest-empty">No cargo</div>
            ) : (
              cargo.map((cargoEntry, index) =>
                renderCargoItem(cargoEntry, index)
              )
            )}
          </div>
        </div>

        {/* Total Value */}
        <div className="cargo-manifest-section">
          <div className="cargo-manifest-total">
            <span className="total-label">Total Value:</span>
            <span id="cargo-manifest-total-value" className="total-value">
              ₡{totals.totalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
