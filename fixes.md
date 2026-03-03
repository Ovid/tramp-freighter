## Fixed

3. **No feedback when quest stage requirements not met:** Added `getUnmetRequirements()` to QuestManager and in-character Tanaka dialogue hints for engine, hull, debt, credits, and rep requirements.
5. **HUD cargo count doesn't update in real-time:** `sellGood()` was passing the same array reference to `updateCargo()`, so React skipped the re-render. Fixed by spreading to a new array.
7. **Retirement not hinted at anywhere in game UI:** Added hint to Captain's Briefing: "Clear your debt and the sector may have more to offer than you expect."
8. **Cole stays COLD even after debt fully paid:** No reputation bonus was granted on debt clearance. Added `REP_DEBT_CLEARED_BONUS` (+15) which moves Cole from COLD into WARM territory.
9. **Duplicate rumors from Info Broker:** Rumor seed was `rumor_{day}` — same seed on same day = same rumor. Added a `rumorsPurchased` counter to the seed.
10. **pre_tanaka narrative event fires again despite once:true flag:** Both `dock_barnards_pre_tanaka` and `tanaka_intro` had equal priority (HIGH). When player had enough systems, pre_tanaka won the tiebreaker. Gave `tanaka_intro` CRITICAL priority so it always wins when eligible.
11. **Mission rewards bypass Cole's 5% withholding:** Mission credit rewards now route through `applyTradeWithholding()`, matching trade sale behavior. UI shows Cole's cut breakdown.
12. **Smuggling vs legal trade reward gap is massive:** Reduced `CARGO_RUN_ILLEGAL_BASE_FEE` from 225 to 150 to narrow the gap.
13. **Distress call "Respond" is economically optimal:** Reduced `CREDITS_REWARD` from 500 to 150 for genuine risk/reward tradeoff.
