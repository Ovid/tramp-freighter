import { useEffect, useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

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
              <div>
                Deliver: {mission.requirements.quantity}{' '}
                {mission.requirements.cargo}
              </div>
              <div>Deadline: {mission.requirements.deadline} days</div>
              <div>Reward: ₡{mission.rewards.credits}</div>
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
