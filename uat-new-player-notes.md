# UAT New Player Experience Notes

**Design plan:** `docs/plans/2026-03-01-uat-new-player-fixes-design.md`
**Branch:** `ovid/full-uat-from-player-perspective`
**Real Start Time:** 2026-03-01 ~10:00 AM
**Real End Time:** 2026-03-01 ~11:15 AM
**Game Start Date:** 2167-06-20 (from HUD)
**Game End Date:** 2167-07-27 (at Sol, debt paid, unable to retire)

## First Impressions

- Title screen is clean and clear. Two options: CONTINUE GAME and NEW GAME.
- Subtitle "Sol Sector Trading Simulation" sets expectations.
- Version v5.0.0 shown at bottom.
- Ship naming screen has suggestions - very helpful for new players.
- After naming ship "Wanderer", got Captain's Briefing popup explaining goal and mechanics.
- Starting conditions: 500 credits, 10,000 debt, all systems 100%, Cargo 20/50, Sol system.
- HUD is clear and readable. Shows credits, debt, date, ship systems, cargo, location.
- Dev admin panel visible (red gear, bottom right). Settings gear bottom left.

## Navigation Notes

- System Info shows all wormhole connections with distance, fuel cost, and travel time. Very clear.
- Sol has 8 wormhole connections. Ross 154 is 9.7 LY, 29% fuel, 5 days.
- Jump Warning dialog shows risk assessment (pirate %, customs %), risk modifiers, and safety recommendations. Excellent UX.
- Ship systems degrade slightly during travel (Hull/Engine/Life Support each lost 1-2%).
- Security levels: Safe (Sol), Contested (Ross 154) — hints at danger scaling.
- Travel time correctly advances the date and mission countdown.

## Trading Notes

- Sol market: Grain 12, Ore 20, Tritium 56, Parts 24, Medicine 29, Electronics 21
- Start with 20 Grain (bought at 12 cr/unit). Selling at Sol = break even.
- Trade UI shows "Break even" / profit/loss indicator - very helpful for new players.
- Buy 1/10/Max buttons. Buy 10 greyed out when too expensive (good).
- Cargo manifest: shows purchase location, price, date, current value.

## Finance Notes

- Owe ¢10,000 to Marcus Cole (Loan Shark). 2% interest every 30 days (200 cr/month).
- 5% withholding on trade sales goes to debt automatically.
- Can borrow up to ¢200 more (emergency credit) but increases withholding.
- Borrow buttons are RED - good warning color.
- Strategic tension: need to trade enough to outpace interest.

## Combat/Encounter Notes

- First encounter: Customs Inspection (ROUTINE) on jump from Ross 154 → Alpha Centauri A.
- Encounter UI is excellent: shows cargo manifest with Legal/Restricted tags, three response options (Cooperate, Bribery, Flee) with clear consequences for each.
- Two-step confirmation: select option, then click confirm button. Good UX to prevent accidental choices.
- **BUG/ISSUE:** Cargo manifest showed RESTRICTED ITEMS: 0 and all items (including "Unmarked_crates") as "Legal". Cooperate option promised "Guaranteed Success" and "+5 authority reputation." But the outcome text said "Restricted goods. There will be a fine." — lost ¢1000 credits and -5 authority reputation. This is contradictory. Either: (a) Unmarked Crates should show as "Restricted" in the manifest, or (b) the outcome should not fine when all items are Legal. The "Guaranteed Success" label is misleading.
- Minor display issue: "Unmarked_crates" shown with underscore — should be "Unmarked Crates" (display name vs. internal ID).
- Faction standings after: Authorities -5, Traders -2, Outlaws -2, Civilians 5.
- Credits dropped from 1,838 to 838 (lost ¢1000 from fine).

## NPC/Mission Notes

- Mission Board shows 3 missions per station. Mix of passenger and cargo runs.
- Passenger missions are high-value, low-cargo. Kira Okafor: ¢1225 for 3 units. Best income source so far.
- Cargo runs: "Registered Freight" (clearly legal) vs. "Unmarked Crates" (turned out to be contraband). Naming convention hints at risk level — good design if intentional, but needs to be more explicit.
- Completed missions: Tanaka (¢1100 + tip), Kira Okafor (¢1225 + bonus?). Both passengers. Very profitable.
- Failed mission: Unmarked Crates cargo run — customs confiscated cargo and fined ¢1000. Net loss from accepting this mission.
- Mission rewards appear to not have withholding (unlike trade sales). Need to verify.
- **UX ISSUE:** No route planner or navigation computer. Missions send you to distant systems (SO 0253+1652) but there's no way to find the route. The destination name in Active Missions doesn't seem clickable for navigation. A new player would have no idea how to get to SO 0253+1652 from Ross 154. Need either: (a) a route planner, (b) clickable mission destinations that center the map, or (c) at minimum a "systems away" indicator.
- NPC Father Okonkwo at Ross 154 is WARM (improved from initial?). Good relationship mechanic.
- Mission expiry: Petra Chen expired during transit (6d remaining, 7d jump). Cargo dropped from 47 to 45 during transit. "Mission Failed" notification appeared upon docking — this is reasonable since player is in transit. The failure message is clear: "delivery was not completed in time. The contact won't be working with you again." Consequence: NPC relationship loss.
- Narrative events during transit are a nice touch (newsfeed about trade disputes). Two response options keep the player engaged during travel.

## Progression/Retirement Notes

- Paid off ¢9,927 debt via Finance panel "Pay All" button. Clear "Debt paid in full!" message. Withholding dropped to 0%. Satisfying moment.
- **No retirement option found anywhere.** Checked: Station menu (all items including Ship Status), Finance panel, scrolled entire station menu. No "Retire" button appears even with debt at 0. A new player would have no idea what to do after paying off debt.
- **UX ISSUE:** After paying off debt, there is zero feedback about what to do next. No congratulations popup, no "you can now retire" message, no hint about where to go. The game just... continues. This is a major progression clarity issue.
- Attempted navigating back to Sol in case retirement requires being at home system — route is Epsilon Eridani → Alpha Centauri A → Sol (2 jumps, ~10 days).
- Arrived at Sol Station with debt 0, credits 5,073. Still no Retire button on station menu.
- **BUG:** Marcus Cole dialogue doesn't check debt state. With debt at 0, he still says "Ten thousand credits. Plus interest... I expect regular payments. Defaulting would be... inadvisable." Response options are all about still owing money. Dialogue tree needs a debt-cleared branch.
- **Narrative event:** "You stare at the balance sheet... Zero. You owe nothing. The weight lifts." triggered during jump AFTER paying off debt (not immediately when paying). Nice writing but timing is off — should trigger when debt hits 0, not on next jump.
- **Debris field event:** Found spare parts (3 units) during jump to Sol. Nice risk/reward mechanic — "Investigate the wreckage" vs "Keep moving." Investigating yielded free cargo.
- **CONCLUSION:** Retirement does not appear to be implemented, or its trigger conditions are not discoverable by a new player. A player who pays off debt, returns to Sol, and talks to their loan shark receives no guidance on what to do next.

## Economic Balance / Arbitrage Issues

- **ARBITRAGE: Passenger missions dominate all other income.** Tanaka paid ¢1,100 and Kira Okafor paid ¢1,225 for carrying just 3 cargo units one jump. Meanwhile, trading 45 units of Grain across systems yields slim margins (1-5 cr/unit) or outright losses. A new player quickly learns: always take passenger missions, ignore trading.
- **The "optimal strategy" is too obvious:** Take every passenger mission, fill remaining cargo with whatever's cheap, repeat. There's no real strategic trade-off because passenger missions pay 5-10x more per cargo slot than trading.
- **Interest is negligible pressure:** 2% monthly on ¢10,000 = ¢200/month. One passenger mission covers 5+ months of interest. The debt doesn't feel threatening.
- **Mission rewards may skip withholding:** Trade sales lose 5% to Cole, but mission payouts seem to go directly to the player with no withholding. If true, this further incentivizes missions over trading.
- **Fuel cost variance adds some strategy:** Sol unknown, Ross 154: 3 cr/%, Alpha Centauri A: 2 cr/%, Epsilon Eridani: 5 cr/%. Players learn to refuel at cheap stations. This is a good mechanic but doesn't offset the mission income dominance.
- **Suggested fixes:** (a) Reduce passenger mission payouts, or (b) increase trade margins, or (c) add withholding to mission rewards, or (d) make passenger missions rarer/harder to qualify for, or (e) add cargo volume requirements to passenger missions so they compete with trade cargo. The game should make trading a viable primary strategy, not just a filler activity.

## Issues Found

1. **FIXED:** ~~Unmarked Crates show as "Legal" in customs inspection manifest but trigger "Restricted goods" fine.~~ `isGoodRestrictedInZone()` now checks `MISSION_CARGO_TYPES.illegal` for mission cargo. Cooperate option shows "fines apply" warning when restricted items present instead of "Guaranteed Success".
2. **FIXED:** ~~"Unmarked_crates" displayed with underscore instead of "Unmarked Crates".~~ Replaced local `formatCommodityName` with shared `formatCargoDisplayName` from string-utils.js. Also fixed restricted items warning display.
3. **UX:** No route planner — mission destinations are unreachable without memorizing or referencing wormhole connections externally.
4. **FIXED (partial):** ~~No retirement option found after paying off debt. No feedback about what to do next.~~ **What was fixed:** Cole (Sol) and Vasquez (Epsilon Eridani) now provide Tanaka questline breadcrumbs when debt === 0 and Tanaka quest not started, so the player has a clear next step after paying off debt. **What remains:** There is still no immediate feedback at the moment debt hits zero (e.g., a congratulations popup, a narrative event, or a UI change). The player only learns about Tanaka on their next NPC visit. A "debt cleared" narrative event or notification at the moment of payoff would close this gap fully.
5. **BALANCE:** Passenger missions are 5-10x more profitable per cargo slot than trading, making trading strategically irrelevant.
6. **BALANCE:** Debt interest (¢200/month) is easily outpaced by mission income (¢1,100+/mission), reducing the intended economic tension.
7. **UX:** Missions can be accepted even when mathematically undeliverable (e.g., 6-day deadline but 7+ days of travel needed). No warning.
8. **FIXED:** ~~Marcus Cole dialogue ignores debt state — still threatens about ¢10,000 debt when debt is 0.~~ Added debt-cleared dialogue branch with cold, grudging tone. Includes Tanaka breadcrumb hint.
9. **FIXED (partial):** ~~Retirement not implemented or not discoverable.~~ **What was fixed:** Both Cole (Sol) and Vasquez (Epsilon Eridani) now provide Tanaka questline breadcrumbs when debt is cleared and quest not started, guiding the player toward Barnard's Star. **What remains:** There is no "Retire" button — the endgame is the Tanaka questline (build trust with Tanaka at Barnard's Star → complete her quest stages → Pavonis run). The UAT tester never discovered this path because there were no breadcrumbs after paying off debt. The breadcrumbs now exist, but a new session should verify the full Tanaka questline is completable end-to-end through to the Pavonis run victory condition.

## Feature Ideas

1. **Route planner / navigation computer** — Clickable mission destinations that show the optimal route and estimated travel time. Essential for new player experience.
2. **Mission feasibility warning** — When accepting a mission, warn if the deadline is tight or impossible given current location and fuel.
3. **Ship Quirks are great** — "Hot Thruster" and "Sensitive Sensors" add personality. Could expand with more quirks that create interesting trade-offs.
4. **Trade route suggestions** — Captain Vasquez mentioned the Barnard's-Procyon-Sirius triangle. Could integrate this advice into a "known routes" feature.
5. **Post-debt-payoff event** — When debt hits 0, trigger a narrative event or popup that congratulates the player and hints at retirement (or next goals).

## Questions

1. How does the player retire? Is retirement implemented? If so, what are the conditions?
2. Do mission rewards have withholding applied? If not, is that intentional?
3. Are ship quirks meant to have mechanical effects, or are they flavor only?
4. Is the Barnard's-Procyon-Sirius trade route actually profitable in-game, or is it just NPC dialogue flavor?
