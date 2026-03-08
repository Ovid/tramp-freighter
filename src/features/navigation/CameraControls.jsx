import { useState, useEffect } from 'react';
import { InstructionsModal } from '../instructions/InstructionsModal';
import { AchievementsModal } from '../achievements/AchievementsModal';
import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants';

export function CameraControls({
  cameraState,
  onZoomIn,
  onZoomOut,
  onToggleRotation,
  onToggleBoundary,
}) {
  const game = useGame();
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);

  const [isExpanded, setIsExpanded] = useState(false);
  const [antimatter, setAntimatter] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (antimatter) {
      document.documentElement.classList.add('antimatter');
    } else {
      document.documentElement.classList.remove('antimatter');
    }
    return () => document.documentElement.classList.remove('antimatter');
  }, [antimatter]);

  const toggleAntimatter = () => {
    setAntimatter((prev) => !prev);
  };

  const toggleJumpWarnings = () => {
    game.setPreference('jumpWarningsEnabled', !jumpWarningsEnabled);
  };

  return (
    <div id="camera-controls" className={isExpanded ? 'expanded' : 'collapsed'}>
      <button
        className="camera-controls-toggle"
        onClick={toggleExpanded}
        aria-label="Toggle settings"
      >
        ⚙
      </button>

      {isExpanded && (
        <div className="settings-panel">
          <div className="settings-header">Settings</div>

          <div className="settings-list">
            {/* Toggle switches */}
            <label className="settings-toggle-row">
              <span className="settings-label">Star Rotation</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.autoRotationEnabled}
                onChange={onToggleRotation}
                aria-label="Star Rotation"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Boundary</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.boundaryVisible}
                onChange={onToggleBoundary}
                aria-label="Boundary"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Antimatter</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={antimatter}
                onChange={toggleAntimatter}
                aria-label="Antimatter"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Jump Warnings</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={jumpWarningsEnabled}
                onChange={toggleJumpWarnings}
                aria-label="Jump Warnings"
              />
              <span className="settings-toggle-slider" />
            </label>

            <div className="settings-divider" />

            {/* Action buttons */}
            <button className="settings-action-btn" onClick={onZoomIn}>
              Zoom In
            </button>
            <button className="settings-action-btn" onClick={onZoomOut}>
              Zoom Out
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowInstructions(true)}
            >
              Instructions
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowAchievements(true)}
            >
              Achievements
            </button>
            <a
              className="settings-action-btn"
              href="https://github.com/Ovid/tramp-freighter/"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      )}

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        shipName={shipName}
      />
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </div>
  );
}
