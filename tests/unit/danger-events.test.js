import { describe, it, expect } from 'vitest';
import { DANGER_EVENTS } from '../../src/game/data/danger-events.js';

describe('Danger Event Data', () => {
  it('should export four danger events', () => {
    expect(DANGER_EVENTS).toHaveLength(4);
  });

  it('should all have category danger', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.category).toBe('danger');
    });
  });

  it('should all be jump type', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.type).toBe('jump');
    });
  });

  it('should have descending priorities: pirate > inspection > mechanical > distress', () => {
    const pirate = DANGER_EVENTS.find((e) => e.encounter.generator === 'pirate');
    const inspection = DANGER_EVENTS.find((e) => e.encounter.generator === 'inspection');
    const mechanical = DANGER_EVENTS.find(
      (e) => e.encounter.generator === 'mechanical_failure'
    );
    const distress = DANGER_EVENTS.find((e) => e.encounter.generator === 'distress_call');

    expect(pirate.priority).toBeGreaterThan(inspection.priority);
    expect(inspection.priority).toBeGreaterThan(mechanical.priority);
    expect(mechanical.priority).toBeGreaterThan(distress.priority);
  });

  it('should all have encounter.generator defined', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.encounter).toBeTruthy();
      expect(e.encounter.generator).toBeTruthy();
    });
  });

  it('should use string chance keys for dynamic calculation', () => {
    const pirate = DANGER_EVENTS.find((e) => e.encounter.generator === 'pirate');
    const inspection = DANGER_EVENTS.find((e) => e.encounter.generator === 'inspection');
    expect(typeof pirate.trigger.chance).toBe('string');
    expect(typeof inspection.trigger.chance).toBe('string');
  });
});
