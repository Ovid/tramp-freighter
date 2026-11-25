import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls.jsx';

// Mock the modal components
vi.mock('../../src/features/instructions/InstructionsModal', () => ({
  InstructionsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="instructions-modal">Instructions</div> : null,
}));
vi.mock('../../src/features/achievements/AchievementsModal', () => ({
  AchievementsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="achievements-modal">Achievements</div> : null,
}));

// Mock GameContext
// One shared object so tests can assert on setPreference calls
const mockGame = vi.hoisted(() => ({
  getPreference: vi.fn(() => true),
  setPreference: vi.fn(),
  getVisitedSystems: vi.fn(() => [0]),
}));
vi.mock('../../src/context/GameContext', () => ({
  useGame: () => mockGame,
}));

// Mock StarmapContext
vi.mock('../../src/context/StarmapContext', () => ({
  useStarmap: () => ({ selectStarById: vi.fn() }),
}));

// Mock useStarData
vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0 }],
}));

// Mock useGameEvent
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => ({ jumpWarningsEnabled: true }),
}));

// Mock MobileContext
vi.mock('../../src/context/MobileContext', () => ({
  useMobile: () => ({ isMobile: false }),
}));

describe('Settings Panel', () => {
  const defaultProps = {
    cameraState: { boundaryVisible: true },
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onToggleBoundary: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gear toggle button', () => {
    render(<CameraControls {...defaultProps} />);
    expect(screen.getByLabelText('Toggle settings')).toBeTruthy();
  });

  it('shows settings panel with header when expanded', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders toggle switches for boolean preferences', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    expect(screen.getByText('Star Rotation')).toBeTruthy();
    expect(screen.getByText('Boundary')).toBeTruthy();
    expect(screen.getByText('Antimatter')).toBeTruthy();
    expect(screen.getByText('Jump Warnings')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    expect(screen.getByText('Zoom In')).toBeTruthy();
    expect(screen.getByText('Zoom Out')).toBeTruthy();
    expect(screen.getByText('Instructions')).toBeTruthy();
    expect(screen.getByText('Achievements')).toBeTruthy();
    expect(screen.getByText('GitHub')).toBeTruthy();
  });

  it('toggle switches have correct initial state', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    const rotationSlider = screen.getByLabelText('Star Rotation');
    expect(rotationSlider.type).toBe('range');
    expect(rotationSlider.value).toBe('3');

    const boundaryToggle = screen.getByLabelText('Boundary');
    expect(boundaryToggle.checked).toBe(true);
  });

  it('changing the Star Rotation slider saves the preference', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    fireEvent.change(screen.getByLabelText('Star Rotation'), {
      target: { value: '6' },
    });
    expect(mockGame.setPreference).toHaveBeenCalledWith('autoRotationSpeed', 6);
  });

  it('should collapse when clicking outside the settings panel', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <CameraControls {...defaultProps} />
      </div>
    );
    // Expand
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    expect(screen.getByText('Settings')).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('should not collapse when clicking inside the settings panel', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    expect(screen.getByText('Settings')).toBeTruthy();

    // Click inside
    fireEvent.mouseDown(screen.getByText('Settings'));
    expect(screen.getByText('Settings')).toBeTruthy();
  });
});
