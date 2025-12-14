# Dev Admin Panel

## Overview

A development-only admin panel for testing game features without playing through the full game loop. The panel only appears when a `.dev` file exists in the project root and is automatically hidden in production.

## Features

### Player Resources

- **Credits**: Set any credit amount for testing purchases (useful for testing upgrades like Advanced Sensors)
- **Debt**: Adjust debt level for testing debt mechanics

### Ship Status

- **Fuel**: Set fuel percentage (0-100%)
- **Repair All**: Instantly repair all ship systems to 100%
- **Clear Cargo**: Remove all cargo (both regular and hidden)

## Testing Advanced Sensors

The Advanced Sensors upgrade (₡3,500) allows you to see economic events in systems before jumping there:

1. Use dev admin to set credits to 3500+
2. Dock at any station and go to Upgrades
3. Purchase "Advanced Sensor Array"
4. Open the system info panel for any system (click on a star)
5. If that system has an active economic event, you'll see a blue info box showing:
   - Event name (e.g., "Mining Boom", "Agricultural Crisis")
   - Event description explaining the price effects

Without Advanced Sensors, you only see events when you dock at a station in that system.

## Implementation

### Files Created

- `js/controllers/dev-admin.js` - Controller for dev admin panel
- `css/panel/dev-admin.css` - Styling for dev admin panel
- `tests/unit/dev-admin-panel.unit.test.js` - Unit tests
- `.dev` - Marker file to enable dev mode (gitignored)

### Files Modified

- `js/game-constants.js` - Added `DEV_MODE` flag and `initDevMode()` function
- `js/game-state.js` - Added `setCredits()`, `setDebt()`, `setFuel()` helper methods
- `js/game-ui.js` - Integrated dev admin controller
- `js/views/starmap.js` - Calls `initDevMode()` on startup
- `starmap.html` - Added dev admin button and panel HTML
- `.gitignore` - Added `.dev` to prevent committing

## Usage

1. Ensure the `.dev` file exists in your project root (it should already be there)
2. Open the game in your browser
3. Look for the red gear button (⚙) in the lower right corner
4. Click to open the dev admin panel
5. Modify values and click "Set" buttons
6. Changes take effect immediately

## Production Deployment

The dev admin panel is automatically hidden in production:

- `DEV_MODE` is determined by checking for the `.dev` file via fetch
- The `.dev` file is in `.gitignore` so it won't be deployed
- Button has `display: none` by default
- Only shown when `.dev` file exists
- No need to remove code for deployment - just don't include the `.dev` file

## How It Works

1. On page load, `initDevMode()` attempts to fetch `.dev` file
2. If the file exists (200 OK), `DEV_MODE` is set to `true`
3. If the file doesn't exist (404), `DEV_MODE` remains `false`
4. UIManager checks `DEV_MODE` and shows/hides the button accordingly

This approach is more reliable than hostname checks because:

- Works with any local development setup (file://, localhost, 127.0.0.1, custom domains)
- Explicit opt-in via file presence
- Impossible to accidentally enable in production (file is gitignored)
- Simple to enable/disable (create/delete the `.dev` file)

## Architecture

Follows the controller pattern established in the codebase:

- Dedicated controller class (`DevAdminPanelController`)
- Dependency injection (elements, gameStateManager)
- Event-driven updates
- Fail-fast validation
- Comprehensive unit tests
