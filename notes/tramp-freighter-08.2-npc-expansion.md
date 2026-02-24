# Tramp Freighter Blues - Spec 08.2: NPC Expansion

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete
**Blocks:** 08.3 (Station Personality), 08.8 (Deployment & Launch)

---

## Overview

Expand the NPC roster from the current set to 15+ named characters, each with distinct personalities, locations, and gameplay benefits.

## Goals

- Add NPCs 6-15 with full dialogue trees
- Each NPC provides unique gameplay benefits
- NPCs are distributed across different star systems
- Reputation progression feels meaningful for each NPC

## Out of Scope

- NPC attitude modifiers from cultural regions (see 08.5)
- Station-type NPC placement (see 08.3)

---

## Additional NPCs

**6. Dock Master Kowalski (Sol)**

- Role: Station Administrator
- Personality: Bureaucratic but fair
- Benefits: Reduced docking fees, priority bay access

**7. "Sparks" Rodriguez (Sirius A)**

- Role: Ship Mechanic
- Personality: Enthusiastic, talkative
- Benefits: Repair discounts, upgrade tips

**8. Dr. Amara Osei (Epsilon Eridani)**

- Role: Medical Officer
- Personality: Compassionate, overworked
- Benefits: Free life support repairs, medical supplies

**9. Captain Zhang (Wolf 359)**

- Role: Patrol Officer
- Personality: By-the-book, but reasonable
- Benefits: Reduced inspection frequency, warnings about pirates

**10. "Lucky" Larsen (Outer Reach)**

- Role: Salvager
- Personality: Superstitious, friendly
- Benefits: Salvage tips, buys goods at premium

**11. Mei-Lin Park (L 789-6 A)**

- Role: Smuggler Queen
- Personality: High risk, high reward, tests player ethics
- Benefits: Restricted goods missions, smuggling routes, black market access

**12-15:** Additional traders, brokers, and station personnel across the sector

---

## Implementation Notes

- NPC data goes in `src/game/data/npc-data.js`
- Dialogue trees in `src/game/data/dialogue-trees.js`
- Each NPC needs: id, name, location, role, personality traits, dialogue tree, reputation thresholds, benefit functions
- Benefits should integrate with existing manager delegation pattern

## Success Criteria

- [ ] 15+ named NPCs with unique dialogue
- [ ] Each NPC has at least 3 reputation tiers of dialogue
- [ ] Benefits are gameplay-meaningful (not just flavor)
- [ ] NPCs are spread across multiple star systems
- [ ] NPC interactions feel distinct from one another
