# The Dirty Dozon

Issues identified during UAT new-player playthrough (Day 1-70). Excludes the
three design-level issues being addressed separately (fine mechanics when broke,
restricted goods transparency, earning rate balance).

## Bugs

### 1. Marcus Cole "Grace period's over" repeats every jump

The interest-trigger message fires on every jump after the first interest cycle
instead of once. Observed at Day 30, 35, 40, and 50+. Debt is only charged once
per 30-day cycle (correct), but the threatening message replays each jump.

UAT notes: 68, 70, 84, 99

### 2. HUD cargo count stale while trade panel is open

Selling cargo updates the Trade panel correctly but the HUD overlay still shows
the pre-sale cargo count. Refreshes when the panel is closed. Buying cargo
updates the HUD immediately (inconsistency). Reproduced 3 times.

UAT notes: 32 (identified), 89, 104, 111

### 3. Mission Board accept silently fails at full cargo

The Accept button stays bright green and clickable when cargo is full, but
clicking it does nothing. No error message, no disabled state, no tooltip.
Compare to Trade panel which correctly greys out Buy buttons with a red
"Insufficient cargo capacity" message. Same treatment needed here.

UAT note: 47

### 4. Cargo math off by 1 after pirate tribute

Pirates demanded 20% of 50 cargo. Expected 40 remaining, got 41. After mission
delivery of 8 units, expected 33, got 34. Likely a rounding issue in the tribute
calculation.

UAT note: 45

### 5. NPC dialogue responses lost in transition

Two instances of NPC dialogue branches where the response text wasn't visible:
- Tau Ceti dockworker: chose "Interesting. Where would I hear more?" but the
  follow-up response was lost in the transition to station menu (Note 30).
- Captain Vasquez at Epsilon Eridani: chose "routes to avoid?" but conversation
  reset to opening without showing the answer (Note 44).

May be the same underlying issue: dialogue transitions happening too quickly or
the response not being displayed before the next UI state takes over.

UAT notes: 30, 44

### 6. Confiscation not shown in encounter outcome

When cooperating with customs while carrying restricted goods, the outcome
screen shows "Credits -1,000, Authorities -5" but does NOT mention that cargo
was confiscated. The pre-choice description also omits confiscation. Player only
discovers cargo is gone by checking the manifest afterward.

Both the pre-choice text and the outcome text need to explicitly state that
restricted goods will be / were seized.

Related to the restricted goods design work but the missing UI text is a
standalone bug.

UAT note: 60

## UX Improvements

### 7. No Sell 10 button

Buy side has Buy 1 / Buy 10 / Buy Max. Sell side has only Sell 1 / Sell All.
Selling a specific partial amount (e.g., 20 of 50 ore) requires clicking Sell 1
twenty times. Add Sell 10 for consistency.

UAT note: 50

### 8. Abandon mission gives no feedback

The abandon confirmation dialog warns about "penalties" but after confirming,
no feedback is shown about what happened. No notification of penalty applied (or
not applied). Player is left guessing. Should show a result message: either
"Mission failed. No penalty." or "Mission failed. -X reputation" etc.

UAT note: 39

### 9. Station menu button highlighting is unexplained

Various station menu buttons highlight in green or cyan across visits with no
apparent pattern or explanation. Sometimes Refuel is highlighted (makes sense
at 63% fuel), sometimes Upgrades, sometimes Info Broker. No tooltip or legend
explains the highlighting. Could confuse new players who think it's a
recommendation or required action.

UAT notes: 8, 13, 33, 97

### 10. Ship quirks missing from Captain's Briefing

Ship quirks (Smooth Talker's Ride, Fuel Sipper) are passive bonuses that affect
gameplay but are never mentioned in the Captain's Briefing or tutorial flow. The
pirate encounter labels them "Active Modifiers" while Ship Status calls them
"Ship Quirks" -- terminology inconsistency adds confusion.

Briefing should mention: "Your ship has some quirks from its previous owner --
check Ship Status to see what you're working with."

UAT notes: 46, 75

### 11. Silent reputation changes

Faction reputation changes from trading, missions, and pirate encounters happen
without notification. Player only sees rep values in encounter outcome screens.
Between encounters, rep changes are invisible. Example: Outlaws went from 0 to
9 with no visible explanation.

A notification like "+2 Traders (successful trade)" or "+3 Outlaws (pirate
tribute)" would help players understand the faction system.

UAT note: 48

### 12. Duplicate rumors from Info Broker

Buying a second rumor for 25 credits returned the exact same text as the first.
Either there should be multiple distinct rumors available, or buying a second
should be blocked ("No new rumors available").

UAT note: 12

### 13. Rumor text is ambiguous about buy vs sell

"Word on the street is that parts prices are pretty good at Sol right now."
Does "pretty good" mean good for buying (cheap) or good for selling (high)?
The UAT player guessed wrong. Rumors should clearly indicate direction:
"parts are cheap at Sol" or "parts fetch a premium at Sol."

UAT note: 12

### 14. 3D starmap navigation is extremely difficult

Stars overlap visually and clicking the correct one requires pixel-hunting.
Multiple stars cluster in the same visual region. The UAT player resorted to
JavaScript console commands to select stars. Key suggestions from UAT:

- Text search/filter for star names
- Make wormhole destinations in System Info panel clickable
- Highlight mission destination stars on the map
- Show route planning for multi-hop missions

This is the single biggest UX pain point identified in the playthrough.

UAT notes: 58, 64, 67

## Summary

| # | Type | Severity | Issue |
|---|------|----------|-------|
| 1 | Bug | Low | Cole message repeats |
| 2 | Bug | Medium | HUD cargo stale |
| 3 | Bug | Medium | Mission accept silent fail |
| 4 | Bug | Low | Cargo math off by 1 |
| 5 | Bug | Medium | NPC dialogue responses lost |
| 6 | Bug | High | Confiscation not shown |
| 7 | UX | Low | No Sell 10 button |
| 8 | UX | Medium | Abandon mission no feedback |
| 9 | UX | Low | Button highlighting unexplained |
| 10 | UX | Medium | Ship quirks not in briefing |
| 11 | UX | Medium | Silent reputation changes |
| 12 | UX | Low | Duplicate rumors |
| 13 | UX | Medium | Ambiguous rumor text |
| 14 | UX | High | 3D starmap navigation |
