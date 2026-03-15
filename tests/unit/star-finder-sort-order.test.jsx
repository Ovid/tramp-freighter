import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls';

vi.mock('../../src/features/instructions/InstructionsModal', () => ({
  InstructionsModal: () => null,
}));
vi.mock('../../src/features/achievements/AchievementsModal', () => ({
  AchievementsModal: () => null,
}));
vi.mock('../../src/context/GameContext', () => ({
  useGame: () => ({
    getPreference: vi.fn(() => true),
    setPreference: vi.fn(),
    getVisitedSystems: vi.fn(() => []),
  }),
}));
vi.mock('../../src/context/StarmapContext', () => ({
  useStarmap: () => ({ selectStarById: vi.fn() }),
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => ({ jumpWarningsEnabled: true }),
}));

// Stars where alphabetical order differs from distance order:
// By distance: Sol (0), Zeta (5), Alpha (10)
// By name:     Alpha, Sol, Zeta
vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0 },
    { id: 1, name: 'Zeta Reticuli', x: 3, y: 4, z: 0 },
    { id: 2, name: 'Alpha Centauri A', x: 6, y: 8, z: 0 },
  ],
}));

describe('Star finder dropdown sort order', () => {
  it('should list stars in alphabetical order by name', async () => {
    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onToggleRotation={vi.fn()}
        onToggleBoundary={vi.fn()}
      />
    );

    // Open settings panel
    fireEvent.click(container.querySelector('.camera-controls-toggle'));
    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    // Open the custom select dropdown
    const selectTrigger = container.querySelector('.custom-select-trigger');
    fireEvent.click(selectTrigger);

    await waitFor(() => {
      expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    });

    const options = container.querySelectorAll('[role="option"]');
    const labels = Array.from(options).map((opt) => opt.textContent.trim());

    expect(labels).toEqual(['Alpha Centauri A', 'Sol', 'Zeta Reticuli']);
  });
});
