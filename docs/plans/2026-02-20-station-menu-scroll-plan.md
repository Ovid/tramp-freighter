# Station Menu Scroll & Compact Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the station menu fit on 720p screens by compacting spacing, removing the redundant Undock button, and adding viewport-capped scrolling.

**Architecture:** CSS-only changes for spacing/scroll, one JSX deletion for the Undock button, test updates to match. No new components or state changes.

**Tech Stack:** CSS, React (JSX), Vitest

---

### Task 1: Update tests to remove Undock button expectations

**Files:**
- Modify: `tests/integration/quick-access-buttons.integration.test.jsx:126-132`
- Modify: `tests/property/app-view-modes.property.test.jsx:373-374`

**Step 1: Update quick-access-buttons test to use close button instead of Undock**

In `tests/integration/quick-access-buttons.integration.test.jsx`, replace the Undock button click (lines 126-132) with a close button (×) click:

```jsx
      // Undock via close button
      const closeBtn = screen.getAllByText('×')[0];
      fireEvent.click(closeBtn);

      // Station menu should close
      await waitFor(() => {
        expect(screen.queryByText('Trade')).not.toBeInTheDocument();
      });
```

Note: The assertion changes from checking `Undock` absence to checking `Trade` absence, since we're removing the Undock button entirely.

**Step 2: Update app-view-modes property test to use close button instead of Undock**

In `tests/property/app-view-modes.property.test.jsx`, replace lines 373-374:

```jsx
        // Transition back to ORBIT mode via close button
        const closeButtons = screen.getAllByText('×');
        const stationCloseBtn = closeButtons.find((btn) =>
          btn.closest('#station-interface')
        );
        fireEvent.click(stationCloseBtn);
```

**Step 3: Run tests to verify they fail**

Run: `npm test -- tests/integration/quick-access-buttons.integration.test.jsx tests/property/app-view-modes.property.test.jsx`

Expected: Tests should still pass at this point (both Undock and × trigger onUndock). This is a pre-refactor step -- we're updating tests first so they won't rely on the Undock button we're about to remove.

**Step 4: Commit**

```bash
git add tests/integration/quick-access-buttons.integration.test.jsx tests/property/app-view-modes.property.test.jsx
git commit -m "test: update station tests to use close button instead of Undock"
```

---

### Task 2: Remove Undock button from StationMenu

**Files:**
- Modify: `src/features/station/StationMenu.jsx:144-146`

**Step 1: Remove the Undock button JSX**

In `src/features/station/StationMenu.jsx`, delete lines 144-146:

```jsx
        <button className="station-btn" onClick={onUndock}>
          Undock
        </button>
```

Also update the component docstring (line 13) to remove "and Undock" from the description.

**Step 2: Run tests to verify everything passes**

Run: `npm test`

Expected: All tests pass. The tests we updated in Task 1 now use `×` instead of Undock, and no other tests should reference the Undock button text.

**Step 3: Commit**

```bash
git add src/features/station/StationMenu.jsx
git commit -m "feat: remove redundant Undock button from station menu"
```

---

### Task 3: Compact the station menu CSS

**Files:**
- Modify: `css/hud.css:433-447` (#station-interface)
- Modify: `css/hud.css:508-512` (.npc-list)
- Modify: `css/hud.css:514-530` (.npc-btn)
- Modify: `css/hud.css:592-596` (.station-actions)
- Modify: `css/hud.css:598-609` (.station-btn)

**Step 1: Add viewport cap and scrolling to `#station-interface`**

In `css/hud.css`, add to the `#station-interface` rule (after line 446):

```css
  max-height: calc(100vh - 40px);
  overflow-y: auto;
```

**Step 2: Add styled scrollbar rules**

Add after the `#station-interface` rule (after line 447):

```css
#station-interface::-webkit-scrollbar {
  width: 6px;
}

#station-interface::-webkit-scrollbar-track {
  background: rgba(0, 255, 136, 0.1);
  border-radius: 3px;
}

#station-interface::-webkit-scrollbar-thumb {
  background: #00ff88;
  border-radius: 3px;
}

#station-interface::-webkit-scrollbar-thumb:hover {
  background: #33ffaa;
}
```

**Step 3: Reduce `.npc-list` gap**

Change `.npc-list` gap from `12px` to `8px`.

**Step 4: Reduce `.npc-btn` height and padding**

Change `.npc-btn` height from `50px` to `40px` and padding-top from `14px` to `10px`.

**Step 5: Reduce `.station-actions` gap**

Change `.station-actions` gap from `12px` to `8px`.

**Step 6: Reduce `.station-btn` height**

Change `.station-btn` height from `50px` to `40px`.

**Step 7: Run tests to verify nothing broke**

Run: `npm test`

Expected: All tests pass (CSS changes don't affect JSDOM tests, but good to confirm).

**Step 8: Commit**

```bash
git add css/hud.css
git commit -m "feat: compact station menu layout with viewport-capped scroll"
```

---

### Task 4: Manual verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify at 1080p**

Open browser at default size. Dock at a station. Confirm all buttons visible, no unnecessary scrollbar.

**Step 3: Verify at 720p**

Resize browser to 1280x720. Dock at a station. Confirm:
- Station menu fits within viewport
- Core actions (Trade, Refuel, Repairs) visible without scrolling
- Scrollbar appears if needed, styled in green
- No Undock button present
- Close button (×) works to undock

**Step 4: Commit (if any visual fixes needed)**

Only if adjustments are required from manual testing.
