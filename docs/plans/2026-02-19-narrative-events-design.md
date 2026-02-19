# Narrative Event System Design

**Date:** 2026-02-19
**Spec:** 06.2 (notes/tramp-freighter-06.2-narrative-events.md)
**Branch:** ovid/narrative-events

---

## Approach: Generic EventEngine with Dispatch

A unified EventEngine replaces ad-hoc encounter checking. It handles trigger eligibility, priority sorting, and event selection for all event types. Resolution and UI remain type-specific — the engine dispatches to the appropriate handler.

### Key Decisions

- **Danger migration:** Existing danger encounters move into the EventEngine as high-priority events. DangerManager keeps all resolution logic. Danger UI panels stay unchanged.
- **Jump priority:** Danger encounters register at priority 60-100, narrative at 10-20. Engine's priority sort handles coordination naturally — no special-case logic.
- **Event chains:** Display immediately in the same panel session. Chained events skip eligibility checks.
- **View mode:** Narrative events reuse ENCOUNTER view mode. App.jsx routes by event category.
- **Effects:** Narrative choice effects use existing costs/rewards format. `applyEncounterOutcome` reused unchanged.
- **State tracking:** `world.narrativeEvents: { fired, cooldowns, flags }`.
- **Conditions:** Enum + params pattern. Type-safe, predefined condition types.
- **Content scope:** 13 sample events (10-15 target) covering all four trigger types.

---

## EventEngine Architecture

`EventEngineManager` extends `BaseManager`. Responsibilities:

- Registers event definitions from data files
- Checks eligibility on trigger (type match, conditions, once-only, cooldowns, chance)
- Sorts eligible events by priority, returns the winner
- Tracks fired events and cooldowns in `world.narrativeEvents`
- Resolves event chains (`getEventById` for `next` references)

Does NOT handle: resolution logic, UI rendering, or effect application.

### Trigger Flow

```
game event (dock/jump/time)
  -> hook calls EventEngine.checkEvents(type, context)
  -> engine filters eligible events, rolls chance, sorts by priority
  -> returns winning event (or null)
  -> hook emits 'encounterTriggered' with the event
  -> App.jsx routes to appropriate panel based on event category
```

---

## Event Data Schema

```javascript
{
  id: 'dock_sol_first',
  type: 'dock',              // dock | jump | time | condition
  category: 'narrative',     // narrative | danger

  trigger: {
    system: 0,               // null for any system
    condition: { type: 'first_visit' },  // enum+params, null for none
    chance: 1.0,             // 0-1, rolled after conditions pass
  },

  once: true,
  cooldown: 0,               // days before can fire again
  priority: 10,              // higher = checked first

  // Narrative events: inline content
  content: {
    text: ['Line one.', 'Line two.'],
    speaker: null,
    mood: 'neutral',
    choices: [
      {
        text: 'Do something.',
        next: null,
        effects: { costs: {}, rewards: { karma: 1 } }
      }
    ]
  },

  // Danger events: encounter generation params (mutually exclusive with content)
  encounter: {
    generator: 'pirate',
  }
}
```

`content` is for narrative events. `encounter` is for danger events (delegates to DangerManager). Mutually exclusive.

---

## Condition Types (Enum + Params)

| Type | Params | Checks |
|------|--------|--------|
| `first_visit` | none | system not in `world.visitedSystems` |
| `debt_above` | `{ value }` | `player.debt > value` |
| `debt_below` | `{ value }` | `player.debt < value` |
| `karma_above` | `{ value }` | `player.karma > value` |
| `karma_below` | `{ value }` | `player.karma < value` |
| `fuel_below` | `{ value }` | `ship.fuel < value` |
| `hull_below` | `{ value }` | `ship.hull < value` |
| `days_past` | `{ value }` | `player.daysElapsed >= value` |
| `has_visited` | `{ system }` | system in `visitedSystems` |
| `has_cargo` | `{ good }` | cargo contains good |
| `flag_set` | `{ flag }` | flag in `narrativeEvents.flags` |

New types added by adding a case to the evaluator function.

---

## Danger Migration

Existing danger encounters register as EventEngine events with `category: 'danger'` and high priority:

| Encounter | Priority |
|-----------|----------|
| Pirate | 100 |
| Inspection | 80 |
| Mechanical failure | 60 |
| Distress call | 40 |

`useJumpEncounters` is replaced by `useEventTriggers`. The manual priority chain and inline chance calculations move into event registrations. Danger events use dynamic `chance` values computed by DangerManager's existing probability methods.

**Unchanged:** DangerManager resolution methods, all six danger UI panels, `applyEncounterOutcome`, `transformOutcome`, App.jsx encounter routing.

**Removed:** Manual priority chain in `useJumpEncounters`, inline chance calculations in the hook.

---

## Hooks and Trigger Points

One unified hook: `useEventTriggers`.

| Game Event | Trigger Type | When |
|------------|-------------|------|
| `docked` | `'dock'` | After docking completes |
| `locationChanged` | `'jump'` | After jump completes |
| `timeChanged` | `'time'` | After day advances |

Condition events piggyback on all trigger points. If no type-specific event won, the engine checks condition-type events. No separate polling.

Chain handling lives in the UI layer. When a choice has `next`, `NarrativeEventPanel` calls `EventEngine.getEventById()` and displays immediately. Chained events skip eligibility checks.

---

## NarrativeEventPanel

New component using ENCOUNTER view mode, alongside existing danger panels.

**App.jsx routing:**
- `event.category === 'danger'` -> existing danger panels (unchanged)
- `event.category === 'narrative'` -> NarrativeEventPanel

**Panel behavior:**
- Renders `content.text` as paragraphs
- Renders `content.choices` as buttons
- On choice: applies effects via `applyEncounterOutcome`, marks fired, sets cooldown
- If choice has `next`: fetches chained event, re-renders with new content
- On final choice (no `next`): closes panel, returns to previous view mode

**Styling:** ID-based selector (`#narrative-event-panel`), `display: none` + `.visible` class.

**Not in scope:** Speaker portraits, mood styling, typewriter effects, animation between chains.

---

## State Tracking

```javascript
world: {
  narrativeEvents: {
    fired: [],           // event IDs (once-only tracking)
    cooldowns: {},       // { eventId: dayWhenEligibleAgain }
    flags: {}            // { flagName: true } for condition checks
  }
}
```

Both narrative and danger events track fired/cooldowns here. Existing `dangerFlags` stays for danger-specific counters. `InitializationManager` provides defaults for saves missing the field.

---

## Sample Events (13 events)

| ID | Type | Trigger | Once? | Description |
|----|------|---------|-------|-------------|
| `dock_sol_first` | dock | system: Sol, first_visit | yes | Arriving at Sol |
| `dock_barnards_first` | dock | system: Barnard's, first_visit | yes | Barnard's Station intro |
| `dock_generic_rumor` | dock | any, chance: 0.15 | no (cd: 3) | Trade rumor |
| `dock_cheap_fuel` | dock | any, fuel_below: 20 | no (cd: 5) | Discounted fuel offer |
| `jump_salvage` | jump | any, chance: 0.05 | no (cd: 5) | Debris field discovery |
| `jump_salvage_result` | chain | next from jump_salvage | -- | Container contents |
| `jump_quiet_moment` | jump | any, chance: 0.08 | no (cd: 3) | Reflective moment |
| `jump_strange_signal` | jump | any, chance: 0.04 | no (cd: 7) | Anomalous signal |
| `time_debt_warning` | time | days_past: 30, debt_above: 8000 | no (cd: 10) | Marcus Cole threat |
| `time_news_broadcast` | time | days_past: 15, chance: 0.2 | no (cd: 5) | Galaxy news |
| `cond_low_fuel` | condition | fuel_below: 10 | no (cd: 5) | Crew anxiety |
| `cond_hull_damage` | condition | hull_below: 30 | no (cd: 5) | Hull concerns |
| `cond_debt_free` | condition | debt_below: 1 | yes | Debt celebration |
