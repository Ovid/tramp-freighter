# Tramp Freighter Blues - Spec 04: NPCs & Relationships

**Foundation:** Spec 03 (Ship Personality)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-03 must be complete

---

## Overview

Bring the universe to life with memorable NPCs who remember you, offer help, and have their own stories. This is where "You Know These People" becomes real.

## Goals

- NPC system with persistent relationships
- Relationship tiers with benefits
- Dialogue system with branching choices
- 10+ key NPCs across different stations
- NPC-specific tips and favors
- Reputation tracking

## Out of Scope

- Full mission/quest system (comes in Spec 05)
- Combat interactions
- The Tanaka Sequence (endgame content)
- Romance or deep personal storylines

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

  dialogue: {
    greeting_neutral: [
      'Another ship. Another day.',
      "Docking Bay 3. Watch the left strut, it's loose.",
      'You need something?',
    ],
    greeting_friendly: [
      'Hey, good to see you back.',
      'Your usual bay is open. I kept it clear.',
      "How's that drive holding up?",
    ],
    greeting_trusted: [
      'There you are. Was starting to worry.',
      "Come on, I'll help you unload. No charge.",
      'Got something you should hear about...',
    ],

    tips: [
      "Ore's cheap here. Always is. Mining station, you know.",
      "Sirius A? Expensive. Everything's expensive there.",
      'You want medicine? Ross 154. They make it there.',
    ],

    backstory: [
      'Used to run my own ship. Long time ago. Tanaka drive, like yours.',
      'Lost her in a bad deal. Learned my lesson about trust.',
      'Been here ever since. Honest work. Boring, but honest.',
    ],
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

### Tier Benefits

| Tier     | Benefits                                                      |
| -------- | ------------------------------------------------------------- |
| Hostile  | Refuses service, may report smuggling, tips off pirates       |
| Cold     | Minimal interaction, no tips, standard prices                 |
| Neutral  | Standard service, generic dialogue                            |
| Warm     | Occasional tips, small discounts (5%), hints about events     |
| Friendly | Regular tips, 10% discount on services, personal dialogue     |
| Trusted  | Free minor repairs (up to 10%), safe harbor, advance warnings |
| Family   | Will take risks for you, best prices, unique content          |

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
    amount *= npc.personality.trust; // Harder to gain trust from suspicious NPCs
  }

  // Apply ship quirk bonus
  if (gameState.ship.quirks.includes('smooth_talker')) {
    amount *= 1.05;
  }

  npcState.rep = Math.max(-100, Math.min(100, npcState.rep + amount));
  npcState.lastInteraction = gameState.player.daysElapsed;
  npcState.interactions++;

  // Log for debugging
  if (reason) {
    console.log(`${npc.name} rep ${amount > 0 ? '+' : ''}${amount}: ${reason}`);
  }
}
```

---

## Key NPCs

### 1. Wei Chen (Barnard's Star)

```javascript
const chen_barnards = {
  id: 'chen_barnards',
  name: 'Wei Chen',
  role: 'Dock Worker',
  system: 4,
  station: 'Bore Station 7',

  personality: { trust: 0.3, greed: 0.2, loyalty: 0.8, morality: 0.6 },

  description: 'Weathered dock worker. Former ship captain. Knows the sector.',

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

  description:
    'Your creditor. Starts hostile but respects those who pay honestly.',

  benefits: {
    neutral: 'Stops sending threats',
    friendly: 'Reduces interest rate to 1%',
    trusted: 'Offers emergency loans at fair rates',
  },
};
```

### 3. "Whisper" (Sirius A)

```javascript
const whisper_sirius = {
  id: 'whisper_sirius',
  name: 'Whisper',
  role: 'Information Broker',
  system: 7,
  station: 'Sirius Exchange',

  personality: { trust: 0.5, greed: 0.7, loyalty: 0.5, morality: 0.4 },

  description:
    "Mysterious info broker. Knows everyone's secrets. Including yours.",

  benefits: {
    warm: '10% discount on intel',
    friendly: 'Free rumors once per visit',
    trusted: 'Advance warning of inspections',
  },
};
```

### 4. Father Okonkwo (Ross 154)

```javascript
const okonkwo_ross154 = {
  id: 'okonkwo_ross154',
  name: 'Father Okonkwo',
  role: 'Chaplain',
  system: 11,
  station: 'Ross 154 Medical',

  personality: { trust: 0.7, greed: 0.0, loyalty: 0.9, morality: 0.9 },

  description:
    'Station chaplain and medic. Moral compass. Helps those in need.',

  benefits: {
    warm: 'Free life support repairs',
    friendly: 'No-interest emergency loans (₡500)',
    trusted: 'Will forgive debts if you help others',
  },
};
```

### 5. Captain Vasquez (Epsilon Eridani)

```javascript
const vasquez_eridani = {
  id: 'vasquez_eridani',
  name: 'Captain Vasquez',
  role: 'Retired Trader',
  system: 10,
  station: 'Eridani Hub',

  personality: { trust: 0.6, greed: 0.3, loyalty: 0.7, morality: 0.7 },

  description:
    'Retired freighter captain. Mentor figure. Knows the old routes.',

  benefits: {
    warm: 'Trading tips and route suggestions',
    friendly: 'Old star charts (reveals profitable routes)',
    trusted: 'Will co-invest in cargo runs (50/50 split)',
  },
};
```

---

## Dialogue System

### Dialogue Interface

When talking to an NPC:

```
┌─────────────────────────────────────────────────────────┐
│  WEI CHEN — Dock Worker                    [Friendly]   │
│  Bore Station 7, Barnard's Star                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Chen looks up from her datapad and nods.               │
│                                                         │
│  "Hey, good to see you back. Your usual bay is open.    │
│   I kept it clear."                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] "Thanks. How's business?"                          │
│  [2] "Any trading tips?"                                │
│  [3] "Tell me about yourself."                          │
│  [4] "I should get going." [END]                        │
└─────────────────────────────────────────────────────────┘
```

### Dialogue Trees

```javascript
const DIALOGUE_TREES = {
  chen_barnards: {
    greeting: {
      text: (rep) => {
        const tier = getRepTier(rep);
        if (tier.name === 'Neutral') return 'Another ship. Another day.';
        if (tier.name === 'Warm') return 'You need something?';
        if (tier.name === 'Friendly') return 'Hey, good to see you back.';
        if (tier.name === 'Trusted')
          return 'There you are. Was starting to worry.';
        return 'Docking Bay 3.';
      },
      choices: [
        { text: "Thanks. How's business?", next: 'small_talk', repGain: 1 },
        { text: 'Any trading tips?', next: 'tips', condition: 'rep >= 10' },
        {
          text: 'Tell me about yourself.',
          next: 'backstory',
          condition: 'rep >= 30',
        },
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

    tips: {
      text: () => {
        const tips = [
          "Ore's cheap here. Always is. Mining station.",
          "Sirius A? Everything's expensive there. Rich folks.",
          'You want medicine? Ross 154. They make it there.',
        ];
        return tips[Math.floor(Math.random() * tips.length)];
      },
      choices: [
        { text: 'Thanks for the tip.', next: 'greeting', repGain: 1 },
        { text: 'Anything else?', next: 'greeting' },
      ],
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

### Dialogue Engine

```javascript
function showDialogue(npcId, nodeId = 'greeting') {
  const npc = NPC_DATA[npcId];
  const npcState = gameState.npcs[npcId] || { rep: 0, flags: [] };
  const tree = DIALOGUE_TREES[npcId];
  const node = tree[nodeId];

  // Get text (may be function)
  const text =
    typeof node.text === 'function' ? node.text(npcState.rep) : node.text;

  // Filter choices by conditions
  const availableChoices = node.choices.filter((choice) => {
    if (!choice.condition) return true;
    return eval(choice.condition.replace('rep', npcState.rep));
  });

  // Render dialogue UI
  renderDialogueUI(npc, text, availableChoices, npcState.rep);
}

function selectChoice(npcId, choice) {
  // Apply rep gain
  if (choice.repGain) {
    modifyRep(npcId, choice.repGain, 'dialogue choice');
  }

  // Set flags
  const node = getCurrentNode(npcId);
  if (node.flags) {
    node.flags.forEach((flag) => {
      gameState.npcs[npcId].flags.push(flag);
    });
  }

  // Navigate to next node
  if (choice.next) {
    showDialogue(npcId, choice.next);
  } else {
    closeDialogue();
  }
}
```

---

## NPC Encounters

### Station Menu with NPCs

```
┌─────────────────────────────────────────────────────────┐
│  BORE STATION 7 — Barnard's Star                        │
│  Distance from Sol: 5.98 LY                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [TRADE]      [REFUEL]      [REPAIRS]      [UPGRADES]   │
│                                                         │
│  ═══ PEOPLE ═══                                         │
│                                                         │
│  • Wei Chen (Dock Worker) [Friendly]                    │
│  • Station Master [Neutral]                             │
│                                                         │
│  [UNDOCK]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Click on NPC name to initiate dialogue.

---

## Relationship Benefits Implementation

### Discounts

```javascript
function getServicePrice(basePrice, npcId) {
  const npcState = gameState.npcs[npcId];
  if (!npcState) return basePrice;

  const tier = getRepTier(npcState.rep);

  if (tier.name === 'Warm') return Math.round(basePrice * 0.95); // 5% off
  if (tier.name === 'Friendly') return Math.round(basePrice * 0.9); // 10% off
  if (tier.name === 'Trusted') return Math.round(basePrice * 0.85); // 15% off
  if (tier.name === 'Family') return Math.round(basePrice * 0.8); // 20% off

  return basePrice;
}
```

### Free Services

```javascript
function canGetFreeRepair(npcId, repairAmount) {
  const npcState = gameState.npcs[npcId];
  if (!npcState) return false;

  const tier = getRepTier(npcState.rep);

  // Trusted NPCs give free minor repairs (up to 10%)
  if (tier.name === 'Trusted' && repairAmount <= 10) {
    return true;
  }

  return false;
}
```

---

## Testing Checklist

- [ ] NPCs appear at their home stations
- [ ] Can initiate dialogue with NPCs
- [ ] Dialogue choices affect reputation
- [ ] Reputation tiers display correctly
- [ ] Tier benefits apply (discounts, free services)
- [ ] Dialogue trees branch correctly
- [ ] Conditions hide/show choices appropriately
- [ ] Flags persist across conversations
- [ ] Multiple NPCs can exist at same station
- [ ] NPC state saves/loads correctly

---

## Success Criteria

Player can:

1. Meet and talk to memorable NPCs
2. Build relationships through repeated interactions
3. Receive tangible benefits from friendships
4. Learn about the universe through NPC dialogue
5. Make choices that affect how NPCs view them

**Next Spec:** Events, missions, and narrative content
