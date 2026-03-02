# UAT New Player Experience Notes

Real Start Time: 2026-03-02 ~current
Game Date at Start: 2167-06-20
Game Date at End: 2167-07-24 (Day 34)
Real End Time: 2026-03-02

---

## Notes (in order)

1. Title screen is clean and clear. Two buttons: CONTINUE GAME and NEW GAME. Version v5.0.0. No confusion about what to do.

2. New game confirmation dialog warns about overwriting save - good UX.

3. Ship naming screen is intuitive. Has text input + 8 name suggestions (Serendipity, Lucky Break, etc). Nice for players who can't think of a name. Named my ship "Rusty Bucket".

4. Captain's Briefing appears on game start. Covers: goal (retire), navigation (starmap + wormholes), docking (trade/refuel/repair), and science behind the stars. Good intro content.

5. **ISSUE - Briefing doesn't mention Debt.** HUD shows "Debt: 10,000" but the Captain's Briefing never explains what this is, how it works, or how to pay it off. As a new player, I see 500 credits and 10,000 debt and have no idea what the relationship is or if interest accrues.

6. **QUESTION - How much do I need to retire?** The briefing says "save up enough credits to retire" but doesn't give a target number. With 500 credits and 10,000 debt, I have no sense of scale.

7. **QUESTION - Cargo 20/50?** HUD shows Cargo: 20/50. Does that mean I already have 20 units of cargo? What is it? The briefing doesn't mention starting cargo at all.

8. Starting state: Credits 500, Debt 10,000, Fuel/Hull/Engine/Life Support all 100%, Cargo 20/50, System Sol, Date 2167-06-20.

9. Gear icon visible in bottom-left corner. Not sure what it does - settings maybe?

10. Station menu at Sol has: PEOPLE (Marcus Cole - Loan Shark, COLD), Mission Board, Finance, Trade (highlighted green), Refuel, Repairs, Info Broker, Upgrades, Cargo Manifest, Ship Status. Good layout, Trade stands out visually.

11. **ANSWER to #7**: Cargo Manifest shows I start with 20 units of Grain, purchased at ¢12/unit at Sol, current value ¢240. Capacity is 50 units. So my starting assets: 500 credits + 240 in cargo = 740 total, against 10,000 debt. That's a big hole.

12. Cargo Manifest is well-designed: shows quantity, purchase location, purchase price, date, and current value. Very helpful for tracking profit.

13. Marcus Cole being a "Loan Shark" with COLD relationship - implies the debt mechanic connects to NPCs. Interesting. Should talk to him.

14. **Trade panel**: 6 goods at Sol — Grain (12), Ore (20), Electronics (21), Parts (24), Medicine (29), Tritium (56). Buy 1/10/Max buttons. "Your Cargo" section shows sell price + profit indicator ("Break even" at same station). Excellent UX for understanding profitability.

15. **MINOR ISSUE - Currency inconsistency?** Cargo manifest uses "¢12/unit" but trade panel uses "12 cr/unit". Should be consistent throughout.

16. **Finance panel ("Cole Credit Line")**: Outstanding ¢10,000, Withholding 5% of trade sales, Interest 3% every 30 days, next interest in 30 days. Can make payments (100/500/1000/All). Emergency credit available up to ¢200. Borrowing buttons are red (good warning). Very informative panel.

17. **KEY INSIGHT - Debt pressure**: 3% interest on 10,000 = 300 credits/month. Plus 5% withholding on all sales. So the debt is actively working against you. With only 500 credits and 240 in cargo, this is tight. Interest compounds if not paid, making the game progressively harder if you don't trade efficiently.

18. **CONCERN - Pay All trap?** "Pay All (¢500)" would dump all cash into debt, leaving 0 credits to trade with. A new player might do this thinking they should pay debt first. But then they can't buy cargo. The game doesn't warn against this. Though you still have the grain to sell...

19. **ANSWER to #5**: The Finance panel explains debt fully — but a new player has to discover it by clicking Finance. The Captain's Briefing should at least mention you owe Marcus Cole and point them to the Finance menu.

20. **Info Broker** has two tabs: "Purchase Intelligence" (buy rumors ¢25, buy system prices ¢100) and "Market Data" (shows all known prices). Bought a rumor for ¢25 — got hint about Parts being cheap at Sol. Good value for money.

21. **Mission Board** had 3 missions: 2 passenger transports (Ava Tanaka → Ross 154 ¢64, Ben Costa → Procyon A ¢38) and 1 cargo run (Diplomatic Pouches → L 726-8 A ¢113). Accepted all 3. Missions cost no money but use cargo space (3+2+10=15 units). Mission board refreshes daily.

22. **Passengers have personality** — names, social class (Wealthy, Scientist), and dialogue quotes. Nice flavor. They use cargo space, which creates an interesting tradeoff with goods.

23. **Refuel panel**: 2 cr per %, slider + buttons. At 100% tank already. Simple and clear.

24. **System Info panel** is excellent. Shows: spectral class, wormholes count, distance, security level, station status. Lists all connected systems with distance/fuel cost/travel time. Sol has 8 wormholes.

25. **Navigation fuel math**: L 726-8 A costs 27.5% fuel (5d), Ross 154 costs 29.4% (5d), Procyon A costs 32.9% (6d). Total to visit all 3 from Sol = 89.8% — nearly a full tank! Must refuel between trips or find connecting routes.

26. **GOOD DESIGN - Security Level shown.** Sol is "Safe". Implies other systems may be dangerous. This is useful for route planning.

27. State before first jump: Credits 235, Debt 10,000, Fuel 100%, Cargo 45/50 (20 Grain, 10 Parts, 10 Diplomatic Pouches, 3 Ava, 2 Ben). 3 active missions.

28. **Jump Warning screen is excellent.** Shows security level explanation, pirate/customs probabilities, risk modifiers (cargo value), and safety recommendations. Gives informed consent before dangerous travel. Great design.

29. **Got customs inspected on arrival at L 726-8 A.** 3 response options: Cooperate (guaranteed success, +5 authority rep), Bribery (60% success, ¢500), Flee (triggers combat, -15 rep). Options are well-explained with clear consequences. Chose Cooperate — passed, got +5 Authorities.

30. **4 faction types: Authorities, Traders, Outlaws, Civilians.** All start at 0 except Authorities now 5 from cooperation.

31. **ISSUE - Customs inspection UI**: Had to scroll all the way down past the 3 options to find the "Comply with Inspection" / "Reconsider" buttons. The Cooperate card LOOKED clickable (highlighted with orange border) but wasn't — the actual button was hidden below. A new player might get confused trying to click the option card itself. Consider making the option cards clickable directly, or at least making the confirm button visible without scrolling.

32. **Ship degradation from travel**: After 1 jump (8.8 LY, 5 days), Fuel 77%, Hull 98%, Engine 99%, Life Support 98%. Systems degrade slightly from travel. Good mechanic — creates ongoing maintenance costs.

33. **POSSIBLE ISSUE - Fuel cost discrepancy?** System Info said L 726-8 A costs 27.5% fuel, Jump confirmation said 28%. But after arriving I'm at 77% fuel (used 23%). That's 5% less than advertised. Either fuel cost is overestimated in the UI, or there's a calculation issue. (Minor, but worth checking.)

34. Arrived at L 726-8 A. Date: 2167-06-25. System is 8.8 LY from Sol. 3 active missions, 4d remaining each.

35. **Cargo mission auto-completed on docking.** "Mission Complete!" popup with Dismiss/Complete buttons. Reward ¢113 applied immediately. Cargo freed up (45→35). Clean UX.

36. **EXCELLENT - Withholding transparency.** Trade receipt shows "Revenue: ¢310 · Cole's cut: -¢16 · You receive: ¢294". Crystal clear. No hidden deductions.

37. **Debt auto-reduction from withholding.** Debt dropped from 10,000 to 9,984 (reduction of ¢16 = the withholding amount). So withholding goes directly to debt. Good passive mechanic — every sale pays down debt automatically.

38. **Prices at L 726-8 A vs Sol**: Grain 12 (same), Ore 18 (cheaper), Parts 31 (up from 24), Medicine 41 (up from 29), Electronics 35 (up from 21!), Tritium 57 (similar). Electronics would have been the killer trade (67% markup).

39. **ISSUE - Mission time trap!** After arriving at L 726-8 A (5 days travel), missions now show 4d remaining. Both remaining passenger missions go to systems only reachable from Sol. Return to Sol takes 5 days. So missions will EXPIRE before I can deliver them. A new player who naively accepts all available missions (like I did) gets punished for not planning routes. The game should either: (a) warn about conflicting deadlines when accepting, (b) give more time, or (c) make it clearer you should only take missions in your planned direction. This is a significant new-player trap.

40. **Route from L 726-8 A**: 5 connections — Tau Ceti (2d), L 725-32 (2d), Epsilon Eridani (3d), Lacaille 9352 (4d), Sol (5d). Neither Ross 154 nor Procyon A is directly connected. This means round-trips from Sol to distant systems are not practical within 9-day mission deadlines.

41. State: Credits 642, Debt 9,984, Fuel 77%, Cargo 25/50 (20 Grain + passengers). 2 active missions likely to fail.

42. **Second customs inspection on return to Sol.** Got inspected AGAIN. Sol is "Maximum" security so inspections seem very likely. Cooperated again, +5 more Authorities rep (now 10 total). Two inspections in 2 jumps feels like a lot, but perhaps that's the price of safe systems.

43. **Both passenger missions failed on docking at Sol.** "Mission Failed" popup for each: Ava Tanaka (Ross 154) and Ben Costa (Procyon A). Message: "delivery was not completed in time. The contact won't be working with you again." Confirms the mission time trap from note #39. No penalty beyond lost opportunity — no fine or reputation hit mentioned. The "won't be working with you again" is flavor text (they were one-time missions anyway).

44. **GOOD - Narrative event on docking.** A dockworker sidles up and gives a free trade tip: "Heard ore prices are through the roof at L 143-23." Two response options: "Thanks for the tip" or "Mind your own business." Nice worldbuilding — gives flavor AND useful information. Chose friendly option. These ambient events make the station feel alive.

45. State after return to Sol: Credits 642, Debt 9,984, Fuel 53%, Hull 96%, Engine 98%, Life Support 95%, Cargo 20/50 (20 Grain), Date 2167-06-30. 10 days into the game. Net worth: 642 + 240 grain - 9,984 debt = -9,102. Deeper in the hole due to interest timing approaching.

46. **STRATEGIC ASSESSMENT at Day 10**: Made ¢142 total (500 start → 642 now), but debt barely moved (10,000 → 9,984 via withholding). Interest of ¢300 hits in 20 more days. At current pace, I'll be underwater. Need to trade MORE aggressively — bigger margins, more cargo, shorter routes. The dockworker's L 143-23 ore tip and the Electronics opportunity I missed suggest I need better market intelligence.

47. **PRICES ARE DYNAMIC!** Sol prices changed between visits (Day 0 vs Day 10): Grain 12→14, Ore 20→22, Electronics 21→24, Parts 24→27, Medicine 29→33, Tritium 56→63. Everything went up. This is a crucial mechanic — prices fluctuate over time. Can't assume the same prices on return trips.

48. **Ship Upgrades are well-designed.** 7 upgrades from ¢2,500 to ¢6,000, each with clear effects AND tradeoffs: Medical Bay (life support drain -30%, but loses cargo space), Extended Fuel Tank (150% capacity, but more vulnerable to weapons), Advanced Sensor Array (see economic events ahead, ¢3,500), Efficient Drive System (fuel -20%, but slower), Smuggler's Panels (10 hidden cargo, but authorities risk), Reinforced Hull Plating (hull degradation -50%, but loses cargo space), Expanded Cargo Hold (capacity 75, but less maneuverable). Great aspirational progression — but at my income rate, the cheapest upgrade is 30+ trading days away.

49. Sold 20 Grain at Sol for 14/unit (+17% profit from 12 purchase). Then bought 37 Electronics at 24/unit = 888 credits. **Buy Max left me with only 20 credits — no money for fuel!** The game doesn't warn you about leaving yourself broke.

50. **ISSUE - Buy Max doesn't reserve for fuel.** A new player could Buy Max and have no money left for fuel, effectively stranding themselves (though emergency credit from Marcus Cole exists). Consider: (a) warning when buying more than X% of cash, or (b) a "Buy Max (reserve fuel)" option.

51. **Second trip to L 726-8 A (Day 10→15).** Narrative event during transit: old distress beacon signal. Choice to "Log coordinates" or "Ignore." Good flavor — logging might lead to future content. Fuel used: 23% (36→13% actual), consistent with 23% pattern despite UI showing 28%. **The fuel cost display is consistently overestimating by ~5%.**

52. **ISSUE - Repeated narrative event.** Dockworker at L 726-8 A gave the EXACT same tip as Sol: "Heard ore prices are through the roof at L 143-23." Word-for-word identical. Different station, same event. Breaks immersion. Narrative events should vary by station or have a cooldown after appearing.

53. **Fuel costs vary by system!** Sol charges 2 cr/%, L 726-8 A charges 3 cr/%. 50% more expensive at the remote system. This adds strategic depth — refuel at cheap systems before venturing out. I only noticed this because I was broke; a new player might not realize fuel prices differ.

54. **DEVASTATING - Prices shifted against me on Medicine trade.** Bought 50 Medicine at L 726-8 A for 19/unit (Sol was 33 last visit). Arrived at Sol 5 days later — Medicine now 15! Loss of -4 cr/unit (-21%). Total loss: ~238 credits on Medicine. The price fluctuation completely wiped out my Electronics profits and then some. THIS is a make-or-break game mechanic. Prices can and will move against you. No guaranteed arbitrage.

55. **GOOD - Salvage event during transit.** Debris field with intact cargo container. Found 3 spare parts (free!). Cargo went to 53/50 — **OVER CAPACITY.** The game allowed loading salvaged goods beyond the 50-unit limit. This is either a bug or an intentional salvage perk. Either way, the UI clearly shows "53/50 (-3 remaining)" which is helpful.

56. **ISSUE - Cargo over capacity (53/50).** If this is unintentional, salvage events should check available capacity and either jettison existing cargo or only take what fits. If intentional, there should be consequences (slower travel? Higher fuel use? Inspection risk?). As-is, it's free bonus cargo with no downside.

57. **BALANCE CONCERN at Day 20**: Credits 772, Debt ~9,878. Net worth: -9,106. Started at approximately -9,260. After 20 days, TWO round trips, and significant trading, I've improved by about 154 credits. Interest of ~296 hits at Day 30. At this pace, I'm barely covering interest. A new player making suboptimal trades (as I did with Medicine) would be LOSING ground. The early game feels like a very steep treadmill.

58. **Current Sol prices (Day 20):** Grain 11, Ore 17, Tritium 49, Parts 21, Medicine 15, Electronics 19. Everything dropped from Day 10 prices. The market is volatile.

59. **Alpha Centauri A trade run (Day 20→23→26).** Shorter route: 3 days each way vs 5 for L 726-8 A. Sold 50 Grain at Alpha Centauri A for 9/unit (bought at 11 at Sol). LOSS of -2/unit (-18%). Then bought 50 Grain at 9 there, returned to Sol and sold at 11 for +2/unit (+22%). Net result after withholding: exactly zero gain. The 5% withholding eats all the profit on low-margin trades. Lesson: need HIGH-margin goods to overcome the withholding tax.

60. **Alpha Centauri A prices:** Grain 9, Ore 14, Tritium 46, Parts 22, Medicine 56, Electronics 22. Key insight: MEDICINE is 56 here vs 15 at Sol — that's a 273% markup! This is the trade route I should have been running from the start.

61. **Fuel cost pattern CONFIRMED.** Every jump consistently uses ~3% LESS fuel than the UI claims. Alpha Centauri shows 19% but costs 16%. L 726-8 A shows 28% but costs 23%. This is a systematic 3% overestimate in the displayed fuel cost, not just rounding.

62. **GOOD - Narrative variety.** Transit to Alpha Centauri A got a calm atmospheric event ("The wormhole transit is smooth. Unusually smooth...") — different from the distress beacon and dockworker events. Good variety in flavor text.

63. **Station NPC variety.** Alpha Centauri A has "Station Master Kowalski" (Station Master, NEUTRAL) vs Sol's "Marcus Cole" (Loan Shark, COLD). Different NPCs at different stations add character. Haven't interacted with Kowalski yet.

64. **FIRST PIRATE ENCOUNTER (Day 26).** Occurred while docking at Sol. Threat Level: MODERATE. Pirates demanding 20% of cargo. Shows ship status, active modifiers ("Sensitive Sensors", "Fuel Sipper" — unclear where these came from), and 4 tactical options: Fight (45% win), Flee (70% win), Negotiate (60% win), Surrender (100% safe). Excellent design — clear risk/reward tradeoffs, good information display.

65. **GOOD - Pirate encounter UI is better than customs.** Cards are clickable, and once selected, confirm button appears AT THE BOTTOM VISIBLE without scrolling. "Select a tactical option to proceed" text is clear. Compare with customs (note #31) where confirm button was hidden below fold.

66. **ISSUE - Unknown modifiers.** "Sensitive Sensors" and "Fuel Sipper" appeared as Active Modifiers during the pirate encounter, but I never purchased or equipped these. The Upgrades panel at Sol showed different upgrades. Where did these come from? No explanation in the UI. Could be default ship traits, but they should be mentioned somewhere (Ship Status panel? Captain's Briefing?).

67. **Negotiation flow is well-designed.** After choosing Negotiate, entered a sub-panel with "Your Position" (Cargo Value ¢500, Karma +2, Outlaw Standing: Neutral, Available Intel: None) and dialogue options. Counter-Proposal has a flavored confirm button ("Say: 'How about something more reasonable?'"). Good immersion. The position stats hint that karma, faction rep, and intel affect outcomes.

68. **ISSUE - Failed negotiation has no consequence?** Counter-Proposal FAILED ("The pirates don't take kindly to your offer"), but the encounter just... ended. Cargo still 50/50, no damage, no combat. The failure text said "Pirates become more aggressive (+10% threat), combat likely" — but no combat occurred. Either: (a) the threat increase applies to future encounters only (but this isn't explained), or (b) the combat-after-failure isn't implemented. This feels anticlimactic. A failed negotiation should have real consequences, or the failure text shouldn't promise "combat likely."

69. **STRATEGIC DISCOVERY - Medicine arbitrage!** Sol: Medicine 15 cr/unit. Alpha Centauri A: Medicine 56 cr/unit. That's +41/unit profit (273%). Bought 36 Medicine at Sol for 540. If prices hold, selling at Alpha Centauri would yield 2,016 revenue (~1,415 after withholding). This is the first genuinely profitable trade I've found. The game rewards market knowledge — a player who just buys Grain (cheap, low margin) will struggle, but discovering the Medicine route changes everything.

70. **BALANCE UPDATE at Day 26**: Credits 1, Debt ~9,827, Cargo 36 Medicine (cost 540, potential value 2,016 at Alpha Centauri). If this trade works, it's a game-changer. Net worth before: -9,286. If I sell Medicine at 56 each: 2,016 revenue - 101 withholding = 1,915 received. New position: 1,916 credits, debt 9,726, net -7,810. That would be a +1,476 improvement in one trip! Compared to 0 improvement from the Grain trade, this shows how critical finding the right trade routes is.

71. **Sol prices (Day 26):** Grain 11, Ore 18, Tritium 50, Parts 21, Medicine 15, Electronics 19. Very similar to Day 20 prices. Medicine at 15 is consistently cheap at Sol — this may be a reliable buy point.

72. **Pirate encounter UI much better than customs.** Cards clickable directly, confirm button visible without scrolling. "Select a tactical option to proceed" text is clear. However, the same scrolling issue from customs (note #31) does NOT apply here — good consistency fix.

73. **ISSUE - Failed negotiation has no real consequence.** Counter-Proposal FAILED but the encounter just ended — no cargo lost, no damage, no forced combat. The failure text promised "combat likely" but nothing happened. This is anticlimactic and potentially a bug. Failed negotiations should escalate meaningfully.

74. **GOOD - Distress Call encounter design.** Three options on a moral spectrum: Respond (HEROIC: costs resources, rewards credits/karma/civilian rep), Ignore (PRAGMATIC: -1 karma, no cost), Salvage (PREDATORY: -3 karma, -15 civilian rep, +5 outlaw rep, random cargo, "This action will be remembered by the sector"). Excellent moral gameplay with clear consequences. The resource display (fuel sufficient? life support can handle crew?) helps informed decision-making.

75. **DEVASTATING - Medicine price crashed 64%.** Alpha Centauri A Medicine went from 56 (Day 23) to 20 (Day 31). Expected +41/unit profit became +5/unit. Revenue 720 vs expected 2,016. This is the THIRD time price volatility undermined a trade (Medicine at Sol, Grain at Alpha Centauri, now Medicine at Alpha Centauri). The game STRONGLY rewards timing and punishes assumptions about stable prices. No guaranteed arbitrage — confirmed.

76. **Interest hit on Day 30.** Debt jumped from 9,827 to 10,122 (+295). 3% of 9,827 = 295. The distress call rescue's +2 day delay pushed the date past Day 30, triggering interest. The rescue earned 500 credits but cost 295 in interest (net +205) plus fuel/life support. Still worth it, but the timing interaction is interesting — rescue delays can trigger interest.

77. **Marcus Cole's "heavier lien" message was misleading.** Finance panel shows withholding still at 5%. Interest still at 3%. The message ("the lien on your trades just got heavier") seems to refer to the general difficulty of the grace period ending, not an actual rate change. HOWEVER, the Emergency Credit section warns "Borrowing increases withholding" — so that's how the lien gets heavier. Confusing messaging for a new player.

78. **Dockworker tips DO vary.** Same station (Alpha Centauri A) on a different visit gave "ore at G51-15" instead of "ore at L 143-23." So tips rotate — the earlier repetition (note #52) may have been coincidental or based on short time between visits.

79. **Ship condition degrading steadily.** After 5 jumps and a rescue: Hull 86%, Engine 93%, Life Support 81%. Life support is the fastest-degrading system (100% → 81% in 31 days). At this rate, I'll need repairs within ~50 days. Repair costs will further strain finances.

80. **BALANCE UPDATE at Day 31**: Credits 1,185, Debt 10,086, Cargo 0. Net worth: -8,901. Started at -9,260. Improvement: +359 over 31 days. Profitable Medicine trade yielded +180 net (after withholding), plus 500 from rescue. Without the lucky rescue, I'd only be up +154 from trading alone in 31 days. Interest of 295 nearly wiped out all trading profits. The early game is extremely tight.

81. **Alpha Centauri A prices (Day 31):** Grain 11, Ore 18, Tritium 53, Parts 26, Medicine 20, Electronics 26. All went UP from Day 23 (Grain 9→11, Ore 14→18, Parts 22→26, Electronics 22→26). Medicine went DOWN dramatically (56→20). No profitable return cargo to Sol at these prices.

82. **Mission Board at Alpha Centauri A (Day 31):** Three cargo run missions available: (1) L 725-32, 3 hops ~10 days, 7 cargo, 21d deadline, ₡394; (2) Scientific Samples to Sol, 1 hop direct, 12 cargo, 9d deadline, ₡75; (3) Barnard's Star, 2 hops ~6 days, 5 cargo, 15d deadline, ₡150. The Sol mission is on my route so I accepted it.

83. **Missions provide cargo for free.** Accepting the Sol mission loaded 12 Scientific Samples into my hold (Cargo: 12/50) without costing any credits (still 1,185). This is MUCH better than the earlier mission experience where I had to buy cargo. The remaining 38 slots are still available for trade goods. This is a nice mechanic — missions supplement trading income without competing for it.

84. **Active Missions HUD section.** After accepting a mission, a new "Active Missions" section appears in the bottom-left HUD showing mission name, destination, days remaining, and an "Abandon" button. This is clear and helpful — players always know what they need to deliver and when.

85. **Info Broker is EXCELLENT.** Two tabs: "Purchase Intelligence" (buy rumors ₡25, buy system intel ₡50-100) and "Market Data" (shows prices from all visited systems with age). Previously visited systems get cheaper intel (Sol ₡50 vs unvisited systems ₡100). The Market Data tab is a free reference showing last-known prices from every system you've visited, with age indicators ("Current", "5 days old", "16 days old"). This is the strategic tool I needed to plan profitable trades. Why didn't I check this sooner? A new player might miss this.

86. **Market Data enables comparison shopping.** Using the data: Alpha Centauri Medicine 20 vs Sol Medicine 30 = +10/unit margin. This is FAR more useful than flying blind. The data aging mechanic means prices get stale — you can never be 100% sure, but it reduces risk significantly. Spending ₡50-100 on intel could save hundreds in bad trades.

87. **SUGGESTION: The game should hint more strongly that the Info Broker exists and is useful.** The tutorial/briefing mentions trading but not the Info Broker. A dockworker tip like "Check with the Info Broker if you want to know where prices are good" would help new players discover this crucial tool earlier. I wasted ~20 days flying blind when the Info Broker could have helped from Day 1.

88. **Fuel overestimate confirmed AGAIN.** Alpha Centauri → Sol: displayed 19% fuel cost, actual was 16% (37%→21%). This is the same ~3% overestimate as before (note #61). Consistent bug.

89. **Mission auto-completes on docking!** Arrived at Sol and immediately got "Mission Complete!" popup with reward. No manual delivery step needed — just dock at the destination. Clean UX. Also: mission reward of ₡75 was paid in full, no Cole's 5% cut. Missions bypass withholding!

90. **Marcus Cole now "COLD."** Was... I think neutral before? His relationship is deteriorating as I'm not paying off debt fast enough. Wonder if this has gameplay consequences beyond flavor.

91. **BEST TRADE RUN YET (Day 31→34):** Bought 38 Medicine at 20/unit at AC (760), sold at Sol for 32/unit (1,216 revenue, 1,155 after Cole). Profit: +395. Plus +75 mission. Total trip: +470. This is 3x better than any previous trip. Key factors: (a) used Info Broker to pick the right good, (b) stacked a free mission on the same route, (c) Medicine price at Sol went UP (+2) while I was in transit.

92. **One-way trade problem.** Sol→AC has NO profitable goods right now. Sol prices are higher than AC for everything except Electronics (+3/unit, barely worth it). The game doesn't have symmetric trade — you need different goods for different directions or need to find a third system to triangulate.

93. **Sol prices (Day 34):** Grain 14, Ore 22, Tritium 62, Parts 27, Medicine 32, Electronics 23. All higher than Alpha Centauri A. Compare to Sol Day 26: Grain 13→14, Ore 20→22, Tritium 58→62, Parts 25→27, Medicine 30→32, Electronics 22→23. All prices went up +1 to +4 in 8 days. Inflation trend at Sol?

94. **Passenger missions discovered!** Sol Mission Board has passenger missions alongside cargo runs. Passengers have occupation (Business, Scientist) and personality quotes ("I expect professional service", "I'm studying stellar phenomena"). Take only 2 cargo units. Rewards are low (₡23-33) but barely take cargo space. Felix Volkov's reward shows "₡23 ▼" with a red down arrow — below-average reward indicator?

95. **Sol Mission Board less useful for my route.** No missions going to Alpha Centauri A. Available: L 722-22 A (3 hops, ₡525), Kapteyn's Star (2 hops, ₡33), L 726-8 A (1 hop, ₡23). None on my trade route. This creates an interesting strategic tension — do I stick to profitable trade routes or chase missions?

96. **Finance panel: voluntary debt payments!** "Make Payment" section offers Pay ₡100/₡500/₡1000/Pay All buttons. Strategic choice: pay down debt (saves interest) vs keep cash (more trading capital). Also "Emergency Credit" up to ₡200 available — borrowing increases withholding rate. Next interest in 27 days.

97. **Retirement not mentioned anywhere.** I've now checked Finance, Ship Status info, Station menu, Upgrades — no mention of retirement anywhere. The briefing said to "pay off your debt and retire" but there's no retirement target, no progress indicator, no "Retire" button. How is a new player supposed to know when/how to retire? This is a CLARITY issue. Maybe retirement triggers automatically when debt = 0?

98. **Ship Upgrades are well-designed with meaningful tradeoffs.** 7 upgrades from ₡2,500-₡6,000: Medical Bay (slower LS drain, -5 cargo), Extended Fuel Tank (+50% fuel, vulnerable to combat), Advanced Sensors (see economic events ahead, no visible tradeoff), Efficient Drive (-20% fuel use, slower), Smuggler's Panels (10 hidden cargo, reputation risk), Reinforced Hull (-50% hull degradation, -5 cargo), Expanded Cargo Hold (+50% capacity, less maneuverable). Every upgrade has a trade-off (except maybe Sensors?). Creates strategic investment decisions.

99. **Upgrades create a gear-up tension.** Cheapest upgrade is ₡2,500 — that's nearly all my current savings. Spending on upgrades means less trading capital AND less debt reduction. The game creates a classic "invest in infrastructure vs pay off debt" dilemma. Good design.

100. **"Sensitive Sensors" and "Fuel Sipper" mystery resolved?** With "No upgrades installed" confirmed, those pirate encounter modifiers (note #66) must be pirate ship attributes or inherent ship traits, NOT purchased upgrades. But there's no explanation in the UI. Still confusing for new players.

101. **BALANCE ASSESSMENT at Day 34:** Credits 1,655, Debt 10,025. Net worth: -8,370 (started -9,260, +890 improvement in 34 days). At the current best pace (~400 profit per 6-day round trip = ~2,000/month, minus ~300 interest = ~1,700 net/month), paying off ₡10K debt would take ~6 months game time (~180 days). That's a LOT of trading. The game is not "too easy" — if anything, it may be too slow for the early game. Upgrades would help but require big upfront investment.

--- ADMIN PANEL SECTION (used to test retirement mechanic) ---

102. **Dev Admin Panel works after creating .dev file.** Red gear icon appears in bottom-right. Can set Credits, Debt, Ship Condition (Hull/Engine/LS/Fuel), Karma, Faction Reputation, and "Repair All Systems to 100%". Very useful for UAT.

103. **Debt = 0 triggers narrative event!** On docking with debt at 0, got a narrative popup: "You stare at the balance sheet. Read it again. Zero. You owe nothing. The weight lifts..." with an "I'm free." button. Great atmospheric moment with orange border highlighting significance. But then... nothing else happens. No retirement option appears.

104. **Withholding drops to 0% when debt-free.** Finance panel changes: Outstanding ₡0, Withholding 0% (was 5%), Next interest N/A. No more Cole's cut on trade revenue. Make Payment section disappears. Emergency Credit still available. But NO retire button.

105. **RETIREMENT DOES NOT EXIST as a game mechanic.** After extensive testing with admin panel (debt=0, credits=1655, all systems 100%): No "Retire" button in station menu, no retire option in Finance, no retirement achievement in Achievements, no retirement trigger. The Captain's Briefing says "save up enough credits to retire" but doesn't specify a target and has no mechanism to actually retire. The game is currently an open-ended sandbox — the goal mentioned in the briefing has no mechanical implementation.

106. **Captain's Briefing (Instructions) is very minimal.** Covers: basic goal ("save enough to retire"), navigation (System Info, jumps cost fuel), stations (dock, trade, refuel, repair), and science trivia (real star systems). Does NOT mention: debt/Cole's credit line, missions, encounters, Info Broker, upgrades, achievements, faction reputation, or what "enough to retire" means.

107. **Achievements & Stats is excellent but hidden.** Available via green gear icon → Achievements. Shows: Reputation & Standing (Karma, 4 factions), Ship's Log (systems visited 3/48, jumps 8, credits earned 5338, cargo hauled 294, charitable acts 4), Danger History, and 6 achievement categories: Exploration (5/15/30/48 systems), Trading (5K/25K/100K/500K credits), Social (1/3/5/8 trusted NPCs), Survival (10/50/150/300 jumps), Danger (3/10/25/50 encounters), Moral (karma magnitude 15/35/60/85). No retirement achievement. I'd completed "Petty Cash" (5K credits) and "Survivor" (3 encounters).

108. **SUGGESTION: Achievements should be shown more prominently or announced.** I didn't discover Achievements until Day 34 and only by exploring the gear menu. There's no notification when you earn one. A popup or banner saying "Achievement Unlocked: Petty Cash!" would add satisfying feedback loops and help players understand their progress.

109. **Game day count summary:** Day 1-10: Learning basics, first trades, first failed mission. Day 10-20: Discovered Sol↔AC route, Grain trading (low margin). Day 20-25: Medicine arbitrage attempt (price crashed). Day 25-31: Better Medicine trade using Info Broker. Day 31-34: Best trade run (+470 including mission). By Day 34, I'd visited 3 systems, completed 8 jumps, survived 4 encounters, earned 5,338 credits total, and improved net worth by +890 (from -9,260 to -8,370).

---

## OVERALL ASSESSMENT

**Is the game too easy?** No. Definitely not. Debt is crushing, interest compounds, prices are volatile, and encounters add risk. There are no guaranteed wins.

**Is the game too hard?** Borderline. The early game is extremely tight — a new player flying blind (without Info Broker) could easily spiral into unrecoverable debt. But once you discover the Info Broker and learn to read market data, progress accelerates. The difficulty curve is steep but not unfair IF you find the right tools.

**Is there arbitrage?** No guaranteed arbitrage. Prices are dynamic and volatile. Medicine went from +273% margin to +33% between visits. The game strongly rewards market intelligence and punishes assumptions.

**Is the game fun?** Yes. There's genuine tension in trade decisions, encounter choices, and resource management. The narrative events add atmosphere. The upgrade system promises interesting strategic choices. Achievements provide long-term goals.

**Can a new player figure it out?** Mostly. Trading basics are intuitive. But the Info Broker, missions, and debt mechanics require discovery. The Captain's Briefing is too minimal. And the retirement goal mentioned in the briefing has no implementation.

---

## ISSUE TRACKER

### Fixed (by retirement discoverability design — 2026-03-02)

| # | Issue | Fix |
|---|-------|-----|
| 5 | Briefing doesn't mention debt | Briefing rewrite covers Finance/debt |
| 6 | How much to retire? No target number | Briefing reframes endgame as quest-driven, not wealth threshold |
| 87 | Info Broker not mentioned in briefing | Briefing mentions Info Broker as strategic tool |
| 97 | Retirement not mentioned anywhere | Briefing hints at quest path; dockworker + Info Broker breadcrumbs added |
| 105 | Retirement doesn't exist as mechanic | Retirement IS the Tanaka quest; discoverability improved via breadcrumbs |
| 106 | Briefing too minimal (no debt, missions, encounters, Info Broker, upgrades) | Briefing expanded to cover debt, Info Broker, missions, NPCs |

### Outstanding

| # | Issue | Category |
|---|-------|----------|
| 7 | Starting cargo (20/50) not explained in briefing | UX - Onboarding |
| 15 | Currency inconsistency (¢ vs cr) | UX - Consistency |
| 31 | Customs inspection UI — confirm button hidden below fold, cards look clickable but aren't | UX - Encounter UI |
| 33, 61, 88 | Fuel cost display overestimates by ~3% systematically | Bug - Calculation |
| 39 | Mission time trap — no warning about conflicting deadlines when accepting | UX - Missions |
| 50 | Buy Max doesn't reserve credits for fuel | UX - Trade |
| 52, 78 | Repeated narrative events (may be coincidental per #78) | UX - Narrative |
| 55, 56 | Cargo over capacity from salvage — no cap enforcement or consequences | Bug - Cargo |
| 66, 100 | Unknown modifiers (Sensitive Sensors, Fuel Sipper) appear with no explanation | UX - Clarity |
| 68, 73 | Failed negotiation has no consequence — text promises combat but nothing happens | Bug - Encounters |
| 77 | Marcus Cole "heavier lien" message misleading — implies rate change but rates unchanged | UX - Narrative |
