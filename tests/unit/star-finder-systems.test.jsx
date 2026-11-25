import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls';

const mobile = vi.hoisted(() => ({ isMobile: false }));

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
vi.mock('../../src/context/MobileContext', () => ({
  useMobile: () => mobile,
}));
vi.mock('../../src/hooks/useStarData', async () => {
  const { STAR_DATA } = await import('../../src/game/data/star-data.js');
  return { useStarData: () => STAR_DATA };
});

const props = {
  cameraState: { boundaryVisible: true },
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onToggleBoundary: vi.fn(),
};

function expectSystems(labels) {
  expect(labels).toHaveLength(84);
  expect(labels).toContain('Sirius');
  expect(labels.some((l) => /Sirius [AB]/.test(l))).toBe(false);
}

describe('Find Star lists systems, not stars', () => {
  afterEach(() => {
    cleanup();
    mobile.isMobile = false;
  });

  it('desktop', async () => {
    const { container } = render(<CameraControls {...props} />);
    fireEvent.click(container.querySelector('.camera-controls-toggle'));
    fireEvent.click(container.querySelector('.custom-select-trigger'));
    await waitFor(() => {
      expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    });

    const labels = Array.from(
      container.querySelectorAll('[role="option"]')
    ).map((o) => o.textContent.trim());
    expectSystems(labels);
  });

  it('mobile', () => {
    mobile.isMobile = true;
    render(<CameraControls {...props} />);

    const select = screen.getByRole('combobox', { name: /find star/i });
    const labels = Array.from(select.querySelectorAll('option'))
      .filter((o) => o.value !== '')
      .map((o) => o.textContent.trim());
    expectSystems(labels);
  });
});
