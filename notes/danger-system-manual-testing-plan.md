# Danger System Manual Testing Plan

## Setup
1. Start development server: `npm run dev`
2. Open browser to localhost:5173
3. Start new game or load existing save
4. Open browser dev tools (F12) for console debugging if needed
5. If dev mode enabled (.dev file exists), use Dev Admin Panel for state manipulation

## Test Categories

### 1. Danger Zone Classification
**Objective**: Verify systems are classified correctly and warnings appear

**Test Steps**:
1. Open starmap and select different systems
2. Check danger zone indicators:
   - **Safe zones**: Sol (0), Alpha Centauri (1), Barnard's Star (4)
   - **Contested zones**: Sirius (7), Epsilon Eridani (10)
   - **Dangerous zones**: Systems >15 LY from Sol
3. Attempt jump to contested/dangerous system
4. **Expected**: DangerWarningDialog appears with:
   - Danger zone classification
   - Pirate encounter probability
   - Inspection probability
   - Proceed/Cancel options

### 2. Pirate Encounters
**Objective**: Test pirate encounter triggers and combat resolution

**Test Steps**:
1. Load cargo worth >₡5,000 (1.2x pirate chance) or >₡10,000 (1.5x pirate chance)
2. Damage engine below 50% condition (1.1x pirate chance)
3. Install advanced_sensors upgrade (0.8x pirate chance reduction)
4. Jump between systems multiple times in dangerous zones (35% base rate)
5. **Expected**: Pirate encounters occur based on modified probability
6. When pirate encounter occurs (PirateEncounterPanel):
   - **Expected**: Panel shows pirate threat level (weak/moderate/strong/dangerous)
   - **Expected**: Current ship status displayed (hull, engine, fuel)
   - **Expected**: Four options: Fight, Flee, Negotiate, Surrender
   - **Expected**: Success probabilities displayed for each option with modifier breakdown
7. Test Surrender option:
   - **Expected**: Pirates demand cargo or credits
   - **Expected**: Transfer occurs and player allowed safe passage
8. Test Flee option:
   - **Expected**: Escape probability based on engine condition
   - **Expected**: efficient_drive upgrade adds +10% to flee success

### 3. Combat Resolution (CombatPanel)
**Objective**: Verify combat choices and outcomes

**Test Steps**:
1. Choose "Fight" during pirate encounter to open CombatPanel
2. **Expected**: Four combat options displayed with probabilities:
   - **Evasive Maneuvers**: 70% base chance
     - Success: -15% fuel, -5% engine condition, escape
     - Failure: -20% hull damage, combat continues
   - **Return Fire**: 45% base chance
     - Success: -10% hull damage, +5 outlaw rep, salvage rewards
     - Failure: -30% hull damage, lose all cargo + ₡500 credits (boarding)
   - **Dump Cargo**: 100% success (guaranteed)
     - Cost: -50% cargo, -10% fuel
   - **Distress Call**: 30% base chance
     - Success: Pirates flee, +5 authority rep
     - Failure: -25% hull damage, combat continues
3. **Expected**: Ship status panel shows hull, engine, fuel, upgrades, quirks
4. **Expected**: Modifier breakdown shows how quirks/upgrades affect probabilities

### 4. Combat Modifiers
**Objective**: Verify quirks and upgrades affect combat

**Test Steps**:
1. Use dev admin panel to add ship quirks/upgrades:
   - `hot_thruster` quirk: +10% to evasive maneuvers (70% → 80%)
   - `lucky_ship` quirk: 5% base chance to negate bad outcomes (scales with karma)
   - `reinforced_hull` upgrade: -25% hull damage taken
   - `efficient_drive` upgrade: +10% to flee attempts
   - `sensitive_sensors` quirk: +5% to distress calls (30% → 35%)
   - `leaky_seals` quirk: +10% hull damage taken
2. Engage in multiple combats to observe modifier effects
3. **Expected**: Success rates in UI reflect modifiers
4. **Expected**: Damage amounts reflect reinforced_hull/leaky_seals modifiers
5. Test karma effect on lucky_ship: Higher karma = higher negate chance (5% + karma × 0.001)

### 5. Negotiation System (NegotiationPanel)
**Objective**: Test pirate negotiation dialogue

**Test Steps**:
1. Choose "Negotiate" during pirate encounter
2. **Expected**: NegotiationPanel with contextual dialogue options
3. Test dialogue choices:
   - **Counter-proposal**: 60% base success
     - Success: Pay only 10% cargo (vs 20% demand)
     - Failure: Enemy strength +10%, forced into combat
   - **Medicine claim** (only if medicine in cargo): 40% sympathy chance
     - Success: Free passage (pirates show sympathy)
     - Failure (lying without medicine): Enemy strength +20%, forced into combat
   - **Intel offer** (only if intel purchased from info broker): 80% success
     - Success: Pirates leave, +3 outlaw rep, -10 rep if discovered later
     - Failure: Enemy strength +15%, forced into combat
   - **Accept demand**: 100% success
     - Cost: 20% cargo, peaceful departure
4. **Expected**: Success probabilities shown for each option
5. **Expected**: Conditional options only appear when requirements met:
   - Medicine claim: Only visible if medicine is in cargo
   - Intel offer: Only visible if player has purchased intel from info broker
6. **Expected**: Karma provides hidden modifier (±5% at extreme karma)
7. **Expected**: Clear consequences displayed for each option

### 6. Customs Inspections (InspectionPanel)
**Objective**: Test inspection system and restricted goods

**Test Steps**:
1. Load restricted goods based on zone:
   - **Electronics** restricted in safe zones (Sol, Alpha Centauri, Barnard's Star)
   - **Medicine** restricted in contested zones (Sirius, Epsilon Eridani)
   - **Tritium** restricted in dangerous zones
   - **Parts** restricted in core systems only (Sol, Alpha Centauri)
2. Jump to systems where goods are restricted
3. **Expected**: Inspection probability = base rate × (1 + restrictedCount × 0.1)
4. **Expected**: Core systems (Sol, Alpha Centauri) have 2x inspection rate
5. When inspection occurs (InspectionPanel):
   - **Expected**: Cargo manifest shows regular cargo only (hidden cargo not visible)
   - **Expected**: Restricted items clearly marked in manifest
   - **Expected**: Three options: Cooperate, Bribe, Flee
6. Test inspection choices:
   - **Cooperate**: 
     - Restricted goods: Confiscated + ₡1,000 fine + -10 authority rep
     - +5 authority rep for cooperation
   - **Bribe**: 
     - Cost: ₡500 upfront
     - 60% success: Pass without confiscation
     - Failure: ₡500 + original fine + ₡1,500 additional penalty
     - -10 authority rep for attempt
   - **Flee**: 
     - Triggers patrol combat encounter
     - -15 authority rep

### 7. Hidden Cargo System
**Objective**: Test hidden cargo compartments

**Test Steps**:
1. Install `smuggler_panels` upgrade (₡4,500, adds 10 hidden cargo capacity)
2. Buy restricted goods in a legal zone
3. Move goods to hidden cargo (should have UI option or method)
4. Jump to restricted zone and trigger inspection
5. **Expected**: Hidden cargo NOT shown in inspection manifest
6. **Expected**: 10% base discovery chance, scaled by security level:
   - Core systems (Sol, Alpha Centauri): 2.0x = 20% discovery
   - Safe zones: 1.5x = 15% discovery
   - Contested zones: 1.0x = 10% discovery
   - Dangerous zones: 0.5x = 5% discovery
7. If hidden cargo discovered:
   - **Expected**: ₡2,000 fine
   - **Expected**: -20 authority rep
   - **Expected**: +5 outlaw rep (smuggling activity)

### 8. Mechanical Failures (MechanicalFailurePanel)
**Objective**: Test ship condition-based failures

**Test Steps**:
1. Use dev admin panel to damage ship systems below thresholds:
   - **Hull below 50%**: 10% chance for hull breach per jump
   - **Engine below 30%**: 15% chance for engine failure per jump
   - **Life support below 30%**: 5% chance for life support emergency per jump
2. Jump between systems with damaged ship (multiple jumps may be needed)
3. When failure occurs (MechanicalFailurePanel):
   - **Hull breach**: 
     - Immediate cargo loss (random amount)
     - -5% additional hull damage
   - **Engine failure**: 
     - Player stranded, must choose repair option
   - **Life support emergency**: 
     - Emergency options presented
4. Test engine failure repair options:
   - **Emergency restart**: 50% success, -10% engine condition on attempt
   - **Call for help**: 100% success, costs ₡1,000 + 2 days delay
   - **Jury-rig**: 75% success, -5% engine condition on attempt
5. **Expected**: Clear success rates and costs displayed for each option

### 9. Distress Calls (DistressCallPanel)
**Objective**: Test moral choice system

**Test Steps**:
1. Jump between systems (10% chance per jump for distress call)
2. When distress call occurs (DistressCallPanel):
   - **Expected**: Description of emergency situation with severity indicator
   - **Expected**: Three options: Respond, Ignore, Loot
   - **Expected**: Clear costs/consequences shown for each
3. Test distress choices:
   - **Respond (Help)**: 
     - Costs: 2 days delay, -15% fuel, -5% life support condition
     - Rewards: +₡500 credits, +10 civilian rep, +1 karma
   - **Ignore**: 
     - Costs: -1 karma only
     - No other penalties
   - **Loot**: 
     - Costs: 1 day delay, -3 karma, -15 civilian rep
     - Rewards: +5 outlaw rep, random cargo reward
4. **Expected**: OutcomePanel shows result with karma/rep changes

### 10. Karma System
**Objective**: Verify karma tracking and effects

**Test Steps**:
1. Start new game - karma should initialize to 0
2. Make various moral choices:
   - Help distress calls: +1 karma each
   - Ignore distress calls: -1 karma each
   - Loot distress calls: -3 karma each
3. Check karma value (dev admin panel or ship status)
4. **Expected**: Karma stays within [-100, +100] bounds (clamped)
5. Test karma effects:
   - **Lucky Ship quirk**: Effective chance = 5% + (karma × 0.001)
     - At karma +100: 15% negate chance
     - At karma -100: 0% negate chance (clamped)
   - **Hidden success modifier**: ±5% at extreme karma (karma × 0.0005)
6. Test karma effect on NPC first impressions in dialogue
7. **Expected**: Karma changes displayed in OutcomePanel after moral choices

### 11. Faction Reputation
**Objective**: Test faction standing system

**Test Steps**:
1. Start new game - all factions should initialize to 0
2. Perform actions affecting each faction:
   - **Authorities**: 
     - Cooperate with inspections: +5
     - Bribe attempt: -10
     - Flee inspection: -15
     - Restricted goods found: -10
     - Hidden cargo found: -20
   - **Civilians**: 
     - Help distress calls: +10
     - Loot distress calls: -15
   - **Outlaws**: 
     - Fight pirates (return fire success): +5
     - Intel offer to pirates: +3
     - Smuggling discovered: +5
     - Loot distress calls: +5
   - **Traders**: (future - currently no direct actions)
3. Check reputation values (dev admin panel or ship status)
4. **Expected**: All faction reps stay within [-100, +100] bounds
5. Test faction effects on encounter probabilities:
   - High outlaw rep: Reduces pirate encounter chance (0.7x at +100)
   - High authority rep: Reduces inspection chance (0.6x at +100)
   - Low authority rep: Increases pirate encounters (1.2x at -100)
6. Test faction effects on NPC dialogue options and attitudes

### 12. Restricted Goods Trading
**Objective**: Test smuggling mechanics and premium pricing

**Test Steps**:
1. Understand zone restrictions:
   - **Electronics**: Restricted in safe zones → legal in contested/dangerous
   - **Medicine**: Restricted in contested zones → legal in safe/dangerous
   - **Tritium**: Restricted in dangerous zones → legal in safe/contested
   - **Parts**: Restricted in core systems (Sol, Alpha Centauri) only
2. Buy restricted goods in legal zones:
   - Buy electronics in contested/dangerous zones
   - Buy medicine in safe/dangerous zones
   - Buy tritium in safe/contested zones
3. Sell in legal zones (where NOT restricted):
   - **Expected**: 1.5x premium price multiplier
4. Try to sell restricted goods in restricted zones:
   - **Expected**: Normal trade blocked without black market contacts
   - **Expected**: Trade allowed if NPC provides black market contact benefit (2.0x price)
5. Test hidden cargo for smuggling:
   - Install smuggler_panels upgrade
   - Move restricted goods to hidden storage
   - **Expected**: Goods hidden from normal inspections
   - **Expected**: Can sell via black market if contacts available

### 13. State Persistence
**Objective**: Verify danger state saves/loads correctly

**Test Steps**:
1. Accumulate various state changes:
   - Modify karma (help/ignore/loot distress calls)
   - Modify faction reputations (inspections, combat, distress calls)
   - Add hidden cargo (if smuggler_panels installed)
   - Trigger danger flags (fight pirates, save civilians, etc.)
2. Save game (auto-save triggers on state changes, or manual save)
3. Reload page or close/reopen browser
4. Load saved game
5. **Expected**: All values preserved exactly:
   - Karma value
   - All four faction reputations
   - Hidden cargo contents
   - Danger flags (piratesFought, civiliansSaved, etc.)
6. **Expected**: No corruption or reset of danger-related state

### 14. Risk Communication (OutcomePanel)
**Objective**: Verify clear probability display and outcome feedback

**Test Steps**:
1. During any encounter (pirate, inspection, failure, distress):
   - **Expected**: Success probabilities shown for each option
   - **Expected**: Current ship status displayed (hull, engine, fuel)
   - **Expected**: Active upgrades and quirks listed
   - **Expected**: Modifier breakdown shows why probability is higher/lower
   - **Expected**: Potential costs and rewards clearly displayed
2. After encounter resolution (OutcomePanel):
   - **Expected**: Outcome explanation provided (success/failure)
   - **Expected**: Feedback on what modifiers affected the result
   - **Expected**: Karma changes displayed with reason
   - **Expected**: Faction reputation changes displayed with reason
   - **Expected**: Resource changes (credits, cargo, fuel, hull) shown

### 15. Integration Testing
**Objective**: Test system interactions

**Test Steps**:
1. **Navigation Integration**: 
   - Verify encounters only trigger during jumps (not during station operations)
   - Verify useJumpEncounters hook fires on jump completion
2. **Multiple Encounters**: 
   - Test sequence of encounters in single session
   - Pirate → Inspection → Mechanical failure → Distress call
   - Verify state accumulates correctly
3. **Dialogue Integration**: 
   - Verify faction rep affects NPC dialogue options
   - Verify karma affects NPC first impressions
   - Check dialogue condition thresholds unlock/lock options
4. **Save/Load Integration**: 
   - Test danger state persistence across browser sessions
   - Verify mid-encounter state handled correctly on reload
5. **UI Integration**: 
   - Verify all panels display correctly and close properly
   - Verify panels don't interfere with other UI (starmap, station menu)
   - Verify OutcomePanel appears after each encounter resolution

## Expected Behaviors Summary

### Encounter Rates by Zone:
| Zone | Pirate Base | Inspection Base |
|------|-------------|-----------------|
| Safe | 5% | 10% |
| Contested | 20% | 15% |
| Dangerous | 35% | 5% |

### Pirate Encounter Modifiers:
| Condition | Multiplier |
|-----------|------------|
| Cargo >₡5,000 | 1.2x |
| Cargo >₡10,000 | 1.5x |
| Engine <50% | 1.1x |
| Advanced sensors | 0.8x |
| High outlaw rep (+100) | 0.7x |
| Low authority rep (-100) | 1.2x |

### Inspection Modifiers:
| Condition | Multiplier |
|-----------|------------|
| Per restricted good | +10% |
| Core systems (Sol, Alpha Centauri) | 2.0x |
| High authority rep (+100) | 0.6x |

### Combat Base Success Rates:
| Option | Base Rate | Key Modifiers |
|--------|-----------|---------------|
| Evasive | 70% | +10% hot_thruster, engine condition |
| Return Fire | 45% | Equipment, karma |
| Distress Call | 30% | +5% sensitive_sensors |
| Dump Cargo | 100% | Guaranteed |

### Negotiation Success Rates:
| Option | Base Rate | Condition |
|--------|-----------|-----------|
| Counter-proposal | 60% | Always available |
| Medicine claim | 40% | Requires medicine in cargo |
| Intel offer | 80% | Requires purchased intel |
| Accept demand | 100% | Always available |

### Inspection Outcomes:
| Choice | Cost | Rep Change |
|--------|------|------------|
| Cooperate (clean) | None | +5 authority |
| Cooperate (restricted) | ₡1,000 fine | -10 authority |
| Cooperate (hidden found) | ₡2,000 fine | -20 authority, +5 outlaw |
| Bribe (success) | ₡500 | -10 authority |
| Bribe (failure) | ₡500 + ₡1,000 + ₡1,500 | -10 authority |
| Flee | Patrol combat | -15 authority |

### Hidden Cargo Discovery Rates:
| Zone | Discovery Chance |
|------|------------------|
| Core (Sol, Alpha Centauri) | 20% (2.0x) |
| Safe | 15% (1.5x) |
| Contested | 10% (1.0x) |
| Dangerous | 5% (0.5x) |

### Failure Thresholds:
| System | Threshold | Chance |
|--------|-----------|--------|
| Hull breach | <50% hull | 10% |
| Engine failure | <30% engine | 15% |
| Life support | <30% life support | 5% |

### Engine Failure Repair Options:
| Option | Success | Cost |
|--------|---------|------|
| Emergency restart | 50% | -10% engine |
| Call for help | 100% | ₡1,000 + 2 days |
| Jury-rig | 75% | -5% engine |

### Distress Call Outcomes:
| Choice | Time | Resources | Karma | Rep |
|--------|------|-----------|-------|-----|
| Respond | +2 days | -15% fuel, -5% life support, +₡500 | +1 | +10 civilian |
| Ignore | None | None | -1 | None |
| Loot | +1 day | +cargo | -3 | -15 civilian, +5 outlaw |

## Deferred Requirements

The following requirements are noted as deferred to future specs:

- **Requirement 9.7**: Karma affects ending epilogues - Deferred to future endgame spec
- **Requirement 10.6**: Reference past actions in future NPC interactions - Partially covered via dangerFlags; full dialogue integration deferred to future dialogue enhancement spec

## Requirements Coverage Matrix

This section maps each requirement to the test section that covers it.

### Requirement 1: Danger Zone Classification
| Req | Description | Test Section |
|-----|-------------|--------------|
| 1.1 | Display danger classification when viewing system | §1 |
| 1.2 | Calculate danger based on distance/designations | §1 |
| 1.3 | Warning dialog for dangerous jumps | §1 |
| 1.4 | 5% pirate rate in safe zones | §1, §2 |
| 1.5 | 20% pirate rate in contested zones | §1, §2 |
| 1.6 | 35% pirate rate in dangerous zones | §1, §2 |
| 1.7 | 10% inspection rate in safe zones | §1, §6 |
| 1.8 | 15% inspection rate in contested zones | §1, §6 |
| 1.9 | 5% inspection rate in dangerous zones | §1, §6 |
| 1.10 | Systems 0,1,4 are safe | §1 |
| 1.11 | Systems 7,10 are contested | §1 |
| 1.12 | Systems >15 LY are dangerous | §1 |

### Requirement 2: Pirate Encounters
| Req | Description | Test Section |
|-----|-------------|--------------|
| 2.1 | Check for pirates during jumps | §2, §15 |
| 2.2 | Present tactical options (fight/flee/negotiate/surrender) | §2 |
| 2.3 | Fight resolves with ship condition/equipment | §3, §4 |
| 2.4 | Flee probability based on engine | §3 |
| 2.5 | Negotiate provides dialogue options | §5 |
| 2.6 | Surrender transfers cargo/credits | §2 |
| 2.7 | Cargo >₡5,000 = 1.2x pirate chance | §2 |
| 2.8 | Cargo >₡10,000 = 1.5x pirate chance | §2 |
| 2.9 | Engine <50% = 1.1x pirate chance | §2 |
| 2.10 | Advanced sensors = 0.8x pirate chance | §2 |
| 2.11 | Show pirate threat level and ship status | §2 |
| 2.12 | Show success probabilities for choices | §2, §3, §14 |

### Requirement 3: Combat Resolution
| Req | Description | Test Section |
|-----|-------------|--------------|
| 3.1 | Present tactical options with probabilities | §3 |
| 3.2 | Evasive: 70% base chance | §3 |
| 3.3 | Evasive success: -15% fuel, -5% engine | §3 |
| 3.4 | Evasive failure: -20% hull | §3 |
| 3.5 | Return fire: 45% base chance | §3 |
| 3.6 | Return fire success: -10% hull, salvage | §3 |
| 3.7 | Return fire failure: -30% hull, lose cargo + ₡500 | §3 |
| 3.8 | Dump cargo: guaranteed escape, -50% cargo, -10% fuel | §3 |
| 3.9 | Distress: 30% base chance | §3 |
| 3.10 | Distress success: +5 rep | §3 |
| 3.11 | Distress failure: -25% hull | §3 |
| 3.12 | hot_thruster: +10% evasive | §4 |
| 3.13 | lucky_ship: 5% negate scaled by karma | §4 |
| 3.14 | reinforced_hull: -25% damage | §4 |
| 3.15 | efficient_drive: +10% flee | §4 |
| 3.16 | sensitive_sensors: +5% distress | §4 |
| 3.17 | leaky_seals: +10% damage taken | §4 |
| 3.18 | All modifiers in game constants | §4 (verified via constants.js) |

### Requirement 4: Negotiation System
| Req | Description | Test Section |
|-----|-------------|--------------|
| 4.1 | Present contextual dialogue options | §5 |
| 4.2 | Counter-proposal: 60% base | §5 |
| 4.3 | Success: 10% cargo (vs 20%) | §5 |
| 4.4 | Failure: +10% enemy strength, combat | §5 |
| 4.5 | Medicine claim shown if medicine in cargo | §5 |
| 4.6 | Medicine claim: 40% sympathy | §5 |
| 4.7 | Sympathy: free passage | §5 |
| 4.8 | Intel offer if prior intel acquired | §5 |
| 4.9 | Intel success: pirates leave, rep penalty if discovered | §5 |
| 4.10 | Accept demand: 20% cargo | §5 |
| 4.11 | Display consequences and probabilities | §5, §14 |

### Requirement 5: Customs Inspections
| Req | Description | Test Section |
|-----|-------------|--------------|
| 5.1 | Check for inspections on arrival | §6, §15 |
| 5.2 | Restricted goods: ×(1 + count × 0.1) | §6 |
| 5.3 | Present options (cooperate/bribe/flee) | §6 |
| 5.4 | Cooperate + restricted: confiscate + ₡1,000 | §6 |
| 5.5 | Cooperate + hidden found: confiscate + ₡2,000 | §7 |
| 5.6 | Bribery: 60% success, ₡500 cost | §6 |
| 5.7 | Bribery success: pass without confiscation | §6 |
| 5.8 | Bribery failure: ₡500 + fine + ₡1,500 | §6 |
| 5.9 | Flee: trigger patrol combat | §6 |
| 5.10 | 10% base hidden cargo discovery | §7 |
| 5.11 | Smuggling: -10 authority (restricted), -20 (hidden) | §6, §7 |
| 5.12 | Core systems: 2x inspection rate | §6 |
| 5.13 | Show cargo manifest with restricted marked | §6 |

### Requirement 6: Mechanical Failures
| Req | Description | Test Section |
|-----|-------------|--------------|
| 6.1 | Check failures when systems <50% | §8 |
| 6.2 | Hull <50%: 10% breach chance | §8 |
| 6.3 | Engine <30%: 15% failure chance | §8 |
| 6.4 | Life support <30%: 5% emergency chance | §8 |
| 6.5 | Hull breach: cargo loss + -5% hull | §8 |
| 6.6 | Engine failure: strand + repair options | §8 |
| 6.7 | Emergency restart: 50% success, -10% engine | §8 |
| 6.8 | Call for help: ₡1,000 + 2 days | §8 |
| 6.9 | Jury-rig: 75% success, -5% engine | §8 |
| 6.10 | Apply immediate consequences | §8 |
| 6.11 | Display success rates and costs | §8, §14 |

### Requirement 7: Distress Calls
| Req | Description | Test Section |
|-----|-------------|--------------|
| 7.1 | 10% chance during jumps | §9 |
| 7.2 | Present options (respond/ignore/loot) | §9 |
| 7.3 | Respond: resource costs + rep/karma rewards | §9 |
| 7.4 | Ignore: karma penalty | §9 |
| 7.5 | Loot: cargo + severe penalties | §9 |
| 7.6 | Display costs and consequences | §9, §14 |
| 7.7 | Help: 2 days, 15% fuel, 5% life support | §9 |
| 7.8 | Help: +₡500, +10 rep, +1 karma | §9 |
| 7.9 | Ignore: -1 karma | §9 |
| 7.10 | Loot: 1 day, -3 karma, -15 rep | §9 |

### Requirement 8: Faction Reputation
| Req | Description | Test Section |
|-----|-------------|--------------|
| 8.1 | Track 4 factions (authorities/traders/outlaws/civilians) | §11 |
| 8.2 | Initialize all to 0 | §11 |
| 8.3 | Clamp to [-100, +100] | §11 |
| 8.4 | Cooperate: +5 authority | §6, §11 |
| 8.5 | Resist/bribe: decrease authority | §6, §11 |
| 8.6 | Help civilians: increase civilian rep | §9, §11 |
| 8.7 | Piracy/smuggling: increase outlaw rep | §9, §11 |
| 8.8 | Faction rep modifies encounter probabilities | §2, §6, §11 |
| 8.9 | Faction affects NPC dialogue | §11, §15 |

### Requirement 9: Karma System
| Req | Description | Test Section |
|-----|-------------|--------------|
| 9.1 | Track karma [-100, +100] | §10 |
| 9.2 | Altruistic choices increase karma | §10 |
| 9.3 | Selfish choices decrease karma | §10 |
| 9.4 | Karma modifies random event outcomes | §10 |
| 9.5 | Karma affects NPC first impressions | §10, §15 |
| 9.6 | Karma modifies Lucky Ship quirk | §4, §10 |
| 9.7 | Karma affects ending epilogues | Deferred (future endgame spec) |
| 9.8 | Initialize karma to 0 | §10 |
| 9.9 | Display karma changes | §10, §14 |
| 9.10 | Karma as hidden success modifier | §5, §10 |

### Requirement 10: Consequence Persistence
| Req | Description | Test Section |
|-----|-------------|--------------|
| 10.1 | Save faction rep changes | §13 |
| 10.2 | Save karma changes | §13 |
| 10.3 | Persist ship damage | §13 |
| 10.4 | Update cargo permanently | §13 |
| 10.5 | Maintain story event flags | §13 |
| 10.6 | Reference past actions in future interactions | §15 (dialogue integration) |

### Requirement 11: Restricted Goods and Hidden Cargo
| Req | Description | Test Section |
|-----|-------------|--------------|
| 11.1 | Define restricted goods in constants | §12 |
| 11.2 | Mark goods as restricted by zone | §12 |
| 11.3 | Allow hidden compartment upgrade | §7 |
| 11.4 | Choose regular vs hidden storage | §7 |
| 11.5 | Maintain hidden cargo separately | §7 |
| 11.6 | Inspections show only regular cargo | §6, §7 |
| 11.7 | 10% base hidden discovery chance | §7 |
| 11.8 | Higher security = higher discovery | §7 |
| 11.9 | Hidden discovery: ₡2,000 + -20 authority | §7 |
| 11.10 | Premium prices in legal zones | §12 |
| 11.11 | Block trade in restricted zones | §12 |
| 11.12 | Black market contacts bypass | §12 |

### Requirement 12: Risk Communication
| Req | Description | Test Section |
|-----|-------------|--------------|
| 12.1 | Display success probabilities | §14 |
| 12.2 | Display ship status affecting outcomes | §14 |
| 12.3 | Warning with specific risk info | §1 |
| 12.4 | Show modifiers from condition/equipment/quirks | §3, §4, §14 |
| 12.5 | Display costs and rewards | §14 |
| 12.6 | Feedback on why outcome occurred | §14 |

## Troubleshooting

**If encounters don't trigger:**
1. Check danger zone classification in console: `gameStateManager.getDangerZone(systemId)`
2. Verify cargo value: `gameStateManager.getState().ship.cargo`
3. Check ship condition: `gameStateManager.getState().ship`
4. Try multiple jumps (encounters are probabilistic)
5. Use dev admin panel to force encounters if available

**If probabilities seem wrong:**
1. Check ship status for modifiers (quirks, upgrades, condition)
2. Verify karma: `gameStateManager.getKarma()`
3. Verify faction reps: `gameStateManager.getFactionRep('authorities')`
4. Check console for calculation details

**If UI panels don't appear:**
1. Check browser console for React errors
2. Verify event system is working (other panels work)
3. Check if encounter actually triggered vs. just probability calculated
4. Verify useJumpEncounters hook is mounted

**If state doesn't persist:**
1. Check localStorage: `localStorage.getItem('trampFreighterSave')`
2. Verify save triggered (check for auto-save debounce)
3. Check for validation errors in console during load
4. Verify game version compatibility