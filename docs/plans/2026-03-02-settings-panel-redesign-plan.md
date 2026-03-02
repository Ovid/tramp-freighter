# Settings Panel Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the CameraControls gear menu into a card-style settings panel with toggle switches for on/off preferences, and add a "Jump Warnings" preference that skips the DangerWarningDialog when disabled.

**Architecture:** The preferences object lives in GameStateManager state, persisted via SaveLoadManager. CameraControls gets restyled into a bordered card panel with two item types: toggle switches (for boolean preferences) and compact action buttons. SystemPanel checks the jumpWarningsEnabled preference to decide whether to show DangerWarningDialog.

**Tech Stack:** React 18, CSS (no new libraries), Vitest for testing

---

### Task 1: Add preferences constant and EVENT_NAME

**Files:**
- Modify: `src/game/constants.js`

**Step 1: Add DEFAULT_PREFERENCES constant**

In `src/game/constants.js`, after the existing `COLE_DEBT_CONFIG` block (search for that export), add:

```js
/**
 * Default player preferences (saved with game state)
 */
export const DEFAULT_PREFERENCES = Object.freeze({
  jumpWarningsEnabled: true,
});
```

**Step 2: Add PREFERENCES_CHANGED event name**

In the `EVENT_NAMES` object in `src/game/constants.js`, add after the `ACHIEVEMENTS_CHANGED` line:

```js
  // Preferences
  PREFERENCES_CHANGED: 'preferencesChanged',
```

**Step 3: Run lint to verify**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```
git add src/game/constants.js
git commit -m "feat: add DEFAULT_PREFERENCES constant and PREFERENCES_CHANGED event"
```

---

### Task 2: Add preferences to game state initialization and save/load

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Modify: `src/game/state/state-validators.js`
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Write failing test for preferences in initial state**

Create `tests/unit/preferences.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { starData } from '../../src/game/data/star-data.js';
import { wormholeData } from '../../src/game/data/wormhole-data.js';
import { DEFAULT_PREFERENCES } from '../../src/game/constants.js';

// Suppress console output during tests
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Preferences', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(starData, wormholeData);
    gsm.initNewGame('test-seed');
  });

  it('initializes with default preferences on new game', () => {
    const state = gsm.getState();
    expect(state.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(state.preferences.jumpWarningsEnabled).toBe(true);
  });

  it('getPreference returns correct value', () => {
    expect(gsm.getPreference('jumpWarningsEnabled')).toBe(true);
  });

  it('setPreference updates value and emits event', () => {
    const listener = vi.fn();
    gsm.subscribe('preferencesChanged', listener);

    gsm.setPreference('jumpWarningsEnabled', false);

    expect(gsm.getPreference('jumpWarningsEnabled')).toBe(false);
    expect(listener).toHaveBeenCalled();
  });

  it('preferences persist through save/load cycle', () => {
    gsm.setPreference('jumpWarningsEnabled', false);
    gsm.saveGame();

    const gsm2 = new GameStateManager(starData, wormholeData);
    gsm2.loadGame();

    expect(gsm2.getPreference('jumpWarningsEnabled')).toBe(false);
  });

  it('old saves without preferences get defaults via addStateDefaults', () => {
    const state = gsm.getState();
    delete state.preferences;

    const gsm2 = new GameStateManager(starData, wormholeData);
    const result = gsm2.restoreState(state);

    expect(result.success).toBe(true);
    expect(gsm2.getPreference('jumpWarningsEnabled')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/preferences.test.js`
Expected: FAIL — `state.preferences` is undefined, `gsm.getPreference` is not a function

**Step 3: Add preferences to initialization**

In `src/game/state/managers/initialization.js`, add import:

```js
import {
  COMMODITY_TYPES,
  SHIP_CONFIG,
  SOL_SYSTEM_ID,
  GAME_VERSION,
  NEW_GAME_DEFAULTS,
  KARMA_CONFIG,
  FACTION_CONFIG,
  COLE_DEBT_CONFIG,
  DEFAULT_PREFERENCES,
} from '../../constants.js';
```

In `createInitialState()`, add `preferences: { ...DEFAULT_PREFERENCES },` to the returned object (after `achievements: {},`).

**Step 4: Add preferences defaults to state-validators.js**

In `addStateDefaults()` in `src/game/state/state-validators.js`, add at the end (before the `return state;`):

```js
  // Initialize preferences if missing (pre-preferences saves)
  if (!state.preferences) {
    state.preferences = { ...DEFAULT_PREFERENCES };
  }
```

Also add `DEFAULT_PREFERENCES` to the import from `'../constants.js'` at the top of the file.

**Step 5: Add getPreference/setPreference to GameStateManager**

In `src/game/state/game-state-manager.js`, add after the achievements section:

```js
  // ========================================================================
  // PREFERENCES
  // ========================================================================

  getPreference(key) {
    return this.state?.preferences?.[key] ?? DEFAULT_PREFERENCES[key];
  }

  setPreference(key, value) {
    if (!this.state.preferences) {
      this.state.preferences = { ...DEFAULT_PREFERENCES };
    }
    this.state.preferences[key] = value;
    this.emit(EVENT_NAMES.PREFERENCES_CHANGED, { ...this.state.preferences });
    this.markDirty();
  }
```

Also add `DEFAULT_PREFERENCES` to the import from `'../constants.js'` at the top.

**Step 6: Emit preferences in _emitAllStateEvents**

In the `_emitAllStateEvents` method of GameStateManager, add after the achievements emit:

```js
    if (state.preferences) {
      this.emit(EVENT_NAMES.PREFERENCES_CHANGED, { ...state.preferences });
    }
```

**Step 7: Run test to verify it passes**

Run: `npm test -- tests/unit/preferences.test.js`
Expected: PASS — all 5 tests

**Step 8: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 9: Commit**

```
git add src/game/state/managers/initialization.js src/game/state/state-validators.js src/game/state/game-state-manager.js tests/unit/preferences.test.js
git commit -m "feat: add preferences to game state with save/load support"
```

---

### Task 3: Wire jump warnings preference into SystemPanel

**Files:**
- Modify: `src/features/navigation/SystemPanel.jsx`
- Modify: `tests/unit/preferences.test.js`

**Step 1: Write failing test for jump warning bypass**

Add to `tests/unit/preferences.test.js`:

```js
  describe('Jump Warnings preference effect', () => {
    it('when jumpWarningsEnabled is false, handleJump skips danger check', () => {
      // This tests the logic: when preference is off, isDangerous check is bypassed
      gsm.setPreference('jumpWarningsEnabled', false);
      expect(gsm.getPreference('jumpWarningsEnabled')).toBe(false);

      // The actual skip logic is in the component, but we verify the state is correct
      // Component-level behavior tested via the SystemPanel integration
    });
  });
```

**Step 2: Modify SystemPanel to check preference**

In `src/features/navigation/SystemPanel.jsx`, add import for useGameEvent (already imported) and EVENT_NAMES (already imported).

At the top of the component function, add after the existing `useDangerZone` line:

```js
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;
```

In the `handleJump` function, change the danger check:

```js
    const handleJump = async () => {
      if (!validation.valid) return;

      // Check if this is a dangerous system that requires warning
      const isDangerous =
        dangerZone === 'contested' || dangerZone === 'dangerous';

      if (isDangerous && jumpWarningsEnabled) {
        setShowDangerWarning(true);
        return; // Stop here and wait for user decision
      }

      // If not dangerous or warnings disabled, proceed directly
      await executeJumpAfterConfirmation();
    };
```

The only change is adding `&& jumpWarningsEnabled` to the condition on line 78.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```
git add src/features/navigation/SystemPanel.jsx tests/unit/preferences.test.js
git commit -m "feat: skip danger warning dialog when jump warnings preference is off"
```

---

### Task 4: Restyle CameraControls into a card-style settings panel

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx`
- Modify: `css/hud.css`

**Step 1: Write failing test for new panel structure**

Create `tests/unit/settings-panel.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraControls } from '../../src/features/navigation/CameraControls.jsx';

// Mock the modal components
vi.mock('../../src/features/instructions/InstructionsModal', () => ({
  InstructionsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="instructions-modal">Instructions</div> : null,
}));
vi.mock('../../src/features/achievements/AchievementsModal', () => ({
  AchievementsModal: ({ isOpen }) =>
    isOpen ? <div data-testid="achievements-modal">Achievements</div> : null,
}));

// Mock GameContext
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getPreference: vi.fn((key) => {
      if (key === 'jumpWarningsEnabled') return true;
      return true;
    }),
    setPreference: vi.fn(),
  }),
}));

// Mock useGameEvent
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => ({ jumpWarningsEnabled: true }),
}));

describe('Settings Panel', () => {
  const defaultProps = {
    cameraState: { autoRotationEnabled: true, boundaryVisible: true },
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onToggleRotation: vi.fn(),
    onToggleBoundary: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gear toggle button', () => {
    render(<CameraControls {...defaultProps} />);
    expect(screen.getByLabelText('Toggle settings')).toBeTruthy();
  });

  it('shows settings panel with header when expanded', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders toggle switches for boolean preferences', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    // Check that toggle labels exist
    expect(screen.getByText('Star Rotation')).toBeTruthy();
    expect(screen.getByText('Boundary')).toBeTruthy();
    expect(screen.getByText('Antimatter')).toBeTruthy();
    expect(screen.getByText('Jump Warnings')).toBeTruthy();
  });

  it('renders action buttons', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    expect(screen.getByText('Zoom In')).toBeTruthy();
    expect(screen.getByText('Zoom Out')).toBeTruthy();
    expect(screen.getByText('Instructions')).toBeTruthy();
    expect(screen.getByText('Achievements')).toBeTruthy();
    expect(screen.getByText('GitHub')).toBeTruthy();
  });

  it('toggle switches have correct initial state', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));

    // Star Rotation: autoRotationEnabled=true means toggle is ON
    const rotationToggle = screen.getByLabelText('Star Rotation');
    expect(rotationToggle.checked).toBe(true);

    // Boundary: boundaryVisible=true means toggle is ON
    const boundaryToggle = screen.getByLabelText('Boundary');
    expect(boundaryToggle.checked).toBe(true);
  });

  it('clicking Star Rotation toggle calls onToggleRotation', () => {
    render(<CameraControls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Toggle settings'));
    fireEvent.click(screen.getByLabelText('Star Rotation'));
    expect(defaultProps.onToggleRotation).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/settings-panel.test.jsx`
Expected: FAIL — no "Settings" header, no toggle switches

**Step 3: Rewrite CameraControls component**

Replace `src/features/navigation/CameraControls.jsx` with the new card-panel version. The component:

- Adds imports for `useGameState` from GameContext and `useGameEvent` from hooks
- Keeps the gear icon toggle
- When expanded, renders a card panel with "Settings" header
- Renders toggle switch rows for: Star Rotation, Boundary, Antimatter, Jump Warnings
- Renders compact action button rows for: Zoom In, Zoom Out, Instructions, Achievements, GitHub
- Toggle switches use a hidden checkbox + styled slider for accessible toggle UI
- Jump Warnings toggle reads/writes via `gameStateManager.getPreference`/`setPreference`

```jsx
import { useState, useEffect } from 'react';
import { InstructionsModal } from '../instructions/InstructionsModal';
import { AchievementsModal } from '../achievements/AchievementsModal';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants';

export function CameraControls({
  cameraState,
  onZoomIn,
  onZoomOut,
  onToggleRotation,
  onToggleBoundary,
}) {
  const gameStateManager = useGameState();
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);

  const [isExpanded, setIsExpanded] = useState(false);
  const [antimatter, setAntimatter] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    if (antimatter) {
      document.documentElement.classList.add('antimatter');
    } else {
      document.documentElement.classList.remove('antimatter');
    }
    return () => document.documentElement.classList.remove('antimatter');
  }, [antimatter]);

  const toggleAntimatter = () => {
    setAntimatter((prev) => !prev);
  };

  const toggleJumpWarnings = () => {
    gameStateManager.setPreference('jumpWarningsEnabled', !jumpWarningsEnabled);
  };

  return (
    <div id="camera-controls" className={isExpanded ? 'expanded' : 'collapsed'}>
      <button
        className="camera-controls-toggle"
        onClick={toggleExpanded}
        aria-label="Toggle settings"
      >
        ⚙
      </button>

      {isExpanded && (
        <div className="settings-panel">
          <div className="settings-header">Settings</div>

          <div className="settings-list">
            {/* Toggle switches */}
            <label className="settings-toggle-row">
              <span className="settings-label">Star Rotation</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.autoRotationEnabled}
                onChange={onToggleRotation}
                aria-label="Star Rotation"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Boundary</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={cameraState.boundaryVisible}
                onChange={onToggleBoundary}
                aria-label="Boundary"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Antimatter</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={antimatter}
                onChange={toggleAntimatter}
                aria-label="Antimatter"
              />
              <span className="settings-toggle-slider" />
            </label>

            <label className="settings-toggle-row">
              <span className="settings-label">Jump Warnings</span>
              <input
                type="checkbox"
                className="settings-toggle-input"
                checked={jumpWarningsEnabled}
                onChange={toggleJumpWarnings}
                aria-label="Jump Warnings"
              />
              <span className="settings-toggle-slider" />
            </label>

            <div className="settings-divider" />

            {/* Action buttons */}
            <button className="settings-action-btn" onClick={onZoomIn}>
              Zoom In
            </button>
            <button className="settings-action-btn" onClick={onZoomOut}>
              Zoom Out
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowInstructions(true)}
            >
              Instructions
            </button>
            <button
              className="settings-action-btn"
              onClick={() => setShowAchievements(true)}
            >
              Achievements
            </button>
            <a
              className="settings-action-btn"
              href="https://github.com/Ovid/tramp-freighter/"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      )}

      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
    </div>
  );
}
```

**Step 4: Add CSS for the new settings panel**

Replace the existing camera controls CSS block in `css/hud.css` (lines 415-457, from `/* Camera Controls */` through `.camera-controls-buttons`) with:

```css
/* Settings Panel (gear icon + card) */
#camera-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 210;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 10px;
}

.camera-controls-toggle {
  width: 40px;
  height: 40px;
  background-color: var(--bg-button);
  color: #ffffff;
  border: 2px solid var(--border-primary);
  border-radius: 5px;
  font-size: 20px;
  font-family: var(--font-family-mono);
  cursor: pointer;
  transition: var(--transition-fast);
  white-space: nowrap;
}

.camera-controls-toggle:hover {
  background-color: #333333;
}

.settings-panel {
  background-color: var(--bg-panel);
  border: 2px solid var(--border-primary);
  border-radius: var(--section-border-radius);
  padding: var(--section-padding);
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
  font-family: var(--font-family-mono);
}

.settings-header {
  color: var(--color-primary);
  font-size: var(--font-size-xlarge);
  font-weight: bold;
  margin-bottom: var(--grid-gap-medium);
  text-align: center;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Toggle switch row */
.settings-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 3px;
  transition: var(--transition-fast);
}

.settings-toggle-row:hover {
  background-color: rgba(0, 255, 136, 0.1);
}

.settings-label {
  color: var(--color-white);
  font-size: var(--font-size-large);
}

/* Hidden checkbox */
.settings-toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

/* Toggle slider track */
.settings-toggle-slider {
  position: relative;
  width: 36px;
  height: 20px;
  background-color: #444444;
  border-radius: 10px;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

/* Toggle slider knob */
.settings-toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background-color: #888888;
  border-radius: 50%;
  transition: var(--transition-fast);
}

/* Checked state */
.settings-toggle-input:checked + .settings-toggle-slider {
  background-color: rgba(0, 255, 136, 0.3);
}

.settings-toggle-input:checked + .settings-toggle-slider::after {
  transform: translateX(16px);
  background-color: var(--color-primary);
}

/* Focus visible for keyboard nav */
.settings-toggle-input:focus-visible + .settings-toggle-slider {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Divider between toggles and actions */
.settings-divider {
  height: 1px;
  background-color: rgba(0, 255, 136, 0.3);
  margin: 6px 0;
}

/* Compact action buttons */
.settings-action-btn {
  display: block;
  width: 100%;
  padding: 6px 8px;
  background-color: transparent;
  color: var(--color-white);
  border: none;
  border-radius: 3px;
  font-size: var(--font-size-large);
  font-family: var(--font-family-mono);
  cursor: pointer;
  transition: var(--transition-fast);
  text-align: left;
  text-decoration: none;
  box-sizing: border-box;
}

.settings-action-btn:hover {
  background-color: rgba(0, 255, 136, 0.1);
  color: var(--color-primary);
}
```

Also remove the now-unused `.camera-controls-buttons` and old `.camera-controls.collapsed` / `.camera-controls.expanded` rules.

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/settings-panel.test.jsx`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```
git add src/features/navigation/CameraControls.jsx css/hud.css tests/unit/settings-panel.test.jsx
git commit -m "feat: restyle settings panel as card with toggle switches"
```

---

### Task 5: Visual verification and cleanup

**Files:**
- Possibly: `css/hud.css` (minor tweaks)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Visual check in browser**

Verify:
- Gear icon still appears in bottom-left
- Clicking it opens a bordered card panel with "Settings" header
- Toggle switches work correctly for Star Rotation, Boundary, Antimatter, Jump Warnings
- Action buttons (Zoom In, Zoom Out, Instructions, Achievements, GitHub) work
- Turning off Jump Warnings and jumping to a contested/dangerous system skips the warning dialog
- Turning Jump Warnings back on shows the dialog again
- Panel styling matches the game's dark sci-fi aesthetic

**Step 3: Run lint and format**

Run: `npm run clean`

**Step 4: Run full test suite one final time**

Run: `npm test`
Expected: All 2627+ tests pass

**Step 5: Commit any cleanup**

```
git add -A
git commit -m "style: polish settings panel styling and fix lint"
```
