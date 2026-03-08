import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MechanicalFailurePanel } from '../../src/features/danger/MechanicalFailurePanel.jsx';
import { FAILURE_CONFIG, SHIP_CONFIG } from '../../src/game/constants.js';

// Suppress console warnings/errors during tests
let consoleSpy;
beforeEach(() => {
  consoleSpy = {
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  };
});

afterEach(() => {
  consoleSpy.warn.mockRestore();
  consoleSpy.error.mockRestore();
  consoleSpy.log.mockRestore();
});

// Mock useGameEvent with configurable return values
const defaultHookValues = {
  hullChanged: 80,
  engineChanged: 60,
  lifeSupportChanged: 90,
  creditsChanged: 5000,
};

let hookValues;

vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn((eventName) => {
    return hookValues[eventName] ?? null;
  }),
}));

const makeFailure = (type, severity) => ({ type, severity });

describe('MechanicalFailurePanel', () => {
  let onChoice;
  let onClose;

  beforeEach(() => {
    hookValues = { ...defaultHookValues };
    onChoice = vi.fn();
    onClose = vi.fn();
  });

  // 1. Renders engine failure with correct type and severity
  it('renders engine failure with correct type and severity', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure', undefined)}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Engine Failure')).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  // 2. Engine failure shows three repair options
  it('engine failure shows three repair options', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Emergency Restart')).toBeTruthy();
    expect(screen.getByText('Call for Help')).toBeTruthy();
    expect(screen.getByText('Jury-Rig Repair')).toBeTruthy();
  });

  // 3. Selecting an option highlights it and shows confirm/cancel buttons
  it('selecting an option highlights it and shows confirm/cancel buttons', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Emergency Restart'));

    expect(screen.getByText('Attempt Emergency Restart')).toBeTruthy();
    expect(screen.getByText('Reconsider')).toBeTruthy();
  });

  // 4. Confirm calls onChoice with selected option
  it('confirm calls onChoice with selected option', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Emergency Restart'));
    fireEvent.click(screen.getByText('Attempt Emergency Restart'));

    expect(onChoice).toHaveBeenCalledWith('emergency_restart');
  });

  // 5. Cancel clears selection
  it('cancel clears selection and returns to selection prompt', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Emergency Restart'));
    expect(screen.getByText('Reconsider')).toBeTruthy();

    fireEvent.click(screen.getByText('Reconsider'));

    expect(
      screen.getByText('Choose a repair option to address the engine failure')
    ).toBeTruthy();
  });

  // 6. Call for Help is disabled when credits insufficient
  it('Call for Help is disabled when credits insufficient', () => {
    hookValues.creditsChanged =
      FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST - 1;

    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Insufficient Credits')).toBeTruthy();

    // Clicking the disabled option should not select it
    fireEvent.click(screen.getByText('Call for Help'));
    expect(
      screen.queryByText('Call for Professional Help')
    ).not.toBeTruthy();
  });

  // 7. Hull breach renders info panel with Acknowledge button
  it('hull breach renders info panel with Acknowledge button', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('hull_breach')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Hull Breach Damage')).toBeTruthy();
    expect(screen.getByText('Acknowledge')).toBeTruthy();
    expect(
      screen.getByText(/hull integrity/, { exact: false })
    ).toBeTruthy();

    // Should not show engine failure options
    expect(screen.queryByText('Emergency Restart')).toBeNull();
  });

  // 8. Hull breach Acknowledge calls onClose
  it('hull breach Acknowledge calls onClose', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('hull_breach')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Acknowledge'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // 9. Life support renders info panel with Acknowledge button
  it('life support renders info panel with Acknowledge button', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('life_support')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    // "Life Support Emergency" appears twice (type-value and option-name)
    const matches = screen.getAllByText('Life Support Emergency');
    expect(matches.length).toBe(2);
    expect(screen.getByText('Acknowledge')).toBeTruthy();
    expect(screen.queryByText('Emergency Restart')).toBeNull();
  });

  // 10. Close button calls onClose
  it('close button calls onClose', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // 11. Ship status displays hull/engine/lifeSupport/credits correctly
  it('ship status displays hull/engine/lifeSupport/credits correctly', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText(/5,000/)).toBeTruthy();

    // Check condition-based status messages
    // Hull at 80 >= HULL threshold (50), so "Hull stable"
    expect(screen.getByText('Hull stable')).toBeTruthy();
    // Engine at 60 >= ENGINE threshold (30), so "Engine operational"
    expect(screen.getByText('Engine operational')).toBeTruthy();
    // Life support at 90 >= LIFE_SUPPORT threshold (20), so "Environment stable"
    expect(screen.getByText('Environment stable')).toBeTruthy();
  });

  // 12. Severity color mapping works for each failure type
  it('severity color mapping works for each failure type', () => {
    // Engine failure -> critical -> #ff0000
    const { unmount: u1 } = render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const engineSeverity = screen.getByText('Critical');
    expect(engineSeverity.style.color).toBe('rgb(255, 0, 0)');
    u1();

    // Hull breach -> serious -> #ff4444
    const { unmount: u2 } = render(
      <MechanicalFailurePanel
        failure={makeFailure('hull_breach')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const hullSeverity = screen.getByText('Serious');
    expect(hullSeverity.style.color).toBe('rgb(255, 68, 68)');
    u2();

    // Life support -> emergency -> #ff0000
    render(
      <MechanicalFailurePanel
        failure={makeFailure('life_support')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );
    const lifeSeverity = screen.getByText('Emergency');
    expect(lifeSeverity.style.color).toBe('rgb(255, 0, 0)');
  });

  // 13. Engine failure shows selection prompt when no option selected
  it('engine failure shows selection prompt when no option selected', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    expect(
      screen.getByText('Choose a repair option to address the engine failure')
    ).toBeTruthy();

    // Confirm/cancel buttons should not be visible
    expect(screen.queryByText('Reconsider')).toBeNull();
  });

  // Additional: engine failure options display correct constants values
  it('engine failure options display correct cost and chance values from constants', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    const emergencyChance = Math.round(
      FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE * 100
    );
    const emergencyCost =
      FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST;
    const juryRigChance = Math.round(
      FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE * 100
    );
    const juryRigCost = FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST;
    const helpCost =
      FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST;
    const helpDelay =
      FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY;

    // Verify emergency restart stats are shown
    expect(
      screen.getAllByText(new RegExp(`${emergencyChance}\\s*%`)).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(`${emergencyCost}%`)).length
    ).toBeGreaterThan(0);

    // Verify jury-rig stats are shown
    expect(
      screen.getAllByText(new RegExp(`${juryRigChance}\\s*%`)).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(`${juryRigCost}%`)).length
    ).toBeGreaterThan(0);

    // Verify call for help stats are shown (cost appears multiple times in outcomes)
    expect(
      screen.getAllByText(new RegExp(`${helpCost.toLocaleString()}`)).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(`${helpDelay}\\s*days`)).length
    ).toBeGreaterThan(0);
  });

  // Confirm works for jury_rig option
  it('confirm calls onChoice with jury_rig when selected', () => {
    render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText('Jury-Rig Repair'));
    fireEvent.click(screen.getByText('Attempt Jury-Rig Repair'));

    expect(onChoice).toHaveBeenCalledWith('jury_rig');
  });

  // Ship status uses UI_CONDITION_DISPLAY_THRESHOLDS for condition classes
  it('ship status uses condition display thresholds for CSS classes', () => {
    // Hull at 80 >= EXCELLENT (75) -> 'good'
    // Engine at 60 >= FAIR (50) -> 'fair'
    // Life support at 90 >= EXCELLENT (75) -> 'good'
    hookValues.hullChanged = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.EXCELLENT;
    hookValues.engineChanged = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.FAIR;
    hookValues.lifeSupportChanged = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.POOR - 1;

    const { container } = render(
      <MechanicalFailurePanel
        failure={makeFailure('engine_failure')}
        onChoice={onChoice}
        onClose={onClose}
      />
    );

    const statusValues = container.querySelectorAll('.status-value');
    // Hull -> good (at EXCELLENT threshold exactly)
    expect(statusValues[0].classList.contains('good')).toBe(true);
    // Engine -> fair (at FAIR threshold exactly)
    expect(statusValues[1].classList.contains('fair')).toBe(true);
    // Life support -> critical (below POOR threshold)
    expect(statusValues[2].classList.contains('critical')).toBe(true);
  });
});
