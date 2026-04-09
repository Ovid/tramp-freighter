# Mobile Responsive Design

**Date:** 2026-04-09
**Status:** Draft
**Target:** Make the game playable on mobile (375px+ width) while keeping desktop pixel-identical

## Problem

The game is unplayable on mobile phones:
- HUD is hardcoded at 300px wide (~80% of a phone screen)
- Station interface is hardcoded at 400px wide (overflows)
- Modals have a 400px min-width (overflows)
- Panels use `position: absolute` with center-transform and overlap each other
- No touch target sizing considerations

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Minimum screen width | 375px | Covers iPhone SE and up, vast majority of phones |
| HUD on mobile | Collapsed summary bar, tap to expand | Keeps critical info visible without eating viewport |
| Panels/modals on mobile | Full-screen overlay, one at a time | Simplest approach; game flow is mostly linear |
| Starmap controls | Floating bottom toolbar | Touch gestures for zoom/rotate, toolbar for Find/toggles |
| Station menu | Full-screen | Station is a distinct mode; full screen gives room for buttons |
| Detection method | CSS media queries + `useMobileLayout()` hook | Need both visual and behavioral changes |
| Desktop impact | Light refactoring (CSS variable extraction) | Never modify rendered output; variable defaults match current values |

## Section 0: Title Screen

The title screen (`.menu-content`) has `min-width: 400px`, `padding: 40px`, and a 36px uppercase title with 2px letter-spacing. All of this overflows on a 375px phone — players can't even start the game.

### Mobile Treatment

- Remove `min-width` on mobile (`min-width: 0` or `min-width: auto`)
- Reduce `.menu-content` padding from 40px to 20px
- Scale `.menu-title` font-size down (~24px) and reduce letter-spacing
- Menu buttons (60px tall) are fine for touch targets — keep them
- `.menu-subtitle` and `.menu-footer` get minor font/spacing reductions

Applied via mobile media query targeting `.menu-content`, `.menu-title`, etc. Desktop unchanged.

## Section 1: Detection & Layout Foundation

### Z-Index Scale

Define a mobile stacking order in `variables.css` to prevent layering bugs between overlapping mobile elements:

| Layer | Variable | Value | Elements |
|-------|----------|-------|----------|
| Starmap | (base) | 0 | Three.js canvas |
| Camera toolbar | `--z-camera-toolbar` | 10 | Floating bottom toolbar |
| Collapsed HUD | `--z-hud-collapsed` | 20 | Top summary bar |
| Full-screen panels | `--z-panel-fullscreen` | 30 | Trade, cargo, station panels, SystemPanel, NarrativeEventPanel |
| Expanded HUD + backdrop | `--z-hud-expanded` | 40 | HUD overlay and semi-transparent backdrop |
| Modals | `--z-modal` | 50 | Modal dialogs |

Audit existing z-index values across CSS files during this step to ensure they align with the scale.

### Safe Area Insets

Add `viewport-fit=cover` to the meta viewport tag in `index.html`. Define safe area padding in the mobile override block in `variables.css`:

```css
@media (max-width: 600px) {
  :root {
    --safe-top: env(safe-area-inset-top);
    --safe-bottom: env(safe-area-inset-bottom);
  }
}
```

Apply `var(--safe-top)` as top padding to the collapsed HUD bar and full-screen panels. Apply `var(--safe-bottom)` as bottom padding to the camera toolbar and any bottom-anchored elements (e.g., Undock button in station menu).

### `useMobileLayout()` Hook

New hook: `src/hooks/useMobileLayout.js`

Listens to `window.matchMedia('(max-width: 600px)')` using the change event listener (no resize polling). Returns `{ isMobile: boolean }`. Matches the existing `--breakpoint-mobile` variable.

Called once in `App.jsx`, provided via a new `MobileContext` in `src/context/MobileContext.jsx`. Components that need structural changes read from context.

### `.centered-panel` Shared Class

Extract the shared center-positioning pattern used by both `.panel-base` and `#narrative-event-panel` into a new `.centered-panel` utility class:

```css
.centered-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@media (max-width: 600px) {
  .centered-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    transform: none;
    border-radius: 0;
  }
}
```

`.panel-base` and `NarrativeEventPanel` both adopt `.centered-panel` for positioning, keeping their own visibility/display logic separate. This avoids duplicating mobile overrides and makes future panel additions consistent.

### CSS Variable Extraction

Replace hardcoded widths with variables that default to current values:

| Selector | Current | Variable | Mobile Override |
|----------|---------|----------|-----------------|
| `#game-hud` | `width: 300px` | `var(--hud-width, 300px)` | `100%` |
| Station interface | `width: 400px` | `var(--station-width, 400px)` | `100%` |
| Modal dialog | `min-width: 400px` | `var(--modal-min-width, 400px)` | `0` |
| Modal dialog | `max-width: 500px` | `var(--modal-max-width, 500px)` | `100%` |

Mobile overrides in a single block in `variables.css`:

```css
@media (max-width: 600px) {
  :root {
    --hud-width: 100%;
    --station-width: 100%;
    --modal-min-width: 0;
    --modal-max-width: 100%;
  }
}
```

Desktop is identical because the defaults match current values.

## Section 2: Full-Screen Panels & Modals

### Panel Takeover

On mobile, all panels render as full-viewport overlays:

- `position: fixed; top: 0; left: 0; width: 100%; height: 100%`
- Solid background (no semi-transparent backdrop — distracting on small screens)
- Content area scrolls with `overflow-y: auto`
- Consistent close/back button in top-right (x icon, 44px touch target)

`.panel-base` inherits full-screen mobile positioning from `.centered-panel` (Section 1). Additional mobile treatment on `.panel-base`: solid background color, `overflow-y: auto` on content area, safe area top padding via `var(--safe-top)`.

### One Panel at a Time

`PanelContainer.jsx` already conditionally renders the active panel. Full-screen rendering naturally enforces one-at-a-time. No architectural change needed.

### SystemPanel Conflict

`SystemPanel` can render simultaneously with `StationMenu` (it's independent of view mode). On mobile, both would try to go full-screen. **Resolution:** On mobile, auto-clear `viewingSystemId` when entering `STATION` view mode. The station header already shows system info. This also improves desktop UX where the overlap isn't ideal either.

### Modals

Modals already use a portal with a fixed overlay. Mobile additions:
- Dialog: `width: 100%; min-width: 0; max-width: 100%` (via variable overrides)
- Padding reduces from 30px to 16px
- Buttons stack vertically, full width, 44px minimum height for touch targets

### Encounter Panels

Encounter panels (combat, inspection, negotiation, distress, mechanical failure) have existing tablet/mobile media queries, but these use **inconsistent hardcoded breakpoints** (600px, 768px, 800px, 900px, 1000px) instead of CSS variables. As part of this step, normalize all encounter panel breakpoints to the canonical values `600px` and `900px` (matching `--breakpoint-mobile` and `--breakpoint-tablet` — CSS variables can't be used in `@media` conditions, so hardcoded values with a comment referencing the variables is the standard). Then add `position: fixed` with full viewport on mobile. Existing responsive button layouts (column stacking) remain.

### NarrativeEventPanel

`NarrativeEventPanel` uses its own `#narrative-event-panel` positioning rules (absolute, center-transform, `var(--panel-width-large)`) — it does NOT use `.panel-base`. Both components reimplement the same center-positioning pattern. Resolution: both adopt the new `.centered-panel` shared class (defined in Section 1). NarrativeEventPanel keeps its own visibility logic (React conditional rendering) separate from `.panel-base`'s `.visible` class toggling.

## Section 3: Collapsed HUD

### Desktop (Unchanged)

300px panel, top-left, all resource bars visible. No changes.

### Mobile: Collapsed State (Default)

Horizontal summary bar across the top, ~48px tall, full width:
- **Ship name** (left-aligned)
- **Credits** (center)
- **Worst resource indicator** — icon + label + percentage for the lowest resource (fuel/hull/engine/life-support), colored by severity using existing warning thresholds from `constants.js` (green = OK, yellow = warning, red = critical). If multiple resources are below the red threshold, show up to 2

Tap anywhere on the bar to expand.

### Mobile: Expanded State

Full HUD content slides down as an overlay (z-index above starmap, below modals/panels). Same information as desktop — all four resource bars, debt, date, location. Reuses existing HUD child components (`ResourceBar`, `DateDisplay`, `ShipStatus`, etc.).

Collapse triggers:
- Tap the summary bar again
- Tap a semi-transparent backdrop behind the expanded HUD (prevents the tap from reaching the starmap — consistent with modal behavior)
- Any panel opens full-screen (auto-collapse)

The backdrop prevents accidental star selections or camera rotations while the HUD is expanded.

### Implementation

`HUD.jsx` checks `isMobile` from `MobileContext`. If mobile, renders `<MobileHUD>` which manages its own `expanded` boolean state. The collapsed bar is a new component; expanded view wraps existing HUD children in an overlay container.

## Section 4: Full-Screen Station Menu

### Mobile Station View

When docked, the station menu takes the full screen (starmap still mounted, just behind):
- Station name at the top
- Vertical list of full-width action buttons (48px tall, good spacing)
- News/narrative text scrollable below buttons
- Undock button prominently placed at the bottom

Tapping an action opens the corresponding panel full-screen. Back button in the panel returns to the station menu.

### State Machine

The existing view mode state machine (`ORBIT <-> STATION <-> PANEL`) maps directly. No changes to the state machine — just how each state renders on mobile.

### Implementation

`StationMenu.jsx` checks `isMobile` and applies a mobile-specific CSS class that takes it full-screen. The component structure stays the same; the layout changes via CSS.

## Section 5: Starmap Camera Toolbar

### Touch Interaction

Three.js `OrbitControls` already supports touch (drag to rotate, pinch to zoom). No canvas changes needed. May need to increase raycasting threshold on mobile for easier star selection with fingers.

### Floating Toolbar (Mobile Only)

Replaces the current bottom-left camera controls panel. Compact horizontal bar anchored to bottom center:

- Button row: `[−]` `[+]` `[Find]` `[⚙]`
- Gear icon opens a popover for toggles (Antimatter, Jump Warnings, Star Rotation, Boundary)
- Find Star uses native `<select>` — mobile browsers render these as full-screen pickers (iOS wheel, Android scrollable list), providing a good UX with zero custom implementation
- All buttons 44x44px minimum touch targets
- Semi-transparent background
- Respects safe area via `var(--safe-bottom)` (defined in Section 1)

### Desktop (Unchanged)

Camera controls panel stays exactly as-is.

### Implementation

`CameraControls.jsx` checks `isMobile` and renders either the existing desktop panel or a new `MobileCameraToolbar` component.

## Section 6: Implementation Strategy

### What We're NOT Doing

- No touch gesture library (no swipe-to-navigate, no pull-to-refresh)
- No mobile-specific game mechanics or simplified UI
- No separate mobile route or app shell
- No changes to core game mechanics, trading logic, or the Bridge Pattern. Minor state management additions (mobile-conditional `viewingSystemId` clearing) are scoped to UI coordination, not gameplay
- No PWA/offline features

### Implementation Order

1. **Foundation** — `useMobileLayout()` hook, `MobileContext`, CSS variable extraction, z-index scale, safe area insets, `.centered-panel` shared class
2. **Title Screen** — Mobile-responsive title screen (players need to start the game first)
3. **Panels & Modals** — Full-screen mobile treatment including NarrativeEventPanel via `.centered-panel` (biggest impact — fixes overlapping panels). Normalize encounter panel breakpoints to canonical 600px/900px values. Auto-clear SystemPanel when entering station on mobile.
4. **HUD** — Collapsed/expanded mobile HUD with backdrop
5. **Station Menu** — Full-screen station menu. PostCreditsStation shares `#station-interface` so CSS changes cascade — visually verify PostCreditsStation on mobile after StationMenu styling is complete and fix any layout differences
6. **Camera Toolbar** — Floating toolbar for starmap controls
7. **Polish** — Touch target sizing, raycasting threshold tuning, edge cases

Each step is independently shippable and testable. Step 2 alone makes the game usable on mobile.

### Testing Approach

**Automated tests (TDD):**
- `useMobileLayout()` hook: matchMedia listener behavior, returns correct `isMobile` value
- `MobileContext`: propagates `isMobile` to consuming components
- Auto-clear `viewingSystemId` on mobile station entry (this IS a game logic change)
- Conditional rendering branches: mobile vs desktop component selection in HUD, CameraControls, StationMenu

**Manual testing:**
- Chrome DevTools device emulation (375px iPhone SE) for development
- Visual comparison: desktop side-by-side to confirm pixel-identical after each step
- Manual testing on real phone for touch interactions and starmap usability
- Existing unit/integration tests pass unchanged

### File Impact

**New files (~4):**
- `src/hooks/useMobileLayout.js`
- `src/context/MobileContext.jsx`
- `src/features/hud/MobileHUD.jsx`
- `src/features/navigation/MobileCameraToolbar.jsx`

**Modified files (~12):**
- `src/App.jsx` — wrap with `MobileContext` provider, auto-clear `viewingSystemId` on mobile station entry
- `src/features/hud/HUD.jsx` — conditional mobile/desktop rendering
- `src/features/station/StationMenu.jsx` — mobile full-screen class
- `src/features/station/PanelContainer.jsx` — potential mobile adjustments
- `src/features/narrative/NarrativeEventPanel.jsx` — adopt `.centered-panel` class
- `src/features/navigation/CameraControls.jsx` — conditional mobile/desktop rendering
- `src/features/navigation/JumpDialog.jsx` — full-screen on mobile
- `src/features/navigation/SystemPanel.jsx` — full-screen on mobile
- `css/variables.css` — CSS variable extraction, mobile overrides, z-index scale, safe area variables, `.centered-panel` class
- `css/hud.css` — variable usage + mobile styles + title screen responsive styles
- `css/modals.css` — variable usage + mobile styles
- `css/panel/narrative-event.css` — adopt `.centered-panel`, remove duplicate positioning
- `css/panel/*.css` (encounter panels) — normalize breakpoints to CSS variables
- `index.html` — add `viewport-fit=cover` to meta viewport
