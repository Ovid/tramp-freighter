# Tramp Freighter Blues - Development Index

**Project:** Space trading survival game built on Sol Sector Starmap  
**Status:** Broken into 8 manageable specs  
**Target Platform:** Static web hosting (GitHub Pages, Netlify, etc.)

---

## Overview

The original `tramp-freighter.md` spec was too large to implement in one go. This index breaks it down into 8 sequential specs that build on each other, allowing incremental development.

Each spec is:
- **Self-contained:** Can be implemented independently
- **Testable:** Has clear success criteria
- **Incremental:** Builds on previous specs
- **Deployable:** Each spec results in a playable (if incomplete) game

---

## Spec Breakdown

### [Spec 01: Core Loop](tramp-freighter-01-core-loop.md)
**Foundation:** Sol Sector Starmap v1.1  
**Focus:** MVP gameplay loop

**Implements:**
- Navigation between wormhole-connected systems
- Basic trading (fixed prices)
- Fuel consumption and refueling
- Credits and debt tracking
- Save/load system
- Basic HUD

**Deliverable:** Playable trading loop with starmap integration

**Estimated Effort:** 2-3 weeks

---

### [Spec 02: Dynamic Economy](tramp-freighter-02-economy.md)
**Foundation:** Spec 01  
**Focus:** Living economy

**Implements:**
- Dynamic prices with daily fluctuation
- Price discovery (only see visited systems)
- Economic events (strikes, emergencies, festivals)
- Information brokers
- Ship condition system (hull, engine, life support)
- Repairs and maintenance

**Deliverable:** Economy that feels alive and reactive

**Estimated Effort:** 2 weeks

---

### [Spec 03: Ship Personality](tramp-freighter-03-ship-personality.md)
**Foundation:** Spec 02  
**Focus:** Ship character and customization

**Implements:**
- Ship quirks (random personality traits)
- Upgrade system with tradeoffs
- Smuggler's panels (hidden cargo)
- Ship naming
- Expanded cargo management

**Deliverable:** Ships with personality and meaningful choices

**Estimated Effort:** 1-2 weeks

---

### [Spec 04: NPCs & Relationships](tramp-freighter-04-npcs.md)
**Foundation:** Spec 03  
**Focus:** "You Know These People"

**Implements:**
- NPC system with persistent relationships
- Relationship tiers with benefits
- Dialogue system with branching choices
- 10+ key NPCs across stations
- NPC-specific tips and favors

**Deliverable:** Memorable characters who remember you

**Estimated Effort:** 3-4 weeks

---

### [Spec 05: Danger & Combat](tramp-freighter-05-danger.md)
**Foundation:** Spec 04  
**Focus:** Risk and tension

**Implements:**
- Pirate encounters with tactical choices
- Customs inspections
- Mechanical failures
- Distress calls (moral choices)
- Combat resolution system
- Faction reputation

**Deliverable:** Meaningful danger and consequences

**Estimated Effort:** 2-3 weeks

---

### [Spec 06: Missions & Events](tramp-freighter-06-missions.md)
**Foundation:** Spec 05  
**Focus:** Structured content

**Implements:**
- Mission system (delivery, fetch, passenger, intel)
- Narrative event framework
- Dock events and jump events
- Time-based story beats
- Repeatable missions
- Mission board

**Deliverable:** Rich narrative content and replayability

**Estimated Effort:** 3-4 weeks

---

### [Spec 07: The Tanaka Sequence & Endgame](tramp-freighter-07-endgame.md)
**Foundation:** Spec 06  
**Focus:** Main quest and victory

**Implements:**
- Yuki Tanaka NPC with deep questline
- The Tanaka Sequence (5 missions)
- Range Extender unlock
- Victory conditions
- The Pavonis Run sequence
- Epilogue generation

**Deliverable:** Complete game with satisfying ending

**Estimated Effort:** 2-3 weeks

---

### [Spec 08: Polish & Content](tramp-freighter-08-polish.md)
**Foundation:** Spec 07  
**Focus:** Final polish and deployment

**Implements:**
- Balance tuning
- Expanded NPC roster (15+ total)
- 50+ events
- UI/UX polish
- Accessibility features
- Performance optimization
- Deployment preparation

**Deliverable:** Polished, balanced, publicly available game

**Estimated Effort:** 2-3 weeks

---

## Total Estimated Timeline

**Sequential Development:** 17-24 weeks (4-6 months)

**With Parallel Work:**
- Core systems (Specs 1-3): 5-7 weeks
- Content (Specs 4-6): 8-11 weeks (can overlap with polish)
- Endgame & Polish (Specs 7-8): 4-6 weeks

**Realistic Timeline:** 4-5 months for solo developer

---

## Development Strategy

### Recommended Approach

1. **Implement Specs 1-3 first** (Core systems)
   - Get the game loop feeling good
   - Establish technical foundation
   - Playtest economy and ship mechanics

2. **Add Specs 4-5** (NPCs and danger)
   - Bring the world to life
   - Add tension and stakes
   - Playtest relationships and combat

3. **Complete Specs 6-7** (Content and endgame)
   - Add narrative depth
   - Implement victory path
   - Playtest full game loop

4. **Polish with Spec 8**
   - Balance based on playtesting
   - Add accessibility
   - Deploy publicly

### Milestone Releases

**Alpha (Specs 1-3):** Core trading game  
**Beta (Specs 1-5):** Full systems, needs content  
**Release Candidate (Specs 1-7):** Complete game, needs polish  
**v1.0 (All specs):** Public release

---

## Technical Architecture

### File Organization

```
/
├── index.html                 # Main entry point
├── css/
│   ├── main.css              # Base styles
│   ├── starmap.css           # 3D starmap styles
│   ├── ui.css                # Game UI styles
│   └── accessibility.css     # A11y overrides
├── js/
│   ├── core/
│   │   ├── game-state.js     # Central state management
│   │   ├── save-manager.js   # localStorage handling
│   │   └── event-engine.js   # Event system
│   ├── systems/
│   │   ├── trading.js        # Buy/sell logic
│   │   ├── navigation.js     # Jump system
│   │   ├── combat.js         # Tactical combat
│   │   └── missions.js       # Mission management
│   ├── ui/
│   │   ├── hud.js           # HUD updates
│   │   ├── modals.js        # Modal system
│   │   └── starmap-ui.js    # Starmap integration
│   └── data/
│       ├── stars.js         # Star system data
│       ├── goods.js         # Trading goods
│       ├── npcs.js          # NPC definitions
│       ├── events.js        # Event content
│       └── missions.js      # Mission definitions
├── assets/
│   ├── fonts/
│   └── icons/
└── README.md
```

### Integration with Existing Starmap

The game builds on `starmap.html`:
- Keep existing Three.js starmap rendering
- Add game state overlay
- Extend click handlers for game interactions
- Add HUD and modal systems on top

---

## Data Files

### Shared Data

Create `data/` subdirectory for game data:

```
data/
├── star-systems.json      # From existing starmap
├── wormholes.json         # From existing starmap
├── goods.json             # Trading goods definitions
├── npcs.json              # NPC data
├── events.json            # Event content
├── missions.json          # Mission definitions
└── dialogue.json          # Dialogue trees
```

This keeps content separate from code for easier editing.

---

## Testing Strategy

### Per-Spec Testing

Each spec includes:
- Feature checklist
- Success criteria
- Manual test cases

### Integration Testing

After each spec:
- Verify previous specs still work
- Check save/load compatibility
- Performance regression testing

### Playtesting

Key milestones:
- After Spec 3: Economy balance
- After Spec 5: Difficulty tuning
- After Spec 7: Full playthrough
- After Spec 8: Final balance pass

---

## Deployment

### Static Hosting

Game is designed for static hosting:
- No server required
- All data in localStorage
- Single-page application

### Recommended Hosts

1. **GitHub Pages** (free)
   - Push to `gh-pages` branch
   - Automatic deployment

2. **Netlify** (free tier)
   - Drag-and-drop deployment
   - Custom domain support

3. **Vercel** (free tier)
   - Git integration
   - Automatic previews

---

## Success Metrics

### Technical

- Load time < 4 seconds
- 60fps rendering
- Save/load < 500ms
- Memory < 100MB

### Gameplay

- 30% completion rate
- 20+ minute sessions
- 60% return rate
- 3+ NPCs at Friendly

---

## Next Steps

1. Review all 8 specs
2. Set up development environment
3. Start with Spec 01
4. Implement incrementally
5. Test thoroughly
6. Deploy publicly

---

## Questions?

Refer to individual spec files for detailed implementation guidance.

Each spec is self-contained and includes:
- Clear goals
- Technical details
- UI mockups
- Testing checklists
- Success criteria

Good luck, Captain. The stars await.
