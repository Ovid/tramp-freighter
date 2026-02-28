import { useState } from 'react';
import { useGameState } from '../../context/GameContext.jsx';
import { Button } from '../../components/Button.jsx';
import './endgame.css';

const JUMP_SEQUENCE = [
  "The Range Extender hums to life. Your ship vibrates in a way you've never felt before.",
  'Tanaka\'s voice crackles over the comm. "Coordinates locked. Delta Pavonis. 19.89 light-years. Initiating jump in three... two... one..."',
  'The stars stretch. Reality bends. Your ship screams through space in ways it was never meant to.',
  'And then... silence.',
  'Delta Pavonis burns ahead of you. Orange. Warm. Home.',
  'You made it.',
];

export function PavonisRun({ onComplete, onCancel }) {
  const gameStateManager = useGameState();
  const [phase, setPhase] = useState('confirm');
  const [textIndex, setTextIndex] = useState(0);

  const handleConfirm = () => {
    gameStateManager.markDirty();
    setPhase('jumping');
  };

  const handleContinue = () => {
    if (textIndex < JUMP_SEQUENCE.length - 1) {
      setTextIndex(textIndex + 1);
    } else {
      setPhase('complete');
      onComplete();
    }
  };

  if (phase === 'confirm') {
    return (
      <div id="pavonis-run" className="visible">
        <div className="endgame-panel">
          <h2>POINT OF NO RETURN</h2>
          <p>Tanaka stands beside your ship, tools in hand.</p>
          <p>
            &quot;Once we do this, there&apos;s no coming back. The Range
            Extender is one-way. You&apos;ll reach Delta Pavonis, but you
            won&apos;t return to the network. Not unless they&apos;ve built
            wormhole infrastructure there.&quot;
          </p>
          <p>She pauses.</p>
          <p>&quot;Are you sure?&quot;</p>
          <div className="endgame-choices">
            <Button onClick={handleConfirm}>YES, I&apos;M READY</Button>
            <Button onClick={onCancel}>NOT YET</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pavonis-run" className="visible">
      <div className="endgame-panel">
        <p className="jump-text">{JUMP_SEQUENCE[textIndex]}</p>
        <Button onClick={handleContinue}>
          {textIndex < JUMP_SEQUENCE.length - 1
            ? 'Continue'
            : 'Arrive at Delta Pavonis'}
        </Button>
      </div>
    </div>
  );
}
