import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { QuickAccessButtons } from './QuickAccessButtons';

/**
 * HUD component composes all HUD sub-components.
 *
 * Displays:
 * - ResourceBar: Credits and fuel
 * - DateDisplay: Current game day
 * - ShipStatus: Hull, engine, and life support condition
 * - QuickAccessButtons: System info and dock buttons
 *
 * React Migration Spec: Requirements 7.5, 24.1, 24.2, 24.3
 *
 * @param {Function} onDock - Callback to trigger docking at a station
 */
export function HUD({ onDock }) {
  return (
    <div id="game-hud" className="visible">
      <ResourceBar />
      <DateDisplay />
      <ShipStatus />
      <QuickAccessButtons onDock={onDock} />
    </div>
  );
}
