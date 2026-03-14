# Tanaka Quest Fixes Design

Date: 2026-03-13
Branch: ovid/tanaka

## Issues

### 1. Credits text discrepancy
Stage 5 dialogue hardcodes "twenty-five thousand" but `ENDGAME_CONFIG.VICTORY_CREDITS` is 15,000. Fix: interpolate the constant.

### 2. Dialogue spoiler — "rare materials"
Player response says "I can help you find those rare materials" before Tanaka mentions materials. Fix: change to "What do you need?"

### 3. Lore inconsistency — "No one has ever made the jump"
Yumi's colony ship Meridian reached Delta Pavonis, so this reads as false. Fix: clarify distinction between colony ship travel and a single drive jump.

New text: "Delta Pavonis. Nineteen point eight-nine light-years from Sol. No wormhole connection. The colony ships took years to crawl there. No one has ever made the jump in a single leap." Her eyes light up — the only sign of emotion you've seen from her. "The Range Extender makes it possible. One jump. One way."

### 4. Trust bar appears to decrease on stage transitions
Bar shows `currentRep / nextStageThreshold`. When stage advances, denominator jumps (30→50), making bar shrink even though rep increased. Fix: show absolute 0–100 bar with next milestone label inline.

Display format: "Trust: 43 / 100 (Next: Rare Materials at 50)"

### 5. Narrative event clicks close station menu
NarrativeEventPanel lacks `data-panel` attribute. `useClickOutside` on StationMenu treats clicks on narrative panel as "outside" clicks. Fix: add `data-panel` to NarrativeEventPanel root div.

## Files to Modify

- `src/game/data/dialogue/tanaka-dialogue.js` (issues 1, 2, 3)
- `src/features/dialogue/DialoguePanel.jsx` (issue 4)
- `src/game/game-dialogue.js` (issue 4)
- `src/features/narrative/NarrativeEventPanel.jsx` (issue 5)
