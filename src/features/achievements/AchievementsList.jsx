import { useGame } from '../../context/GameContext.jsx';
import { useGameEvent } from '../../hooks/useGameEvent.js';
import { EVENT_NAMES } from '../../game/constants.js';
import { ACHIEVEMENT_CATEGORIES } from '../../game/data/achievements-data.js';

const CATEGORY_DISPLAY_NAMES = {
  exploration: 'Exploration',
  trading: 'Trading',
  social: 'Social',
  survival: 'Survival',
  danger: 'Danger',
  moral: 'Moral',
};

export function AchievementsList() {
  const game = useGame();
  // Subscribe to trigger re-renders when achievements change.
  // The return value is not used directly because getAchievementProgress()
  // returns a computed view that cannot be reconstructed from raw event data alone.
  useGameEvent(EVENT_NAMES.ACHIEVEMENTS_CHANGED);

  const progress = game.getAchievementProgress();

  return (
    <div className="achievements-list">
      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const categoryAchievements = progress
          .filter((a) => a.category === category)
          .sort((a, b) => a.tier - b.tier);

        return (
          <div className="achievement-category" key={category}>
            <h3 className="achievement-category-title">
              {CATEGORY_DISPLAY_NAMES[category]}
            </h3>
            {categoryAchievements.map((achievement) => {
              const percent = Math.min(
                100,
                Math.round((achievement.current / achievement.target) * 100)
              );
              return (
                <div className="achievement-item" key={achievement.id}>
                  <div className="achievement-header">
                    <span
                      className={`achievement-name ${achievement.unlocked ? 'unlocked' : ''}`}
                    >
                      {achievement.unlocked ? '\u2713 ' : ''}
                      {achievement.name}
                    </span>
                    <span className="achievement-progress-text">
                      {achievement.current}/{achievement.target}
                    </span>
                  </div>
                  <div className="achievement-description">
                    {achievement.description}
                  </div>
                  <div className="achievement-progress-bar">
                    <div
                      className={`achievement-progress-fill ${achievement.unlocked ? 'complete' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
