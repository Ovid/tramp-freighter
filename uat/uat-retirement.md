# UAT Plan: Retirement (New Game → Pavonis Run → Credits)

**Goal:** Start a brand-new game and play it all the way to the end: the
Tanaka quest, the Pavonis Run, the Epilogue, the End Credits, and the
post-credits station at Delta Pavonis. Every step of the quest must go through
the real UI. This is a **guided** run, unlike `uat/uat-new-player.md`, which is
a black-box discovery test. Here you know the route. You are checking that
each gate works, that its hints are clear, and that the ending plays from start
to finish.

Write notes to `uat/<YYYY-MM-DD>-uat-retirement-notes.md` as you go. Put a real
timestamp (`YYYY-MM-DD:HH-MM-SS`) and the HUD date at the top of each entry.

Read `notes/uat.md` first. It covers save backups, the Dev Admin panel, its
custom dropdowns, and other common problems.

---

## 0. Pick a mode before starting

Ask the user which mode to run. Default to **Accelerated** unless told otherwise.

| Mode | Dev Admin allowed for | Not allowed |
|------|----------------------|-------------|
| **Honest** | Nothing. Earn everything. | Any admin use. |
| **Accelerated** | Credits (Player Resources), Teleport, Ship Condition (repairs) | NPC Reputation for Tanaka/Vasquez/Cole. Skipping any quest stage. Endgame → Epilogue preview. |

In Accelerated mode, record every admin action and its amount in the notes,
so it is clear later which gates were reached legitimately. Tanaka's rep,
the quest stages, the exotic samples, and the message delivery must always be
earned in play. Those are what this UAT tests.

## 1. Setup

1. Start `npm run dev` if nothing is listening on 5173.
2. Open `http://localhost:5173/` and take a screenshot.
3. **Back up the user's save** (see `notes/uat.md`, "Protect the user's
   save"). Starting a new game overwrites it.
4. Title screen → New Game → confirm → name the ship → you arrive in ORBIT at Sol.
5. Record the starting state: credits ₡500, debt ₡10,000 to Marcus Cole,
   20 grain, 50 cargo capacity, and the HUD date.

---

## 2. What "done" requires (cheat sheet)

The quest NPC is **Yuki Tanaka**, Bore Station 7, **Barnard's Star**, one
jump from Sol. She stays hidden from the station's People list until you meet
her.

| Gate | Requirement |
|------|-------------|
| Meet Tanaka | Dock at Barnard's Star with **≥ 10 systems visited** (Sol counts) |
| Stage 1 offer: Field Test | Tanaka rep ≥ **10** (Warm), engine ≥ **80%** |
| Stage 1 objective | **3 jumps** after accepting |
| Stage 2 offer: Rare Materials | rep ≥ **30** |
| Stage 2 objective | **5 exotic samples**, docking at stations **≥ 15 LY from Sol** |
| Stage 3 offer: The Prototype | rep ≥ **50**, hull ≥ **70%**, engine ≥ **80%** |
| Stage 4 offer: Personal Request | rep ≥ **70** |
| Stage 4 objective | Give Tanaka's message to **Captain Vasquez**, **Epsilon Eridani** |
| Stage 5 offer: Final Preparations | rep ≥ **90**, **debt = 0**, credits ≥ **₡15,000**, hull ≥ **80%**, engine ≥ **90%** |
| Pavonis Run | Same as Stage 5, still true when you say "I'm ready" |

Stage rewards: S1 ₡1,000, +15 rep, full engine repair · S2 ₡3,000, +15 rep,
Advanced Sensors · S3 ₡2,000, +20 rep · S4 +20 rep · S5 Range Extender.

**Rep math:** only the first 10 rep needs grinding. The rewards, plus the rep
from accepting each stage, carry you past every later threshold. (Approximate
totals: about 33 after S1, 56 after S2, 85 after S3, capped at 100 after S4.)
If a threshold is still not met when you get there, that is a finding.

**Money math:** about ₡10,000 or more of debt (it grows; check Finance) plus
₡15,000 in hand, minus ₡6,000 in quest rewards, plus repair costs. You will need
roughly **₡20,000+ of net trading profit**. In Honest mode this is most of
the playtime.

---

## 3. Test plan

Mark each item ✅ PASS / ❌ FAIL with what you saw. Take a screenshot after
every narrative popup and dialogue node that matters.

### Phase A: Opening and exploration

1. **New game starts cleanly.** The ship naming screen works, ORBIT at Sol
   appears, and the HUD shows ₡500, debt ₡10,000, and the date.
2. **First dock greeting.** Dock at Sol and dismiss the welcome narrative with
   "Time to get to work." The station menu shows People, Mission Board,
   Finance, Trade, Refuel, and Repair.
3. **Early Barnard's visit (before 10 systems).** Jump Sol → Barnard's Star and
   dock. The `dock_barnards_pre_tanaka` narrative fires ("she doesn't talk to
   green pilots…"). Pick "How many ports are we talking?" and check that the
   follow-up tells you to visit more systems. Tanaka is **not** in People.
4. **Visit 10 systems.** The fastest set is Sol plus all 8 of its neighbors
   (Alpha Centauri, Barnard's Star, Sirius, L 726-8, Ross 154, Ross 248,
   L 789-6, Procyon), plus Epsilon Eridani (Alpha Centauri → Epsilon
   Eridani). Most of them are dead ends back to Sol, so expect to backtrack.
   Trade along the way, and watch fuel. Ross 154 and Procyon are Contested,
   so expect encounters. Log each encounter and how it resolved.
   - Optional hint check: once you have visited ≥ 10 systems and before meeting
     Tanaka, ask Captain Vasquez at Epsilon Eridani "Know anyone interesting
     at Barnard's?"
5. **Meet Tanaka.** Dock at Barnard's Star. The `tanaka_intro` narrative
   ("Tanaka drive. Mark III…") fires. Choose any option. **Yuki Tanaka now
   appears in People.**

### Phase B: Earning Tanaka's trust (rep 0 → 10)

6. **Requirement hint.** Talk to Tanaka. Because rep is below 10, the greeting
   is the rep hint ("I don't know you well enough yet… Bring supplies"). Check
   that the hint makes it clear what to do.
7. **Gain rep the intended way:**
   - Conversation: "Tell me about your work" → "How much further?" (+1) →
     "Why Delta Pavonis?" (+2) → "I hope you find her." (+3).
   - Research supply: carry **5 electronics or 5 medicine**, then
     "I brought supplies for your research." This takes the goods and gives
     +3 rep, with a 7-day cooldown. Check that the goods leave the hold and
     that you are not paid for them. Tanaka's reward is rep only, so say
     whether that trade-off is clear.
8. **Rep-farming check.** Run the conversation in step 7 a second time.
   Conversation `repGain` is now paid once per choice, so the second run
   should give **no** rep. If it pays +6 again, record it as an
   **Arbitrage FAIL**: it makes every rep gate trivial.
   Reach rep 10 with supply runs instead.

### Phase C: Stage 1, Field Test

9. With rep ≥ 10 and engine ≥ 80% (repair first if needed), the choice
   **"You mentioned needing a field test?"** appears. Accept it (+5 rep).
10. The HUD Active Missions shows **"Tanaka: Field Test — 0/3 jumps"**, and
    the count goes up with each jump.
11. Make 3 jumps and come back. The greeting says the field test data looks
    excellent. Choose "Glad the data worked out…" and check: **+₡1,000**,
    **engine at 100%**, rep up by about 15–18.

### Phase D: Stage 2, Rare Materials

12. "What do you need?" → accept (+5). The HUD shows **"0/5 samples"**.
13. **Collect samples.** On each dock at a new station ≥ 15 LY from Sol, the
    scanner either finds a sample ("Scanner: Exotic matter detected… [n/5]")
    or reports "Scanner: No exotic matter here. Odds improve at the next
    distant station." The base chance is 60%, and each miss adds 20% to the
    next scan (so never more than two misses in a row). Docking again at any
    station already scanned shows "Scanner: Already scanned this station."
    Suggested loop from Barnard's (≥ 15 LY stations in **bold**):
    - Barnard's → **70 Ophiuchi** (16.6) → **Altair** (16.8, dead end) → 70 Oph → Barnard's
    - Barnard's → Struve 2398 → **Sigma Draconis** (18.9) → Struve 2398 → BD+68 946 → **Groombridge 1618** (15.9)
    - Groombridge 1618 → Alpha Centauri → L 143-23 → **L 145-141** (15.1) → **CD-40 9712** (19.4)
    - More options: `notes/star-connections.md` plus the table at the end of this file.
14. **Re-roll check.** After a miss, undock and dock again at the same
    station. It must say "Already scanned" and must not roll again. Also check
    that the scan after two misses in a row always succeeds.
15. Go back to Tanaka with 5/5 samples. Choose "Took some searching…" and check
    **+₡3,000**, **Advanced Sensors** under ship upgrades, and the rep gain.

### Phase E: Stage 3, The Prototype

16. If hull < 70% or engine < 80%, check that Tanaka's greeting gives the
    matching hull or engine hint. Repair, then choose
    **"I'm ready for the prototype installation."** and accept.
17. **Diagnostics check.** Tanaka says "Give me a moment to run the
    diagnostics, then we talk." Stage 3 has **no objectives**, so talking to
    her again straight away should offer the claim, and she should say "The
    diagnostics came back clean." Check that nothing mentions a test flight.
    Then claim: **+₡2,000**, +20 rep.

### Phase F: Stage 4, Personal Request

18. "About that personal request…" shows four choices. Try **"Tell me more about
    Yumi first."** and check that the backstory node offers accept or decline.
    Accept.
19. The HUD shows **"Deliver to Epsilon Eridani"**. Route: Barnard's → Sol →
    Alpha Centauri (or L 726-8) → Epsilon Eridani.
20. Talk to Captain Vasquez and choose **"I have a message from Yuki
    Tanaka."** You get "Message delivered.", and the HUD changes to **"Return
    to Tanaka at Barnard's Star"**.
21. Go back. Choose "Vasquez understood…" and check about +20 rep. Tanaka's rep
    tier should now be **Family** (≥ 90).

### Phase G: Final preparations (debt, cash, condition)

22. If anything is unmet, Tanaka's greeting gives **one** hint, in this priority
    order: engine → hull → debt → credits → rep. Check each hint you see.
    Vasquez's line "Tanaka says she's ready when I am." should also show up
    while Stage 5 is blocked.
23. **Pay off Cole:** Finance → Pay All. Debt goes to **0**. Record the total
    paid against the starting ₡10,000.
24. Get to **₡15,000 or more** in credits, with **hull ≥ 80%** and **engine ≥ 90%**.
25. "Tell me about the final preparations." shows all the requirements. Choose
    "I'm ready. Let's do this." → "Together." → check that the **Range
    Extender** shows in ship upgrades.
26. **Economic sanity:** the Stage 5 text says the ₡15,000 is "for fuel and
    supplies". Watch whether any credits are actually deducted at the Pavonis
    Run (the code suggests none are). If not, note that ₡15,000 is only a
    threshold, and say whether that feels right.

### Phase H: Pavonis Run and ending

27. Greeting → **"I'm ready for the Pavonis Run."** → "Let's fly." The **POINT OF
    NO RETURN** screen appears.
28. Click **"NOT YET"** once. Check that you return safely with the quest intact,
    and that you can start the run again.
29. **"YES, I'M READY"**. Step through 6 jump-sequence texts with Continue, then
    **"Arrive at Delta Pavonis"**.
30. **EPILOGUE** text sections render. Check that they reflect your choices
    (debt, karma, NPC relationships), then press Continue.
31. **VOYAGE STATISTICS**: check that the final date, systems visited, credits
    earned, missions, Trusted+ NPCs, cargo hauled, and jumps match your notes.
    Then press **Credits**.
32. **End Credits** play after the fade. Test pause (Space) and skip (Escape),
    or let them run out.
33. **Post-credits station:** "Delta Pavonis Colony" with **Yumi Tanaka** in
    People. Talk to her through a few rounds (it's fourth-wall comedy).
    Then **Return to Title**.
34. **⚠ Reload after victory.** Reload the page and continue the save. In code,
    `meta.victory` is read only by the random-event guard (no encounters after
    victory), and the location is Delta Pavonis, which has no wormholes. Record what happens: are you stuck in orbit, is
    there a sensible state, or does the game know it's over?

### Phase I: Wrap-up

35. Restore the user's save from the `uatbackup__` keys (see `notes/uat.md`).
36. Write the final report in the format from the ovid-uat skill. Include
    the total real time, the HUD days elapsed, and every admin action used.

---

## 4. Things to keep an eye on

- **Clarity:** at every blocked gate, can the player tell what's missing from
  what's on screen alone? (Tanaka's hints, Vasquez/Cole hints, HUD mission
  text, the "(Ready!)" vs tier-name indicator in the dialogue panel.)
- **Delta Pavonis distance:** the dialogue says "19.89 light-years", but the star
  data works out to 19.97 LY from Sol. Check what the starmap shows.
- **Mission slot:** the Tanaka quest uses one Active Missions slot while
  active. Check that it doesn't block taking Mission Board jobs in a way the
  player doesn't expect.
- **Cole pressure:** debt grows and Cole has checkpoints, starting at day 30.
  Note whether the debt pressure and the Tanaka grind fight each other
  unfairly.

## 5. Stations ≥ 15 LY from Sol that have wormhole links

Names in `notes/star-connections.md` are reachable. Distance from Sol in LY:

70 Ophiuchi 16.6 · Altair 16.8 · Sigma Draconis 18.9 · Groombridge 1618 15.9 ·
L 145-141 15.1 · CD-40 9712 19.4 · G158-27 15.4 · Ross 780 15.4 ·
L 722-22 17.3 · G208-44 15.4 · BD+43 4305 16.5 · G254-29 17.6 ·
BD+20 2465 16.0 · Lalande 21258 15.8 · Stein 2051 18.0 · Wolf 294 18.0 ·
DENIS 0255-47 16.0 · LP 944-20 16.2 · L 354-89 16.1 · CD-44 11909 16.5 ·
36 Ophiuchi 19.6 · L 347-14 19.4 · G9-38 17.1 · Lalande 25372 17.8 ·
L 668-21 18.9

Check each name against the connections file before routing there.
