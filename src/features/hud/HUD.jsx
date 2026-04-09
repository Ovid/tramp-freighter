import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { LocationDisplay } from './LocationDisplay';
import { QuickAccessButtons } from './QuickAccessButtons';
import { ActiveMissions } from './ActiveMissions.jsx';
import { MobileHUD } from './MobileHUD';
import { useMobile } from '../../context/MobileContext';

/**
 * HUD component composes all HUD sub-components.
 *
 * On mobile devices, delegates to MobileHUD for a compact layout.
 * On desktop, renders the full HUD with all sub-components.
 *
 * Displays (desktop):
 * - ResourceBar: Credits and debt
 * - DateDisplay: Current game day
 * - ShipStatus: Ship name, fuel, hull, engine, life support, and cargo
 * - LocationDisplay: Current system and distance from Sol
 * - QuickAccessButtons: System info and dock buttons
 *
 * React Migration Spec: Requirements 7.5, 24.1, 24.2, 24.3
 *
 * @param {Function} onDock - Callback to trigger docking at a station
 * @param {Function} onSystemInfo - Callback to open system info panel
 * @param {boolean} panelActive - Whether a panel or encounter is currently active
 */
export function HUD({ onDock, onSystemInfo, panelActive }) {
  const { isMobile } = useMobile();

  if (isMobile) {
    return (
      <MobileHUD
        onDock={onDock}
        onSystemInfo={onSystemInfo}
        panelActive={panelActive}
      />
    );
  }

  return (
    <div id="game-hud" className="visible">
      <ResourceBar />
      <DateDisplay />
      <ShipStatus />
      <LocationDisplay />
      <QuickAccessButtons onDock={onDock} onSystemInfo={onSystemInfo} />
      <ActiveMissions />
    </div>
  );
}
