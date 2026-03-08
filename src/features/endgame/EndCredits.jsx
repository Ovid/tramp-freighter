import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { CREDITS_SECTIONS, buildCastList } from './credits-data.js';
import { CREDITS_CONFIG } from '../../game/constants.js';
import './endgame.css';

export function EndCredits({ onCreditsComplete }) {
  const game = useGame();
  const [scrollFinished, setScrollFinished] = useState(false);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  // Direct access acceptable: read-only mount-time value that never changes during credits
  const shipName = useMemo(
    () => game.getShip()?.name || 'Your Ship',
    [game]
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
    const durationMs =
      (totalDistance / CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC) * 1000;

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

  useEffect(() => {
    if (scrollFinished) {
      onCreditsComplete();
    }
  }, [scrollFinished, onCreditsComplete]);

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
      case 'credit-pair':
        return (
          <div key={idx} className="credits-section credits-cast">
            {section.pairs.map(([label, value]) => (
              <div key={label} className="credits-cast-row">
                <span className="credits-cast-name">{label}</span>
                <span className="credits-cast-dots" />
                <span className="credits-cast-role">{value}</span>
              </div>
            ))}
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
    <div id="end-credits">
      <div className="credits-center">
        <div className="credits-scroll" ref={scrollRef}>
          {beforeCast.map(renderSection)}

          <div className="credits-section credits-cast">
            {cast.map((npc) => (
              <div key={npc.id} className="credits-cast-row">
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
    </div>
  );
}
