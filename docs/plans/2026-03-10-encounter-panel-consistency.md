# Encounter Panel CSS Consistency Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all encounter popups (pirate, combat, negotiation, distress, inspection, mechanical failure, danger warning, outcome) visually consistent by standardizing design tokens, removing hardcoded values, and unifying reputation tier colors.

**Architecture:** CSS-only changes plus two small JSX tweaks. All encounter panels already use a shared `panel-base` utility class (defined in `css/variables.css`) for base positioning/sizing. Some panels override these with hardcoded values or don't use the class at all. The fix is to: (1) add missing design tokens, (2) remove redundant overrides so `panel-base` does its job, (3) standardize semantic colors across panels.

**Tech Stack:** CSS custom properties, React JSX class names. No game logic changes.

**Important context:**
- `css/variables.css` defines `.panel-base` (lines 141-161) with position, background, border, max-height, padding, z-index, overflow
- Panels using `panel-base` in JSX: CombatPanel, NegotiationPanel, OutcomePanel, InspectionPanel, DistressCallPanel, MechanicalFailurePanel
- Panels NOT using `panel-base`: PirateEncounterPanel, DangerWarningDialog (they define all base styles in their own CSS)
- CombatPanel is the gold standard — its CSS only adds `width` and `border-color`, letting `panel-base` handle the rest
- The `#id` selector has higher specificity than `.panel-base`, so any hardcoded values in panel CSS files silently override the utility class

---

### Task 1: Add Missing Design Tokens to variables.css

**Files:**
- Modify: `css/variables.css`

**Why:** Several panels use colors that aren't in the design token system. We need these tokens before we can convert the hardcoded values in subsequent tasks.

**Step 1: Add reputation tier color tokens**

In `css/variables.css`, add after the Zone Classification Colors section (after line 126):

```css
  /* Reputation Tier Colors */
  --rep-trusted: #00ff88;
  --rep-friendly: #88ff00;
  --rep-warm: #ffaa00;
  --rep-neutral: #ffffff;
  --rep-cold: #ff6b6b;
  --rep-hostile: #ff0000;

  /* Accent Colors */
  --color-karma: #9966ff;
  --color-info-accent: #66ccff;
  --color-cyan: #00ffff;
```

The reputation tier colors use the inspection panel's scale (green → lime → orange → red → bright red) which provides the clearest visual gradient from good to bad. This is a better semantic mapping than negotiation's all-green scale where "cold" and "hostile" look similar.

**Step 2: Run test suite to verify no regressions**

Run: `npm test`
Expected: All tests pass (CSS variable additions can't break anything)

**Step 3: Commit**

```
git add css/variables.css
git commit -m "Add reputation tier and accent color tokens to CSS variables"
```

---

### Task 2: Slim negotiation.css — Remove panel-base Duplicates, Fix z-index Bug

**Files:**
- Modify: `css/panel/negotiation.css`

**Why:** NegotiationPanel already uses `className="panel-base visible"` in JSX (line 71), but the CSS overrides every base property with hardcoded values, including `z-index: 300` instead of `--z-modal` (1100). This is a **functional bug** — the panel can render behind other modal-level elements.

**Step 1: Replace the `#negotiation-panel` base properties**

Replace lines 4-20 of `css/panel/negotiation.css`:

```css
/* Old - hardcoded, overrides panel-base */
#negotiation-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 850px;
  max-height: 85vh;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.95);
  border: 3px solid #ffaa00;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  display: none;
  z-index: 300;
  overflow-y: auto;
}
```

With:

```css
/* Panel-specific overrides only — base positioning/sizing from .panel-base */
#negotiation-panel {
  width: var(--panel-width-xlarge);
  border-color: var(--color-secondary);
}
```

This matches the CombatPanel pattern. The `panel-base` class provides position, background, border-width, border-style, border-radius, max-height, padding, color, font-size, display, z-index, and overflow.

**Step 2: Convert heading styles to use variables**

Replace lines 26-46 (h2, h3, h4 styles):

```css
#negotiation-panel h2 {
  margin-bottom: var(--section-gap);
  color: var(--color-secondary);
  font-size: var(--font-size-title);
  text-align: center;
  text-shadow: var(--shadow-text-secondary);
}

#negotiation-panel h3 {
  margin-bottom: var(--grid-gap-medium);
  color: var(--color-secondary);
  font-size: var(--font-size-xlarge);
  border-bottom: var(--section-border-width) solid rgba(255, 170, 0, 0.3);
  padding-bottom: 5px;
}

#negotiation-panel h4 {
  margin-bottom: var(--grid-gap-small);
  color: var(--color-white);
  font-size: var(--font-size-large);
}
```

**Step 3: Convert close button to use variables**

Replace lines 48-63:

```css
#negotiation-panel .close-btn {
  color: var(--color-secondary);
}

#negotiation-panel .close-btn:hover {
  color: var(--color-white);
}
```

The `panel-base` doesn't include close-btn, but `variables.css` has a `.close-btn` utility class (lines 163-174) that provides position, top, right, background, border, font-size, cursor, padding, line-height, and transition. The close button already uses `className="close-btn"` in the JSX. We only need to specify the color override.

Wait — check if NegotiationPanel's close button JSX uses the `close-btn` class. If it does, we only need the color. If not, we need the full definition.

Actually, looking at the current code: NegotiationPanel.jsx line 72 likely has `className="close-btn"`. The `.close-btn` class in variables.css provides position/top/right/etc. So we only need:

```css
#negotiation-panel .close-btn {
  color: var(--color-secondary);
}

#negotiation-panel .close-btn:hover {
  color: var(--color-white);
}
```

**Step 4: Convert negotiation button primary to green (matching other panels)**

Replace lines 469-478:

```css
/* Old — orange primary button (inconsistent with all other panels) */
.negotiation-btn.primary {
  background-color: #ffaa00;
  color: #000000;
  border-color: #ffaa00;
}

.negotiation-btn.primary:hover {
  background-color: #cc8800;
  border-color: #cc8800;
  box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
}
```

With:

```css
.negotiation-btn.primary {
  background-color: var(--color-primary);
  color: var(--color-black);
  border-color: var(--color-primary);
}

.negotiation-btn.primary:hover {
  background-color: #00cc6a;
  border-color: #00cc6a;
  box-shadow: var(--shadow-glow-primary);
}
```

All other panels use green-filled primary buttons. The negotiation panel's orange primary button is the only outlier.

**Step 5: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```
git add css/panel/negotiation.css
git commit -m "Fix negotiation panel z-index bug and convert to CSS variables"
```

---

### Task 3: Rewrite mechanical-failure.css to Use Variables

**Files:**
- Modify: `css/panel/mechanical-failure.css`

**Why:** This is the biggest visual inconsistency. Despite importing variables.css, it hardcodes everything: blue-tinted background, thinner gray borders, different close button position, ghost-style buttons, wrong breakpoints. MechanicalFailurePanel already uses `className="panel-base visible"` in JSX (line 52), so we can slim this CSS dramatically.

**Step 1: Replace the `#mechanical-failure-panel` base properties**

Replace lines 11-21:

```css
/* Old */
#mechanical-failure-panel {
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 20px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  color: #ffffff;
  font-family: 'Courier New', monospace;
}
```

With:

```css
/* Panel-specific overrides only — base from .panel-base */
#mechanical-failure-panel {
  width: var(--panel-width-large);
  border-color: var(--color-secondary);
}
```

Orange border (secondary) matches the warning theme. The blue-tinted background, thinner border, and font-family overrides are removed — `panel-base` handles them correctly.

**Step 2: Convert headings to use variables and match other panels**

Replace lines 23-44:

```css
#mechanical-failure-panel h2 {
  color: var(--color-danger);
  text-align: center;
  margin-bottom: var(--section-gap);
  font-size: var(--font-size-title);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: var(--shadow-glow-danger);
}

#mechanical-failure-panel h3 {
  color: var(--color-secondary);
  border-bottom: var(--section-border-width) solid rgba(255, 170, 0, 0.3);
  padding-bottom: 5px;
  margin-bottom: var(--grid-gap-large);
  font-size: var(--font-size-xlarge);
}

#mechanical-failure-panel h4 {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--grid-gap-small);
  font-size: var(--font-size-large);
}
```

Key changes: h3 border uses translucent theme-color instead of `#444` gray. Sizes use variables.

**Step 3: Convert section styling to match other panels**

Replace lines 53-58 (`.failure-section`):

```css
.failure-section {
  background-color: var(--bg-section-secondary);
  border: var(--section-border-width) solid rgba(255, 170, 0, 0.2);
  border-radius: var(--section-border-radius);
  padding: var(--section-padding);
}
```

**Step 4: Convert label colors to use variables**

Replace `.type-label, .severity-label` (lines 74-78):

```css
.type-label,
.severity-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}
```

Replace `.severity-value` colors (lines 91-105) to use variables:

```css
.severity-value.minor {
  color: var(--color-secondary);
}

.severity-value.moderate {
  color: var(--color-danger);
}

.severity-value.serious {
  color: var(--color-danger);
}

.severity-value.critical {
  color: var(--color-critical);
}
```

Note: `.serious` was `#ff4444` (not in our palette). Use `--color-danger` (`#ff6b6b`) instead — close enough and stays on-palette.

**Step 5: Convert status value colors to variables**

Replace lines 169-183:

```css
.status-value.good {
  color: var(--condition-good);
}

.status-value.fair {
  color: var(--condition-fair);
}

.status-value.poor {
  color: var(--condition-poor);
}

.status-value.critical {
  color: var(--condition-critical);
}
```

**Step 6: Convert repair option selected state and borders**

Replace lines 198-226. Key changes:
- `.repair-option` border: `2px solid rgba(255, 255, 255, 0.2)` (match other option cards)
- `.repair-option` border-radius: `var(--section-border-radius)` (5px, not 6px)
- `.repair-option:hover` border-color: `rgba(255, 255, 255, 0.4)` (match other panels)
- `.repair-option.selected` stays the same (green highlight is correct)

```css
.repair-option {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--section-border-radius);
  padding: var(--section-padding);
  background: var(--bg-overlay);
  cursor: pointer;
  transition: var(--transition-fast);
}

.repair-option:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: var(--bg-overlay-dark);
}

.repair-option.selected {
  border-color: var(--color-primary);
  background: rgba(0, 255, 136, 0.1);
}

.repair-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.1);
}

.repair-option.disabled:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: var(--bg-overlay);
}

.repair-option.hull-breach-info,
.repair-option.life-support-info {
  cursor: default;
  border-color: var(--color-danger);
  background: rgba(255, 107, 107, 0.1);
}
```

**Step 7: Convert button styling to match other panels (filled, not outlined)**

Replace lines 378-428. The mechanical failure panel uses an outlier ghost-button style (transparent bg, colored text). Convert to the standard filled pattern:

```css
.failure-actions {
  display: flex;
  justify-content: center;
  gap: var(--grid-gap-large);
  margin-top: var(--section-gap);
  padding-top: var(--section-gap);
  border-top: var(--section-border-width) solid rgba(255, 170, 0, 0.3);
}

.failure-btn {
  padding: var(--button-padding);
  border: var(--button-border-width) solid;
  border-radius: var(--button-border-radius);
  background: transparent;
  color: var(--color-white);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-large);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: var(--transition-fast);
  min-width: var(--button-min-width);
}

.failure-btn.primary {
  background-color: var(--color-primary);
  color: var(--color-black);
  border-color: var(--color-primary);
}

.failure-btn.primary:hover:not(:disabled) {
  background-color: #00cc6a;
  border-color: #00cc6a;
  box-shadow: var(--shadow-glow-primary);
}

.failure-btn.primary:disabled {
  background-color: #666666;
  color: #999999;
  border-color: #666666;
  cursor: not-allowed;
}

.failure-btn.secondary {
  background-color: transparent;
  color: var(--color-white);
  border-color: var(--color-white);
}

.failure-btn.secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: #cccccc;
}
```

**Step 8: Convert close button to match other panels**

Replace lines 438-454:

```css
#mechanical-failure-panel .close-btn {
  color: var(--color-danger);
}

#mechanical-failure-panel .close-btn:hover {
  color: var(--color-white);
}
```

The `.close-btn` utility class in variables.css handles position, size, etc.

**Step 9: Fix responsive breakpoints to match other panels**

Replace lines 457-476. Change `768px` to `900px` and `600px`:

```css
@media (max-width: 900px) {
  #mechanical-failure-panel {
    width: 90vw;
    max-width: 700px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  #mechanical-failure-panel {
    width: 95vw;
    padding: var(--panel-padding-small);
  }

  .failure-actions {
    flex-direction: column;
    align-items: center;
  }

  .failure-btn {
    width: 100%;
    max-width: 250px;
  }
}
```

**Step 10: Convert remaining hardcoded colors throughout the file**

Remaining instances to convert (throughout the file):
- `.status-label` color: `#aaaaaa` → `rgba(255, 255, 255, 0.7)`
- `.status-impact` color: `#888888` → `rgba(255, 255, 255, 0.5)`
- `.failure-description` color: `#cccccc` → `rgba(255, 255, 255, 0.8)`
- `.system-alert` border/color: `#ff6b6b` → `var(--color-danger)`
- `.system-alert` background: `rgba(255, 0, 0, 0.1)` → keep (matches other panels)
- `.prob-value` color: `#00ff88` → `var(--color-primary)`
- `.cost-value` color: `#ffaa00` → `var(--color-secondary)`
- `.delay-value` color: `#ff6b6b` → `var(--color-danger)`
- `.option-name` color: `#ffffff` → `var(--color-white)`
- `.option-type` color: `#aaaaaa` → `rgba(255, 255, 255, 0.7)`
- `.option-description` color: `#cccccc` → `rgba(255, 255, 255, 0.8)`
- `.outcome` border/background colors: Use existing pattern from combat.css
- `.error-text` color: `#ff0000` → `var(--color-critical)`
- `.selection-prompt` color: `#aaaaaa` → `rgba(255, 255, 255, 0.7)`

**Step 11: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 12: Commit**

```
git add css/panel/mechanical-failure.css
git commit -m "Rewrite mechanical-failure.css to use CSS variables consistently"
```

---

### Task 4: Add panel-base to PirateEncounterPanel and DangerWarningDialog

**Files:**
- Modify: `src/features/danger/PirateEncounterPanel.jsx` (one line)
- Modify: `src/features/danger/DangerWarningDialog.jsx` (one line)
- Modify: `css/panel/pirate-encounter.css`
- Modify: `css/panel/danger-warning.css`

**Why:** These two panels define ALL base styling (position, background, border-width, padding, etc.) in their CSS instead of using the `panel-base` utility class that all other panels use. Adding `panel-base` and removing the redundant CSS makes them consistent with the pattern and reduces maintenance burden.

**Step 1: Add panel-base class to PirateEncounterPanel JSX**

In `src/features/danger/PirateEncounterPanel.jsx`, find the root div (approximately line 96):

```jsx
/* Old */
<div id="pirate-encounter-panel" className="visible">
```

Change to:

```jsx
<div id="pirate-encounter-panel" className="panel-base visible">
```

**Step 2: Slim pirate-encounter.css base properties**

Replace lines 5-21:

```css
/* Old */
#pirate-encounter-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--panel-width-large);
  max-height: var(--panel-max-height);
  padding: var(--panel-padding);
  background-color: var(--bg-panel);
  border: var(--panel-border-width) solid var(--color-danger);
  border-radius: var(--panel-border-radius);
  color: var(--color-white);
  font-size: var(--font-size-large);
  display: none;
  z-index: var(--z-modal);
  overflow-y: auto;
}
```

With:

```css
/* Panel-specific overrides only — base from .panel-base */
#pirate-encounter-panel {
  width: var(--panel-width-large);
  border-color: var(--color-danger);
  z-index: var(--z-modal);
}
```

Note: We keep `z-index: var(--z-modal)` because `panel-base` uses `--z-panel` (300) while encounter panels should be at modal level (1100). This is a deliberate override.

**Step 3: Slim pirate-encounter.css close button**

Replace lines 49-61:

```css
#pirate-encounter-panel .close-btn {
  color: var(--color-danger);
}

#pirate-encounter-panel .close-btn:hover {
  color: var(--color-white);
}
```

**Step 4: Add panel-base class to DangerWarningDialog JSX**

In `src/features/danger/DangerWarningDialog.jsx`, find the root div (approximately line 69):

```jsx
/* Old */
<div id="danger-warning-dialog" className="visible">
```

Change to:

```jsx
<div id="danger-warning-dialog" className="panel-base visible">
```

**Step 5: Slim danger-warning.css base properties**

Replace lines 5-21:

```css
/* Panel-specific overrides only — base from .panel-base */
#danger-warning-dialog {
  width: var(--panel-width-medium);
  border-color: var(--color-secondary);
  z-index: var(--z-modal);
}
```

**Step 6: Slim danger-warning.css close button**

Replace lines 49-65:

```css
#danger-warning-dialog .close-btn {
  color: var(--color-secondary);
}

#danger-warning-dialog .close-btn:hover {
  color: var(--color-white);
}
```

**Step 7: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 8: Commit**

```
git add src/features/danger/PirateEncounterPanel.jsx src/features/danger/DangerWarningDialog.jsx css/panel/pirate-encounter.css css/panel/danger-warning.css
git commit -m "Add panel-base to PirateEncounter and DangerWarning for consistent panel styling"
```

---

### Task 5: Standardize Reputation Tier Colors Across All Panels

**Files:**
- Modify: `css/panel/negotiation.css`
- Modify: `css/panel/distress-call.css`
- Modify: `css/panel/inspection.css`

**Why:** The same reputation tier (e.g., "friendly") renders in different colors across different encounter panels, which is confusing for players. We standardize on the variables defined in Task 1.

**Step 1: Update negotiation.css reputation colors**

Find the `.status-value` reputation classes (lines 189-207) and update to use the new variables:

```css
.status-value.trusted {
  color: var(--rep-trusted);
}

.status-value.friendly {
  color: var(--rep-friendly);
}

.status-value.warm {
  color: var(--rep-warm);
}

.status-value.cold {
  color: var(--rep-cold);
}

.status-value.hostile {
  color: var(--rep-hostile);
}
```

Old values being replaced: trusted was `#00ff88`, friendly was `#88ff88`, warm was `#aaffaa`, cold was `#ffaa00`, hostile was `#ff6b6b`.

**Step 2: Update distress-call.css reputation colors**

Find `.rep-value` reputation classes (lines 321-343) and update:

```css
.rep-value.trusted {
  color: var(--rep-trusted);
}

.rep-value.friendly {
  color: var(--rep-friendly);
}

.rep-value.warm {
  color: var(--rep-warm);
}

.rep-value.neutral {
  color: var(--rep-neutral);
}

.rep-value.cold {
  color: var(--rep-cold);
}

.rep-value.hostile {
  color: var(--rep-hostile);
}
```

Old values: trusted was `#00ffff` (cyan), friendly was `#00ff88`, warm was `#88ff00`, cold/hostile same.

**Step 3: Update inspection.css reputation colors**

Find `.summary-value` reputation classes (lines 339-361) and update:

```css
.summary-value.trusted {
  color: var(--rep-trusted);
}

.summary-value.friendly {
  color: var(--rep-friendly);
}

.summary-value.warm {
  color: var(--rep-warm);
}

.summary-value.neutral {
  color: var(--rep-neutral);
}

.summary-value.cold {
  color: var(--rep-cold);
}

.summary-value.hostile {
  color: var(--rep-hostile);
}
```

Old values: friendly was `#88ff00`, warm was `#ffaa00`, cold was `#ff6b6b`, hostile was `#ff0000`.

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add css/panel/negotiation.css css/panel/distress-call.css css/panel/inspection.css
git commit -m "Standardize reputation tier colors across encounter panels"
```

---

### Task 6: Fix Outcome Panel Off-Palette Colors and Inspection Nit

**Files:**
- Modify: `css/panel/outcome.css`
- Modify: `css/panel/inspection.css`

**Why:** Outcome panel uses `#9966ff` (karma purple) and `#66ccff` (info blue) which aren't in the design token system. Inspection panel has a border-radius inconsistency (8px vs 5px).

**Step 1: Update outcome.css karma and reputation accent colors**

In `css/panel/outcome.css`, replace:

Line 297 — `.change-item.karma` border-left:
```css
.change-item.karma {
  border-left: 3px solid var(--color-karma);
}
```

Line 300-301 — `.change-item.reputation` border-left:
```css
.change-item.reputation {
  border-left: 3px solid var(--color-info-accent);
}
```

Lines 396-403 — `.additional-effects` section:
```css
.additional-effects {
  background-color: rgba(102, 204, 255, 0.05);
  border-color: rgba(102, 204, 255, 0.2);
}

.additional-effects h3 {
  color: var(--color-info-accent);
  border-bottom-color: rgba(102, 204, 255, 0.3);
}
```

Lines 419-420 — `.effect-item`:
```css
.effect-item {
  /* ... existing ... */
  border-left: 3px solid var(--color-info-accent);
}
```

Lines 422-426 — `.effect-icon`:
```css
.effect-icon {
  color: var(--color-info-accent);
  /* ... rest unchanged ... */
}
```

**Step 2: Also update distress-call.css saint color to use variable**

In `css/panel/distress-call.css`, line 261-262:
```css
.resource-value.saint {
  color: var(--color-cyan);
  text-shadow: 0 0 var(--grid-gap-small) var(--color-cyan);
}
```

**Step 3: Fix inspection-option border-radius**

In `css/panel/inspection.css`, line 387:

```css
/* Old */
.inspection-option {
  /* ... */
  border-radius: 8px;
  /* ... */
}
```

Change to:

```css
.inspection-option {
  /* ... */
  border-radius: var(--section-border-radius);
  /* ... */
}
```

**Step 4: Run test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add css/panel/outcome.css css/panel/distress-call.css css/panel/inspection.css
git commit -m "Replace off-palette colors with CSS variables and fix inspection border-radius"
```

---

### Task 7: Visual Verification

**Files:** None (verification only)

**Step 1: Run full test suite one final time**

Run: `npm test`
Expected: All tests pass

**Step 2: Visual spot-check in dev server**

Run: `npm run dev`

Verify each encounter panel visually:
1. **Pirate encounter** — red border, centered, proper z-index
2. **Combat panel** — bright red border, option cards with 5px radius
3. **Negotiation panel** — orange border, green primary button (not orange), proper z-index (should overlay other panels)
4. **Distress call** — orange border, reputation colors match inspection panel
5. **Inspection panel** — orange border, option cards with 5px radius, reputation colors match
6. **Mechanical failure** — orange border (not gray!), black background (not blue-tinted), filled green button (not ghost), section borders are translucent orange (not gray)
7. **Danger warning** — orange border, centered
8. **Outcome panel** — karma section has purple left-border, info section has blue accent

Key things to verify:
- All panels have consistent border thickness (3px)
- All panels have black `rgba(0,0,0,0.95)` background
- All primary buttons are green-filled with black text
- All secondary buttons are transparent with white border
- Reputation tiers show same colors across all panels
- Close buttons are consistently positioned (top: 15px, right: 15px)

**Step 3: Commit any final adjustments if needed**

---

## Future Considerations (Not In Scope)

**Button class consolidation:** Each panel defines its own button class prefix (`.encounter-btn`, `.combat-btn`, etc.) with identical base styling. The `variables.css` file already has `.button-base`, `.button-primary`, `.button-secondary` utility classes. A future cleanup could switch JSX to use these shared classes, but that requires JSX changes across all 8 panels and risks breaking the existing button behavior. Not worth the risk for zero visual change.

**Reputation utility extraction:** The `getReputationClass()` function is duplicated in NegotiationPanel, DistressCallPanel, InspectionPanel, and OutcomePanel (with OutcomePanel using different class names: very-good/good/bad/very-bad vs trusted/friendly/etc.). Extracting to a shared utility in `src/features/danger/` or `src/game/utils/` would reduce duplication but is a JS refactor, not a CSS consistency fix.
