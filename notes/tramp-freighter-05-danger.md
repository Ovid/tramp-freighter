# Tramp Freighter Blues - Spec 05: Danger & Combat

**Foundation:** Spec 04 (NPCs & Relationships)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-04 must be complete

---

## Overview

Add tension and risk through pirates, inspections, mechanical failures, and tactical choices. Combat is choice-driven, not twitch-based.

## Goals

- Pirate encounters with tactical choices
- Customs inspections for restricted goods
- Mechanical failures based on ship condition
- Distress calls (moral choices)
- Combat resolution system
- Consequences and rewards

## Out of Scope

- Real-time combat
- Crew management
- Faction warfare
- Complex weapon systems

---

## Threat Zones

### Route Danger Levels

```javascript
const DANGER_ZONES = {
  safe: {
    pirateChance: 0.05,
    inspectionChance: 0.1,
    systems: [0, 1, 4], // Sol, Alpha Centauri, Barnard's
  },
  contested: {
    pirateChance: 0.2,
    inspectionChance: 0.15,
    systems: [7, 10], // Sirius, Epsilon Eridani
  },
  dangerous: {
    pirateChance: 0.35,
    inspectionChance: 0.05,
    systems: [], // Outer Reach systems (distance > 15 LY)
  },
};

function getDangerLevel(systemId) {
  const system = STAR_DATA.find((s) => s.id === systemId);
  const distance = getDistanceFromSol(system);

  if (DANGER_ZONES.safe.systems.includes(systemId)) return 'safe';
  if (DANGER_ZONES.contested.systems.includes(systemId)) return 'contested';
  if (distance > 15) return 'dangerous';

  return 'safe';
}
```

### Jump Warning

Before jumping to dangerous systems:

```
┌─────────────────────────────────────────────────────────┐
│  JUMP WARNING                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠ This route passes through contested space.           │
│                                                         │
│  Pirate activity reported in this sector.              │
│  Recommend caution.                                     │
│                                                         │
│  [PROCEED]  [CANCEL]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Pirate Encounters

### Encounter Trigger

```javascript
function checkForPirateEncounter(fromSystem, toSystem) {
  const dangerLevel = getDangerLevel(toSystem);
  const baseChance = DANGER_ZONES[dangerLevel].pirateChance;

  // Modifiers
  let chance = baseChance;

  // Carrying valuable cargo increases risk
  const cargoValue = calculateCargoValue();
  if (cargoValue > 5000) chance *= 1.2;
  if (cargoValue > 10000) chance *= 1.5;

  // Ship condition affects detection
  if (gameState.ship.engine < 50) chance *= 1.1; // Slow ship

  // Advanced sensors reduce risk
  if (gameState.ship.upgrades.includes('advanced_sensors')) {
    chance *= 0.8;
  }

  return Math.random() < chance;
}
```

### Pirate Encounter Screen

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ PIRATE ENCOUNTER                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  A corsair drops out of the asteroid shadow, weapons    │
│  hot. Your proximity alarm screams.                     │
│                                                         │
│  "Red Claw" Corsair                                     │
│  Threat Level: ████████░░ (Strong)                      │
│                                                         │
│  Your Status:                                           │
│  Hull: 67%  |  Engine: 84%  |  Fuel: 45%               │
│  Cargo Value: ₡3,240                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [FIGHT]      Engage in combat                          │
│  [FLEE]       Attempt to escape                         │
│  [NEGOTIATE]  Try to talk your way out                  │
│  [SURRENDER]  Give them what they want                  │
└─────────────────────────────────────────────────────────┘
```

---

## Combat System

### Fight Option

```
┌─────────────────────────────────────────────────────────┐
│  COMBAT — "Red Claw" Corsair                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  The corsair locks weapons. Your sensors show two more  │
│  ships emerging from the asteroid shadow.               │
│                                                         │
│  Enemy Strength: ████████░░ (Strong)                    │
│  Your Hull: 67%  |  Engine: 84%                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] Evasive maneuvers                                  │
│      Engine check (70% success)                         │
│      Success: Escape, -15% fuel, -5% engine             │
│      Failure: Take hit (-20% hull), continue fight      │
│                                                         │
│  [2] Return fire                                        │
│      Combat check (45% success)                         │
│      Success: Drive off attacker, -10% hull             │
│      Failure: Heavy damage (-30% hull), they board      │
│                                                         │
│  [3] Dump cargo and run                                 │
│      Guaranteed escape                                  │
│      Lose: 50% of cargo, -10% fuel                      │
│                                                         │
│  [4] Broadcast distress signal                          │
│      30% chance: Patrol responds, pirates flee          │
│      70% chance: No response, pirates attack (+10% dmg) │
└─────────────────────────────────────────────────────────┘
```

### Combat Resolution

```javascript
function resolveCombat(choice, enemyStrength) {
  const results = {
    evasive: {
      successChance: 0.7,
      success: { fuel: -15, engine: -5, escaped: true },
      failure: { hull: -20, continue: true },
    },
    returnFire: {
      successChance: 0.45,
      success: { hull: -10, escaped: true, salvage: true },
      failure: { hull: -30, cargo: -100, credits: -500 },
    },
    dumpCargo: {
      successChance: 1.0,
      success: { cargo: -50, fuel: -10, escaped: true },
    },
    distress: {
      successChance: 0.3,
      success: { escaped: true, repGain: 5 },
      failure: { hull: -25, continue: true },
    },
  };

  // Apply modifiers
  if (choice === 'evasive' && gameState.ship.engine > 80) {
    results.evasive.successChance += 0.15;
  }

  if (choice === 'evasive' && gameState.ship.quirks.includes('hot_thruster')) {
    results.evasive.successChance += 0.1;
  }

  // Roll
  const roll = Math.random();
  const outcome = roll < results[choice].successChance ? 'success' : 'failure';

  return applyOutcome(results[choice][outcome]);
}
```

---

## Negotiate Option

```
┌─────────────────────────────────────────────────────────┐
│  NEGOTIATION — "Red Claw" Corsair                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  The corsair captain's face fills your screen.          │
│  Scarred. Tired. Not unlike you.                        │
│                                                         │
│  "Twenty percent of your cargo and you fly free.        │
│   Counter-offer?"                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] "Ten percent. That's fair."                        │
│      Charisma check (60% base)                          │
│      Success: Pay 10%, leave peacefully                 │
│      Failure: They attack, +10% enemy strength          │
│                                                         │
│  [2] "I'm carrying medicine for Ross 154."              │
│      Only if carrying medicine                          │
│      Morality check (40% chance)                        │
│      Success: They let you pass free                    │
│      Failure: "Not my problem." Standard demand         │
│                                                         │
│  [3] "I know where there's a fatter target."            │
│      Requires: Intel about another ship                 │
│      Success: Pirates leave, -rep if discovered         │
│      Failure: They don't believe you, attack            │
│                                                         │
│  [4] Accept the twenty percent.                         │
│      Pay 20% cargo, leave peacefully                    │
└─────────────────────────────────────────────────────────┘
```

---

## Customs Inspections

### Inspection Trigger

```javascript
function checkForInspection(systemId) {
  const dangerLevel = getDangerLevel(systemId);
  let chance = DANGER_ZONES[dangerLevel].inspectionChance;

  // Carrying restricted goods increases chance
  const restrictedCount = countRestrictedGoods();
  if (restrictedCount > 0) {
    chance *= 1 + restrictedCount * 0.1;
  }

  // Core systems inspect more
  if ([0, 1].includes(systemId)) {
    // Sol, Alpha Centauri
    chance *= 2;
  }

  return Math.random() < chance;
}
```

### Inspection Screen

```
┌─────────────────────────────────────────────────────────┐
│  CUSTOMS INSPECTION                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  A patrol ship intercepts you on approach.              │
│                                                         │
│  "Routine inspection. Prepare to be boarded."           │
│                                                         │
│  Your cargo:                                            │
│  • Grain (20 units) ✓                                   │
│  • Medicine (5 units) ✓                                 │
│  • Weapons (3 units) ⚠ RESTRICTED                       │
│                                                         │
│  Hidden cargo: 3 units (10% chance of discovery)        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [COOPERATE]    Let them inspect                        │
│  [BRIBE]        Offer ₡500 to look the other way        │
│  [RUN]          Attempt to flee (risky)                 │
└─────────────────────────────────────────────────────────┘
```

### Inspection Outcomes

```javascript
function resolveInspection(choice, hasRestricted, hasHidden) {
  if (choice === 'cooperate') {
    if (hasRestricted) {
      // Confiscate restricted goods
      confiscateRestrictedGoods();
      // Fine
      gameState.player.credits -= 1000;
      // Reputation loss
      modifyFactionRep('authorities', -10);
      return 'Restricted goods confiscated. Fine: ₡1,000.';
    }

    if (hasHidden && Math.random() < 0.1) {
      // Discovered hidden cargo
      confiscateHiddenGoods();
      gameState.player.credits -= 2000;
      modifyFactionRep('authorities', -20);
      return 'Hidden compartment discovered! Fine: ₡2,000.';
    }

    return "Inspection complete. You're free to go.";
  }

  if (choice === 'bribe') {
    const success = Math.random() < 0.6;
    if (success) {
      gameState.player.credits -= 500;
      return 'The inspector pockets the credits and waves you through.';
    } else {
      gameState.player.credits -= 500;
      confiscateRestrictedGoods();
      gameState.player.credits -= 1500;
      return 'Bribery attempt failed. Additional fine: ₡1,500.';
    }
  }

  if (choice === 'run') {
    // Triggers combat encounter with patrol
    return triggerPatrolCombat();
  }
}
```

---

## Mechanical Failures

### Failure Checks

```javascript
function checkForMechanicalFailure() {
  const failures = [];

  // Hull breach
  if (gameState.ship.hull < 50 && Math.random() < 0.1) {
    failures.push('hull_breach');
  }

  // Engine failure
  if (gameState.ship.engine < 30 && Math.random() < 0.15) {
    failures.push('engine_failure');
  }

  // Life support emergency
  if (gameState.ship.lifeSupport < 30 && Math.random() < 0.05) {
    failures.push('life_support');
  }

  return failures;
}
```

### Failure Events

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ HULL BREACH                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  A seal gives way mid-jump. Cargo bay decompressing.    │
│                                                         │
│  You lose 3 units of Grain.                             │
│  Hull integrity: 47% → 42%                              │
│                                                         │
│  [CONTINUE]                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ ENGINE FAILURE                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  The drive cuts out mid-jump. You're stranded.          │
│                                                         │
│  Options:                                               │
│                                                         │
│  [EMERGENCY RESTART]  50% success, -10% engine          │
│  [CALL FOR HELP]      ₡1,000 tow fee, +2 days          │
│  [JURY-RIG REPAIR]    75% success, -5% engine           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Distress Calls

### Distress Call Event

10% chance during any jump:

```
┌─────────────────────────────────────────────────────────┐
│  DISTRESS CALL                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  You pick up a weak signal. A civilian transport,       │
│  life support failing. Three hours of air left.         │
│                                                         │
│  "Please... anyone... we have children..."              │
│                                                         │
│  Responding will cost:                                  │
│  • 2 days (detour)                                      │
│  • 15% fuel                                             │
│  • 5% life support (sharing resources)                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [RESPOND]    Help them                                 │
│  [IGNORE]     Continue to destination                   │
│  [LOOT]       Salvage their cargo (if they don't make it)│
└─────────────────────────────────────────────────────────┘
```

### Distress Outcomes

```javascript
const DISTRESS_OUTCOMES = {
  respond: {
    costs: { days: 2, fuel: -15, lifeSupport: -5 },
    rewards: { rep: 10, credits: 500, karma: 1 },
    message: "They're grateful. One of them presses credits into your hand.",
  },

  ignore: {
    costs: {},
    rewards: { karma: -1 },
    message: 'You try not to think about it.',
  },

  loot: {
    costs: { days: 1 },
    rewards: { cargo: 'random', karma: -3, rep: -15 },
    message: "You find salvage. It doesn't feel good.",
  },
};
```

---

## Consequences

### Reputation with Factions

```javascript
gameState.factions = {
  authorities: 0, // Customs, patrols
  traders: 0, // Merchant guilds
  outlaws: 0, // Pirates, smugglers
  civilians: 0, // General populace
};
```

Faction rep affects:

- Inspection frequency
- Pirate aggression
- NPC attitudes
- Ending epilogue

### Karma System

```javascript
gameState.player.karma = 0; // -100 to +100
```

Karma affects:

- Random event outcomes
- NPC first impressions
- Ending epilogue
- "Lucky Ship" quirk effectiveness

---

## Testing Checklist

- [ ] Pirate encounters trigger based on danger zones
- [ ] Combat choices resolve correctly
- [ ] Can negotiate with pirates
- [ ] Customs inspections trigger with restricted goods
- [ ] Hidden cargo has chance of discovery
- [ ] Mechanical failures occur at low condition
- [ ] Distress calls appear randomly
- [ ] Choices have appropriate consequences
- [ ] Faction reputation tracks correctly
- [ ] Karma affects outcomes

---

## Success Criteria

Player can:

1. Face meaningful danger during jumps
2. Make tactical choices in combat
3. Negotiate or fight their way out
4. Smuggle goods with risk/reward
5. Respond to moral dilemmas
6. See consequences of their choices

**Next Spec:** Events, missions, and narrative content
