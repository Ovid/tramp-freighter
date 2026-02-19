import { NARRATIVE_EVENT_CONFIG } from '../constants.js';

const {
  DANGER_PRIORITY_PIRATE,
  DANGER_PRIORITY_INSPECTION,
  DANGER_PRIORITY_MECHANICAL,
  DANGER_PRIORITY_DISTRESS,
} = NARRATIVE_EVENT_CONFIG;

/**
 * Danger encounter event definitions for the EventEngine.
 *
 * These wrap existing DangerManager encounters in the event schema.
 * Resolution logic stays in DangerManager — the engine only handles
 * trigger eligibility and priority.
 *
 * Pirate and inspection events use string chance keys (e.g., 'pirate_chance')
 * which the trigger hook resolves dynamically via DangerManager probability methods.
 *
 * Mechanical failure and distress call use string chance keys too, resolved
 * in the hook from DangerManager's check methods.
 */
export const DANGER_EVENTS = [
  {
    id: 'danger_pirate',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'pirate_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_PIRATE,
    encounter: { generator: 'pirate' },
  },
  {
    id: 'danger_inspection',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'inspection_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_INSPECTION,
    encounter: { generator: 'inspection' },
  },
  {
    id: 'danger_mechanical',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'mechanical_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_MECHANICAL,
    encounter: { generator: 'mechanical_failure' },
  },
  {
    id: 'danger_distress',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'distress_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_DISTRESS,
    encounter: { generator: 'distress_call' },
  },
];
