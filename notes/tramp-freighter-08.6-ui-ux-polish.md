# Tramp Freighter Blues - Spec 08.6: UI/UX Polish

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete

---

## Overview

Visual and interaction polish pass across the entire UI. Improve consistency, add quality-of-life features, and make the game feel more responsive and informative.

## Goals

- Refine HUD with animations and color coding
- Enhance starmap with transitions and filters
- Unify modal styling
- Add quick actions and keyboard shortcuts
- Improve information display (profit tracker, route planner, price history)
- Add save management features

## Out of Scope

- Accessibility features (see 08.7)
- Performance optimization (see 08.7)

---

## Visual Improvements

### HUD Refinement

- Smooth animations for stat changes
- Color coding (green = good, yellow = warning, red = critical)
- Tooltips on hover
- Collapsible sections

### Starmap Enhancements

- Smooth camera transitions
- Highlight current location more clearly
- Show jump path preview
- Distance ruler tool
- Filter options (by distance, danger, visited)

### Modal Consistency

- Unified styling across all modals
- Consistent button placement
- Keyboard shortcuts (ESC to close, Enter to confirm)
- Smooth fade in/out

---

## Quality of Life

### Quick Actions

- Keyboard shortcuts for common actions
- "Quick Trade" mode (auto-sell/buy optimal goods)
- "Auto-repair" button (repair all to 100%)
- "Fast travel" option (skip jump animation after first time)

### Information Display

- Cargo value calculator
- Profit/loss tracker per session
- Route planner (show multi-jump routes)
- Price history graphs

### Save Management

- Multiple save slots (3)
- Auto-save indicator
- Manual save button
- Save file export/import

---

## Implementation Notes

- Animations should respect reduced-motion preferences (see 08.7)
- Keyboard shortcuts documented in a help modal
- Price history requires storing snapshots in game state (limit retention per 08.7 performance concerns)
- Save slots use separate localStorage keys

## Success Criteria

- [ ] HUD stat changes animate smoothly
- [ ] Color coding applied consistently across UI
- [ ] Starmap camera transitions are smooth
- [ ] All modals share consistent styling
- [ ] ESC closes any open modal
- [ ] At least 5 keyboard shortcuts for common actions
- [ ] Profit/loss visible per trading session
- [ ] Save management supports multiple slots
