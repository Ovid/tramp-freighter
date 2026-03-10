# Panel Width Consolidation & Dev Panel Previewer

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collapse the 4-tier panel width system to 3 tiers, standardize outlier panels, and add a dev panel previewer for visual verification.

**Architecture:** Remove `--panel-width-xlarge` (850px), change its two consumers to use `--panel-width-large` (800px). Bring Upgrades and Cargo Manifest panels onto `panel-base`. Add a `DevPanelPreview` overlay component that renders any panel with mock data for visual inspection.

**Tech Stack:** CSS custom properties, React JSX. No game logic changes.

**Important context:**
- `css/variables.css` defines `--panel-width-xlarge: 850px` (line 44), used only by combat.css and negotiation.css
- `panel-base` class (variables.css lines 154-174) provides centered absolute positioning, background, border, display, z-index, overflow
- Upgrades and Cargo Manifest panels do NOT use `panel-base` — they duplicate all positioning CSS
- DevAdminPanel (src/features/dev-admin/DevAdminPanel.jsx) already has encounter trigger buttons (lines 810-817)
- Encounter panels receive props from App.jsx (encounter objects, onChoice, onClose callbacks)

---

### Task 1: Remove --panel-width-xlarge and Collapse to 3 Tiers

**Files:**
- Modify: `css/variables.css`
- Modify: `css/panel/combat.css`
- Modify: `css/panel/negotiation.css`

**Why:** The 850px vs 800px difference (50px) is imperceptible. Collapsing to 3 tiers (600/700/800) simplifies the system.

**Step 1: Remove the variable definition**

In `css/variables.css`, delete line 44:

```css
  --panel-width-xlarge: 850px;
```

**Step 2: Update combat.css**

In `css/panel/combat.css`, change:

```css
/* Old */
  width: var(--panel-width-xlarge);
```

To:

```css
  width: var(--panel-width-large);
```

**Step 3: Update negotiation.css**

In `css/panel/negotiation.css`, change:

```css
/* Old */
  width: var(--panel-width-xlarge);
```

To:

```css
  width: var(--panel-width-large);
```

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add css/variables.css css/panel/combat.css css/panel/negotiation.css
git commit -m "Remove --panel-width-xlarge and consolidate to 3 panel width tiers"
```

---

### Task 2: Standardize Upgrades Panel to Use panel-base

**Files:**
- Modify: `src/features/upgrades/UpgradesPanel.jsx`
- Modify: `css/panel/upgrades.css`

**Why:** Upgrades panel duplicates all positioning CSS instead of using `panel-base`. It also uses `width: 90%; max-width: 900px` instead of a width token.

**Step 1: Add panel-base class to JSX**

In `src/features/upgrades/UpgradesPanel.jsx`, find the root div (line 229):

```jsx
/* Old */
<div id="upgrades-panel" className="visible">
```

Change to:

```jsx
<div id="upgrades-panel" className="panel-base visible">
```

**Step 2: Slim upgrades.css base properties**

Replace the `#upgrades-panel` base rule (lines 5-20) and the `.visible` rule (lines 22-24). The current rule has position, top, left, transform, width, max-width, max-height, padding, background-color, border, border-radius, color, font-size, display, z-index, overflow-y.

Replace with:

```css
/* Panel-specific overrides only — base from .panel-base */
#upgrades-panel {
  width: var(--panel-width-large);
}
```

Remove the `#upgrades-panel.visible` rule entirely (panel-base handles it).

Note: The panel uses a green border which matches `panel-base`'s default (`--color-primary`), so no border-color override is needed. Check the current border color — if it's different from `--color-primary` (#00ff88), add a `border-color` override.

**Step 3: Slim close button if redundant**

Check if `#upgrades-panel .close-btn` duplicates what the `.close-btn` utility class already provides. If so, reduce to color-only overrides matching the pattern:

```css
#upgrades-panel .close-btn {
  color: var(--color-primary);
}

#upgrades-panel .close-btn:hover {
  color: var(--color-white);
}
```

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add src/features/upgrades/UpgradesPanel.jsx css/panel/upgrades.css
git commit -m "Standardize upgrades panel to use panel-base and width token"
```

---

### Task 3: Standardize Cargo Manifest Panel to Use panel-base

**Files:**
- Modify: `src/features/cargo/CargoManifestPanel.jsx`
- Modify: `css/panel/cargo-manifest.css`

**Why:** Same issue as upgrades — duplicates all positioning CSS, uses responsive width instead of a token.

**Step 1: Add panel-base class to JSX**

In `src/features/cargo/CargoManifestPanel.jsx`, find the root div (line 103):

```jsx
/* Old */
<div id="cargo-manifest-panel" className="visible">
```

Change to:

```jsx
<div id="cargo-manifest-panel" className="panel-base visible">
```

**Step 2: Slim cargo-manifest.css base properties**

Replace the `#cargo-manifest-panel` base rule (lines 5-20) and remove the `.visible` rule (lines 22-24).

Replace with:

```css
/* Panel-specific overrides only — base from .panel-base */
#cargo-manifest-panel {
  width: var(--panel-width-medium);
}
```

Check the border color — if it differs from panel-base default, add a `border-color` override.

**Step 3: Slim close button if redundant**

Same pattern as Task 2 — reduce to color-only overrides if the `.close-btn` utility class handles the rest.

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add src/features/cargo/CargoManifestPanel.jsx css/panel/cargo-manifest.css
git commit -m "Standardize cargo manifest panel to use panel-base and width token"
```

---

### Task 4: Create Mock Data for Panel Previewer

**Files:**
- Create: `src/features/dev-admin/panelPreviewData.js`

**Why:** Each encounter panel needs a realistic mock data object to render in the previewer. This file centralizes all mock data.

**Step 1: Create the mock data file**

Create `src/features/dev-admin/panelPreviewData.js` with mock data objects for each encounter panel. The data shapes must match what App.jsx passes as props.

```js
/**
 * Mock data for the DevPanelPreview component.
 * Each key maps to a panel name and contains the props needed to render it.
 */

export const PREVIEW_PANELS = {
  pirateEncounter: {
    label: 'Pirate Encounter',
    component: 'PirateEncounterPanel',
    props: {
      encounter: {
        threatLevel: 'moderate',
        description:
          'A scarred corvette drops out of warp, weapons hot. The pirate captain hails you with a sneer.',
        demandPercent: 30,
        name: 'Captain Vex',
      },
      escalated: false,
    },
  },

  combat: {
    label: 'Combat',
    component: 'CombatPanel',
    props: {
      combat: {
        intensity: 'moderate',
        description:
          'The pirate vessel opens fire. Your shields absorb the first volley, but they are closing fast.',
      },
      fleeContext: null,
    },
  },

  negotiation: {
    label: 'Negotiation',
    component: 'NegotiationPanel',
    props: {
      encounter: {
        threatLevel: 'moderate',
        description:
          'Captain Vex considers your counter-offer, fingers drumming on the console.',
        demandPercent: 30,
        name: 'Captain Vex',
      },
    },
  },

  inspection: {
    label: 'Customs Inspection',
    component: 'InspectionPanel',
    props: {
      inspection: {
        securityLevel: 'moderate',
        description:
          'An Authority patrol vessel signals you to halt for routine cargo inspection.',
        officerName: 'Inspector Reyes',
      },
    },
  },

  mechanicalFailure: {
    label: 'Mechanical Failure',
    component: 'MechanicalFailurePanel',
    props: {
      failure: {
        type: 'engine_failure',
        severity: 'moderate',
      },
    },
  },

  distressCall: {
    label: 'Distress Call',
    component: 'DistressCallPanel',
    props: {
      distressCall: {
        signalStrength: 'strong',
        emergencyType: 'medical',
        description:
          'A civilian freighter is broadcasting an emergency beacon. Their life support is failing.',
        vesselName: 'MV Starling',
      },
    },
  },

  dangerWarning: {
    label: 'Danger Warning',
    component: 'DangerWarningDialog',
    props: {
      destinationSystemId: 5,
      destinationSystemName: 'Wolf 359',
    },
  },

  outcome: {
    label: 'Outcome',
    component: 'OutcomePanel',
    props: {
      outcome: {
        success: true,
        encounterType: 'pirate',
        choiceMade: 'return_fire',
        explanation:
          'Your weapons found their mark. The pirate vessel broke off its attack and limped away.',
        modifiers: [
          { name: 'Hull Integrity', effect: 'Good condition gave combat bonus', impact: '+15%' },
          { name: 'Weapons Upgrade', effect: 'Improved targeting systems', impact: '+10%' },
        ],
        consequences: {},
        karmaChanges: [
          { source: 'Defended vessel', amount: 2, reason: 'Self-defense against pirates' },
        ],
        reputationChanges: [
          { faction: 'outlaws', amount: -5, reason: 'Defeated pirate crew' },
          { faction: 'authorities', amount: 3, reason: 'Reduced pirate activity' },
        ],
        resourceChanges: {
          hull: -8,
          fuel: -2,
        },
      },
    },
  },
};
```

Verify each mock shape by reading the corresponding component's prop destructuring. The implementer MUST read each panel component and verify the mock data matches the expected prop shape. The shapes above are based on App.jsx's prop passing patterns but may need adjustment.

**Step 2: Run test suite**

Run: `npm test`
Expected: All tests pass (new file, no imports yet)

**Step 3: Commit**

```
git add src/features/dev-admin/panelPreviewData.js
git commit -m "Add mock data for panel previewer"
```

---

### Task 5: Create DevPanelPreview Overlay Component

**Files:**
- Create: `src/features/dev-admin/DevPanelPreview.jsx`
- Create: `css/panel/dev-panel-preview.css`

**Why:** The overlay renders any panel with mock data for visual inspection without triggering game events.

**Step 1: Create the CSS file**

Create `css/panel/dev-panel-preview.css`:

```css
@import '../variables.css';

.dev-panel-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dev-preview-toolbar {
  display: flex;
  gap: var(--grid-gap-small);
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 2px solid var(--color-primary);
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
  z-index: 10000;
}

.dev-preview-toolbar button {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: var(--color-white);
  font-family: var(--font-family-mono);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.dev-preview-toolbar button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dev-preview-toolbar button.active {
  background: var(--color-primary);
  color: var(--color-black);
  border-color: var(--color-primary);
}

.dev-preview-toolbar .close-preview-btn {
  margin-left: auto;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.dev-preview-toolbar .close-preview-btn:hover {
  background: var(--color-danger);
  color: var(--color-white);
}

.dev-preview-container {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Override panel-base positioning inside preview — panels use absolute positioning
   which needs a relative container to work properly */
.dev-preview-container .panel-base {
  display: block;
}
```

**Step 2: Create the component**

Create `src/features/dev-admin/DevPanelPreview.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import { PirateEncounterPanel } from '../danger/PirateEncounterPanel';
import { CombatPanel } from '../danger/CombatPanel';
import { NegotiationPanel } from '../danger/NegotiationPanel';
import { InspectionPanel } from '../danger/InspectionPanel';
import { MechanicalFailurePanel } from '../danger/MechanicalFailurePanel';
import { DistressCallPanel } from '../danger/DistressCallPanel';
import { DangerWarningDialog } from '../danger/DangerWarningDialog';
import { OutcomePanel } from '../danger/OutcomePanel';
import { PREVIEW_PANELS } from './panelPreviewData';
import '../../../css/panel/dev-panel-preview.css';

const PANEL_COMPONENTS = {
  PirateEncounterPanel,
  CombatPanel,
  NegotiationPanel,
  InspectionPanel,
  MechanicalFailurePanel,
  DistressCallPanel,
  DangerWarningDialog,
  OutcomePanel,
};

const noop = () => {};

export function DevPanelPreview({ onClose }) {
  const [selectedPanel, setSelectedPanel] = useState(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderPanel = () => {
    if (!selectedPanel) return null;

    const panelConfig = PREVIEW_PANELS[selectedPanel];
    if (!panelConfig) return null;

    const Component = PANEL_COMPONENTS[panelConfig.component];
    if (!Component) return null;

    // Build props with no-op callbacks
    const props = { ...panelConfig.props };

    // Add appropriate no-op callbacks based on panel type
    if (panelConfig.component === 'DangerWarningDialog') {
      props.onProceed = noop;
      props.onCancel = noop;
    } else if (panelConfig.component === 'OutcomePanel') {
      props.onClose = noop;
      props.onContinue = noop;
    } else {
      props.onChoice = noop;
      props.onClose = noop;
    }

    return <Component {...props} />;
  };

  return (
    <div
      className="dev-panel-preview-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-label="Panel Preview"
    >
      <div className="dev-preview-toolbar">
        {Object.entries(PREVIEW_PANELS).map(([key, config]) => (
          <button
            key={key}
            className={selectedPanel === key ? 'active' : ''}
            onClick={() => setSelectedPanel(key)}
          >
            {config.label}
          </button>
        ))}
        <button className="close-preview-btn" onClick={onClose}>
          Close Preview
        </button>
      </div>
      <div className="dev-preview-container">{renderPanel()}</div>
    </div>
  );
}
```

**Step 3: Verify mock data shapes**

Before proceeding, the implementer MUST read each encounter panel component and verify the mock data in `panelPreviewData.js` matches the expected prop shapes. Adjust any mock data that doesn't match. Pay special attention to:
- `NegotiationPanel` — may expect different encounter object shape
- `InspectionPanel` — `inspection` prop shape may have specific required fields
- `DistressCallPanel` — `distressCall` prop shape may have specific required fields
- `DangerWarningDialog` — uses hooks (`useDangerZone`, `useEncounterProbabilities`) that need a real `systemId`; verify `5` (Wolf 359) exists in star-data.js

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add src/features/dev-admin/DevPanelPreview.jsx css/panel/dev-panel-preview.css
git commit -m "Add DevPanelPreview overlay component for visual panel inspection"
```

---

### Task 6: Wire Preview Button into DevAdminPanel

**Files:**
- Modify: `src/features/dev-admin/DevAdminPanel.jsx`

**Why:** The dev panel needs a button to open the preview overlay.

**Step 1: Add state and import**

At the top of DevAdminPanel.jsx, add the import:

```jsx
import { DevPanelPreview } from './DevPanelPreview';
```

Add state for the preview visibility (near the other useState declarations):

```jsx
const [showPreview, setShowPreview] = useState(false);
```

**Step 2: Add the preview button**

Find the encounter trigger section (around lines 810-817, the "Trigger Encounters" area). Add a "Preview Panels" button nearby — either in the same section or as a new section:

```jsx
<div className="dev-section">
  <h3>Panel Preview</h3>
  <button onClick={() => setShowPreview(true)}>
    Preview All Panels
  </button>
</div>
```

**Step 3: Render the overlay**

At the end of the component's return, just before the closing `</div>`, add:

```jsx
{showPreview && <DevPanelPreview onClose={() => setShowPreview(false)} />}
```

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add src/features/dev-admin/DevAdminPanel.jsx
git commit -m "Add panel preview button to dev admin panel"
```

---

### Task 7: Test and Fix Mock Data

**Files:**
- Modify: `src/features/dev-admin/panelPreviewData.js` (likely)
- Modify: `src/features/dev-admin/DevPanelPreview.jsx` (if needed)
- Modify: `css/panel/dev-panel-preview.css` (if needed)

**Why:** The mock data shapes are approximate. This task is for actually opening each panel in the preview and fixing any rendering errors.

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Open the previewer**

Navigate to the game, click the dev icon (gear, bottom-left), find the "Preview All Panels" button, click it.

**Step 3: Click through each panel**

For each of the 8 encounter panels:
1. Click its button in the toolbar
2. Check the browser console for errors
3. If errors appear, read the panel component to find the correct prop shape
4. Fix the mock data in `panelPreviewData.js`
5. Verify the panel renders with realistic content

Common issues to watch for:
- Missing required fields in mock objects (will cause undefined errors)
- The `panel-base` class applying `display: none` inside the preview container — the CSS override in `dev-panel-preview.css` should handle this, but verify
- DangerWarningDialog's hooks need a valid system ID — if `5` doesn't work, check `src/game/data/star-data.js` for valid IDs
- Panels that compute derived data in `useMemo` may need more mock fields than expected

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit any fixes**

```
git add -A
git commit -m "Fix mock data shapes and preview rendering issues"
```

---

### Task 8: Visual Verification

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Verify width consolidation**

Using the panel previewer, verify:
1. Combat panel renders at 800px (was 850px) — no layout issues
2. Negotiation panel renders at 800px (was 850px) — probability modifiers don't wrap awkwardly
3. All panels have consistent borders, backgrounds, and close buttons

**Step 3: Verify outlier standardization**

1. Open Upgrades panel from station menu — centered, consistent border, correct width
2. Open Cargo Manifest from station menu — centered, consistent border, correct width

**Step 4: Verify all encounter panels in previewer**

Click through each panel and confirm:
- Consistent border thickness (3px)
- Consistent black background
- Consistent close button positioning
- Green primary buttons, white secondary buttons
- Reputation colors match across panels
- No console errors

---

## Panel Width Reference (After Changes)

| Width | Token | Panels |
|-------|-------|--------|
| 600px | --panel-width-small | Dialogue, Finance, Refuel, Ship Status, System Info |
| 700px | --panel-width-medium | Danger Warning, Info Broker, Mission Board, Repair, Trade, Cargo Manifest |
| 800px | --panel-width-large | Combat, Negotiation, Distress Call, Inspection, Mechanical Failure, Pirate Encounter, Outcome, Narrative Event, Upgrades |
