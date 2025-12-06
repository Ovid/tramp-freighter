# Navigation UX Improvements

## Problem
With 117 star systems and a rotating 3D map, it was difficult for players to:
- Identify which systems they could jump to
- Click on the correct star
- Understand navigation options

## Solutions Implemented

### 1. Connected Systems Highlighting
When you select a star system, all connected systems are now:
- **Highlighted in bright cyan** (0x00FFFF)
- **Enlarged by 50%** for better visibility
- Automatically cleared when deselecting

### 2. Auto-Pause Rotation
- Map rotation automatically pauses when you select a star
- Prevents the map from spinning while you're trying to navigate
- Can be manually toggled back on if desired

### 3. Connected Systems List
When viewing your current system, a new panel shows:
- **Clickable list** of all connected systems
- **Sorted by distance** (closest first)
- **Color-coded** by fuel availability:
  - Cyan border: Sufficient fuel
  - Red border: Insufficient fuel
- **Quick info**: Distance, fuel cost, and jump time
- **Click to select** that system directly

### 4. Larger Star Sprites
- Increased star size from 20 to 30 units
- Increased selection ring from 30 to 40 units
- Makes stars easier to click in the 3D space

## How to Use

### From Your Current System:
1. Click on your current system (marked with pulsing green ring)
2. View the "Connected Systems" list in the right panel
3. Click any system in the list to select it
4. Click "Jump to System" to execute the jump

### From Any Other System:
1. Click on any star to see if you can jump there
2. Connected systems will be highlighted in cyan
3. View jump info (distance, fuel cost, time)
4. Click "Jump to System" if available

## Visual Feedback

- **Green ring**: Your current location
- **Yellow targeting reticle**: Selected system
- **Cyan highlighted stars**: Systems you can jump to from selected system
- **Green connections**: Sufficient fuel for jump
- **Red connections**: Insufficient fuel for jump

## Technical Details

### Files Modified:
- `js/starmap.js`: Added highlight functions and connected systems list
- `starmap.html`: Added connected systems panel to HUD
- `css/starmap.css`: Added styling for connected systems list
- `js/game-constants.js`: Increased star sizes for better clickability

### New Functions:
- `highlightConnectedSystems(systemId)`: Highlights all connected stars
- `clearHighlightedSystems()`: Removes all highlights
- `updateConnectedSystemsList(systemId, fuel)`: Populates the clickable list

All 141 tests continue to pass.
