import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGameState } from '../../context/GameContext';
import { Button } from '../../components/Button.jsx';
import { CREDITS_SECTIONS, buildCastList } from './credits-data.js';
import './endgame.css';

const SCROLL_SPEED_PX_PER_SEC = 25;

export function EndCredits({ onReturnToTitle }) {
  const gameStateManager = useGameState();
  const [scrollFinished, setScrollFinished] = useState(false);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  const shipName = useMemo(
    () => gameStateManager.getShip()?.name || 'Your Ship',
    [gameStateManager]
  );
  const cast = useMemo(() => buildCastList(), []);

  const handleSkip = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
    }
    setScrollFinished(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || scrollFinished) return;

    const contentHeight = el.scrollHeight;
    const viewportHeight = window.innerHeight;
    const totalDistance = contentHeight + viewportHeight;
    const durationMs = (totalDistance / SCROLL_SPEED_PX_PER_SEC) * 1000;

    const animation = el.animate(
      [
        { transform: `translateY(${viewportHeight}px)` },
        { transform: `translateY(-${contentHeight}px)` },
      ],
      {
        duration: durationMs,
        easing: 'linear',
        fill: 'forwards',
      }
    );

    animationRef.current = animation;
    animation.onfinish = () => setScrollFinished(true);

    return () => animation.cancel();
  }, [scrollFinished]);

  const renderSection = (section, idx) => {
    switch (section.type) {
      case 'title':
        return (
          <div key={idx} className="credits-section credits-title">
            {section.lines.map((line, i) => (
              <h1 key={i}>{line}</h1>
            ))}
          </div>
        );
      case 'separator':
        return <div key={idx} className="credits-separator" />;
      case 'heading':
        return (
          <div key={idx} className="credits-section credits-heading">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      case 'role':
        return (
          <div key={idx} className="credits-section credits-role">
            <div className="credits-role-title">{section.lines[0]}</div>
            <div className="credits-role-name">{section.lines[1]}</div>
          </div>
        );
      case 'thankyou':
        return (
          <div key={idx} className="credits-section credits-thankyou">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      case 'quote':
        return (
          <div key={idx} className="credits-section credits-quote">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      default:
        return (
          <div key={idx} className="credits-section credits-body">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
    }
  };

  const castHeadingIdx = CREDITS_SECTIONS.findIndex(
    (s) => s.type === 'heading' && s.lines[0] === 'CAST'
  );

  const beforeCast = CREDITS_SECTIONS.slice(0, castHeadingIdx + 1);
  const afterCast = CREDITS_SECTIONS.slice(castHeadingIdx + 1);

  return (
    <div id="end-credits" onClick={scrollFinished ? undefined : handleSkip}>
      <div className="credits-scroll" ref={scrollRef}>
        {beforeCast.map(renderSection)}

        <div className="credits-section credits-cast">
          {cast.map((npc) => (
            <div key={npc.name} className="credits-cast-row">
              <span className="credits-cast-name">{npc.name}</span>
              <span className="credits-cast-dots" />
              <span className="credits-cast-role">{npc.role}</span>
            </div>
          ))}
          <div className="credits-cast-ship">
            <div>And introducing</div>
            <div className="credits-ship-name">{shipName}</div>
            <div>as itself</div>
          </div>
        </div>

        {afterCast.map((section, idx) =>
          renderSection(section, idx + castHeadingIdx + 1)
        )}
      </div>

      {!scrollFinished && (
        <button
          className="credits-skip-btn"
          onClick={handleSkip}
          aria-label="Skip credits"
        >
          Skip
        </button>
      )}

      {scrollFinished && (
        <div className="credits-end-buttons">
          <Button onClick={onReturnToTitle}>Return to Title</Button>
        </div>
      )}
    </div>
  );
}
