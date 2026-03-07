import { useMemo, useState } from 'react';
import { useGameAction } from '../../hooks/useGameAction.js';
import { Button } from '../../components/Button.jsx';
import { EndCredits } from './EndCredits.jsx';
import { gameDayToDate } from '../../game/utils/date-utils.js';
import './endgame.css';

export function Epilogue({ onCreditsComplete }) {
  const { getEpilogueData, getEpilogueStats } = useGameAction();
  const [phase, setPhase] = useState('epilogue');

  // Computed once — the game is over by the time Epilogue renders
  const sections = useMemo(() => getEpilogueData(), [getEpilogueData]);
  const stats = useMemo(() => getEpilogueStats(), [getEpilogueStats]);

  if (phase === 'credits') {
    return <EndCredits onCreditsComplete={onCreditsComplete} />;
  }

  if (phase === 'stats') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>VOYAGE STATISTICS</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span>Final date:</span>
              <span>{gameDayToDate(stats.daysElapsed ?? 0)}</span>
            </div>
            <div className="stat-row">
              <span>Systems visited:</span>
              <span>{stats.systemsVisited}</span>
            </div>
            <div className="stat-row">
              <span>Credits earned:</span>
              <span>₡{stats.creditsEarned.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>Missions completed:</span>
              <span>{stats.missionsCompleted}</span>
            </div>
            <div className="stat-row">
              <span>NPCs at Trusted or higher:</span>
              <span>{stats.trustedNPCs}</span>
            </div>
            <div className="stat-row">
              <span>Cargo hauled:</span>
              <span>{stats.cargoHauled} units</span>
            </div>
            <div className="stat-row">
              <span>Jumps made:</span>
              <span>{stats.jumpsCompleted}</span>
            </div>
          </div>
          <Button onClick={() => setPhase('credits')}>Credits</Button>
        </div>
      </div>
    );
  }

  return (
    <div id="epilogue" className="visible">
      <div className="endgame-panel">
        <h2>EPILOGUE</h2>
        {sections.map((section) => (
          <p key={section.id} className="epilogue-text">
            {section.text}
          </p>
        ))}
        <Button onClick={() => setPhase('stats')}>Continue</Button>
      </div>
    </div>
  );
}
