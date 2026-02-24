# Tramp Freighter Blues - Spec 08.4: Event Expansion

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete
**Related:** 08.3 (Station Personality), 08.5 (Cultural Regions)

---

## Overview

Expand the event library to 50+ events across all categories, providing variety and replayability.

## Goals

- 20+ dock events
- 20+ jump events
- 10+ time events
- 10+ condition events
- Events should feel distinct and contextual

## Out of Scope

- Region-specific event variants (see 08.5)

---

## Event Categories

### Dock Events (20+)

- First visit narration for each major system
- NPC introductions
- Station-specific flavor
- Economic news
- Festival announcements

### Jump Events (20+)

- Pirate encounters (variety)
- Distress calls (variety)
- Salvage discoveries
- Anomalies
- Random encounters
- Mechanical issues

### Time Events (10+)

- Debt reminders
- NPC check-ins
- Story beats
- Holiday/festival triggers
- Economic shifts

### Condition Events (10+)

- Low fuel warnings
- Critical damage alerts
- Debt collection escalation
- Reputation milestones
- Achievement unlocks

---

## Implementation Notes

- Events go in `src/game/data/danger-events.js` and `src/game/data/narrative-events.js`
- Each event needs: id, type, trigger conditions, content (text + choices), effects
- Use the existing `EventEngineManager` trigger system
- Events should reference station type and NPC data where appropriate
- Encounter RNG must use `SeededRandom` per CLAUDE.md rules

## Success Criteria

- [ ] 50+ total events implemented
- [ ] Each category meets its minimum count
- [ ] Events trigger reliably under their conditions
- [ ] No duplicate or near-duplicate event text
- [ ] Events integrate with existing game systems (credits, reputation, ship condition)
