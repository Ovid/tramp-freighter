/**
 * Ship Naming Dialog Component
 *
 * Displays a dialog for the player to name their ship at the start of a new game.
 * Provides suggested names and sanitizes user input.
 *
 * React Migration Spec: Requirements 48.1, 48.2, 48.3, 48.4, 48.5, 48.6, 48.7
 */
import { useState } from 'react';
import { SHIP_CONFIG } from '../../game/constants';
import { sanitizeShipName } from '../../game/state/game-state-manager';

/**
 * ShipNamingDialog component that allows the player to name their ship.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Callback when ship name is submitted (sanitizedName: string)
 * @returns {JSX.Element} Ship naming dialog component
 */
export function ShipNamingDialog({ onSubmit }) {
  const [shipName, setShipName] = useState('');

  const handleSubmit = () => {
    const sanitized = sanitizeShipName(shipName);
    onSubmit(sanitized);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSuggestionClick = (name) => {
    setShipName(name);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-content">
          <h2 className="modal-title">Name Your Ship</h2>
          <p className="modal-description">What will you call your vessel?</p>

          <div className="ship-naming-input-group">
            <input
              type="text"
              className="ship-name-input"
              value={shipName}
              onChange={(e) => setShipName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter ship name..."
              autoFocus
            />
          </div>

          <div className="ship-name-suggestions">
            <p className="suggestions-label">Suggestions:</p>
            <div className="suggestions-list">
              {SHIP_CONFIG.NAME_SUGGESTIONS.map((name) => (
                <button
                  key={name}
                  className="suggestion-btn"
                  onClick={() => handleSuggestionClick(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button className="modal-confirm" onClick={handleSubmit}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
