import { useState } from 'react';

export function MobileCameraToolbar({
  onZoomIn,
  onZoomOut,
  onFindStar,
  stars,
  visitedSet,
  toggles,
  onToggle,
  onShowInstructions,
  onShowAchievements,
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      className="mobile-camera-toolbar"
      role="toolbar"
      aria-label="Starmap controls"
    >
      <button
        className="mobile-toolbar-btn"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        className="mobile-toolbar-btn"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        +
      </button>
      <label className="mobile-toolbar-find">
        <select
          className="mobile-toolbar-select"
          value=""
          onChange={(e) => onFindStar(e.target.value)}
          aria-label="Find star"
        >
          <option value="" disabled>
            Find...
          </option>
          {stars.map((star) => (
            <option key={star.id} value={star.id}>
              {visitedSet?.has(star.id) ? '\u2713 ' : '  '}
              {star.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="mobile-toolbar-btn"
        onClick={() => setShowSettings(!showSettings)}
        aria-label="Settings"
        aria-expanded={showSettings}
      >
        ⚙
      </button>

      {showSettings && (
        <div className="mobile-toolbar-popover">
          {Object.entries(toggles).map(([key, value]) => {
            const label = key
              .replace(/^show/, '')
              .replace(/([A-Z])/g, ' $1')
              .trim();
            return (
              <label key={key} className="mobile-toolbar-toggle">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => onToggle(key)}
                />
                {label}
              </label>
            );
          })}
          <button
            className="mobile-toolbar-action"
            onClick={() => {
              setShowSettings(false);
              onShowInstructions();
            }}
          >
            Instructions
          </button>
          <button
            className="mobile-toolbar-action"
            onClick={() => {
              setShowSettings(false);
              onShowAchievements();
            }}
          >
            Achievements
          </button>
        </div>
      )}
    </div>
  );
}
