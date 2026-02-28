# Game Instructions Design

## Overview

Add a "Captain's Briefing" instructions modal that auto-shows when starting a new game and is accessible from the gear menu at any time during starmap view. Also swap the Quick Access button order so Dock is on the left.

## Content

### Tramp Freighter Blues — Captain's Briefing

**Your Goal**
You've spent years hauling cargo through the wormhole lanes of Sol Sector. Bad deals, rough encounters, and the relentless cost of keeping a ship running have taken their toll. You're tired. All you want is enough credits to retire somewhere quiet and never look at a cargo manifest again. Save up enough and you might just make it. But space doesn't make it easy — fuel costs money, hulls don't repair themselves, and not everyone out there has your best interests at heart. Stay sharp, trade smart, and survive long enough to earn your way out.

**Navigation**
The starmap shows 117 real star systems connected by wormhole lanes. To travel, click the **System Info** button in the Quick Access panel to view a system's details, wormhole connections, and the option to jump there. Every jump costs fuel and advances time.

**Stations**
When you're in a system with a station, click the **Dock** button in the Quick Access panel to go aboard. From there you can trade goods, refuel, and repair your ship. Each system has different prices — buy low, sell high. Keep an eye on your credits and cargo hold.

**The Stars**
The stars in this game are real systems within 20 light-years of Sol. Their colors and relative sizes are as accurate as we could make them, with a minimum size so the smallest remain visible. Most are red dwarfs — too dim to see with the naked eye. Until modern astronomy, we didn't even know they existed.

## Technical Design

### InstructionsModal Component

- New file: `src/features/instructions/InstructionsModal.jsx`
- Single scrollable modal using the existing `Modal` component from `src/components/`
- Static JSX content — no game state needed
- Props: `isOpen`, `onClose`

### Gear Menu Integration

- Add "Instructions" button to `CameraControls.jsx` in the `camera-controls-buttons` div
- CameraControls gains local state `showInstructions` to control modal visibility

### Auto-show on New Game

- In `App.jsx`, when view transitions from `SHIP_NAMING` to `ORBIT` (inside `handleShipNamed`), set a flag `showInstructions: true`
- InstructionsModal renders in App.jsx; dismissing clears the flag
- No new view mode — just a modal overlay on the ORBIT view

### No Persistence

- No tracking of whether player has seen instructions
- New game always shows them
- Loading a save does not

### Button Swap Fix

- In `QuickAccessButtons.jsx`, swap order of "System Info" and "Dock" buttons so Dock is on the left

### CSS

- New file: `css/panel/instructions.css`
- Styles for section headers and paragraph spacing
- Modal chrome comes from existing Modal component styles

## Scope

- `src/features/instructions/InstructionsModal.jsx` (new)
- `css/panel/instructions.css` (new)
- `src/features/navigation/CameraControls.jsx` (add Instructions button)
- `src/App.jsx` (auto-show logic on new game)
- `src/features/hud/QuickAccessButtons.jsx` (swap button order)
