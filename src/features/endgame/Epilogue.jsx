import { useMemo, useState } from 'react';
import { useGameState } from '../../context/GameContext.jsx';
import { generateEpilogue, generateStats } from '../../game/data/epilogue-data.js';
import { Button } from '../../components/Button.jsx';
import './endgame.css';

export function Epilogue({ onReturnToTitle }) {
  const gameStateManager = useGameState();
  const [phase, setPhase] = useState('epilogue');

  const state = gameStateManager.state;
  const sections = useMemo(() => generateEpilogue(state), [state]);
  const stats = useMemo(() => generateStats(state), [state]);

  if (phase === 'credits') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>TRAMP FREIGHTER BLUES</h2>
          <p className="credits-text">A space trading survival game</p>
          <Button onClick={onReturnToTitle}>Return to Title</Button>
        </div>
      </div>
    );
  }

  if (phase === 'stats') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>VOYAGE STATISTICS</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span>Days traveled:</span>
              <span>{stats.daysElapsed}</span>
            </div>
            <div className="stat-row">
              <span>Systems visited:</span>
              <span>{stats.systemsVisited}</span>
            </div>
            <div className="stat-row">
              <span>Credits earned:</span>
              <span>{stats.creditsEarned.toLocaleString()}</span>
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
