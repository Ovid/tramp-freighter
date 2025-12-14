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
        return (
          <div className="panel-placeholder">
            <h2>Trade Panel</h2>
            <p>TradePanel will be implemented in task 10</p>
          </div>
        );
      case 'refuel':
        return (
          <div className="panel-placeholder">
            <h2>Refuel Panel</h2>
            <p>RefuelPanel will be implemented in task 11</p>
          </div>
        );
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

  return (
    <div
      className="panel-container"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        backgroundColor: '#333',
        color: '#fff',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '400px',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
        }}
      >
        ×
      </button>
      {renderPanel()}
    </div>
  );
}
