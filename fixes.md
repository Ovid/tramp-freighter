3. **No feedback when quest stage requirements not met:** If a player reaches stage 5 but doesn't have enough credits/rep, the dialogue option simply doesn't appear with no hint as to why.
7. **Retirement not hinted at anywhere in game UI:** The Captain's Briefing, Achievements, and Finance panel never mention retirement. Players don't know it exists until they pay off debt and Cole mentions Tanaka.
11. **Mission rewards bypass Cole's 5% withholding:** Confirmed across all mission types. Mission-focused players avoid debt tax entirely.
12. **Smuggling vs legal trade reward gap is massive:** ~7x more per cargo unit for smuggling. Legal trade feels uncompetitive.
13. **Distress call "Respond" is economically optimal:** ₡500 reward far exceeds fuel cost (~₡45). Heroic path should cost more or reward less to make it a real tradeoff.

## Fixed

5. **HUD cargo count doesn't update in real-time:** `sellGood()` was passing the same array reference to `updateCargo()`, so React skipped the re-render. Fixed by spreading to a new array.
8. **Cole stays COLD even after debt fully paid:** No reputation bonus was granted on debt clearance. Added `REP_DEBT_CLEARED_BONUS` (+15) which moves Cole from COLD into WARM territory.
9. **Duplicate rumors from Info Broker:** Rumor seed was `rumor_{day}` — same seed on same day = same rumor. Added a `rumorsPurchased` counter to the seed.
10. **pre_tanaka narrative event fires again despite once:true flag:** Both `dock_barnards_pre_tanaka` and `tanaka_intro` had equal priority (HIGH). When player had enough systems, pre_tanaka won the tiebreaker. Gave `tanaka_intro` CRITICAL priority so it always wins when eligible.
