import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('dismissMissionFailureNotice', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGameStateManager();
    // Seed notices directly into state
    gsm.getState().missions.pendingFailureNotices = [
      { id: 'mission_1', title: 'Cargo Run: Tau Ceti', destination: 'Tau Ceti' },
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
