// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHUD } from '../../src/features/hud/MobileHUD';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/hud/ResourceBar', () => ({
  ResourceBar: () => <div data-testid="resource-bar">ResourceBar</div>,
}));
vi.mock('../../src/features/hud/DateDisplay', () => ({
  DateDisplay: () => <div data-testid="date-display">DateDisplay</div>,
}));
vi.mock('../../src/features/hud/ShipStatus', () => ({
  ShipStatus: () => <div data-testid="ship-status">ShipStatus</div>,
}));
vi.mock('../../src/features/hud/LocationDisplay', () => ({
  LocationDisplay: () => (
    <div data-testid="location-display">LocationDisplay</div>
  ),
}));
vi.mock('../../src/features/hud/QuickAccessButtons', () => ({
  QuickAccessButtons: () => (
    <div data-testid="quick-access">QuickAccessButtons</div>
  ),
}));
vi.mock('../../src/features/hud/ActiveMissions', () => ({
  ActiveMissions: () => <div data-testid="active-missions">ActiveMissions</div>,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    const defaults = {
      shipNameChanged: 'Test Ship',
      creditsChanged: 500,
      fuelChanged: 80,
      shipConditionChanged: { hull: 70, engine: 90, lifeSupport: 15 },
    };
    return defaults[eventName] ?? null;
  },
}));

describe('MobileHUD', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderMobileHUD = (props = {}) =>
    render(
      <MobileProvider isMobile={true}>
        <MobileHUD
          onDock={() => {}}
          onSystemInfo={() => {}}
          panelActive={false}
          {...props}
        />
      </MobileProvider>
    );

  it('should render collapsed summary bar by default', () => {
    renderMobileHUD();
    expect(screen.getByText('Test Ship')).toBeTruthy();
    expect(screen.getByText('₡500')).toBeTruthy();
  });

  it('should show worst resource indicator', () => {
    renderMobileHUD();
    expect(screen.getByText(/Life Sup/i)).toBeTruthy();
    expect(screen.getByText(/15%/)).toBeTruthy();
  });

  it('should expand when summary bar is tapped', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    expect(screen.getByTestId('resource-bar')).toBeTruthy();
    expect(screen.getByTestId('ship-status')).toBeTruthy();
  });

  it('should collapse when summary bar is tapped again', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    fireEvent.click(screen.getByRole('button', { name: /collapse hud/i }));
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });

  it('should collapse when backdrop is tapped', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    fireEvent.click(screen.getByTestId('hud-backdrop'));
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });

  it('should block expansion when a panel is active', () => {
    render(
      <MobileProvider isMobile={true}>
        <MobileHUD
          onDock={() => {}}
          onSystemInfo={() => {}}
          panelActive={true}
          onDismissPanel={() => {}}
        />
      </MobileProvider>
    );

    // Click the HUD bar — should NOT expand when panelActive is true
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });

  it('should auto-collapse when panelActive becomes true', () => {
    const { rerender } = render(
      <MobileProvider isMobile={true}>
        <MobileHUD
          onDock={() => {}}
          onSystemInfo={() => {}}
          panelActive={false}
        />
      </MobileProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    expect(screen.getByTestId('resource-bar')).toBeTruthy();

    rerender(
      <MobileProvider isMobile={true}>
        <MobileHUD
          onDock={() => {}}
          onSystemInfo={() => {}}
          panelActive={true}
        />
      </MobileProvider>
    );
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });
});
