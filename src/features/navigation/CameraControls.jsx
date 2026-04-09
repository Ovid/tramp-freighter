import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { InstructionsModal } from '../instructions/InstructionsModal';
import { AchievementsModal } from '../achievements/AchievementsModal';
import { CustomSelect } from '../../components/CustomSelect';
import { useGame } from '../../context/GameContext';
import { useStarmap } from '../../context/StarmapContext';
import { useMobile } from '../../context/MobileContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useStarData } from '../../hooks/useStarData';
import { useClickOutside } from '../../hooks/useClickOutside';
import { MobileCameraToolbar } from './MobileCameraToolbar';
import { EVENT_NAMES } from '../../game/constants';

export function CameraControls({
  cameraState,
  onZoomIn,
  onZoomOut,
  onToggleRotation,
  onToggleBoundary,
}) {
  const game = useGame();
  const { selectStarById } = useStarmap();
  const starData = useStarData();
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  const [isExpanded, setIsExpanded] = useState(false);
  const [antimatter, setAntimatter] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const controlsRef = useRef(null);

  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;

  const visitedSet = new Set(game.getVisitedSystems());

  const sortedStars = useMemo(() => {
    if (!starData) return [];
    return [...starData].sort((a, b) => a.name.localeCompare(b.name));
  }, [starData]);

  const collapseSettings = useCallback(() => setIsExpanded(false), []);
  useClickOutside(controlsRef, collapseSettings, isExpanded);

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

  const { isMobile } = useMobile();

  if (isMobile) {
    return (
      <>
        <MobileCameraToolbar
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFindStar={(val) => {
            const systemId = parseInt(val, 10);
            if (!isNaN(systemId)) selectStarById(systemId);
          }}
          stars={sortedStars}
          toggles={{
            showAntimatter: antimatter,
            showJumpWarnings: jumpWarningsEnabled,
            showRotation: cameraState.autoRotationEnabled,
            showBoundary: cameraState.boundaryVisible,
          }}
          onToggle={(key) => {
            const handlers = {
              showAntimatter: toggleAntimatter,
              showJumpWarnings: toggleJumpWarnings,
              showRotation: onToggleRotation,
              showBoundary: onToggleBoundary,
            };
            handlers[key]?.();
          }}
        />
        <InstructionsModal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          shipName={shipName}
        />
        <AchievementsModal
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
        />
      </>
    );
  }

  return (
    <div
      id="camera-controls"
      ref={controlsRef}
      data-panel
      className={isExpanded ? 'expanded' : 'collapsed'}
    >
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

            <div className="settings-star-finder">
              <span className="settings-label">Find Star</span>
              <CustomSelect
                className="star-finder-select"
                options={sortedStars.map((star) => ({
                  value: String(star.id),
                  label: `${visitedSet.has(star.id) ? '\u2713 ' : '  '}${star.name}`,
                }))}
                value=""
                onChange={(val) => {
                  const systemId = parseInt(val, 10);
                  if (!isNaN(systemId)) {
                    selectStarById(systemId);
                  }
                }}
                placeholder="-- Select --"
                aria-label="Find star system"
              />
            </div>

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
