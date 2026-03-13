# Click-Outside Panel Dismissal Fix

Date: 2026-03-13

## Problem

The click-outside-to-dismiss feature (commit 932349b) has multiple bugs caused
by two root issues:

### Bug 1: Z-index layering

`#station-interface` has `z-index: 200` but `.station-backdrop` has
`z-index: 300` (var(--z-panel)). The backdrop sits on top of the dock menu,
intercepting every click. Buttons inside the dock never receive clicks — they
all fire `onUndock` via the backdrop instead.

### Bug 2: Full-screen backdrops block all other UI

The backdrop at z-index 300 covers the HUD (z-index 200). Clicking "System
Info" while docked hits the backdrop instead of the HUD button. Same issue
with Settings — its document mousedown listener fires when clicking any other
panel.

### Visible symptoms

- Clicking any button on the dock dismisses it (backdrop intercepts)
- Clicking "System Info" while docked closes the dock, doesn't open system info
- Settings panel closes when clicking any other panel or HUD element
- Can only have dock + system info open by opening system info first (before
  the backdrop exists)

## Design

### Approach: `useClickOutside` hook + flatten view state machine

Remove all backdrop elements. Replace with a shared `useClickOutside` hook
using document-level `mousedown` listeners. Flatten the STATION/PANEL view
modes so panels can coexist.

---

### 1. New `useClickOutside` hook

File: `src/hooks/useClickOutside.js`

```javascript
import { useEffect } from 'react';

export function useClickOutside(ref, onClose, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      // Click inside this panel — ignore
      if (ref.current?.contains(e.target)) return;

      // Click inside any other interactive zone — ignore
      if (e.target.closest('[data-panel]')) return;
      if (e.target.closest('#game-hud')) return;
      if (e.target.closest('#camera-controls')) return;
      if (e.target.closest('#dev-admin-btn')) return;
      if (e.target.closest('.modal-overlay')) return;

      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose, enabled]);
}
```

Key decisions:

- `mousedown` not `click` — matches CameraControls' existing pattern, more
  responsive
- `data-panel` attribute convention — panels protect each other from dismissal
- `enabled` parameter — allows CameraControls to only listen when expanded
- Protected zones: other panels, HUD, camera controls, dev admin button, modals

### 2. Flatten view state machine

Remove `VIEW_MODES.PANEL`. When docked, the player stays in STATION mode.
`activePanel` is independent state.

Before:

```
viewMode === STATION  ->  StationMenu only
viewMode === PANEL    ->  PanelContainer only (StationMenu hidden)
```

After:

```
viewMode === STATION                    ->  StationMenu always
viewMode === STATION && activePanel     ->  PanelContainer alongside StationMenu
```

Handler changes:

- `handleOpenPanel`: sets `activePanel` only, no viewMode change
- `handleClosePanel`: clears `activePanel`, stays in STATION
- `handleUndock`: sets viewMode to ORBIT, clears activePanel, clears
  viewingSystemId (closes everything)
- Starmap background click (via `useClickOutside`): calls `handleUndock`

### 3. Per-component changes

**StationMenu:**

- Remove `station-backdrop` div and `stopPropagation`
- Add `ref` + `data-panel` to `#station-interface`
- Use `useClickOutside(ref, onUndock)`

**PanelContainer:**

- Remove `panel-backdrop` div and `stopPropagation`
- Add `ref` + `data-panel` to wrapper div
- Two callbacks: `onClose` (X button, closes just this panel) and `onUndock`
  (starmap click, closes everything)
- Use `useClickOutside(ref, onUndock)`

**DevAdminPanel:**

- Remove `dev-admin-backdrop` div and `stopPropagation`
- Add `ref` + `data-panel`
- Use `useClickOutside(ref, onClose)`

**CameraControls:**

- Remove inline `useEffect` mousedown listener
- Add `data-panel` to `#camera-controls`
- Use `useClickOutside(controlsRef, () => setIsExpanded(false), isExpanded)`

### 4. CSS changes

- Remove `.station-backdrop`, `.panel-backdrop`, `.dev-admin-backdrop` rule
  from `css/base.css`
- Fix `#station-interface` z-index from 200 to `var(--z-panel)` (300)
- Add sticky close buttons: panel headers get `position: sticky; top: 0;
  z-index: 1` so X buttons stay visible when scrolling

### 5. Test updates

- `tests/unit/panel-click-outside.test.jsx` — rewrite for `useClickOutside`
  hook behavior (mousedown on starmap closes, mousedown on other panel doesn't)
- `tests/unit/settings-panel.test.jsx` — update CameraControls tests
- Any tests checking `viewMode === 'PANEL'` need updating
- New test: verify multiple panels can be open simultaneously

## Files to modify

- `src/hooks/useClickOutside.js` (new)
- `src/App.jsx` — remove VIEW_MODES.PANEL, flatten rendering logic
- `src/features/station/StationMenu.jsx` — remove backdrop, add hook
- `src/features/station/PanelContainer.jsx` — remove backdrop, add hook,
  add `onUndock` prop
- `src/features/dev-admin/DevAdminPanel.jsx` — remove backdrop, add hook
- `src/features/navigation/CameraControls.jsx` — replace inline listener
  with hook
- `css/base.css` — remove backdrop rules
- `css/hud.css` — fix station-interface z-index
- Panel CSS files — add sticky headers where needed
- `tests/unit/panel-click-outside.test.jsx` — rewrite
- `tests/unit/settings-panel.test.jsx` — update
