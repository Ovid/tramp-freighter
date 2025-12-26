# Tramp Freighter Blues - Spec 04-02: NPC Benefits & Expansion

**Foundation:** Spec 04-01 (NPC Foundation)  
**Status:** Ready for Development  
**Dependencies:** Spec 04-01 must be complete  
**Part:** 2 of 2 (NPC Benefits & Expansion)

---

## Overview

Expand the NPC system with tangible benefits, a full roster of memorable characters, and gameplay rewards for building relationships.

## Goals

- Tier-based benefits (discounts, free services, tips)
- 7 additional NPCs (total 10+)
- NPC-specific tips and market intel
- Special favors system

## Out of Scope

- Full mission/quest system (Spec 05)
- Combat interactions with NPCs
- The Tanaka Sequence (endgame)
- Romance storylines

---

## Tier Benefits System

### Tier Benefits Table

| Tier     | Benefits                                                      |
| -------- | ------------------------------------------------------------- |
| Hostile  | Refuses service, may report smuggling, tips off pirates       |
| Cold     | Minimal interaction, no tips, standard prices                 |
| Neutral  | Standard service, generic dialogue                            |
| Warm     | Occasional tips, small discounts (5%), hints about events     |
| Friendly | Regular tips, 10% discount on services, personal dialogue     |
| Trusted  | Free minor repairs (up to 10%), safe harbor, advance warnings |
| Family   | Will take risks for you, best prices, unique content          |

### Discount Implementation

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

### Free Service Implementation

```javascript
function canGetFreeRepair(npcId, repairAmount) {
  const npcState = gameState.npcs[npcId];
  if (!npcState) return false;

  const tier = getRepTier(npcState.rep);

  // Trusted NPCs give free minor repairs (up to 10%)
  if (tier.name === 'Trusted' && repairAmount <= 10) return true;

  return false;
}
```

**Note:** Original spec specifies "up to 10%" for Trusted. Family tier (25%) is an enhancement for gameplay balance.

### Intel/Tips System

```javascript
function getNPCTip(npcId) {
  const npcState = gameState.npcs[npcId];
  if (!npcState) return null;

  const npc = NPC_DATA[npcId];
  const tier = getRepTier(npcState.rep);

  // Only Warm+ NPCs give tips
  if (tier.name === 'Neutral' || tier.name === 'Cold' || tier.name === 'Hostile') {
    return null;
  }

  // Check if tip already given recently (one tip per week)
  const daysSinceLastTip = gameState.player.daysElapsed - (npcState.lastTipDay || 0);
  if (daysSinceLastTip < 7) return null;

  const tips = npc.tips || [];
  if (tips.length === 0) return null;

  const tip = tips[Math.floor(Math.random() * tips.length)];
  npcState.lastTipDay = gameState.player.daysElapsed;

  return tip;
}
```

---

## Additional NPCs (Part 2)

### 4. "Whisper" (Sirius A)

```javascript
const whisper_sirius = {
  id: 'whisper_sirius',
  name: 'Whisper',
  role: 'Information Broker',
  system: 7,
  station: 'Sirius Exchange',
  personality: { trust: 0.5, greed: 0.7, loyalty: 0.5, morality: 0.4 },
  speechStyle: { greeting: 'formal', vocabulary: 'educated', quirk: 'Cryptic, measured tones' },
  description: "Mysterious info broker. Knows everyone's secrets. Including yours.",
  initialRep: 0,
  tips: [
    'Procyon is buying ore at premium prices this week.',
    'Avoid Tau Ceti. Inspections are up 300%.',
    'Someone at Ross 154 is looking for electronics. Big buyer.',
  ],
  benefits: {
    warm: '10% discount on intel',
    friendly: 'Free rumors once per visit',
    trusted: 'Advance warning of inspections',
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
  speechStyle: { greeting: 'warm', vocabulary: 'simple', quirk: 'Tells trading stories' },
  description: 'Retired freighter captain. Mentor figure. Knows the old routes.',
  initialRep: 5,
  tips: [
    'Barnard's Star always needs ore. Mining station, you know.',
    'Sirius A pays top credit for luxury goods. Rich folks.',
    'The Procyon run is profitable if you can afford the fuel.',
  ],
  benefits: {
    warm: 'Trading tips and route suggestions',
    friendly: 'Old star charts (reveals profitable routes)',
    trusted: 'Will co-invest in cargo runs (50/50 split)',
  },
};
```

### 6. Dr. Sarah Kim (Tau Ceti)

```javascript
const kim_tauceti = {
  id: 'kim_tauceti',
  name: 'Dr. Sarah Kim',
  role: 'Station Administrator',
  system: 12,
  station: 'Tau Ceti Station',
  personality: { trust: 0.4, greed: 0.5, loyalty: 0.6, morality: 0.8 },
  speechStyle: { greeting: 'formal', vocabulary: 'technical', quirk: 'Cites regulations' },
  description: 'Efficient station administrator. By-the-book. Respects professionalism.',
  initialRep: 0,
  tips: [
    'We have strict customs here. Keep your cargo manifest accurate.',
    'Medicine prices are stable at Ross 154. Good for planning.',
    'Fuel efficiency matters on long routes. Upgrade your engine.',
  ],
  benefits: {
    warm: 'Expedited docking clearance',
    friendly: 'Waives docking fees',
    trusted: 'Advance notice of inspections',
  },
};
```

### 7. "Rusty" Rodriguez (Procyon)

```javascript
const rusty_procyon = {
  id: 'rusty_procyon',
  name: '"Rusty" Rodriguez',
  role: 'Mechanic',
  system: 13,
  station: 'Procyon Depot',
  personality: { trust: 0.7, greed: 0.4, loyalty: 0.8, morality: 0.5 },
  speechStyle: { greeting: 'gruff', vocabulary: 'technical', quirk: 'Talks to ships like people' },
  description: 'Gruff but skilled mechanic. Loves ships more than people.',
  initialRep: 0,
  tips: [
    "Don't let your hull drop below 50%. Expensive to fix after that.",
    'Engine degradation is real. Budget for maintenance.',
    'Life support is critical. Never skip those repairs.',
  ],
  benefits: {
    warm: '5% discount on repairs',
    friendly: '15% discount on repairs',
    trusted: 'Free diagnostics and minor fixes',
  },
};
```

### 8. Zara Osman (Luyten's Star)

```javascript
const osman_luyten = {
  id: 'osman_luyten',
  name: 'Zara Osman',
  role: 'Trader',
  system: 9,
  station: "Luyten's Outpost",
  personality: { trust: 0.5, greed: 0.6, loyalty: 0.6, morality: 0.5 },
  speechStyle: { greeting: 'casual', vocabulary: 'slang', quirk: 'Trading jargon' },
  description: 'Sharp trader with connections across the sector. Competitive but fair.',
  initialRep: 0,
  tips: [
    'Buy low at mining stations, sell high at rich systems.',
    'Luxury goods have the best margins if you can afford the capital.',
    'Watch for economic events. They shift prices dramatically.',
  ],
  benefits: {
    warm: 'Market price hints',
    friendly: 'Advance notice of price shifts',
    trusted: 'Will buy your cargo at 105% market rate',
  },
};
```

### 9. Station Master Kowalski (Alpha Centauri)

```javascript
const kowalski_centauri = {
  id: 'kowalski_centauri',
  name: 'Station Master Kowalski',
  role: 'Station Master',
  system: 1,
  station: 'Centauri Station',
  personality: { trust: 0.3, greed: 0.4, loyalty: 0.7, morality: 0.7 },
  speechStyle: { greeting: 'gruff', vocabulary: 'simple', quirk: 'No-nonsense, direct' },
  description: 'Veteran station master. Seen everything. Respects competence.',
  initialRep: 0,
  tips: [
    'Alpha Centauri is a hub. Good for buying and selling most goods.',
    'We get a lot of traffic. Prices are competitive.',
    'Keep your ship in good shape. We have standards here.',
  ],
  benefits: {
    warm: 'Priority docking',
    friendly: 'Access to station storage (10 units)',
    trusted: 'Emergency fuel at cost',
  },
};
```

### 10. "Lucky" Liu (Wolf 359)

```javascript
const liu_wolf359 = {
  id: 'liu_wolf359',
  name: '"Lucky" Liu',
  role: 'Gambler',
  system: 8,
  station: 'Wolf 359 Station',
  personality: { trust: 0.6, greed: 0.8, loyalty: 0.4, morality: 0.3 },
  speechStyle: { greeting: 'casual', vocabulary: 'slang', quirk: 'Gambling metaphors' },
  description: 'Professional gambler and risk-taker. Loves long odds. Respects bold moves.',
  initialRep: 0,
  tips: [
    'Sometimes you gotta take risks. Big risks, big rewards.',
    'I heard about a high-stakes cargo run. Interested?',
    "Don't play it safe all the time. Fortune favors the bold.",
  ],
  benefits: {
    warm: 'Gambling tips',
    friendly: 'Will stake you ₡500 for cargo runs',
    trusted: 'Shares insider information on risky opportunities',
  },
};
```

---

## Dialogue Trees

**Note:** All NPCs follow the dialogue tree pattern from Part 1. Example for Whisper:

```javascript
const DIALOGUE_TREES = {
  whisper_sirius: {
    greeting: {
      text: (rep) => {
        const tier = getRepTier(rep);
        if (tier.name === 'Neutral') return 'Welcome. I deal in information. What do you need?';
        if (tier.name === 'Warm') return 'Ah, a familiar face. Looking for intel?';
        if (tier.name === 'Friendly') return 'Good to see you. I have something interesting.';
        if (tier.name === 'Trusted') return "I've been expecting you. We need to talk.";
        return 'Information costs credits.';
      },
      choices: [
        { text: 'What kind of information?', next: 'what_info', repGain: 1 },
        { text: 'Any tips for me?', next: 'tips', condition: (rep) => rep >= 10 },
        { text: 'Tell me about yourself.', next: 'backstory', condition: (rep) => rep >= 30 },
        { text: 'Not today.', next: null },
      ],
    },
    // Additional nodes follow same pattern as Part 1
  },
};
```

**Vasquez Dialogue** includes backstory about Pavonis route and Range Extender (endgame hints).

---

## Special Favors

```javascript
function checkFavorAvailability(npcId, favorType) {
  const npcState = gameState.npcs[npcId];
  if (!npcState) return { available: false, reason: 'NPC not met' };

  const tier = getRepTier(npcState.rep);
  const daysSinceLastFavor = gameState.player.daysElapsed - (npcState.lastFavorDay || 0);

  if (daysSinceLastFavor < 30) {
    return { available: false, reason: 'Favor used recently (wait 30 days)' };
  }

  if (favorType === 'emergency_loan') {
    if (tier.name === 'Trusted' || tier.name === 'Family') {
      return { available: true, cost: 0 };
    }
    return { available: false, reason: 'Requires Trusted relationship' };
  }

  if (favorType === 'cargo_storage') {
    if (tier.name === 'Friendly' || tier.name === 'Trusted' || tier.name === 'Family') {
      return { available: true, cost: 0 };
    }
    return { available: false, reason: 'Requires Friendly relationship' };
  }

  return { available: false, reason: 'Unknown favor type' };
}

function grantFavor(npcId, favorType) {
  const check = checkFavorAvailability(npcId, favorType);
  if (!check.available) return false;

  const npcState = gameState.npcs[npcId];
  npcState.lastFavorDay = gameState.player.daysElapsed;

  if (favorType === 'emergency_loan') {
    gameState.player.credits += 500;
    modifyRep(npcId, 5, 'accepted emergency loan');
  }

  if (favorType === 'cargo_storage') {
    npcState.storedCargo = gameState.ship.cargo.splice(0, 10);
  }

  return true;
}
```

---

## Testing Checklist

- [ ] All 10 NPCs appear at correct stations
- [ ] Tier benefits apply correctly (discounts, free services)
- [ ] Free repair thresholds work (10% Trusted, 25% Family)
- [ ] Tips given once per week maximum
- [ ] Special favors have correct tier requirements
- [ ] Favors have 30-day cooldown
- [ ] Service prices show discount in UI

---

## Success Criteria

Player can:

1. Build relationships with 10+ unique NPCs
2. Receive tangible gameplay benefits from friendships
3. Get free services from Trusted NPCs
4. Receive trading tips and market intel
5. Request special favors from close friends

**Next Spec:** Events, missions, and narrative content (Spec 05)
