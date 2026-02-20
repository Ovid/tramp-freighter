import { useEffect, useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { capitalizeFirst, pluralizeUnit } from '@game/utils/string-utils.js';

export function MissionBoardPanel({ onClose }) {
  const missions = useGameEvent('missionsChanged');
  const { acceptMission, refreshMissionBoard } = useGameAction();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    refreshMissionBoard();
  }, [refreshMissionBoard]);

  const handleAccept = (mission) => {
    const result = acceptMission(mission);
    if (!result.success) {
      setFeedback(result.reason);
    } else {
      setFeedback(`Accepted: ${mission.title}`);
    }
  };

  return (
    <div id="mission-board-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        &times;
      </button>
      <h2>Mission Board</h2>
      {feedback && <div className="mission-feedback">{feedback}</div>}
      <div className="mission-list">
        {missions?.board?.map((mission) => (
          <div key={mission.id} className="mission-card">
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
            <div className="mission-details">
              {mission.type === 'passenger' ? (
                <>
                  <div className="passenger-type">
                    {capitalizeFirst(mission.passenger.type)}
                  </div>
                  <div className="passenger-dialogue">
                    &ldquo;{mission.passenger.dialogue}&rdquo;
                  </div>
                  <div>
                    Space Required:{' '}
                    {pluralizeUnit(mission.requirements.cargoSpace)}
                  </div>
                </>
              ) : mission.missionCargo ? (
                <>
                  <div>
                    Cargo: {mission.missionCargo.quantity}{' '}
                    {mission.missionCargo.good
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                  {mission.missionCargo.isIllegal && (
                    <div className="illegal-warning">Discreet Delivery</div>
                  )}
                </>
              ) : mission.requirements?.cargo ? (
                <div>
                  Deliver: {mission.requirements.quantity}{' '}
                  {mission.requirements.cargo}
                </div>
              ) : null}
              <div>Deadline: {mission.requirements.deadline} days</div>
              <div className={mission.saturated ? 'reward-saturated' : ''}>
                Reward: ₡{mission.rewards.credits}
                {mission.saturated && (
                  <span
                    className="saturation-hint"
                    title="Haulers on this route are plentiful — reduced pay"
                  >
                    {' '}▼
                  </span>
                )}
              </div>
            </div>
            <button
              className="accept-btn"
              onClick={() => handleAccept(mission)}
            >
              Accept
            </button>
          </div>
        ))}
        {(!missions?.board || missions.board.length === 0) && (
          <p>No contracts available. Check back tomorrow.</p>
        )}
      </div>
      <button className="station-btn" onClick={onClose}>
        Back
      </button>
    </div>
  );
}
