import { useState } from 'react';

/**
 * CameraControls component provides debug/camera control buttons.
 *
 * These controls supplement mouse/trackpad controls for the starmap camera.
 * The panel is collapsible to minimize screen clutter during normal gameplay.
 *
 * Features:
 * - Zoom In/Out buttons for camera distance adjustment
 * - Toggle Rotation button to enable/disable automatic camera orbit
 * - Toggle Boundary button to show/hide the 20 light-year sector boundary
 * - Collapsible panel that can be hidden/shown with toggle button
 *
 * @param {Object} props - Component props
 * @param {Object} props.cameraState - Current camera state from starmap
 * @param {boolean} props.cameraState.autoRotationEnabled - Whether auto-rotation is currently enabled
 * @param {boolean} props.cameraState.boundaryVisible - Whether sector boundary is currently visible
 * @param {Function} props.onZoomIn - Callback to zoom camera in (decreases distance to target)
 * @param {Function} props.onZoomOut - Callback to zoom camera out (increases distance from target)
 * @param {Function} props.onToggleRotation - Callback to toggle auto-rotation on/off
 * @param {Function} props.onToggleBoundary - Callback to toggle boundary visibility on/off
 */
export function CameraControls({
  cameraState,
  onZoomIn,
  onZoomOut,
  onToggleRotation,
  onToggleBoundary,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div id="camera-controls" className={isExpanded ? 'expanded' : 'collapsed'}>
      <button className="camera-controls-toggle" onClick={toggleExpanded}>
        {isExpanded ? '◀' : '▶'} Camera
      </button>

      {isExpanded && (
        <div className="camera-controls-buttons">
          <button className="control-btn" onClick={onZoomIn}>
            Zoom In
          </button>
          <button className="control-btn" onClick={onZoomOut}>
            Zoom Out
          </button>
          <button
            className={`control-btn ${cameraState.autoRotationEnabled ? 'active' : ''}`}
            onClick={onToggleRotation}
          >
            Toggle Rotation
          </button>
          <button
            className={`control-btn ${cameraState.boundaryVisible ? 'active' : ''}`}
            onClick={onToggleBoundary}
          >
            Toggle Boundary
          </button>
        </div>
      )}
    </div>
  );
}
