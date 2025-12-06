# Tramp Freighter Blues - Spec Documentation

This directory contains the complete specification for **Tramp Freighter Blues**, a space trading survival game built on the Sol Sector Starmap.

## Quick Start

1. **Read:** [tramp-freighter-00-index.md](tramp-freighter-00-index.md) - Overview and development strategy
2. **Implement:** Start with Spec 01 and work sequentially
3. **Reference:** Original spec in [tramp-freighter.md](tramp-freighter.md)

## Spec Files

### Development Specs (Implement in Order)

| Spec | File | Focus | Effort |
|------|------|-------|--------|
| **00** | [tramp-freighter-00-index.md](tramp-freighter-00-index.md) | Overview & Index | - |
| **01** | [tramp-freighter-01-core-loop.md](tramp-freighter-01-core-loop.md) | MVP Trading Loop | 2-3 weeks |
| **02** | [tramp-freighter-02-economy.md](tramp-freighter-02-economy.md) | Dynamic Economy | 2 weeks |
| **03** | [tramp-freighter-03-ship-personality.md](tramp-freighter-03-ship-personality.md) | Ship Quirks & Upgrades | 1-2 weeks |
| **04** | [tramp-freighter-04-npcs.md](tramp-freighter-04-npcs.md) | NPCs & Relationships | 3-4 weeks |
| **05** | [tramp-freighter-05-danger.md](tramp-freighter-05-danger.md) | Combat & Danger | 2-3 weeks |
| **06** | [tramp-freighter-06-missions.md](tramp-freighter-06-missions.md) | Missions & Events | 3-4 weeks |
| **07** | [tramp-freighter-07-endgame.md](tramp-freighter-07-endgame.md) | Tanaka Sequence & Victory | 2-3 weeks |
| **08** | [tramp-freighter-08-polish.md](tramp-freighter-08-polish.md) | Polish & Deployment | 2-3 weeks |

### Reference

| File | Description |
|------|-------------|
| [tramp-freighter.md](tramp-freighter.md) | Original complete spec (reference only) |
| [trial-spec.md](trial-spec.md) | Sol Sector Starmap spec (foundation) |

## Why Break It Down?

The original `tramp-freighter.md` spec is **1,276 lines** and covers:
- 13 major systems
- 100+ events
- 15+ NPCs
- Complex economy
- Combat mechanics
- Mission system
- Endgame sequence

That's too much to implement at once. The 8-spec breakdown:
- ✅ Makes progress visible
- ✅ Allows incremental testing
- ✅ Enables early playtesting
- ✅ Reduces risk of scope creep
- ✅ Provides clear milestones

## Development Phases

### Phase 1: Core Systems (Specs 01-03)
**Goal:** Playable trading game  
**Duration:** 5-7 weeks  
**Deliverable:** Can trade, navigate, upgrade ship

### Phase 2: Living World (Specs 04-05)
**Goal:** NPCs and danger  
**Duration:** 5-7 weeks  
**Deliverable:** Characters to meet, risks to face

### Phase 3: Content & Victory (Specs 06-07)
**Goal:** Complete game  
**Duration:** 5-7 weeks  
**Deliverable:** Missions, main quest, ending

### Phase 4: Polish (Spec 08)
**Goal:** Public release  
**Duration:** 2-3 weeks  
**Deliverable:** Balanced, accessible, deployed

**Total:** 17-24 weeks (4-6 months)

## Key Design Pillars

From the original spec:

1. **"You Know These People"** - NPCs with memory and personality
2. **"Every Credit Counts"** - Financial pressure creates meaningful choices
3. **"Your Ship, Your Story"** - Quirks and upgrades give character
4. **"The Universe Doesn't Wait"** - Dynamic world with time-based changes

## Technical Stack

- **Three.js** - 3D starmap rendering (existing)
- **Vanilla JavaScript** - Game logic
- **localStorage** - Save system
- **Static hosting** - No server required

## Victory Condition

Reach **Delta Pavonis** (27.88 LY from Sol) by:
1. Paying off debt (₡10,000)
2. Saving credits (₡25,000)
3. Building relationship with Yuki Tanaka
4. Completing The Tanaka Sequence
5. Installing the Range Extender

## Getting Started

```bash
# 1. Review the index
open tramp-freighter-00-index.md

# 2. Read Spec 01
open tramp-freighter-01-core-loop.md

# 3. Start implementing!
# (See existing starmap.html for foundation)
```

## Questions?

Each spec includes:
- Clear goals and scope
- Technical implementation details
- UI mockups and examples
- Testing checklists
- Success criteria

Refer to individual spec files for detailed guidance.

---

**Status:** Ready for Development  
**Last Updated:** December 4, 2025  
**Version:** 1.0
