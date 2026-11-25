import { useEffect, useRef } from 'react';
import { TradePanel } from '../trade/TradePanel';
import { RefuelPanel } from '../refuel/RefuelPanel';
import { RepairPanel } from '../repair/RepairPanel';
import { UpgradesPanel } from '../upgrades/UpgradesPanel';
import { InfoBrokerPanel } from '../info-broker/InfoBrokerPanel';
import { CargoManifestPanel } from '../cargo/CargoManifestPanel';
import { ShipStatusPanel } from '../ship-status/ShipStatusPanel';
import { DialoguePanel } from '../dialogue/DialoguePanel';
import { MissionBoardPanel } from '../missions/MissionBoardPanel.jsx';
import { FinancePanel } from '../finance/FinancePanel';

/**
 * Panel container component.
 *
 * Conditionally renders the active panel based on the activePanel prop.
 * Handles panel closing and provides a consistent container for all panels.
 *
 * React Migration Spec: Requirements 9.4
 * NPC Foundation Spec: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * @param {string} activePanel - Name of the currently active panel
 * @param {string} npcId - NPC ID for dialogue panel (optional)
 * @param {Function} onClose - Callback to close just this panel
 */
export function PanelContainer({ activePanel, npcId, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      // A modal over the panel (cargo storage picker, upgrade confirmation,
      // narrative event) owns Escape. Two queries, not a selector list:
      // jsdom's nwsapi mismatches lists that mix class and attribute
      if (document.querySelector('.modal-overlay')) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      // Focus in another panel (dev admin, camera controls) means Escape is
      // for it. The station menu is exempt: focus stays on the menu button
      // that opened this panel.
      const focusedPanel = document.activeElement?.closest('[data-panel]');
      if (
        focusedPanel &&
        focusedPanel !== containerRef.current &&
        focusedPanel.id !== 'station-interface'
      )
        return;
      // Capture phase + stopPropagation: the panel sits above the station
      // menu, so it takes this Escape and the menu must not undock as well
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const renderPanel = () => {
    switch (activePanel) {
      case 'trade':
        return <TradePanel onClose={onClose} />;
      case 'refuel':
        return <RefuelPanel onClose={onClose} />;
      case 'repair':
        return <RepairPanel onClose={onClose} />;
      case 'upgrades':
        return <UpgradesPanel onClose={onClose} />;
      case 'info-broker':
        return <InfoBrokerPanel onClose={onClose} />;
      case 'cargo-manifest':
        return <CargoManifestPanel onClose={onClose} />;
      case 'ship-status':
        return <ShipStatusPanel onClose={onClose} />;
      case 'dialogue':
        return <DialoguePanel npcId={npcId} onClose={onClose} />;
      case 'mission-board':
        return <MissionBoardPanel onClose={onClose} />;
      case 'finance':
        return <FinancePanel onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="panel-container" ref={containerRef} data-panel>
      {renderPanel()}
    </div>
  );
}
