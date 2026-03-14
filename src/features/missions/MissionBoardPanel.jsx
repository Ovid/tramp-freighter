import { useEffect, useMemo, useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useGame } from '../../context/GameContext';
import { useStarData } from '../../hooks/useStarData';
import { EVENT_NAMES, MISSION_CONFIG } from '../../game/constants.js';
import { capitalizeFirst, pluralizeUnit } from '@game/utils/string-utils.js';
import {
  calculateRouteIndicator,
  formatRouteIndicator,
  getFeasibilityWarning,
} from './missionRouteUtils.js';

export function MissionBoardPanel({ onClose }) {
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  // Quest changes affect getEffectiveMissionCount() via Tanaka quest slot
  useGameEvent(EVENT_NAMES.QUEST_CHANGED);
  const { acceptMission, refreshMissionBoard } = useGameAction();
  const game = useGame();
  const starData = useStarData();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    refreshMissionBoard();
  }, [refreshMissionBoard]);

  // Pre-compute route indicators for all board missions
  const routeIndicators = useMemo(() => {
    if (!missions?.board || !starData || !game?.navigationSystem) {
      return {};
    }
    const indicators = {};
    for (const mission of missions.board) {
      const destId = mission.destination?.systemId;
      const originId = mission.giverSystem;
      if (destId !== undefined && originId !== undefined) {
        indicators[mission.id] = calculateRouteIndicator(
          originId,
          destId,
          starData,
          game.navigationSystem
        );
      }
    }
    return indicators;
  }, [missions?.board, starData, game?.navigationSystem]);

  // Compute why each board mission can't be accepted (if any).
  // No useMemo — the computation is trivially cheap and avoiding it
  // eliminates stale-dependency bugs with quests/active array references.
  const disabledReasons = (() => {
    if (!missions?.board) return {};
    const activeCount = game.getEffectiveMissionCount();
    const cargoRemaining = game.getCargoRemaining();
    const activeIds = new Set((missions.active ?? []).map((m) => m.id));

    const reasons = {};
    for (const mission of missions.board) {
      if (activeCount >= MISSION_CONFIG.MAX_ACTIVE) {
        reasons[mission.id] =
          `Maximum ${MISSION_CONFIG.MAX_ACTIVE} active missions.`;
      } else if (activeIds.has(mission.id)) {
        reasons[mission.id] = 'Already accepted.';
      } else if (
        mission.type === 'passenger' &&
        mission.requirements.cargoSpace > cargoRemaining
      ) {
        reasons[mission.id] =
          `Need ${mission.requirements.cargoSpace} cargo space (${cargoRemaining} available).`;
      } else if (
        mission.missionCargo &&
        mission.missionCargo.quantity > cargoRemaining
      ) {
        reasons[mission.id] =
          `Need ${mission.missionCargo.quantity} cargo space (${cargoRemaining} available).`;
      }
    }
    return reasons;
  })();

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
      <button className="close-btn" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <h2>Mission Board</h2>
      {feedback && <div className="mission-feedback">{feedback}</div>}
      <div className="mission-list">
        {missions?.board?.map((mission) => (
          <div key={mission.id} className="mission-card">
            <h3>
              {mission.title}
              {mission.priority && (
                <span className="priority-badge">PRIORITY</span>
              )}
            </h3>
            <p>{mission.description}</p>
            {routeIndicators[mission.id] && (
              <div className="mission-route-info">
                {formatRouteIndicator(routeIndicators[mission.id])}
              </div>
            )}
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
              {(() => {
                const warning = getFeasibilityWarning(
                  routeIndicators[mission.id]?.totalDays,
                  mission.requirements.deadline
                );
                return warning ? (
                  <div
                    className={`feasibility-warning feasibility-${warning.level}`}
                  >
                    {warning.text}
                  </div>
                ) : null;
              })()}
              <div className={mission.saturated ? 'reward-saturated' : ''}>
                Reward: ₡{mission.rewards.credits}
                {mission.saturated && (
                  <span
                    className="saturation-hint"
                    title="Haulers on this route are plentiful — reduced pay"
                    aria-label="Reduced pay: haulers on this route are plentiful"
                  >
                    {' '}
                    ▼
                  </span>
                )}
              </div>
            </div>
            <button
              className="accept-btn"
              onClick={() => handleAccept(mission)}
              disabled={!!disabledReasons[mission.id]}
              title={disabledReasons[mission.id] || ''}
            >
              Accept
            </button>
            {disabledReasons[mission.id] && (
              <div className="mission-disabled-reason">
                {disabledReasons[mission.id]}
              </div>
            )}
          </div>
        ))}
        {(!missions?.board || missions.board.length === 0) && (
          <p>No contracts available. Check back tomorrow.</p>
        )}
      </div>
      <button className="station-btn secondary" onClick={onClose}>
        Back to Station
      </button>
    </div>
  );
}
