import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls';
import * as fc from 'fast-check';

/**
 * Property tests for camera controls functionality.
 *
 * Tests verify:
 * - Camera controls are collapsible
 * - Zoom In/Out buttons work correctly
 * - Toggle Rotation button changes state
 * - Toggle Boundary button changes visibility
 */

describe('Property: Camera Controls', () => {
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

    // Buttons should not be visible
    const controlButtons = container.querySelector('.camera-controls-buttons');
    expect(controlButtons).toBeFalsy();
  });

  it('should toggle camera controls visibility when toggle button clicked', async () => {
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

    // Initially collapsed - buttons should not be visible
    let controlButtons = container.querySelector('.camera-controls-buttons');
    expect(controlButtons).toBeFalsy();

    // Click to expand
    fireEvent.click(toggleButton);

    // Wait for buttons to appear
    await waitFor(() => {
      controlButtons = container.querySelector('.camera-controls-buttons');
      expect(controlButtons).toBeTruthy();
    });

    // Verify all 6 buttons are present
    const buttons = controlButtons.querySelectorAll('.control-btn');
    expect(buttons.length).toBe(6);

    // Click to collapse
    fireEvent.click(toggleButton);

    // Wait for buttons to disappear
    await waitFor(() => {
      controlButtons = container.querySelector('.camera-controls-buttons');
      expect(controlButtons).toBeFalsy();
    });
  });

  it('should show active state for Toggle Rotation button when rotation disabled', async () => {
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
      expect(container.querySelector('.camera-controls-buttons')).toBeTruthy();
    });

    // Find Toggle Rotation button
    const buttons = container.querySelectorAll('.control-btn');
    const rotationButton = Array.from(buttons).find((btn) =>
      btn.textContent.includes('Toggle Rotation')
    );

    expect(rotationButton).toBeTruthy();

    // Initially not active (rotation enabled = default state)
    expect(rotationButton.classList.contains('active')).toBe(false);

    // Click to disable rotation
    fireEvent.click(rotationButton);
    expect(mockHandlers.onToggleRotation).toHaveBeenCalledTimes(1);

    // Re-render with rotation disabled
    rerender(
      <CameraControls
        cameraState={{ autoRotationEnabled: false, boundaryVisible: true }}
        {...mockHandlers}
      />
    );

    // Should now be active (rotation off = highlighted)
    const updatedButtons = container.querySelectorAll('.control-btn');
    const updatedRotationButton = Array.from(updatedButtons).find((btn) =>
      btn.textContent.includes('Toggle Rotation')
    );
    expect(updatedRotationButton.classList.contains('active')).toBe(true);
  });

  it('should show active state for Toggle Boundary button when boundary hidden', async () => {
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
      expect(container.querySelector('.camera-controls-buttons')).toBeTruthy();
    });

    // Find Toggle Boundary button
    const buttons = container.querySelectorAll('.control-btn');
    const boundaryButton = Array.from(buttons).find((btn) =>
      btn.textContent.includes('Toggle Boundary')
    );

    expect(boundaryButton).toBeTruthy();

    // Initially not active (boundary visible = default state)
    expect(boundaryButton.classList.contains('active')).toBe(false);

    // Click to hide boundary
    fireEvent.click(boundaryButton);
    expect(mockHandlers.onToggleBoundary).toHaveBeenCalledTimes(1);

    // Re-render with boundary hidden
    rerender(
      <CameraControls
        cameraState={{ autoRotationEnabled: true, boundaryVisible: false }}
        {...mockHandlers}
      />
    );

    // Should now be active (boundary off = highlighted)
    const updatedButtons = container.querySelectorAll('.control-btn');
    const updatedBoundaryButton = Array.from(updatedButtons).find((btn) =>
      btn.textContent.includes('Toggle Boundary')
    );
    expect(updatedBoundaryButton.classList.contains('active')).toBe(true);
  });

  it('Property: Toggle Rotation button calls handler on each click', () => {
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

        // Find Toggle Rotation button
        const buttons = container.querySelectorAll('.control-btn');
        const rotationButton = Array.from(buttons).find((btn) =>
          btn.textContent.includes('Toggle Rotation')
        );

        // Click the button clickCount times
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(rotationButton);
        }

        // Verify handler was called exactly clickCount times
        expect(mockHandlers.onToggleRotation).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('Property: Toggle Boundary button calls handler on each click', () => {
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

        // Find Toggle Boundary button
        const buttons = container.querySelectorAll('.control-btn');
        const boundaryButton = Array.from(buttons).find((btn) =>
          btn.textContent.includes('Toggle Boundary')
        );

        // Click the button clickCount times
        for (let i = 0; i < clickCount; i++) {
          fireEvent.click(boundaryButton);
        }

        // Verify handler was called exactly clickCount times
        expect(mockHandlers.onToggleBoundary).toHaveBeenCalledTimes(clickCount);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should have all 6 control buttons when expanded', async () => {
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
      expect(container.querySelector('.camera-controls-buttons')).toBeTruthy();
    });

    const buttons = container.querySelectorAll('.control-btn');
    expect(buttons.length).toBe(6);

    // Verify button labels
    const buttonTexts = Array.from(buttons).map((btn) =>
      btn.textContent.trim()
    );
    expect(buttonTexts).toContain('Zoom In');
    expect(buttonTexts).toContain('Zoom Out');
    expect(buttonTexts).toContain('Toggle Rotation');
    expect(buttonTexts).toContain('Toggle Boundary');
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
      expect(container.querySelector('.camera-controls-buttons')).toBeTruthy();
    });

    const buttons = container.querySelectorAll('.control-btn');
    const instructionsButton = Array.from(buttons).find((btn) =>
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

    const buttons = container.querySelectorAll('.control-btn');
    const zoomInButton = Array.from(buttons).find((btn) =>
      btn.textContent.includes('Zoom In')
    );
    const zoomOutButton = Array.from(buttons).find((btn) =>
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

        const buttons = container.querySelectorAll('.control-btn');
        const zoomInButton = Array.from(buttons).find((btn) =>
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

        const buttons = container.querySelectorAll('.control-btn');
        const zoomOutButton = Array.from(buttons).find((btn) =>
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
