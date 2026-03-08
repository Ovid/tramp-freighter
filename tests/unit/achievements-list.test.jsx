import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementsList } from '../../src/features/achievements/AchievementsList.jsx';

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGameState: vi.fn(),
}));

vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn(),
}));

vi.mock('../../src/game/data/achievements-data.js', () => ({
  ACHIEVEMENT_CATEGORIES: ['exploration', 'trading', 'survival'],
}));

import { useGameState } from '../../src/context/GameContext.jsx';

function buildAchievement(overrides = {}) {
  return {
    id: 'test_1',
    name: 'Test Achievement',
    description: 'A test description',
    category: 'exploration',
    tier: 1,
    current: 3,
    target: 10,
    unlocked: false,
    ...overrides,
  };
}

describe('AchievementsList', () => {
  let mockGSM;

  beforeEach(() => {
    mockGSM = {
      getAchievementProgress: vi.fn(() => []),
    };
    useGameState.mockReturnValue(mockGSM);
  });

  it('renders category titles for each category', () => {
    mockGSM.getAchievementProgress.mockReturnValue([]);
    render(<AchievementsList />);

    expect(screen.getByText('Exploration')).toBeDefined();
    expect(screen.getByText('Trading')).toBeDefined();
    expect(screen.getByText('Survival')).toBeDefined();
  });

  it('renders achievement items with name, description, and progress', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', name: 'Star Hopper', description: 'Visit 5 systems', current: 3, target: 5 }),
    ]);
    render(<AchievementsList />);

    expect(screen.getByText('Star Hopper')).toBeDefined();
    expect(screen.getByText('Visit 5 systems')).toBeDefined();
    expect(screen.getByText('3/5')).toBeDefined();
  });

  it('shows checkmark for unlocked achievements', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', name: 'Done', unlocked: true }),
    ]);
    render(<AchievementsList />);

    const nameEl = screen.getByText(/Done/);
    expect(nameEl.textContent).toContain('\u2713');
  });

  it('shows progress bar with correct width percentage', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', current: 7, target: 10 }),
    ]);
    const { container } = render(<AchievementsList />);

    const fill = container.querySelector('.achievement-progress-fill');
    expect(fill.style.width).toBe('70%');
  });

  it('caps progress bar at 100%', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', current: 15, target: 10, unlocked: true }),
    ]);
    const { container } = render(<AchievementsList />);

    const fill = container.querySelector('.achievement-progress-fill');
    expect(fill.style.width).toBe('100%');
  });

  it('shows "complete" class for unlocked achievements', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', unlocked: true, current: 10, target: 10 }),
    ]);
    const { container } = render(<AchievementsList />);

    const fill = container.querySelector('.achievement-progress-fill');
    expect(fill.className).toContain('complete');
  });

  it('does not show "complete" class for locked achievements', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', unlocked: false }),
    ]);
    const { container } = render(<AchievementsList />);

    const fill = container.querySelector('.achievement-progress-fill');
    expect(fill.className).not.toContain('complete');
  });

  it('shows "unlocked" class on achievement name when unlocked', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e1', name: 'Unlocked One', unlocked: true }),
    ]);
    const { container } = render(<AchievementsList />);

    const nameEl = container.querySelector('.achievement-name.unlocked');
    expect(nameEl).not.toBeNull();
    expect(nameEl.textContent).toContain('Unlocked One');
  });

  it('sorts achievements within a category by tier', () => {
    mockGSM.getAchievementProgress.mockReturnValue([
      buildAchievement({ id: 'e3', name: 'Tier 3', tier: 3 }),
      buildAchievement({ id: 'e1', name: 'Tier 1', tier: 1 }),
      buildAchievement({ id: 'e2', name: 'Tier 2', tier: 2 }),
    ]);
    const { container } = render(<AchievementsList />);

    const items = container.querySelectorAll('.achievement-item');
    expect(items[0].textContent).toContain('Tier 1');
    expect(items[1].textContent).toContain('Tier 2');
    expect(items[2].textContent).toContain('Tier 3');
  });
});
