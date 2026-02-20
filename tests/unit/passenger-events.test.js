import { describe, it, expect } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Passenger Narrative Events', () => {
  const passengerEvents = NARRATIVE_EVENTS.filter((e) =>
    e.id.startsWith('passenger_')
  );

  it('should define passenger comfort complaint event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_complaint_comfort'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('jump');
    expect(event.category).toBe('narrative');
    expect(event.trigger.condition.type).toBe('has_passenger');
    expect(event.trigger.chance).toBe(0.15);
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should define wealthy passenger tip event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_wealthy_tip'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('dock');
    expect(event.trigger.condition.type).toBe('has_wealthy_passenger');
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should define family children event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_family_children'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('jump');
    expect(event.trigger.condition.type).toBe('has_family_passenger');
    expect(event.trigger.chance).toBe(0.2);
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should have valid structure for all passenger events', () => {
    expect(passengerEvents.length).toBe(3);
    for (const event of passengerEvents) {
      expect(event.category).toBe('narrative');
      expect(event.content.text.length).toBeGreaterThan(0);
      expect(event.content.choices.length).toBeGreaterThan(0);
      for (const choice of event.content.choices) {
        expect(choice.text).toBeTruthy();
        expect(choice.effects).toBeDefined();
      }
    }
  });
});
