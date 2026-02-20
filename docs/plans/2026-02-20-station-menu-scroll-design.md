# Station Menu Scroll & Compact Design

## Problem

The station menu (dock panel) is a vertical stack of buttons that overflows the viewport on 720p screens. With 1 NPC, the content is ~830px tall -- exceeding 720px before accounting for OS chrome. Players can't reach buttons at the bottom.

## Target

Support 1280x720 as the minimum resolution with minimal or no scrolling needed for core actions (Trade, Refuel, Repairs).

## Approach: Compact Layout + Viewport-Capped Scroll

### CSS Changes

**`#station-interface`:**
- `max-height: calc(100vh - 40px)` -- never exceed viewport
- `overflow-y: auto` -- scroll when content overflows
- Styled scrollbar: 6px wide, `#00ff88` thumb, `rgba(0, 255, 136, 0.1)` track

**`.station-btn`, `.npc-btn`:**
- Height: 50px -> 40px
- `.npc-btn` padding-top adjusted for new height

**`.station-actions`, `.npc-list`:**
- Gap: 12px -> 8px

### JSX Change

Remove the "Undock" button from `StationMenu.jsx`. The `x` close button already calls `onUndock` -- they are redundant (both invoke the same callback).

### Test Updates

Update tests that assert on the Undock button or count station action buttons.

### Space Savings

- 9 buttons at 50px+12px -> 8 buttons at 40px+8px: saves ~234px
- At 720p, core actions (Trade/Refuel/Repairs) will be above the fold with 1 NPC
