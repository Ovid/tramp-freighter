import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('dismissMissionFailureNotice', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
    // Seed notices directly into state
    gsm.getState().missions.pendingFailureNotices = [
      {
        id: 'mission_1',
        title: 'Cargo Run: Tau Ceti',
        destination: 'Tau Ceti',
      },
      { id: 'mission_2', title: 'Cargo Run: Procyon', destination: 'Procyon' },
    ];
  });

  it('removes the notice with the given id', () => {
    gsm.dismissMissionFailureNotice('mission_1');

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe('mission_2');
  });

  it('emits missionsChanged after dismissal', () => {
    let emitted = null;
    gsm.subscribe('missionsChanged', (data) => {
      emitted = data;
    });

    gsm.dismissMissionFailureNotice('mission_1');

    expect(emitted).not.toBeNull();
    expect(emitted.pendingFailureNotices).toHaveLength(1);
  });

  it('does nothing when id not found', () => {
    gsm.dismissMissionFailureNotice('nonexistent');

    expect(gsm.getState().missions.pendingFailureNotices).toHaveLength(2);
  });
});

describe('checkMissionDeadlines: pendingFailureNotices', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
  });

  it('pushes a notice when a mission expires', () => {
    const mission = {
      id: 'expired_mission',
      type: 'delivery',
      title: 'Cargo Run: Unmarked Crates to Tau Ceti',
      destination: { systemId: 4, name: 'Tau Ceti' },
      requirements: { destination: 4, deadline: 3 },
      rewards: { credits: 500 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(4);

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe('expired_mission');
    expect(notices[0].title).toBe('Cargo Run: Unmarked Crates to Tau Ceti');
    expect(notices[0].destination).toBe('Tau Ceti');
  });

  it('handles missions without destination gracefully', () => {
    const mission = {
      id: 'no_dest_mission',
      type: 'delivery',
      title: 'Intel Run',
      requirements: { destination: 4, deadline: 2 },
      rewards: { credits: 200 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(3);

    const notices = gsm.getState().missions.pendingFailureNotices;
    expect(notices).toHaveLength(1);
    expect(notices[0].destination).toBeNull();
  });

  it('handles saves without pendingFailureNotices (backwards compat)', () => {
    const state = gsm.getState();
    // Simulate old save: delete the field
    delete state.missions.pendingFailureNotices;

    const mission = {
      id: 'compat_mission',
      type: 'delivery',
      title: 'Compat Test',
      requirements: { destination: 4, deadline: 1 },
      rewards: { credits: 100 },
      penalties: {},
    };
    gsm.acceptMission(mission);
    gsm.updateTime(2);

    expect(gsm.getState().missions.pendingFailureNotices).toHaveLength(1);
  });
});
