import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls';
import * as fc from 'fast-check';

/**
 * Property tests for camera controls / settings panel functionality.
 *
 * Tests verify:
 * - Settings panel is collapsible
 * - Zoom In/Out buttons work correctly
 * - Star Rotation toggle changes state
 * - Boundary toggle changes visibility
 */

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
vi.mock('../../src/context/GameContext', () => {
  const hook = () => ({
    getPreference: vi.fn((key) => {
      if (key === 'jumpWarningsEnabled') return true;
      return true;
    }),
    setPreference: vi.fn(),
  });
  return { useGame: hook };
});

// Mock useGameEvent
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => ({ jumpWarningsEnabled: true }),
}));

describe('Property: Settings Panel', () => {
  it('should start in collapsed state by default', () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    // Should have collapsed class
    const cameraControls = container.querySelector('#camera-controls');
    expect(cameraControls.classList.contains('collapsed')).toBe(true);
    expect(cameraControls.classList.contains('expanded')).toBe(false);

    // Settings panel should not be visible
    const settingsPanel = container.querySelector('.settings-panel');
    expect(settingsPanel).toBeFalsy();
  });

  it('should toggle settings panel visibility when toggle button clicked', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    expect(toggleButton).toBeTruthy();

    // Initially collapsed - settings panel should not be visible
    let settingsPanel = container.querySelector('.settings-panel');
    expect(settingsPanel).toBeFalsy();

    // Click to expand
    fireEvent.click(toggleButton);

    // Wait for panel to appear
    await waitFor(() => {
      settingsPanel = container.querySelector('.settings-panel');
      expect(settingsPanel).toBeTruthy();
    });

    // Verify toggle rows and action buttons are present
    const toggleRows = settingsPanel.querySelectorAll('.settings-toggle-row');
    const actionBtns = settingsPanel.querySelectorAll('.settings-action-btn');
    expect(toggleRows.length).toBe(4);
    expect(actionBtns.length).toBe(5);

    // Click to collapse
    fireEvent.click(toggleButton);

    // Wait for panel to disappear
    await waitFor(() => {
      settingsPanel = container.querySelector('.settings-panel');
      expect(settingsPanel).toBeFalsy();
    });
  });

  it('should reflect Star Rotation toggle state from props', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container, rerender } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    // Find Star Rotation checkbox by aria-label
    let rotationCheckbox = container.querySelector(
      'input[aria-label="Star Rotation"]'
    );
    expect(rotationCheckbox).toBeTruthy();
    expect(rotationCheckbox.checked).toBe(true);

    // Click to toggle rotation
    fireEvent.click(rotationCheckbox);
    expect(mockHandlers.onToggleRotation).toHaveBeenCalledTimes(1);

    // Re-render with rotation disabled
    rerender(
      <CameraControls
        cameraState={{ autoRotationEnabled: false, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    // Checkbox should now be unchecked
    rotationCheckbox = container.querySelector(
      'input[aria-label="Star Rotation"]'
    );
    expect(rotationCheckbox.checked).toBe(false);
  });

  it('should reflect Boundary toggle state from props', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container, rerender } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    // Find Boundary checkbox by aria-label
    let boundaryCheckbox = container.querySelector(
      'input[aria-label="Boundary"]'
    );
    expect(boundaryCheckbox).toBeTruthy();
    expect(boundaryCheckbox.checked).toBe(true);

    // Click to toggle boundary
    fireEvent.click(boundaryCheckbox);
    expect(mockHandlers.onToggleBoundary).toHaveBeenCalledTimes(1);

    // Re-render with boundary hidden
    rerender(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: false }}
        {...mockHandlers}
      />
    );

    // Checkbox should now be unchecked
    boundaryCheckbox = container.querySelector('input[aria-label="Boundary"]');
    expect(boundaryCheckbox.checked).toBe(false);
  });

  it('Property: Star Rotation toggle calls handler on each click', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (clickCount) => {
        const mockHandlers = {
          onZoomIn: vi.fn(),
          onZoomOut: vi.fn(),
          onToggleRotation: vi.fn(),
          onToggleBoundary: vi.fn(),
        };

        const { container } = render(
          <CameraControls
            cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
            {...mockHandlers}
          />
        );

        const toggleButton = container.querySelector('.camera-controls-toggle');
        fireEvent.click(toggleButton);

        // Find Star Rotation checkbox
        const rotationCheckbox = container.querySelector(
          'input[aria-label="Star Rotation"]'
        );

        // Click the checkbox clickCount times
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(rotationCheckbox);
        }

        // Verify handler was called exactly clickCount times
        expect(mockHandlers.onToggleRotation).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property: Boundary toggle calls handler on each click', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (clickCount) => {
        const mockHandlers = {
          onZoomIn: vi.fn(),
          onZoomOut: vi.fn(),
          onToggleRotation: vi.fn(),
          onToggleBoundary: vi.fn(),
        };

        const { container } = render(
          <CameraControls
            cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
            {...mockHandlers}
          />
        );

        const toggleButton = container.querySelector('.camera-controls-toggle');
        fireEvent.click(toggleButton);

        // Find Boundary checkbox
        const boundaryCheckbox = container.querySelector(
          'input[aria-label="Boundary"]'
        );

        // Click the checkbox clickCount times
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(boundaryCheckbox);
        }

        // Verify handler was called exactly clickCount times
        expect(mockHandlers.onToggleBoundary).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should render GitHub link when expanded', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    const githubLink = container.querySelector(
      'a[href="https://github.com/Ovid/tramp-freighter/"]'
    );
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(githubLink.textContent.trim()).toBe('GitHub');
  });

  it('should have all toggle rows and action buttons when expanded', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    const toggleRows = container.querySelectorAll('.settings-toggle-row');
    expect(toggleRows.length).toBe(4);

    const actionBtns = container.querySelectorAll('.settings-action-btn');
    expect(actionBtns.length).toBe(5);

    // Verify action button labels
    const actionTexts = Array.from(actionBtns).map((btn) =>
      btn.textContent.trim()
    );
    expect(actionTexts).toContain('GitHub');
    expect(actionTexts).toContain('Achievements');
    expect(actionTexts).toContain('Zoom In');
    expect(actionTexts).toContain('Zoom Out');
    expect(actionTexts).toContain('Instructions');
  });

  it('should render Instructions button when expanded', async () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(container.querySelector('.settings-panel')).toBeTruthy();
    });

    const actionBtns = container.querySelectorAll('.settings-action-btn');
    const instructionsButton = Array.from(actionBtns).find((btn) =>
      btn.textContent.includes('Instructions')
    );

    expect(instructionsButton).toBeTruthy();
  });

  it('should call zoom handlers when zoom buttons clicked', () => {
    const mockHandlers = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onToggleRotation: vi.fn(),
      onToggleBoundary: vi.fn(),
    };

    const { container } = render(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    const toggleButton = container.querySelector('.camera-controls-toggle');
    fireEvent.click(toggleButton);

    const actionBtns = container.querySelectorAll('.settings-action-btn');
    const zoomInButton = Array.from(actionBtns).find((btn) =>
      btn.textContent.includes('Zoom In')
    );
    const zoomOutButton = Array.from(actionBtns).find((btn) =>
      btn.textContent.includes('Zoom Out')
    );

    fireEvent.click(zoomInButton);
    expect(mockHandlers.onZoomIn).toHaveBeenCalledTimes(1);

    fireEvent.click(zoomOutButton);
    expect(mockHandlers.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('Property: Zoom In button calls handler on each click', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (clickCount) => {
        const mockHandlers = {
          onZoomIn: vi.fn(),
          onZoomOut: vi.fn(),
          onToggleRotation: vi.fn(),
          onToggleBoundary: vi.fn(),
        };

        const { container } = render(
          <CameraControls
            cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
            {...mockHandlers}
          />
        );

        const toggleButton = container.querySelector('.camera-controls-toggle');
        fireEvent.click(toggleButton);

        const actionBtns = container.querySelectorAll('.settings-action-btn');
        const zoomInButton = Array.from(actionBtns).find((btn) =>
          btn.textContent.includes('Zoom In')
        );

        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(zoomInButton);
        }

        expect(mockHandlers.onZoomIn).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property: Zoom Out button calls handler on each click', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (clickCount) => {
        const mockHandlers = {
          onZoomIn: vi.fn(),
          onZoomOut: vi.fn(),
          onToggleRotation: vi.fn(),
          onToggleBoundary: vi.fn(),
        };

        const { container } = render(
          <CameraControls
            cameraState={{ autoRotationEnabled: true, boundaryVisible: true }}
            {...mockHandlers}
          />
        );

        const toggleButton = container.querySelector('.camera-controls-toggle');
        fireEvent.click(toggleButton);

        const actionBtns = container.querySelectorAll('.settings-action-btn');
        const zoomOutButton = Array.from(actionBtns).find((btn) =>
          btn.textContent.includes('Zoom Out')
        );

        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(zoomOutButton);
        }

        expect(mockHandlers.onZoomOut).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
