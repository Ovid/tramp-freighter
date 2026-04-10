// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { HUD } from '../../src/features/hud/HUD';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/hud/ResourceBar', () => ({
  ResourceBar: () => <div data-testid="resource-bar" />,
}));
vi.mock('../../src/features/hud/DateDisplay', () => ({
  DateDisplay: () => <div data-testid="date-display" />,
}));
vi.mock('../../src/features/hud/ShipStatus', () => ({
  ShipStatus: () => <div data-testid="ship-status" />,
}));
vi.mock('../../src/features/hud/LocationDisplay', () => ({
  LocationDisplay: () => <div data-testid="location-display" />,
}));
vi.mock('../../src/features/hud/QuickAccessButtons', () => ({
  QuickAccessButtons: () => <div data-testid="quick-access" />,
}));
vi.mock('../../src/features/hud/ActiveMissions', () => ({
  ActiveMissions: () => <div data-testid="active-missions" />,
}));
vi.mock('../../src/features/hud/MobileHUD', () => ({
  MobileHUD: () => <div data-testid="mobile-hud" />,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));

afterEach(() => vi.restoreAllMocks());

describe('HUD mobile/desktop switch', () => {
  it('should render desktop HUD when not mobile', () => {
    const { container } = render(
      <MobileProvider isMobile={false}>
        <HUD onDock={() => {}} onSystemInfo={() => {}} />
      </MobileProvider>
    );
    expect(container.querySelector('#game-hud')).toBeTruthy();
    expect(container.querySelector('[data-testid="mobile-hud"]')).toBeNull();
  });

  it('should render MobileHUD when mobile', () => {
    const { container } = render(
      <MobileProvider isMobile={true}>
        <HUD onDock={() => {}} onSystemInfo={() => {}} />
      </MobileProvider>
    );
    expect(container.querySelector('[data-testid="mobile-hud"]')).toBeTruthy();
    expect(container.querySelector('#game-hud')).toBeNull();
  });
});
