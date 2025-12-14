import { TradePanel } from '../trade/TradePanel';
import { RefuelPanel } from '../refuel/RefuelPanel';

/**
 * Panel container component.
 *
 * Conditionally renders the active panel based on the activePanel prop.
 * Handles panel closing and provides a consistent container for all panels.
 *
 * React Migration Spec: Requirements 9.4
 *
 * @param {string} activePanel - Name of the currently active panel
 * @param {Function} onClose - Callback to close the panel
 */
export function PanelContainer({ activePanel, onClose }) {
  // Placeholder for panel rendering
  // Actual panel components will be imported and rendered in later tasks
  const renderPanel = () => {
    switch (activePanel) {
      case 'trade':
        return <TradePanel onClose={onClose} />;
      case 'refuel':
        return <RefuelPanel onClose={onClose} />;
      case 'repair':
        return (
          <div className="panel-placeholder">
            <h2>Repair Panel</h2>
            <p>RepairPanel will be implemented in task 12</p>
          </div>
        );
      case 'upgrades':
        return (
          <div className="panel-placeholder">
            <h2>Upgrades Panel</h2>
            <p>UpgradesPanel will be implemented in task 13</p>
          </div>
        );
      case 'info-broker':
        return (
          <div className="panel-placeholder">
            <h2>Info Broker Panel</h2>
            <p>InfoBrokerPanel will be implemented in task 14</p>
          </div>
        );
      case 'cargo-manifest':
        return (
          <div className="panel-placeholder">
            <h2>Cargo Manifest Panel</h2>
            <p>CargoManifestPanel will be implemented in task 15</p>
          </div>
        );
      case 'ship-status':
        return (
          <div className="panel-placeholder">
            <h2>Ship Status Panel</h2>
            <p>ShipStatusPanel will be implemented in task 16</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Minimal wrapper that doesn't interfere with panel styling
  // Each panel has its own complete styling from CSS
  return <div className="panel-container">{renderPanel()}</div>;
}
