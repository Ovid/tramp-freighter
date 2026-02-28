# Game Instructions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Captain's Briefing" instructions modal that auto-shows on new game and is accessible from the gear menu.

**Architecture:** Single InstructionsModal component using existing Modal. Gear menu gets an "Instructions" button. App.jsx manages auto-show state on new game. Also swap Quick Access button order (Dock left, System Info right).

**Tech Stack:** React, existing Modal component, CSS

**Design doc:** `docs/plans/2026-02-28-game-instructions-design.md`

---

### Task 1: Swap Quick Access Button Order

**Files:**
- Modify: `src/features/hud/QuickAccessButtons.jsx:91-106`
- Modify: `tests/unit/quick-access-buttons-component.unit.test.jsx`

**Step 1: Update the test to expect Dock before System Info**

In `tests/unit/quick-access-buttons-component.unit.test.jsx`, add a new test:

```jsx
it('should render Dock button before System Info button', () => {
  render(
    <GameProvider gameStateManager={gameStateManager}>
      <QuickAccessButtons onDock={() => {}} onSystemInfo={() => {}} />
    </GameProvider>
  );

  const buttons = screen.getAllByRole('button');
  expect(buttons[0].textContent).toBe('Dock');
  expect(buttons[1].textContent).toBe('System Info');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/quick-access-buttons-component.unit.test.jsx`
Expected: FAIL — Dock is currently second, not first.

**Step 3: Swap the button order in QuickAccessButtons.jsx**

In `src/features/hud/QuickAccessButtons.jsx`, swap the two `<button>` elements in the `hud-quick-access-buttons` div so the Dock button comes first:

```jsx
<div className="hud-quick-access-buttons">
  <button
    className="quick-access-btn"
    onClick={handleDock}
    disabled={!canDock || isAnimationRunning}
  >
    Dock
  </button>
  <button
    className="quick-access-btn"
    onClick={handleSystemInfo}
    disabled={false}
  >
    System Info
  </button>
</div>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/quick-access-buttons-component.unit.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass (some other tests may reference button order — check and fix if needed).

**Step 6: Commit**

```bash
git add src/features/hud/QuickAccessButtons.jsx tests/unit/quick-access-buttons-component.unit.test.jsx
git commit -m "fix: swap Quick Access button order (Dock first, System Info second)"
```

---

### Task 2: Create InstructionsModal Component

**Files:**
- Create: `src/features/instructions/InstructionsModal.jsx`
- Create: `tests/unit/instructions-modal.test.jsx`

**Step 1: Write the test file**

Create `tests/unit/instructions-modal.test.jsx`:

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InstructionsModal } from '../../src/features/instructions/InstructionsModal.jsx';

describe('InstructionsModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    render(<InstructionsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText("Captain's Briefing")).not.toBeInTheDocument();
  });

  it('should render all sections when isOpen is true', () => {
    render(<InstructionsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Captain's Briefing")).toBeInTheDocument();
    expect(screen.getByText('Your Goal')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Stations')).toBeInTheDocument();
    expect(screen.getByText('The Stars')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<InstructionsModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/instructions-modal.test.jsx`
Expected: FAIL — module not found.

**Step 3: Create the InstructionsModal component**

Create `src/features/instructions/InstructionsModal.jsx`:

```jsx
import { Modal } from '../../components/Modal';

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Captain's Briefing">
      <div className="instructions-content">
        <section className="instructions-section">
          <h3>Your Goal</h3>
          <p>
            You've spent years hauling cargo through the wormhole lanes of Sol
            Sector. Bad deals, rough encounters, and the relentless cost of
            keeping a ship running have taken their toll. You're tired. All you
            want is enough credits to retire somewhere quiet and never look at a
            cargo manifest again.
          </p>
          <p>
            Save up enough and you might just make it. But space doesn't make it
            easy — fuel costs money, hulls don't repair themselves, and not
            everyone out there has your best interests at heart. Stay sharp,
            trade smart, and survive long enough to earn your way out.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Navigation</h3>
          <p>
            The starmap shows 117 real star systems connected by wormhole lanes.
            To travel, click the <strong>System Info</strong> button in the Quick
            Access panel to view a system's details, wormhole connections, and
            the option to jump there. Every jump costs fuel and advances time.
          </p>
        </section>

        <section className="instructions-section">
          <h3>Stations</h3>
          <p>
            When you're in a system with a station, click the{' '}
            <strong>Dock</strong> button in the Quick Access panel to go aboard.
            From there you can trade goods, refuel, and repair your ship. Each
            system has different prices — buy low, sell high. Keep an eye on your
            credits and cargo hold.
          </p>
        </section>

        <section className="instructions-section">
          <h3>The Stars</h3>
          <p>
            The stars in this game are real systems within 20 light-years of Sol.
            Their colors and relative sizes are as accurate as we could make
            them, with a minimum size so the smallest remain visible. Most are
            red dwarfs — too dim to see with the naked eye. Until modern
            astronomy, we didn't even know they existed.
          </p>
        </section>
      </div>
    </Modal>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/instructions-modal.test.jsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/instructions/InstructionsModal.jsx tests/unit/instructions-modal.test.jsx
git commit -m "feat: add InstructionsModal component with Captain's Briefing content"
```

---

### Task 3: Add Instructions CSS

**Files:**
- Create: `css/panel/instructions.css`
- Modify: `index.html` (add CSS import — check how other panel CSS files are loaded)

**Step 1: Check how CSS is loaded**

Look at `index.html` to see how other CSS files in `css/panel/` are imported. Follow the same pattern.

**Step 2: Create instructions CSS**

Create `css/panel/instructions.css`:

```css
@import '../variables.css';

.instructions-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.instructions-section {
  margin-bottom: 20px;
}

.instructions-section:last-child {
  margin-bottom: 0;
}

.instructions-section h3 {
  color: var(--color-primary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-large);
  font-weight: bold;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.instructions-section p {
  color: var(--color-white);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-medium);
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.instructions-section p:last-child {
  margin-bottom: 0;
}

.instructions-section strong {
  color: var(--color-primary);
}
```

**Step 3: Add CSS import**

Add the import following the same pattern as other panel CSS files.

**Step 4: Verify visually** (dev server)

Run: `npm run dev` — open browser, manually test modal appearance if desired.

**Step 5: Commit**

```bash
git add css/panel/instructions.css index.html
git commit -m "style: add instructions modal CSS"
```

---

### Task 4: Add Instructions Button to Gear Menu

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx`
- Modify: `tests/property/camera-controls.property.test.jsx` (if it tests button count)

**Step 1: Write a test for the Instructions button**

Add to `tests/property/camera-controls.property.test.jsx` (or create a unit test if more appropriate). The test should verify that when expanded, an "Instructions" button is rendered.

Check the existing test file first to understand the pattern, then add:

```jsx
it('should render Instructions button when expanded', () => {
  // render CameraControls in expanded state, verify "Instructions" button exists
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/property/camera-controls.property.test.jsx`
Expected: FAIL — no Instructions button exists yet.

**Step 3: Add Instructions button and modal state to CameraControls**

In `src/features/navigation/CameraControls.jsx`:

1. Import `InstructionsModal`:
```jsx
import { InstructionsModal } from '../instructions/InstructionsModal';
```

2. Add state:
```jsx
const [showInstructions, setShowInstructions] = useState(false);
```

3. Add button after the Antimatter button inside `camera-controls-buttons`:
```jsx
<button
  className="control-btn"
  onClick={() => setShowInstructions(true)}
>
  Instructions
</button>
```

4. Add the modal render at the end of the component return (inside the outer div but outside the conditional):
```jsx
<InstructionsModal
  isOpen={showInstructions}
  onClose={() => setShowInstructions(false)}
/>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/property/camera-controls.property.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/features/navigation/CameraControls.jsx tests/property/camera-controls.property.test.jsx
git commit -m "feat: add Instructions button to gear menu"
```

---

### Task 5: Auto-show Instructions on New Game

**Files:**
- Modify: `src/App.jsx:69-116`

**Step 1: Add showInstructions state**

In `src/App.jsx`, add state alongside existing state declarations (~line 72):

```jsx
const [showInstructions, setShowInstructions] = useState(false);
```

**Step 2: Set flag in handleShipNamed**

In `handleShipNamed` (~line 109), after `setViewMode(VIEW_MODES.ORBIT)`, add:

```jsx
setShowInstructions(true);
```

**Step 3: Import and render InstructionsModal**

Add import at top of App.jsx:
```jsx
import { InstructionsModal } from './features/instructions/InstructionsModal';
```

Render the modal inside the game components section (after the StarmapProvider opening, before any view-specific content — treat it like the NarrativeEventPanel overlay):

```jsx
<InstructionsModal
  isOpen={showInstructions}
  onClose={() => setShowInstructions(false)}
/>
```

**Step 4: Verify handleStartGame (load) does NOT show instructions**

Confirm that the `else` branch of `handleStartGame` (loading a save) does not set `showInstructions`. It should not — only new games trigger it.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: auto-show instructions modal on new game start"
```

---

### Task 6: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Manual smoke test**

Run: `npm run dev`
- Start a new game → Instructions modal should appear after ship naming
- Dismiss it → Should land in ORBIT view
- Open gear menu → "Instructions" button should be visible
- Click Instructions → Modal should reappear
- Load existing save → Instructions should NOT appear
- Verify Quick Access buttons show Dock on left, System Info on right

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors.
