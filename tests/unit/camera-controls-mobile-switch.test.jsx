// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/navigation/MobileCameraToolbar', () => ({
  MobileCameraToolbar: () => <div data-testid="mobile-camera-toolbar" />,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));
vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [],
}));
vi.mock('../../src/context/GameContext', () => ({
  useGame: () => ({ getVisitedSystems: () => [], setPreference: vi.fn() }),
}));
vi.mock('../../src/context/StarmapContext', () => ({
  useStarmap: () => ({ selectStarById: vi.fn() }),
}));
vi.mock('../../src/hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));
vi.mock('../../src/features/instructions/InstructionsModal', () => ({
  InstructionsModal: () => null,
}));
vi.mock('../../src/features/achievements/AchievementsModal', () => ({
  AchievementsModal: () => null,
}));
vi.mock('../../src/components/CustomSelect', () => ({
  CustomSelect: () => <select data-testid="custom-select" />,
}));

afterEach(() => vi.restoreAllMocks());

describe('CameraControls mobile/desktop switch', () => {
  it('should render mobile toolbar when isMobile is true', async () => {
    const { CameraControls } = await import(
      '../../src/features/navigation/CameraControls'
    );
    const { container } = render(
      <MobileProvider isMobile={true}>
        <CameraControls
          cameraState={{ autoRotationEnabled: true, boundaryVisible: false }}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onToggleRotation={() => {}}
          onToggleBoundary={() => {}}
        />
      </MobileProvider>,
    );
    expect(
      container.querySelector('[data-testid="mobile-camera-toolbar"]'),
    ).toBeTruthy();
    expect(container.querySelector('#camera-controls')).toBeNull();
  });

  it('should render desktop controls when isMobile is false', async () => {
    const { CameraControls } = await import(
      '../../src/features/navigation/CameraControls'
    );
    const { container } = render(
      <MobileProvider isMobile={false}>
        <CameraControls
          cameraState={{ autoRotationEnabled: true, boundaryVisible: false }}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onToggleRotation={() => {}}
          onToggleBoundary={() => {}}
        />
      </MobileProvider>,
    );
    expect(container.querySelector('#camera-controls')).toBeTruthy();
    expect(
      container.querySelector('[data-testid="mobile-camera-toolbar"]'),
    ).toBeNull();
  });
});
