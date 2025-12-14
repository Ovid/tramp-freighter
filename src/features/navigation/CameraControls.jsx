import { useState } from 'react';

/**
 * CameraControls component provides debug/camera control buttons.
 *
 * Features:
 * - Zoom In/Out buttons
 * - Toggle Rotation button
 * - Toggle Boundary button
 * - Collapsible panel that can be hidden/shown
 *
 * These controls supplement mouse/trackpad controls for the starmap camera.
 *
 * @param {Object} cameraState - Current camera state from starmap
 * @param {Function} onZoomIn - Callback to zoom camera in
 * @param {Function} onZoomOut - Callback to zoom camera out
 * @param {Function} onToggleRotation - Callback to toggle auto-rotation
 * @param {Function} onToggleBoundary - Callback to toggle boundary visibility
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
            className={`control-btn ${cameraState?.autoRotationEnabled ? 'active' : ''}`}
            onClick={onToggleRotation}
          >
            Toggle Rotation
          </button>
          <button
            className={`control-btn ${cameraState?.boundaryVisible ? 'active' : ''}`}
            onClick={onToggleBoundary}
          >
            Toggle Boundary
          </button>
        </div>
      )}
    </div>
  );
}
