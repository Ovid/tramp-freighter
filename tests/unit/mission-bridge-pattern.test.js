import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Mission Bridge Pattern', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
  });

  it('should emit missionsChanged when mission is accepted', () => {
    let emitted = null;
    manager.subscribe('missionsChanged', (data) => {
      emitted = data;
    });

    manager.acceptMission({
      id: 'test_bridge',
      type: 'delivery',
      title: 'Bridge Test',
      requirements: {
        cargo: 'grain',
        quantity: 5,
        destination: 4,
        deadline: 5,
      },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    });

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(1);
  });

  it('should emit missionsChanged when mission is completed', () => {
    manager.acceptMission({
      id: 'test_bridge_complete',
      type: 'delivery',
      requirements: {
        cargo: 'grain',
        quantity: 5,
        destination: 0,
        deadline: 5,
      },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    });

    let emitted = null;
    manager.subscribe('missionsChanged', (data) => {
      emitted = data;
    });
    manager.completeMission('test_bridge_complete');

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
    expect(emitted.completed).toContain('test_bridge_complete');
  });
});
