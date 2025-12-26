# Tramp Freighter Blues - Spec 04-01: NPC Foundation

**Foundation:** Spec 03 (Ship Personality)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-03 must be complete  
**Part:** 1 of 2 (NPC Foundation)

---

## Overview

Establish the foundation for NPCs with persistent relationships, basic dialogue, and reputation tracking. This part focuses on the core systems that make NPCs memorable and reactive to player actions.

## Goals

- NPC data structure and storage
- Relationship/reputation system with tiers
- Basic dialogue interface
- 3 initial NPCs to test the system
- Reputation tracking and persistence
- Simple dialogue trees with choices

## Out of Scope (Part 2)

- 7 additional NPCs (Part 2 adds to reach 10+ total)
- Tier-based benefit implementation (discounts, free services)
- NPC tips system with cooldowns
- Special favors system
- Complex branching dialogue trees

---

## NPC Data Structure

```javascript
const NPC_SCHEMA = {
  id: 'chen_barnards',
  name: 'Wei Chen',
  role: 'Dock Worker',
  system: 4, // Barnard's Star
  station: 'Bore Station 7',

  personality: {
    trust: 0.3, // How quickly they warm up (0-1)
    greed: 0.2, // Money motivation (0-1)
    loyalty: 0.8, // Relationship value (0-1)
    morality: 0.6, // Ethical flexibility (0-1)
  },

  speechStyle: {
    greeting: 'casual', // casual, formal, gruff, warm
    vocabulary: 'simple', // simple, educated, technical, slang
    quirk: "Drops articles ('Had ship like that' vs 'I had a ship')",
  },

  description:
    'Weathered dock worker in her 50s. Seen it all, helps those who help themselves.',

  initialRep: 0, // Starting relationship
};
```

### NPC State (in Game State)

```javascript
gameState.npcs = {
  chen_barnards: {
    rep: 15, // Current reputation (-100 to 100)
    lastInteraction: 42, // Day last talked to them
    flags: ['chen_backstory_1'], // Story flags
    interactions: 5, // Total conversation count
  },
};
```

---

## Relationship System

### Relationship Tiers

```javascript
const REP_TIERS = {
  hostile: { min: -100, max: -50, name: 'Hostile' },
  cold: { min: -49, max: -10, name: 'Cold' },
  neutral: { min: -9, max: 9, name: 'Neutral' },
  warm: { min: 10, max: 29, name: 'Warm' },
  friendly: { min: 30, max: 59, name: 'Friendly' },
  trusted: { min: 60, max: 89, name: 'Trusted' },
  family: { min: 90, max: 100, name: 'Family' },
};

function getRepTier(rep) {
  for (let tier of Object.values(REP_TIERS)) {
    if (rep >= tier.min && rep <= tier.max) {
      return tier;
    }
  }
  return REP_TIERS.neutral;
}
```

### Reputation Changes

```javascript
function modifyRep(npcId, amount, reason = null) {
  if (!gameState.npcs[npcId]) {
    gameState.npcs[npcId] = {
      rep: 0,
      lastInteraction: gameState.player.daysElapsed,
      flags: [],
      interactions: 0,
    };
  }

  const npc = NPC_DATA[npcId];
  const npcState = gameState.npcs[npcId];

  // Apply personality modifiers
  if (amount > 0) {
    amount *= npc.personality.trust;
  }

  // Apply ship quirk bonus
  if (gameState.ship.quirks?.includes('smooth_talker')) {
    amount *= 1.05;
  }

  npcState.rep = Math.max(-100, Math.min(100, npcState.rep + amount));
  npcState.lastInteraction = gameState.player.daysElapsed;
  npcState.interactions++;

  if (reason) {
    console.log(`${npc.name} rep ${amount > 0 ? '+' : ''}${amount}: ${reason}`);
  }
}
```

---

## Initial NPCs (Part 1)

### 1. Wei Chen (Barnard's Star)

```javascript
const chen_barnards = {
  id: 'chen_barnards',
  name: 'Wei Chen',
  role: 'Dock Worker',
  system: 4,
  station: 'Bore Station 7',
  personality: { trust: 0.3, greed: 0.2, loyalty: 0.8, morality: 0.6 },
  speechStyle: { greeting: 'casual', vocabulary: 'simple', quirk: "Drops articles" },
  description: 'Weathered dock worker. Former ship captain. Knows the sector.',
  initialRep: 0,
  benefits: {
    warm: 'Free loading/unloading tips',
    friendly: 'Market intel for free',
    trusted: 'Will store cargo for you (up to 10 units)',
  },
};
```

### 2. Marcus Cole (Sol)

```javascript
const cole_sol = {
  id: 'cole_sol',
  name: 'Marcus Cole',
  role: 'Loan Shark',
  system: 0,
  station: 'Sol Central',
  personality: { trust: 0.1, greed: 0.9, loyalty: 0.3, morality: 0.2 },
  speechStyle: { greeting: 'formal', vocabulary: 'educated', quirk: 'Short, clipped sentences' },
  description: 'Your creditor. Cold and calculating. Respects those who pay their debts.',
  initialRep: -20, // Starts cold due to debt
  benefits: {
    neutral: 'Stops sending threats',
    friendly: 'Reduces interest rate to 1%',
    trusted: 'Offers emergency loans at fair rates',
  },
};
```

### 3. Father Okonkwo (Ross 154)

```javascript
const okonkwo_ross154 = {
  id: 'okonkwo_ross154',
  name: 'Father Okonkwo',
  role: 'Chaplain',
  system: 11,
  station: 'Ross 154 Medical',
  personality: { trust: 0.7, greed: 0.0, loyalty: 0.9, morality: 0.9 },
  speechStyle: { greeting: 'warm', vocabulary: 'educated', quirk: 'Religious metaphors' },
  description: 'Station chaplain and medic. Moral compass. Helps those in need.',
  initialRep: 10, // Starts warm (welcoming to all)
  benefits: {
    warm: 'Free life support repairs',
    friendly: 'No-interest emergency loans (₡500)',
    trusted: 'Will forgive debts if you help others',
  },
};
```

---

## Dialogue System

### Dialogue Interface

```
┌─────────────────────────────────────────────────────────┐
│  WEI CHEN — Dock Worker                    [Friendly]   │
│  Bore Station 7, Barnard's Star                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  "Hey, good to see you back. Your usual bay is open."  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] "Thanks. How's business?"                          │
│  [2] "Tell me about yourself."                          │
│  [3] "I should get going." [END]                        │
└─────────────────────────────────────────────────────────┘
```

### Dialogue Trees

**Note:** Original spec uses string conditions with `eval()`. This implementation uses function conditions for safety.

```javascript
const DIALOGUE_TREES = {
  chen_barnards: {
    greeting: {
      text: (rep) => {
        const tier = getRepTier(rep);
        if (tier.name === 'Neutral') return 'Another ship. Another day.';
        if (tier.name === 'Warm') return 'You need something?';
        if (tier.name === 'Friendly') return 'Hey, good to see you back.';
        if (tier.name === 'Trusted') return 'There you are. Was starting to worry.';
        return 'Docking Bay 3.';
      },
      choices: [
        { text: "Thanks. How's business?", next: 'small_talk', repGain: 1 },
        { text: 'Tell me about yourself.', next: 'backstory', condition: (rep) => rep >= 30 },
        { text: 'I should get going.', next: null },
      ],
    },

    small_talk: {
      text: 'Same as always. Ships come, ships go. Keeps me busy.',
      choices: [
        { text: 'Must get boring.', next: 'boring_response', repGain: 1 },
        { text: 'Honest work.', next: 'honest_work', repGain: 2 },
        { text: 'Anything else?', next: 'greeting' },
      ],
    },

    boring_response: {
      text: 'Sometimes. But boring is safe. Safe is good.',
      choices: [{ text: 'Fair enough.', next: 'greeting', repGain: 1 }],
    },

    honest_work: {
      text: 'Exactly. Not glamorous, but it pays. And nobody shoots at me.',
      choices: [{ text: 'Good point.', next: 'greeting', repGain: 1 }],
    },

    backstory: {
      text: 'Used to run my own ship. Long time ago. Tanaka drive, like yours.',
      flags: ['chen_backstory_1'],
      choices: [
        { text: 'What happened?', next: 'backstory_2', repGain: 2 },
        { text: 'Maybe another time.', next: 'greeting' },
      ],
    },

    backstory_2: {
      text: 'Lost her in a bad deal. Learned my lesson about trust. Been here ever since.',
      flags: ['chen_backstory_complete'],
      choices: [
        { text: "I'm sorry.", next: 'greeting', repGain: 3 },
        { text: 'We all make mistakes.', next: 'greeting', repGain: 2 },
      ],
    },
  },
};
```

**Note:** Marcus Cole and Father Okonkwo follow the same pattern with different text and personality-appropriate responses.

### Dialogue Engine

```javascript
function showDialogue(npcId, nodeId = 'greeting') {
  const npc = NPC_DATA[npcId];
  const npcState = gameState.npcs[npcId] || { rep: npc.initialRep, flags: [] };
  const tree = DIALOGUE_TREES[npcId];
  const node = tree[nodeId];

  const text = typeof node.text === 'function' ? node.text(npcState.rep) : node.text;
  const availableChoices = node.choices.filter((choice) => {
    if (!choice.condition) return true;
    return choice.condition(npcState.rep);
  });

  renderDialogueUI(npc, text, availableChoices, getRepTier(npcState.rep));
}

function selectChoice(npcId, choice) {
  if (choice.repGain) {
    modifyRep(npcId, choice.repGain, 'dialogue choice');
  }

  const node = getCurrentDialogueNode(npcId);
  if (node.flags) {
    const npcState = gameState.npcs[npcId];
    node.flags.forEach((flag) => {
      if (!npcState.flags.includes(flag)) {
        npcState.flags.push(flag);
      }
    });
  }

  if (choice.next) {
    showDialogue(npcId, choice.next);
  } else {
    closeDialogue();
  }
}
```

---

## Station Menu with NPCs

```
┌─────────────────────────────────────────────────────────┐
│  BORE STATION 7 — Barnard's Star                        │
├─────────────────────────────────────────────────────────┤
│  [TRADE]  [REFUEL]  [REPAIRS]  [UPGRADES]               │
│                                                         │
│  ═══ PEOPLE ═══                                         │
│  • Wei Chen (Dock Worker) [Friendly]                    │
│                                                         │
│  [UNDOCK]                                               │
└─────────────────────────────────────────────────────────┘
```

```javascript
function getNPCsAtSystem(systemId) {
  return Object.values(NPC_DATA).filter((npc) => npc.system === systemId);
}

function renderStationNPCs() {
  const npcs = getNPCsAtSystem(gameState.player.currentSystem);
  if (npcs.length === 0) return;

  return npcs.map((npc) => {
    const npcState = gameState.npcs[npc.id] || { rep: npc.initialRep };
    const tier = getRepTier(npcState.rep);
    return `• ${npc.name} (${npc.role}) [${tier.name}]`;
  }).join('\n');
}
```

---

## Save/Load Integration

```javascript
const SAVE_DATA_SCHEMA = {
  version: 4, // Increment for NPC support
  timestamp: Date.now(),
  state: {
    player: { /* ... */ },
    ship: { /* ... */ },
    world: { /* ... */ },
    npcs: {
      chen_barnards: {
        rep: 25,
        lastInteraction: 42,
        flags: ['chen_backstory_1'],
        interactions: 8,
      },
    },
  },
};

function migrateToVersion4(oldSave) {
  if (!oldSave.state.npcs) {
    oldSave.state.npcs = {};
  }
  oldSave.version = 4;
  return oldSave;
}
```

---

## Testing Checklist

- [ ] NPCs appear at their home stations
- [ ] Can initiate dialogue with NPCs
- [ ] Dialogue choices affect reputation
- [ ] Reputation tiers display correctly
- [ ] Dialogue trees branch correctly
- [ ] Conditions hide/show choices appropriately
- [ ] Flags persist across conversations
- [ ] NPC state saves/loads correctly

---

## Success Criteria

Player can:

1. Meet NPCs at specific stations
2. Engage in dialogue with choices
3. Build relationships through conversations
4. See reputation tier change based on interactions
5. Experience different greetings based on relationship level

**Next:** Part 2 adds full NPC roster, tier benefits, and complex dialogue.
