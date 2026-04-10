import { useState, useEffect } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES, SHIP_CONFIG } from '../../game/constants.js';
import { getConditionClass } from '../../game/utils/string-utils.js';
import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { LocationDisplay } from './LocationDisplay';
import { QuickAccessButtons } from './QuickAccessButtons';
import { ActiveMissions } from './ActiveMissions.jsx';

function getWorstResources(fuel, fuelCapacity, condition) {
  const safeFuelCap = fuelCapacity ?? 100;
  const fuelPct = ((fuel ?? safeFuelCap) / safeFuelCap) * 100;
  const resources = [
    { name: 'Fuel', value: Math.round(fuelPct) },
    { name: 'Hull', value: Math.round(condition?.hull ?? 100) },
    { name: 'Engine', value: Math.round(condition?.engine ?? 100) },
    { name: 'Life Sup', value: Math.round(condition?.lifeSupport ?? 100) },
  ];
  resources.sort((a, b) => a.value - b.value);

  const critical = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.POOR;
  const criticalResources = resources.filter((r) => r.value < critical);
  if (criticalResources.length >= 2) return criticalResources.slice(0, 2);
  return [resources[0]];
}

const CONDITION_TO_SEVERITY = {
  good: 'ok',
  fair: 'ok',
  poor: 'warning',
  critical: 'critical',
};

function getSeverityClass(value) {
  return CONDITION_TO_SEVERITY[getConditionClass(value)];
}

export function MobileHUD({
  onDock,
  onSystemInfo,
  panelActive,
  onDismissPanel,
}) {
  const [expanded, setExpanded] = useState(false);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const fuelCapacity = useGameEvent(EVENT_NAMES.FUEL_CAPACITY_CHANGED);
  const condition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);

  useEffect(() => {
    if (panelActive) setExpanded(false);
  }, [panelActive]);

  const worst = getWorstResources(fuel, fuelCapacity, condition);

  return (
    <>
      <button
        className="mobile-hud-bar"
        onClick={() => {
          const willExpand = !expanded;
          setExpanded(willExpand);
          if (willExpand && onDismissPanel) onDismissPanel();
        }}
        aria-label={expanded ? 'Collapse HUD' : 'Expand HUD'}
        aria-expanded={expanded}
      >
        <span className="mobile-hud-ship">{shipName}</span>
        <span className="mobile-hud-credits">
          ₡{(Number.isFinite(credits) ? credits : 0).toLocaleString()}
        </span>
        <span className="mobile-hud-resources">
          {worst.map((r) => (
            <span
              key={r.name}
              className={`mobile-hud-indicator ${getSeverityClass(r.value)}`}
            >
              {r.name} {r.value}%
            </span>
          ))}
        </span>
      </button>

      {expanded && (
        <>
          <div
            className="mobile-hud-backdrop"
            data-testid="hud-backdrop"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
          <div
            className="mobile-hud-expanded"
            role="region"
            aria-label="Ship status details"
          >
            <ResourceBar />
            <DateDisplay />
            <ShipStatus />
            <LocationDisplay />
            <QuickAccessButtons
              onDock={() => {
                setExpanded(false);
                onDock();
              }}
              onSystemInfo={() => {
                setExpanded(false);
                onSystemInfo();
              }}
            />
            <ActiveMissions />
          </div>
        </>
      )}
    </>
  );
}
