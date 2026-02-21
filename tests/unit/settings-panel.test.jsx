import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls';

const defaultProps = {
  cameraState: { autoRotationEnabled: true, boundaryVisible: true },
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onToggleRotation: vi.fn(),
  onToggleBoundary: vi.fn(),
};

describe('Settings Panel', () => {
  describe('Gear icon toggle', () => {
    it('should display a gear icon on the toggle button', () => {
      const { container } = render(<CameraControls {...defaultProps} />);
      const toggle = container.querySelector('.camera-controls-toggle');
      expect(toggle.textContent).toContain('⚙');
      expect(toggle.textContent).not.toContain('Camera');
    });
  });

  describe('Antimatter Mode', () => {
    it('should show an Antimatter toggle when expanded', async () => {
      const { container } = render(<CameraControls {...defaultProps} />);
      const toggle = container.querySelector('.camera-controls-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        const buttons = container.querySelectorAll('.control-btn');
        const antimatterBtn = Array.from(buttons).find(
          (btn) =>
            btn.textContent.includes('Antimatter') ||
            btn.textContent.includes('Matter')
        );
        expect(antimatterBtn).toBeTruthy();
      });
    });

    it('should toggle label between Matter and Antimatter on click', async () => {
      const { container } = render(<CameraControls {...defaultProps} />);
      const toggle = container.querySelector('.camera-controls-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(
          container.querySelector('.camera-controls-buttons')
        ).toBeTruthy();
      });

      const buttons = container.querySelectorAll('.control-btn');
      const antimatterBtn = Array.from(buttons).find(
        (btn) => btn.textContent.trim() === 'Antimatter'
      );

      expect(antimatterBtn).toBeTruthy();

      // Click to activate
      fireEvent.click(antimatterBtn);

      // Now should say "Matter"
      const updatedButtons = container.querySelectorAll('.control-btn');
      const matterBtn = Array.from(updatedButtons).find(
        (btn) => btn.textContent.trim() === 'Matter'
      );
      expect(matterBtn).toBeTruthy();
    });

    it('should apply invert class to document element when antimatter active', async () => {
      const { container } = render(<CameraControls {...defaultProps} />);
      const toggle = container.querySelector('.camera-controls-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(
          container.querySelector('.camera-controls-buttons')
        ).toBeTruthy();
      });

      const buttons = container.querySelectorAll('.control-btn');
      const antimatterBtn = Array.from(buttons).find((btn) =>
        btn.textContent.includes('Antimatter')
      );

      fireEvent.click(antimatterBtn);
      expect(document.documentElement.classList.contains('antimatter')).toBe(
        true
      );
    });

    it('should remove invert class when toggled back to matter', async () => {
      const { container } = render(<CameraControls {...defaultProps} />);
      const toggle = container.querySelector('.camera-controls-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(
          container.querySelector('.camera-controls-buttons')
        ).toBeTruthy();
      });

      const buttons = container.querySelectorAll('.control-btn');
      const antimatterBtn = Array.from(buttons).find((btn) =>
        btn.textContent.includes('Antimatter')
      );

      // Activate
      fireEvent.click(antimatterBtn);
      expect(document.documentElement.classList.contains('antimatter')).toBe(
        true
      );

      // Find the now-labeled "Matter" button and click again
      const updatedButtons = container.querySelectorAll('.control-btn');
      const matterBtn = Array.from(updatedButtons).find(
        (btn) => btn.textContent.trim() === 'Matter'
      );
      fireEvent.click(matterBtn);
      expect(document.documentElement.classList.contains('antimatter')).toBe(
        false
      );
    });
  });
});
