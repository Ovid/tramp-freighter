# Tramp Freighter Blues - Spec 07: The Tanaka Sequence & Endgame

**Foundation:** Spec 06 (Missions & Events)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-06 must be complete

---

## Overview

The main quest line that leads to victory: building a relationship with Yuki Tanaka, completing her mission sequence, and ultimately making The Pavonis Run to reach Delta Pavonis.

## Goals

- Yuki Tanaka NPC with deep questline
- The Tanaka Sequence (5 missions)
- Range Extender unlock
- Victory condition implementation
- The Pavonis Run sequence
- Epilogue generation based on player choices

## Out of Scope

- New Game+ features
- Alternative endings (single ending with variations)
- Post-game content

---

## Yuki Tanaka

### NPC Profile

```javascript
const tanaka_barnards = {
  id: "tanaka_barnards",
  name: "Yuki Tanaka",
  role: "Engineer",
  system: 4,  // Barnard's Star
  station: "Bore Station 7",
  
  personality: {
    trust: 0.2,      // Very slow to trust
    greed: 0.1,      // Not motivated by money
    loyalty: 0.9,    // Extremely loyal once earned
    morality: 0.8    // Strong ethics
  },
  
  speechStyle: {
    greeting: "formal",
    vocabulary: "technical",
    quirk: "Precise, measured speech. Never wastes words."
  },
  
  description: "Brilliant engineer in her 40s. Working on experimental drive technology. Has her own reasons for wanting to reach Delta Pavonis.",
  
  arc: "Tanaka is developing a Range Extender that can make one-way jumps to systems without wormhole connections. She needs help testing it and gathering rare components. She wants to reach Delta Pavonis to find her sister, who went there 10 years ago and hasn't been heard from since."
};
```

### Meeting Tanaka

First encounter at Barnard's Star (after player has visited 5+ systems):

```
┌─────────────────────────────────────────────────────────┐
│  BORE STATION 7 — Barnard's Star                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  A woman in engineer's coveralls watches your ship      │
│  dock. She approaches as you exit the airlock.          │
│                                                         │
│  "Tanaka drive. Mark III, if I'm not mistaken."         │
│                                                         │
│  She circles your ship, running a hand along the hull.  │
│                                                         │
│  "I'm Yuki Tanaka. I designed that drive. Well, my      │
│   father did. I improved it."                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] "It's a good drive. Reliable."                     │
│  [2] "You're THE Tanaka? I've heard of you."            │
│  [3] "What do you want?"                                │
└─────────────────────────────────────────────────────────┘
```

---

## The Tanaka Sequence

### Mission 1: Field Test

**Requirements:**
- Reputation with Tanaka: 10+
- Ship engine condition: 80%+

**Objective:** Install prototype sensor package, make 3 jumps, return data

**Dialogue:**
```
"I need field data. Real-world stress tests. Your ship is perfect — old enough to show wear patterns, new enough to survive the test. Install this sensor package. Make three jumps. Any routes. Bring me the data."
```

**Rewards:**
- ₡1,000
- +15 rep with Tanaka
- Free engine tune-up (restore to 100%)

---

### Mission 2: Rare Materials

**Requirements:**
- Mission 1 complete
- Reputation with Tanaka: 30+

**Objective:** Acquire 5 units of "Exotic Materials" from outer systems (distance > 15 LY)

**Dialogue:**
```
"The Range Extender needs exotic matter. Rare isotopes. You'll find them in the outer systems — places most traders don't go. Five units. I'll pay market rate plus twenty percent."
```

**Rewards:**
- ₡3,000
- +15 rep with Tanaka
- Unlock: Advanced Sensors upgrade (if not already purchased)

---

### Mission 3: The Prototype

**Requirements:**
- Mission 2 complete
- Reputation with Tanaka: 50+
- Ship hull: 70%+, engine: 80%+

**Objective:** Test prototype Range Extender on a short jump (to a nearby unreachable system)

**Dialogue:**
```
"It's ready. The prototype. I need to test it. Short jump — just to Proxima Centauri. It's only 5.87 light-years from Sol, but no wormhole connection. If this works... everything changes."
```

**The Test:**
- Jump to Proxima Centauri (unreachable system)
- One-way jump (can't return via Range Extender)
- Must use wormhole network to get back
- Collect data at Proxima

**Rewards:**
- ₡2,000
- +20 rep with Tanaka
- Tanaka shares her true goal: reaching Delta Pavonis

---

### Mission 4: Personal Request

**Requirements:**
- Mission 3 complete
- Reputation with Tanaka: 70+

**Objective:** Deliver a message to an NPC at a distant station

**Dialogue:**
```
"I need a favor. Personal, not professional. There's someone at Epsilon Eridani. Old friend. Give them this message. Tell them... tell them I'm going to find her."
```

**The Message:**
Reveals Tanaka's backstory — her sister went to Delta Pavonis 10 years ago as part of a colony mission. Communications stopped after 2 years. Tanaka has been working on the Range Extender ever since.

**Rewards:**
- No credits (personal favor)
- +20 rep with Tanaka
- Tanaka offers to help you reach Delta Pavonis

---

### Mission 5: Final Preparations

**Requirements:**
- Mission 4 complete
- Reputation with Tanaka: 90+ (Trusted)
- Player debt: 0
- Player credits: 25,000+

**Objective:** Gather final components and prepare for The Pavonis Run

**Dialogue:**
```
"You've helped me more than you know. The Range Extender is ready. I can install it on your ship. But this is it — the real thing. Delta Pavonis. 27.88 light-years. One way. Are you ready?"
```

**Requirements Check:**
- Debt paid off: ✓
- 25,000 credits saved: ✓
- Ship condition: Hull 80%+, Engine 90%+
- Tanaka reputation: Trusted

**Rewards:**
- Range Extender installed (permanent upgrade)
- Unlock: The Pavonis Run

---

## Victory Conditions

### The Pavonis Run Checklist

```
┌─────────────────────────────────────────────────────────┐
│  THE PAVONIS RUN — Victory Requirements                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ Pay off starting debt (0 credits owed)              │
│  ✓ Accumulate savings (25,000 credits)                 │
│  ✓ Engineer reputation (Trusted with Yuki Tanaka)      │
│  ✓ Complete questline (The Tanaka Sequence)            │
│  ✓ Ship condition (Hull ≥80%, Engine ≥90%)             │
│                                                         │
│  ═══ READY FOR DEPARTURE ═══                            │
│                                                         │
│  [INITIATE THE PAVONIS RUN]                             │
│  [NOT YET]                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## The Pavonis Run Sequence

### Point of No Return

```
┌─────────────────────────────────────────────────────────┐
│  POINT OF NO RETURN                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tanaka stands beside your ship, tools in hand.         │
│                                                         │
│  "Once we do this, there's no coming back. The Range    │
│   Extender is one-way. You'll reach Delta Pavonis, but  │
│   you won't return to the network. Not unless they've   │
│   built wormhole infrastructure there."                 │
│                                                         │
│  She pauses.                                            │
│                                                         │
│  "Are you sure?"                                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [YES, I'M READY]                                       │
│  [NOT YET]                                              │
└─────────────────────────────────────────────────────────┘
```

### Final Preparation

```
┌─────────────────────────────────────────────────────────┐
│  FINAL PREPARATIONS                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You have one last chance to:                           │
│                                                         │
│  • Purchase supplies                                    │
│  • Say goodbye to NPCs                                  │
│  • Repair your ship                                     │
│  • Review your cargo                                    │
│                                                         │
│  When you're ready, return to Tanaka.                   │
│                                                         │
│  [CONTINUE PREPARATIONS]                                │
│  [I'M READY TO GO]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### The Jump

Narrative sequence (not gameplay):

```
The Range Extender hums to life. Your ship vibrates in a way you've never felt before.

Tanaka's voice crackles over the comm. "Coordinates locked. Delta Pavonis. 27.88 light-years. Initiating jump in three... two... one..."

The stars stretch. Reality bends. Your ship screams through space in ways it was never meant to.

And then... silence.

Delta Pavonis burns ahead of you. Orange. Warm. Home.

You made it.
```

---

## Epilogue Generation

### Variables Tracked

```javascript
const epilogueData = {
  // Relationships
  trustedNPCs: gameState.npcs.filter(n => n.rep >= 60).length,
  familyNPCs: gameState.npcs.filter(n => n.rep >= 90).length,
  
  // Morality
  karma: gameState.player.karma,
  smugglingRuns: gameState.stats.smugglingRuns,
  charitableActs: gameState.stats.charitableActs,
  
  // Financial
  finalCredits: gameState.player.credits,
  totalEarned: gameState.stats.creditsEarned,
  
  // Combat
  combatVictories: gameState.stats.combatVictories,
  combatSurrenders: gameState.stats.combatSurrenders,
  
  // Missions
  missionsCompleted: gameState.missions.completed.length,
  missionsFailed: gameState.missions.failed.length,
  
  // Key choices
  helpedOkonkwo: gameState.npcs.okonkwo_ross154?.flags.includes('mission_complete'),
  betrayedAnyone: gameState.player.flags.includes('betrayal'),
  // ... etc
};
```

### Epilogue Structure

```
┌─────────────────────────────────────────────────────────┐
│  EPILOGUE                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Opening paragraph - arrival at Delta Pavonis]         │
│                                                         │
│  [Tanaka's story resolution]                            │
│                                                         │
│  [Player's reputation - how they're remembered]         │
│                                                         │
│  [Key NPC outcomes based on relationships]              │
│                                                         │
│  [Final reflection based on karma/choices]              │
│                                                         │
│  ═══ STATISTICS ═══                                     │
│                                                         │
│  Days traveled: 127                                     │
│  Systems visited: 23                                    │
│  Credits earned: ₡47,320                                │
│  Missions completed: 18                                 │
│  NPCs at Trusted or higher: 5                           │
│                                                         │
│  [CREDITS]                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Epilogue Variations

**High Karma, Many Friends:**
```
"Word spreads fast, even 27 light-years from Sol. They remember you in the network — the trader who kept their word, who helped when it mattered. Chen sends messages. Okonkwo prays for you. Vasquez tells stories about you to young captains.

You're not forgotten."
```

**Low Karma, Few Friends:**
```
"You made it. That's what matters. The network moves on without you. Ships dock and undock. Traders come and go. Your name fades.

But you're here. You're free. That's enough."
```

**Smuggler Path:**
```
"The authorities are probably glad you're gone. One less problem. But in the outer stations, in the dark corners, they remember. The trader who took the risks no one else would. Who got the job done, no matter what.

There's respect in that."
```

---

## Delta Pavonis Data

Add to STAR_DATA (currently unreachable):

```javascript
{
  id: 116,
  name: "Delta Pavonis",
  type: "G8V",
  x: 178,  // 27.88 LY from Sol
  y: -145,
  z: 89,
  wh: 0,   // No wormhole connections
  st: 1,   // One station (colony)
  r: 0     // Unreachable (until Range Extender)
}
```

---

## Testing Checklist

- [ ] Can meet Tanaka at Barnard's Star
- [ ] Tanaka missions unlock in sequence
- [ ] Reputation requirements enforced
- [ ] Range Extender installs correctly
- [ ] Victory conditions check properly
- [ ] Point of no return warning appears
- [ ] Final preparation phase works
- [ ] The Pavonis Run sequence plays
- [ ] Epilogue generates based on choices
- [ ] Statistics display correctly
- [ ] Credits roll

---

## Success Criteria

Player can:
1. Build relationship with Tanaka through missions
2. Learn her backstory and motivations
3. Work toward clear victory conditions
4. Make the final jump to Delta Pavonis
5. See an epilogue that reflects their choices
6. Feel a sense of accomplishment and closure

**Next Spec:** Polish, balance, and content expansion
