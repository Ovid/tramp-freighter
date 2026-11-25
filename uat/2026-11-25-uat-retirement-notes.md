# UAT Retirement Notes (2026-11-25), Honest mode

Mode: **Honest** (no Dev Admin use at all).
Save backup: all 10 localStorage keys copied to `uatbackup__*` and verified.

## 2026-11-25:16-24-39 · HUD 2167-06-20

- A1 ✅ New Game → overwrite confirmation → naming ("Long Way Home") →
  Starmap at Sol. HUD: ₡500, debt ₡10,000, date 2167-06-20, cargo 20/50, all systems 100%.
  A "Captain's Briefing" modal opens first and mentions the Tanaka Mark III freighter.
- A2 ✅ Dock at Sol → "Sol Station. The heart of human civilization…" → "Time to get to work."
  Menu: Mission Board, Finance, Trade, Refuel, Repair, Info Broker, Upgrades, Cargo Manifest, Ship Status.
  People: Marcus Cole (Loan Shark, COLD).

## 2026-11-25:16-50 · HUD 2167-06-20 → 2167-07-28 (Phase A step 4, exploring and earning)

Route so far: Sol → L 726-8 → Tau Ceti → Epsilon Eridani → Alpha Centauri → L 143-23 → Alpha Centauri → Epsilon Eridani.
Visited 6 systems.

Missions (all net of Cole's 5% cut): L 726-8 freight ₡262, 2× Tau Ceti smuggling ₡418 each, Leo Dubois passenger ₡116 (₡123 paid against ₡112 advertised, a satisfaction bonus),
L 143-23 pouches ₡437, Epsilon Eridani black-market ₡538. Each mission: cash_after > cash_before ✅. Mission cargo is client-provided (₡0 basis) ✅.
Trades: medicine Sol→L 726-8 +₡99 net; ore/tritium Tau Ceti→Alpha Centauri ≈ +₡90; medicine Alpha Centauri→Epsilon Eridani +₡168 (it was bought at 30
when Epsilon Eridani showed 86, but by arrival 21 days later the price was 36).

Encounter: Distress Call on arrival at Alpha Centauri (Contested). Responded: +₡150, +1 karma, +10 civilians, −15% fuel, −5% life support, +2 days. ✅

Findings so far:
- F1 (clarity, minor): The Mission Board shows "1 hop — direct jump" without travel days for 1-hop jobs (multi-hop jobs show "~N days travel").
  I accepted two 1-hop jobs (Ross 154 and L 726-8, both 8-day deadlines, each 5 days from Sol) that could not both be done, and had to abandon one.
  The abandon dialog says "apply any penalties" without saying what they are. None were visible.
- F2 (economic clarity): Cole's 5% cut applies to **mission rewards** as well as trade sales. Finance says only "5% of trade sales".
  Mission cards advertise the gross reward. The cut is first disclosed at the claim ("does not reduce your debt").
  It's small, but a skimming clawback is not disclosed at acceptance.
- F3 (narrative/mechanics mismatch): Cole's day-30 message says "the lien on your trades just got heavier", but Finance still shows 5%,
  and the next mission claim took ₡29 of ₡567 (5%). Interest did apply: debt went 10,000 → 10,300.
- F4 (narrative, minor): Tau Ceti dockworker rumor: choosing "Interesting. Where would I hear more?" closes the popup with no reply.
- F5 (clarity): Epsilon Eridani medicine showed 86 (a spike). Nothing marked it as temporary, and by the time I could get back it was 36.
  An Alpha Centauri rumor then said medicine was "through the roof at CD-40 9712". That's probably working as intended (events), but it's harsh
  given 7-day jumps. Not a bug.
- Tanaka hint seen at the Alpha Centauri dock: "the designer's daughter works out of Barnard's Star… Picky about who she works with" ✅ (good breadcrumb).
- Stacked modals: Mission Complete opens over a dockworker narrative on the same dock. Both are readable. Cosmetic only.
- Fuel price varies: ₡2/% near Sol (Alpha Centauri), ₡5/% at the outer systems.

## 2026-11-25:17-40 · HUD 2167-07-31 → 2167-09-04 (Phase A steps 3–4)

Route: Epsilon Eridani → Tau Ceti → G158-27 (Dangerous, no encounter) → Tau Ceti → L 726-8 → Sol → Barnard's → 70 Ophiuchi → Barnard's → Struve 2398.
**10 systems visited** on 2167-09-04 (game day ~76).

- Missions: 3× Tau Ceti ₡1,098; G158-27 ₡440; Dmitri passenger ₡172 plus a **₡500 tip** narrative ("wealthy passenger… generous tip").
  The tip is 3× the fare, which seems generous. Tips skip Cole's cut.
- 70 Ophiuchi crates ₡666. Pirate encounter on arrival (MODERATE, 20% tribute). Fled at 70%: success, −15% fuel, −5% engine.
- **Customs at Sol** (arriving with the Black Market Goods → Sol job, ₡700): Cooperate → ₡1,000 fine, cargo confiscated, mission gone.
  Net −₡1,000. The mission card said "Rumors spreading", but:
  - F8 (clarity): Sol is "Safe", so no Jump Warning appears, yet it has **Maximum** customs security. The Jump Warning is the only pre-jump risk
    screen, and it's skipped for exactly the systems where smuggling is riskiest. The card also never says the fine is ₡1,000 against a ₡700 reward.
- Trading: tritium 70 Ophiuchi 44 → Barnard's 98: **+₡2,455 net** on 50 units. Medicine Sol→Barnard's +₡352, Barnard's→Struve +₡442.
- Repairs at Sol: ₡5/% (₡327 for hull 76→100, engine 88→100, life support 71→100).
- Debt interest: 10,000 → 10,300 (day 30) → 10,609 (day 60). Withholding is still 5% (₡245 cut on ₡4,900).

### A3 ✅ (with notes): early Barnard's visit
- On the **first** dock, `dock_barnards_first` (Wei Chen "Bay 3" intro, HIGH priority) fires instead of `dock_barnards_pre_tanaka`
  (also HIGH). The pre-Tanaka narrative only shows on the **second** dock. F7: a player who docks once and leaves never gets the hint.
- Second dock: "Tanaka? Yeah, she's here. But she doesn't talk to green pilots…" → "How many ports are we talking?" →
  "More than you've got… Visit more systems." ✅ The hint says what to do, but never gives a number, and no visited-systems count appears anywhere in the UI.
- Tanaka is not in People (only Wei Chen) ✅.

### F6: Info Broker "Known Market Prices" are live, but labeled stale
- Market Data lists visited systems as "Visited · N days old", but the numbers don't match what the Trade screen showed at the visit
  (L 143-23 is listed with tritium 52 / ore 15; I saw 98 / 35 there). Sol is listed as "3 days old" with medicine 33, but it was 26 when I left.
- Cause: `TradingManager.recalculatePricesForKnownSystems()` (src/game/state/managers/trading.js:338) rewrites every known system's
  prices to the current day's prices on each day tick. The "N days old" label is wrong, and paying ₡50 to refresh a visited system buys nothing.
  It also hands the player free live intel on every visited system, which made the 70 Ophiuchi → Barnard's tritium run risk-free.

### Other notes
- F9 (minor): Cole's cut is rounded up **per sale** (₡2 on a ₡26 single-unit sale, 7.7%). Selling one at a time costs more than selling in bulk.
- Narrative "question" choices with no answer: Tau Ceti ("Where would I hear more?"), the newsfeed ("Keep listening."), and Barnard's
  "Stop to introduce yourself." (+1 karma, no line). All close silently. Minor polish.
- Price spikes move around (medicine 86: Epsilon Eridani → L 726-8 → Barnard's; tritium 98 / ore 35: L 143-23 → Barnard's / L 726-8).
  The dockworker rumors point at them, which is good.

## 2026-11-25:19-10 · HUD 2167-09-09 → 2168-01-20 (Phases A5, B, C, D)

### A5 ✅ Meet Tanaka (2167-09-09, 10 systems)
`tanaka_intro` fires on the first dock after reaching 10 systems ("Tanaka drive. Mark III, if I'm not mistaken…"). Yuki Tanaka (Engineer, NEUTRAL) now appears in People.

### B6 ✅ (clarity note): requirement hint
"I like you, captain. But I don't know you well enough yet… Keep visiting. Bring supplies." The dialogue header shows
"Trust: 0 / 100 (Next: Field Test at 10)" with a bar, which is clear. F10: "Bring supplies" doesn't say **which** (5 electronics or 5 medicine),
and the supply option is hidden until you're carrying 5 of one. A player can't find the requirement from the UI.

### B7 ✅ Gaining rep
- Conversation chain +1/+2/+3 (0→1→3→6).
- Research supply: 5 medicine (₡160) → trust +3, goods leave the hold, no credits ✅. The choice gives no preview of the cost or the reward.
  A second supply with 5 electronics after the 7-day cooldown (10 days later): +3.

### B8 ❌ → fixed. ARBITRAGE FAIL: rep farming
Repeating "Tell me about your work" → "How much further?" → "Why Delta Pavonis?" → "I hope you find her." gave the same +6 again (6 → 12).
Unlimited and free. **Every rep gate in the quest can be farmed.** Under Honest rules I treat those 6 points as tainted.
Legitimate rep reached 12 (6 conversation + 3 + 3 supply) before I accepted Stage 1.

### C9 ✅ / C10 ✅ / C11 ✅ Field Test
- Offer at trust 18 (legitimate 12), engine 88%. Accepting gives +5 (23). HUD: "QUEST Tanaka: Field Test 0/3 jumps" and it counts up.
- F12 (HUD): at 3/3 it still says "Ongoing" and keeps counting (**4/3, 5/3 jumps**). There's no "Return to Tanaka at Barnard's Star" prompt.
  The same happens in Stage 2 at 5/5 samples.
- Claim: "Glad the data worked out…" → ₡2,021 → **₡3,021 (+₡1,000)** ✅, engine 83% → **100%** ✅, trust 23 → **41** (+18) ✅,
  "Merchant" achievement. Minor: the money and repair only apply on the **next** choice, although the line already says "transfers your payment".
  The greeting then repeats "The field test data looks excellent…" before the Stage 2 offer.

### D12 ✅ Stage 2 offer
"What do you need?" → +5 (46, "Next: The Prototype at 50"). HUD: "Tanaka: Rare Materials 0/5 samples". Legitimate rep 35 at acceptance (≥30).

### D13 ✅ Sample collection
| # | Station (LY) | Result |
|---|---|---|
| 1 | 70 Ophiuchi (16.6) | collected on the first dock |
| – | 70 Ophiuchi redock | "Scanner: Already sampled this station." ✅ |
| 2 | Altair (16.8) | failed → redock failed → redock **collected** (the D14 check) |
| – | L 722-22 (17.3) | failed (not retried) |
| 3 | Ross 780 (15.4) | collected on the first dock |
| – | Groombridge 1618 (15.9) | failed |
| – | L 145-141 (15.1) | failed |
| 4 | L 145-141 | **collected** on a natural return 4 days later (L 143-23 round trip) |
| 5 | CD-40 9712 (19.4) | collected on the first dock |

Save check: `quests.tanaka.data.exoticStations` matches the stations above.

### D14 ❌ → fixed. Re-roll exploit
A failed roll doesn't mark the station. Undocking and redocking immediately re-rolls, with no time cost. Altair took 3 docks.
The 60% chance is meaningless to a player willing to click Dock again. The code (quest-manager.js:320) also defaults to `rngFn = Math.random`,
which CLAUDE.md forbids in gameplay paths. Under Honest rules I re-rolled only for the prescribed check.

### Economy, debt, and encounters in this stretch
- F15 (clarity, → fixed): **Cole's heat is invisible.** Each missed 30-day checkpoint (no payment since the last one) adds +10 heat. Above 20 heat,
  withholding goes to **10%** and interest to **4%**. By 2167-11-30 my cut was 10% (₡95 on ₡945) without any message that I'd seen.
  Finance shows "Next interest" but not heat, checkpoints, or that a payment each period is expected. Paying (5 × ₡1,000) brought it back to 5% / 3%.
- F16 (exploit-ish, → fixed): heat drops **−3 per payment action**, whatever the amount (debt.js:255). Ten "Pay ₡100" clicks erase 30 heat for ₡1,000.
- Payments: 2167-09-22 ₡3,000; 2167-11-30 ₡5,000. Debt was ₡3,417 on 2168-01-20.
- Second customs fine: L 143-23 (Standard security), 2 smuggling jobs (₡882 total). Cooperate → −₡1,000, cargo confiscated, both jobs gone.
  The outcome screen is headed "**SUCCESS**" even though I was fined and lost the cargo (wording). No "mission failed" notice for the two jobs.
- F14: salvage "Load it up" with a full hold (50/50) silently drops the parts. No "hold full" message.
- F11: salvaged parts show "Bought at: 0 ₡/unit… Sell at 30 | Break even". That's pure profit, but it says break even.
- Passenger tips: ₡500 three times (fares were ₡165–₡227). Generous, maybe too generous.
- Pirates: fled 4 times (3 successes, 1 failure costing −20% hull). Distress calls: responded 5 times (+₡150 each).
- **Price spikes can't be caught:** I bought for the 86 medicine spike at Altair and the 98 tritium spike at Barnard's. Both had ended when I arrived 4–6 days later.
  Rumors advertise spikes that last fewer days than a typical jump (F5).
- Free "live intel" (F6) helped me plan trades, but prices still drift ±25% within a week, so the edge is small.

## 2026-11-25:21-00 · HUD 2168-01-20 → 2168-06-03 (Phases D15–G24)

### D15 ✅ Stage 2 claim (2168-02-10)
"Took some searching…" → ₡3,591 → **₡6,591 (+₡3,000)**, trust 46 → 64, **Advanced Sensor Array** in Ship Status → Upgrades
("See economic events one jump ahead"), "First Friend" achievement.

### E16 ✅ / E17 ❌ → fixed. Stage 3, The Prototype
- Hull 81%, engine 83%, so I couldn't check the low-condition hints here (tested in G22 instead). "I'm ready for the prototype installation."
  → states "hull at seventy percent minimum, engine at eighty" ✅ → accept (+5, 69).
- **E17 ❌ narrative/mechanics mismatch:** Tanaka says "Take a test flight. Come back and we will verify the readings."
  Closing and reopening the dialogue without flying → "The prototype integration is complete. Your ship performed admirably." Claim offered right away.
- Claim: **+₡2,000** (6,591 → 8,591) ✅, trust 71 → **93 (FAMILY)**. That's already Family after Stage 3 (it would be 87 without the 6 farmed points).
  The plan expected Family only after Stage 4, so rep thresholds after Stage 1 are effectively automatic.

### F18 ✅ F19 ✅ F20 ✅ F21 ✅ Stage 4, Personal Request
- "About that personal request…" shows 4 choices. "Tell me more about Yumi first." → backstory → "I'll get it there." / "I need some time…" ✅
- HUD: "Tanaka: Personal Request — Deliver to Epsilon Eridani" ✅.
- Vasquez: "I have a message from Yuki Tanaka." → he reads it ✅. HUD → "Return to Tanaka at Barnard's Star" ✅.
  Minor: no "Message delivered." toast appears. It's only an action return value (captain-vasquez.js:171).
- Return: "Vasquez understood…" → "She would want to hear from you." → trust **100/100 (Family)** ✅.
- F12 again: after each claim the HUD keeps showing the finished stage's last objective. The save shows `stage: 4, _rewardsClaimedStage: 4`
  until Stage 5 is accepted.

### G22 ✅ Blocked-gate hints (Barnard's, 2168-03-21)
Priority confirmed, with step-by-step repairs:
- engine 71% / 81% → "Your drive's running rough… Get it tuned up and we'll talk." (no number given)
- engine 91%, hull 57% / 77% → "Your hull's taken a beating. Get that patched up…" (no number given)
- hull 87%, debt already 0 → "You'll need at least 15,000 credits before we proceed… Keep trading." (number given ✅)
- Couldn't see the debt hint (paid off early) or the rep hint (rep is 100).
- **Vasquez ❌ contradictory hint:** "Tanaka says she's ready when I am." ✅ appears. Then "How much credits are we talking?" →
  "**Twenty-five thousand, at least.**" But the gate is `ENDGAME_CONFIG.VICTORY_CREDITS = 15000`, and Tanaka says 15,000.
  The Vasquez text is hard-coded at src/game/data/dialogue/captain-vasquez.js:607.

### G23 ✅ Pay off Cole (2168-02-13, Sol)
Finance → "Pay All (₡3,020)" → Outstanding ₡0, withholding 0%, interest 0%, "Debt paid in full!". The "Zero. You owe nothing… I'm free." narrative fires.
**Total paid to Cole: ₡11,520** (₡3,000 + ₡5,000 + ₡500 + ₡3,020) against ₡10,000 borrowed, plus withholding cuts of about ₡2,000.

### G24 ✅ Requirements met (2168-06-03)
₡15,119, debt 0, hull 89% (≥80), engine 92% (≥90), trust 100.
Getting from about ₡7k to ₡15k after Stage 4 took **~100 game days** of 2-slot mission running (the quest holds one of the 3 mission slots).

### Mission slot (watch item)
"Maximum 3 active missions." The Tanaka quest counts as one, so for the whole quest the player can hold only 2 jobs. The cap shows on cards
(Accept is disabled) once you're at 3. It isn't explained when the quest starts. It noticeably slows the money grind.

### Other
- Customs inspection at Alpha Centauri with only legal tritium: passed, +5 authorities ✅.
- Third price spike gone on arrival (Barnard's tritium 98 → 60 in 3 days, after the Info Broker showed 98 "9 days old").
- Passenger narratives ("children restless", "cramped quarters complaint") appear with single-passenger jobs. Flavor only.

## 2026-11-25:22-10 · HUD 2168-06-03 (Phases G25–I)

### G25 ✅ (display ❌, fixed) Final preparations
"Tell me about the final preparations." lists every requirement (zero debt, 15,000 credits, hull 80%, engine 90%, full trust) ✅.
That's the only place the full list appears, and only once you already meet it.
"I'm ready. Let's do this." → "Together." The save gets `ship.upgrades: [advanced_sensors, range_extender]`, **but Ship Status listed only
Advanced Sensors**. Cause: ShipStatusPanel drops any upgrade with no `SHIP_CONFIG.UPGRADES` entry. **Fixed** (see below).

### G26 ⚠️ Economic sanity
No credits are deducted at any point in the Pavonis Run (₡15,119 before and after). The ₡15,000 "for fuel and supplies" is only a threshold.
It doesn't feel wrong at the end of the game (money no longer matters), but the dialogue implies spending it.

### H27 ✅ Point of No Return appears after "I'm ready for the Pavonis Run." → "Let's fly."
### H28 ❌ → fixed. "NOT YET" returned safely (quest stage 5, upgrades, and credits intact), but **"Let's fly." could never reopen the run**.
The dialogue just closed. Cause: `startPavonisRun()` emitted a constant `true`, so React's `useGameEvent` state didn't change on the
second emit. A page reload was the only workaround. **Fixed**, and re-verified in the browser: NOT YET → Let's fly → Point of No Return again ✅.
### H29 ❌ → fixed. 6 jump texts ✅ → "ARRIVE AT DELTA PAVONIS" → **a Pirate Encounter appeared instead of the Epilogue.**
Cause: `markVictory()` moves the player with `navigationManager.updateLocation()`, which emits LOCATION_CHANGED, so `useEventTriggers`
rolled a jump encounter (Delta Pavonis is "Dangerous") and the encounter took over the view. Resolving it would have returned to ORBIT
without an ending. **Fixed** with a victory guard in `handleTrigger`.
To re-test the real path I restored the save to its pre-run state (meta.victory=false, location Barnard's, the extra jump undone) and replayed from
Tanaka's dialogue. Arrive → **EPILOGUE** ✅.
### H30 ✅ Epilogue: 4 sections. Branches use karma (14 → "Neither saint nor villain") and Trusted NPCs (1 → "Some will remember your name").
Debt isn't mentioned, which is moot since it must be 0.
### H31 ✅ Voyage Statistics: date 2168-06-03 ✓, systems 22 ✓ (21 + Delta Pavonis), credits earned ₡84,593 (gross revenue, not profit;
could mislead), missions 61 ✓ (matches my count), Trusted+ NPCs 1 ✓, cargo 1,401, jumps 81 ✓.
### H32 ✅ End credits: Space pauses (button becomes "Play"), Space resumes, Escape skips. The Skip button is partly covered by the Dev Admin gear (dev only).
### H33 ✅ "Delta Pavonis Colony" with Yumi Tanaka (Colony Director, WARM). The fourth-wall rounds escalate
("Is there a secret ending?" → "This isn't that kind of game…"; "Do you just... live in menus?"). Return to Title works.
### H34 ⚠️ Reload after victory: Continue → ORBIT at Delta Pavonis. System Info: 0 wormholes, "Off the wormhole network". Dock → the colony
(Yumi + Return to Title). Not stuck, and nothing breaks, but nothing says the voyage is over. `meta.victory` is now read only by the random-event guard.

### Distances
The dialogue and jump text say "19.89 light-years". The star data gives 19.96 LY (`calculateDistanceFromSol`), and the HUD shows "20.0 LY".

### I35 ✅ User save restored: reloaded to the title, copied all 10 `uatbackup__*` keys back, verified, deleted the backups. The save is "Serendipity", ₡253.

## Fixes applied (TDD: RED → GREEN; full suite 467 files / 4,642 tests green, lint and Prettier clean)
1. `GameCoordinator.startPavonisRun()` emits an incrementing counter instead of `true`, so the run can restart after NOT YET.
   Test: tests/integration/app-endgame-flow.integration.test.jsx "should restart the Pavonis Run after the player cancels once".
2. `useEventTriggers.handleTrigger` returns early when `meta.victory` is set, so no encounter or narrative can hijack the ending or fire after victory.
   Test: tests/integration/event-triggers-integration.test.jsx "should not trigger an encounter when markVictory moves the player…".
3. Vasquez's `pavonis_prep_credits` line builds its figure from `ENDGAME_CONFIG.VICTORY_CREDITS` ("15,000 credits, at least") instead of
   "Twenty-five thousand". Test: tests/unit/tanaka-breadcrumbs.test.js.
4. New `SHIP_CONFIG.QUEST_UPGRADES.range_extender`, and `ShipManager.getUpgradeDefinition` falls back to it, so Ship Status shows the
   Range Extender. It's kept out of `UPGRADES` so the shop never sells it. Test: tests/unit/ship-manager.test.js.
   ⚠️ Verified by unit test only. The UAT save had already finished the game, so I couldn't open Ship Status before the jump.
   The save loader and `calculateShipCapabilities` also accept quest upgrades, so the Range Extender survives a reload.
   Tests: tests/unit/state-validators.test.js, tests/unit/ship-manager.test.js.
5. B8: conversation `repGain` is paid once per choice (claims stored per NPC in `repGainsClaimed`, keyed on node and choice text).
   Penalties, cargo pickers, and action choices such as loans still pay every time the action succeeds, and nothing when it fails.
   Test: tests/unit/dialogue-rep-once.test.js.
6. D14: a failed exotic scan marks the station, so redocking can't re-roll. Each miss adds 20% to the next scan, so the third
   scan after two misses always succeeds. The roll uses `SeededRandom` instead of `Math.random`.
7. E17: Tanaka no longer asks for a test flight at Stage 3. She runs diagnostics on the spot, which matches the instant claim.
8. F15/F16: Finance shows Cole's heat, tier, and days to the next check-in. Heat relief is now 1 point per ₡250 repaid,
   so tiny repeated payments no longer erase heat.

## Honest-mode accounting
- **Dev Admin: never used.**
- Exploit checks the plan asked for, each run once: the rep-farming loop (+6, counted as tainted) and a sample re-roll (Altair, 3 docks).
- One save-state edit, made only to re-test the Epilogue path after fixing H29 (undoing what the buggy run had written). No resources were gained.
- Real time: about 5h45m (16:24 → 22:10). HUD time: 2167-06-20 → 2168-06-03 (**348 days**).
