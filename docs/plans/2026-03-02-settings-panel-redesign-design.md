# Settings Panel Redesign & Jump Warnings Preference

## Problem

The settings gear menu (CameraControls) is a bare vertical stack of floating buttons
with no container or header, inconsistent with the game's styled card/panel aesthetic.
Additionally, the Jump Warning dialog becomes repetitive for experienced players who
want to skip it.

## Design

### Settings Panel Layout

Restyle `CameraControls` from a bare button stack into a card-style panel:

- **Container**: Dark background panel with the game's characteristic border styling
  (matching HUD cards). Same position: bottom-left of the starmap.
- **Header**: Small "Settings" title at the top.
- **Flat list** of two item types:
  - **Toggle switches**: Row with label text on left, on/off toggle on right.
  - **Action buttons**: Compact clickable rows (not large standalone blocks).
- **Gear icon** still toggles the panel open/closed.
- Max-height with overflow scroll for future additions.

### Toggle Switch Items

Items converted from buttons to toggle switches:

| Label           | Behavior                                      | Default |
|-----------------|-----------------------------------------------|---------|
| Star Rotation   | Stars rotate (was "Toggle Rotation")          | On      |
| Boundary        | Boundary visible (was "Toggle Boundary")      | On      |
| Antimatter      | Inverted colors (was text-changing button)     | Off     |
| Jump Warnings   | Show danger warning before jumps (NEW)        | On      |

The "Toggle" prefix is dropped since the switch itself communicates toggle nature.

### Action Button Items

Remain as compact clickable rows:

- Zoom In
- Zoom Out
- Instructions
- Achievements
- GitHub

### Jump Warnings Preference

- **Storage**: In GameStateManager state, saved with the game via SaveLoadManager.
- **Default**: `jumpWarningsEnabled: true` in constants.js.
- **Behavior when off**: SystemPanel skips showing DangerWarningDialog entirely.
  Clicking "Jump to System" on a contested/dangerous system proceeds immediately.
- **No minimal feedback** when disabled. Player understands the consequences.
- **DangerWarningDialog unchanged** — it just never gets shown when preference is off.

## Files Modified

| File | Change |
|------|--------|
| `src/features/navigation/CameraControls.jsx` | Restyle into card panel, convert toggles to switch style, add Jump Warnings toggle |
| `css/hud.css` | New styles for card panel, toggle switches, compact action rows |
| `src/game/constants.js` | Default preferences with `jumpWarningsEnabled: true` |
| `src/game/state/managers/StateManager.js` | Add preferences to state, getter/setter |
| `src/game/state/game-state-manager.js` | Delegate preference methods |
| `src/game/state/managers/SaveLoadManager.js` | Include preferences in save/load |
| `src/features/navigation/SystemPanel.jsx` | Skip DangerWarningDialog when preference off |
| `tests/unit/settings-panel.test.jsx` | Update tests, add toggle and preference tests |

## Test Coverage

- Toggle switches render correct on/off state
- Jump Warnings toggle persists via save/load
- Jumping to dangerous system skips warning dialog when preference is off
- Jumping to dangerous system still shows warning when preference is on
