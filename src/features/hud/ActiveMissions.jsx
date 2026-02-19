import { useGameEvent } from '../../hooks/useGameEvent';

export function ActiveMissions() {
  const missions = useGameEvent('missionsChanged');
  const daysElapsed = useGameEvent('timeChanged');

  if (!missions?.active?.length) return null;

  return (
    <div className="active-missions-hud">
      <h4>Active Missions</h4>
      {missions.active.map((mission) => {
        const daysRemaining = Math.max(0, Math.ceil(mission.deadlineDay - daysElapsed));
        const isUrgent = daysRemaining <= 2;

        return (
          <div key={mission.id} className={`mission-hud-item ${isUrgent ? 'urgent' : ''}`}>
            <div className="mission-hud-title">{mission.title}</div>
            <div className="mission-hud-deadline">
              {daysRemaining > 0 ? `${daysRemaining}d remaining` : 'EXPIRED'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
