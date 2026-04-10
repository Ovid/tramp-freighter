# Mobile Responsive Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the game playable on mobile phones (375px+ width) while keeping desktop rendering pixel-identical.

**Architecture:** CSS media queries handle visual changes; a `useMobileLayout()` hook + `MobileContext` handle structural/behavioral differences in React components. A new `.centered-panel` utility class unifies panel positioning and mobile full-screen takeover. Desktop remains unchanged because all CSS variable defaults match current hardcoded values.

**Tech Stack:** React 18, CSS custom properties, `window.matchMedia` API, Vitest + React Testing Library

**Design Spec:** `docs/plans/2026-04-09-mobile-responsive-design.md`

---

## Task 1: Z-Index Scale Variables

**Requirement:** Spec Section 1 — Z-Index Scale. Define mobile stacking order in `css/variables.css`.

**Files:**
- Modify: `css/variables.css:82-87` (existing z-index section)
- Test: `tests/unit/mobile-z-index-scale.test.js`

#### RED

Write a test that asserts the four mobile z-index variables exist with correct ascending values, and that `--z-modal` remains higher than all mobile layers.

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile z-index scale', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  const layers = [
    { name: '--z-camera-toolbar', expected: 10 },
    { name: '--z-hud-collapsed', expected: 20 },
    { name: '--z-panel-fullscreen', expected: 30 },
    { name: '--z-hud-expanded', expected: 40 },
  ];

  it.each(layers)(
    'should define $name with value $expected',
    ({ name, expected }) => {
      const regex = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(\\d+)`);
      const match = css.match(regex);
      expect(match).not.toBeNull();
      expect(parseInt(match[1], 10)).toBe(expected);
    }
  );

  it('should maintain ascending z-index order', () => {
    const values = layers.map(({ name }) => {
      const regex = new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(\\d+)`);
      const match = css.match(regex);
      return parseInt(match[1], 10);
    });
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('should keep --z-modal higher than all mobile layers', () => {
    const modalMatch = css.match(/--z-modal:\s*(\d+)/);
    expect(parseInt(modalMatch[1], 10)).toBeGreaterThan(40);
  });
});
```

Run: `npm test -- tests/unit/mobile-z-index-scale.test.js`
Expected failure: Variables not defined yet.
If it passes unexpectedly: The variables already exist — check if a prior branch added them.

#### GREEN

In `css/variables.css`, after line 87 (`--z-background: 1;`), add:

```css
  /* Mobile z-index scale (used for mobile layout stacking order) */
  --z-camera-toolbar: 10;
  --z-hud-collapsed: 20;
  --z-panel-fullscreen: 30;
  --z-hud-expanded: 40;
```

Run: `npm test -- tests/unit/mobile-z-index-scale.test.js` — PASS

#### REFACTOR

Look for:
- Do any existing z-index values in the file (e.g., `--z-modal: 1100`, `--z-panel: 300`) conflict with the new scale? They shouldn't — the mobile scale is separate and lower — but verify no component accidentally uses a mobile z-index variable where it should use the existing higher ones.
- Are there hardcoded z-index values elsewhere in `variables.css`? If so, consider whether they should be variables too.

Commit: `git commit -m "feat: add mobile z-index scale variables to variables.css"`

---

## Task 2: Safe Area Inset Variables + Viewport Meta

**Requirement:** Spec Section 1 — Safe Area Insets. Add `viewport-fit=cover` and safe area CSS variables.

**Files:**
- Modify: `index.html:5` (viewport meta tag)
- Modify: `css/variables.css` (add safe area variables in mobile media query)
- Test: `tests/unit/mobile-safe-area.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile safe area setup', () => {
  it('index.html should include viewport-fit=cover', () => {
    const html = readFileSync(resolve('index.html'), 'utf-8');
    expect(html).toContain('viewport-fit=cover');
  });

  it('variables.css should define --safe-top and --safe-bottom in mobile media query', () => {
    const css = readFileSync(resolve('css/variables.css'), 'utf-8');
    expect(css).toContain('--safe-top');
    expect(css).toContain('--safe-bottom');
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-bottom)');
  });
});
```

Run: `npm test -- tests/unit/mobile-safe-area.test.js`
Expected failure: No `viewport-fit=cover` and no safe area variables.

#### GREEN

In `index.html:5`, change:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

In `css/variables.css`, add after the closing `}` of `:root` (after line 150), before the utility classes:

```css
/* Mobile safe area insets — applied on notched/island devices */
/* Breakpoint: 600px matches --breakpoint-mobile (CSS vars can't be used in @media) */
@media (max-width: 600px) {
  :root {
    --safe-top: env(safe-area-inset-top);
    --safe-bottom: env(safe-area-inset-bottom);
  }
}
```

Run: `npm test -- tests/unit/mobile-safe-area.test.js` — PASS

#### REFACTOR

Look for:
- Is there already a `<meta name="viewport">` tag that might conflict? There's only one (line 5) — just modify it.
- Could `--safe-left` and `--safe-right` be needed? Check the spec — no, only top/bottom are used. Don't add speculative variables.

Commit: `git commit -m "feat: add viewport-fit=cover and safe area CSS variables"`

---

## Task 3: `.centered-panel` Shared Class

**Requirement:** Spec Section 1 — Extract shared center-positioning into `.centered-panel` with mobile full-screen override.

**Files:**
- Modify: `css/variables.css` (add after `.panel-base.visible` block, ~line 173)
- Test: `tests/unit/centered-panel-class.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('.centered-panel utility class', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should define .centered-panel with absolute centering', () => {
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*top:\s*50%/s);
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*left:\s*50%/s);
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*transform:\s*translate\(-50%,\s*-50%\)/s);
  });

  it('should override to fixed full-screen at 600px breakpoint', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.centered-panel\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    const rules = mobileBlock[1];
    expect(rules).toContain('position: fixed');
    expect(rules).toContain('width: 100%');
    expect(rules).toContain('height: 100%');
    expect(rules).toContain('transform: none');
  });
});
```

Run: `npm test -- tests/unit/centered-panel-class.test.js`
Expected failure: Class doesn't exist.

#### GREEN

In `css/variables.css`, after `.panel-base.visible` block (after line 173):

```css
.centered-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Breakpoint: 600px matches --breakpoint-mobile (CSS vars can't be used in @media) */
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

Run: `npm test -- tests/unit/centered-panel-class.test.js` — PASS

#### REFACTOR

Look for:
- Compare `.centered-panel` positioning with `.panel-base` positioning (lines 153-169). They share `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`. `.panel-base` has additional properties (max-height, padding, background, border, etc.) that are specific to panels, so the duplication of just the positioning is acceptable. Don't try to make `.panel-base` extend `.centered-panel` — they have different visibility semantics.
- Is the mobile media query block for `.centered-panel` near the other mobile media query block (safe area)? Consider consolidating mobile overrides into fewer `@media` blocks for readability, but only if they're adjacent.

Commit: `git commit -m "feat: add .centered-panel utility class with mobile full-screen override"`

---

## Task 4: CSS Variable Extraction (HUD, Station, Modals)

**Requirement:** Spec Section 1 — Replace hardcoded widths with CSS variables. Add mobile overrides.

**Files:**
- Modify: `css/hud.css:9` (`width: 300px` → `var(--hud-width, 300px)`)
- Modify: `css/hud.css:518` (`width: 400px` → `var(--station-width, 400px)`)
- Modify: `css/modals.css:27-28` (min-width/max-width → variables)
- Modify: `css/variables.css` (add mobile overrides to existing mobile media query block)
- Test: `tests/unit/mobile-css-variables.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS variable extraction for mobile', () => {
  it('HUD width should use var(--hud-width, 300px)', () => {
    const css = readFileSync(resolve('css/hud.css'), 'utf-8');
    expect(css).toMatch(/#game-hud\s*\{[^}]*width:\s*var\(--hud-width,\s*300px\)/s);
  });

  it('station interface width should use var(--station-width, 400px)', () => {
    const css = readFileSync(resolve('css/hud.css'), 'utf-8');
    expect(css).toMatch(/#station-interface\s*\{[^}]*width:\s*var\(--station-width,\s*400px\)/s);
  });

  it('modal dialog should use variable for min-width', () => {
    const css = readFileSync(resolve('css/modals.css'), 'utf-8');
    expect(css).toMatch(/\.modal-dialog\s*\{[^}]*min-width:\s*var\(--modal-min-width,\s*400px\)/s);
  });

  it('modal dialog should use variable for max-width', () => {
    const css = readFileSync(resolve('css/modals.css'), 'utf-8');
    expect(css).toMatch(/\.modal-dialog\s*\{[^}]*max-width:\s*var\(--modal-max-width,\s*500px\)/s);
  });

  it('mobile media query should override variables for mobile', () => {
    const css = readFileSync(resolve('css/variables.css'), 'utf-8');
    expect(css).toContain('--hud-width: 100%');
    expect(css).toContain('--station-width: 100%');
    expect(css).toContain('--modal-min-width: 0');
    expect(css).toContain('--modal-max-width: 100%');
  });
});
```

Run: `npm test -- tests/unit/mobile-css-variables.test.js`
Expected failure: Hardcoded values still in place.

#### GREEN

In `css/hud.css:9`: `width: var(--hud-width, 300px);`
In `css/hud.css:518`: `width: var(--station-width, 400px);`
In `css/modals.css:27`: `max-width: var(--modal-max-width, 500px);`
In `css/modals.css:28`: `min-width: var(--modal-min-width, 400px);`

In `css/variables.css`, add to the existing mobile `@media (max-width: 600px)` block (the one with `--safe-top`):
```css
    --hud-width: 100%;
    --station-width: 100%;
    --modal-min-width: 0;
    --modal-max-width: 100%;
```

Run: `npm test -- tests/unit/mobile-css-variables.test.js` — PASS
Run: `npm test` — All existing tests still pass (defaults match previous values).

#### REFACTOR

Look for:
- Are there other hardcoded widths in `hud.css` or `modals.css` that should also be variables? Scan the files. Don't variablize everything — only values the spec identifies.
- The mobile media query in `variables.css` now has safe area vars and width overrides. Is it getting large? If so, add a section comment to organize.
- Check that the existing `css-z-index-hierarchy.test.js` still passes — it reads `variables.css` with regex.

Commit: `git commit -m "feat: extract hardcoded widths into CSS variables with mobile overrides"`

---

## Task 5: `useMobileLayout()` Hook

**Requirement:** Spec Section 1 — Hook that listens to `matchMedia('(max-width: 600px)')` and returns `{ isMobile }`.

**Files:**
- Create: `src/hooks/useMobileLayout.js`
- Test: `tests/unit/use-mobile-layout.test.js`

#### RED

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileLayout } from '../../src/hooks/useMobileLayout';

describe('useMobileLayout hook', () => {
  let listeners;
  let currentMatches;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    window.matchMedia = vi.fn((query) => ({
      matches: currentMatches,
      media: query,
      addEventListener: vi.fn((event, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        listeners = listeners.filter((l) => l !== handler);
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return isMobile false on desktop widths', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(false);
  });

  it('should return isMobile true on mobile widths', () => {
    currentMatches = true;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(true);
  });

  it('should update when media query changes', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      listeners.forEach((l) => l({ matches: true }));
    });
    expect(result.current.isMobile).toBe(true);
  });

  it('should query max-width: 600px', () => {
    renderHook(() => useMobileLayout());
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 600px)');
  });

  it('should clean up listener on unmount', () => {
    const removeListenerSpy = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeListenerSpy,
    }));

    const { unmount } = renderHook(() => useMobileLayout());
    unmount();
    expect(removeListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
```

Run: `npm test -- tests/unit/use-mobile-layout.test.js`
Expected failure: Module not found.

#### GREEN

Create `src/hooks/useMobileLayout.js`:

```js
import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 600px)';

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return { isMobile };
}
```

Run: `npm test -- tests/unit/use-mobile-layout.test.js` — PASS

#### REFACTOR

Look for:
- Should the `600px` breakpoint be a shared constant with the CSS? No — CSS variables can't be used in `@media` queries, and JS constants don't help CSS. A comment referencing `--breakpoint-mobile` is sufficient.
- Is `window.matchMedia` called twice (once in `useState` initializer, once in `useEffect`)? Yes, but that's the standard pattern — the initializer avoids a flash, the effect subscribes to changes. This is correct.

Commit: `git commit -m "feat: add useMobileLayout hook with matchMedia listener"`

---

## Task 6: `MobileContext` Provider

**Requirement:** Spec Section 1 — Context provider so components can read `isMobile`.

**Files:**
- Create: `src/context/MobileContext.jsx`
- Test: `tests/unit/mobile-context.test.jsx`

**Reference:** `src/context/GameContext.jsx` — follow the same pattern.

#### RED

```jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MobileProvider, useMobile } from '../../src/context/MobileContext';

describe('MobileContext', () => {
  it('should provide isMobile value to consumers', () => {
    const wrapper = ({ children }) => (
      <MobileProvider isMobile={true}>{children}</MobileProvider>
    );
    const { result } = renderHook(() => useMobile(), { wrapper });
    expect(result.current.isMobile).toBe(true);
  });

  it('should provide isMobile=false when set', () => {
    const wrapper = ({ children }) => (
      <MobileProvider isMobile={false}>{children}</MobileProvider>
    );
    const { result } = renderHook(() => useMobile(), { wrapper });
    expect(result.current.isMobile).toBe(false);
  });

  it('should throw when useMobile is called outside provider', () => {
    expect(() => {
      renderHook(() => useMobile());
    }).toThrow('useMobile must be used within MobileProvider');
  });
});
```

Run: `npm test -- tests/unit/mobile-context.test.jsx`
Expected failure: Module not found.

#### GREEN

Create `src/context/MobileContext.jsx`:

```jsx
import { createContext, useContext, useMemo } from 'react';

const MobileContext = createContext(null);

export function MobileProvider({ isMobile, children }) {
  const value = useMemo(() => ({ isMobile }), [isMobile]);
  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
}
```

Run: `npm test -- tests/unit/mobile-context.test.jsx` — PASS

#### REFACTOR

Look for:
- Compare with `GameContext.jsx`. The pattern is the same (createContext, Provider, useX hook with error). Good consistency.
- Is `useMemo` necessary? Yes — without it, every re-render of the provider creates a new object, causing all consumers to re-render. The `isMobile` value changes rarely (only on resize across the breakpoint), so memoization prevents unnecessary cascading renders.

Commit: `git commit -m "feat: add MobileContext provider and useMobile hook"`

---

## Task 7: Wire `MobileProvider` into `App.jsx`

**Requirement:** Spec Section 1 — Called once in `App.jsx`, provided via `MobileContext`.

**Files:**
- Modify: `src/App.jsx` (add imports, add `useMobileLayout()`, wrap `StarmapProvider` with `MobileProvider`)
- Test: `tests/integration/mobile-provider-wiring.test.jsx`

#### RED

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-utils';

describe('MobileProvider wiring in App', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should render without crashing with MobileProvider', () => {
    const game = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    render(
      <GameProvider game={game}>
        <App />
      </GameProvider>
    );
    expect(screen.getByText(/tramp freighter blues/i)).toBeTruthy();
  });
});
```

Run: `npm test -- tests/integration/mobile-provider-wiring.test.jsx`
Expected failure: May pass trivially (no consumer throws yet), but confirms no regression.
If it passes: Good — MobileProvider doesn't break the tree.

#### GREEN

In `src/App.jsx`, add imports (after existing imports around line 27):
```js
import { MobileProvider } from './context/MobileContext';
import { useMobileLayout } from './hooks/useMobileLayout';
```

Inside the `App` function body (near line 94, with other state):
```js
const { isMobile } = useMobileLayout();
```

Wrap `StarmapProvider` (line 407) with `MobileProvider`:
```jsx
<MobileProvider isMobile={isMobile}>
  <StarmapProvider value={starmapMethods}>
    {/* ... existing content unchanged ... */}
  </StarmapProvider>
</MobileProvider>
```

Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- Is `useMobileLayout()` called at the right level? It's called in `App` which is inside `GameProvider` — correct. It needs to be above `StarmapProvider` but doesn't need game state.
- Could `MobileProvider` be moved higher (e.g., `main.jsx`)? No — `useMobileLayout()` is a hook that needs a React component. `App` is the right place since title screen doesn't need mobile context.
- Actually, title screen DOES render at 375px. Check: is `MobileProvider` wrapping title screen too? No — it only wraps the `StarmapProvider` branch (lines 405-406 conditional). Title screen mobile is handled purely via CSS (Task 8), so this is fine.

Commit: `git commit -m "feat: wire MobileProvider into App.jsx component tree"`

---

## Task 8: Title Screen Mobile Styles

**Requirement:** Spec Section 0 — Mobile-responsive title screen so players can start the game.

**Files:**
- Modify: `css/hud.css` (add mobile media query after menu styles, ~line 870)
- Test: `tests/unit/title-screen-mobile.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Title screen mobile styles', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should have a mobile media query for .menu-content', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.menu-content\s*\{[^}]*min-width:\s*0/s);
  });

  it('should reduce .menu-title font-size on mobile', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.menu-title\s*\{[^}]*font-size:\s*24px/s);
  });
});
```

Run: `npm test -- tests/unit/title-screen-mobile.test.js`
Expected failure: No mobile media query for menu styles.

#### GREEN

In `css/hud.css`, after the `.menu-footer` block (near end of title screen styles):

```css
/* Mobile title screen — breakpoint: 600px matches --breakpoint-mobile */
@media (max-width: 600px) {
  .menu-content {
    min-width: 0;
    padding: 20px;
  }

  .menu-title {
    font-size: 24px;
    letter-spacing: 1px;
  }

  .menu-subtitle {
    font-size: 12px;
    margin-bottom: 24px;
  }

  .menu-buttons {
    gap: 10px;
    margin-bottom: 20px;
  }

  .menu-footer {
    font-size: 10px;
  }
}
```

Run: `npm test -- tests/unit/title-screen-mobile.test.js` — PASS
Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- The `.menu-btn` height is 60px (line ~847). Spec says keep it — 60px > 44px touch target minimum. Don't change it.
- Are there other title screen elements not covered? Check `.title-screen` class — it has `z-index: 1000`. This doesn't need a mobile override since it's already full-screen.
- Could the mobile overrides use existing CSS variables instead of magic numbers? `24px` and `12px` aren't in `variables.css`. Don't add them — these are one-off mobile overrides, not reusable values.

Commit: `git commit -m "feat: add mobile-responsive title screen styles"`

---

## Task 9: `.panel-base` Mobile Override

**Requirement:** Spec Section 2 — `.panel-base` gets full-screen mobile treatment with solid background and safe area padding.

**Files:**
- Modify: `css/variables.css` (add mobile media query for `.panel-base`)
- Test: `tests/unit/panel-base-mobile.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('.panel-base mobile treatment', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should have a 600px mobile media query for .panel-base', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.panel-base\s*\{/s);
  });

  it('should set solid background on mobile .panel-base', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.panel-base\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('background-color');
  });

  it('should apply safe area top padding on mobile .panel-base', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.panel-base\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('--safe-top');
  });
});
```

Run: `npm test -- tests/unit/panel-base-mobile.test.js`
Expected failure: No mobile media query for `.panel-base`.

#### GREEN

In `css/variables.css`, add a mobile media query (can be a new block or merged into existing):

```css
/* Breakpoint: 600px matches --breakpoint-mobile */
@media (max-width: 600px) {
  .panel-base {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    transform: none;
    border-radius: 0;
    background-color: var(--bg-panel);
    padding-top: calc(var(--panel-padding) + var(--safe-top, 0px));
    overflow-y: auto;
  }
}
```

Run: `npm test -- tests/unit/panel-base-mobile.test.js` — PASS

#### REFACTOR

Look for:
- This duplicates the positioning from `.centered-panel`'s mobile override. This is intentional — `.panel-base` has its own visibility semantics (`display: none` + `.visible` toggle) that make inheriting from `.centered-panel` risky. Document this with a comment: `/* Mirrors .centered-panel mobile override — kept separate due to .panel-base visibility logic */`
- Count the mobile `@media` blocks in `variables.css`. If there are now 3+, consider consolidating adjacent ones into a single block with section comments.

Commit: `git commit -m "feat: add mobile full-screen override for .panel-base with safe area padding"`

---

## Task 10: Modal Mobile Styles

**Requirement:** Spec Section 2 — Modals: reduced padding, stacked buttons, 44px touch targets.

**Files:**
- Modify: `css/modals.css` (add mobile media query at end)
- Test: `tests/unit/modal-mobile.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Modal mobile styles', () => {
  const css = readFileSync(resolve('css/modals.css'), 'utf-8');

  it('should have a 600px mobile media query for .modal-dialog', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.modal-dialog\s*\{/s);
  });

  it('should reduce padding on mobile', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^]*\.modal-dialog\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('padding');
  });

  it('should set minimum touch target height for modal buttons', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*min-height:\s*44px/s);
  });
});
```

Run: `npm test -- tests/unit/modal-mobile.test.js`
Expected failure: No mobile media query in modals.css.

#### GREEN

At the end of `css/modals.css`:

```css
/* Mobile modal styles — breakpoint: 600px matches --breakpoint-mobile */
@media (max-width: 600px) {
  .modal-dialog {
    padding: 16px;
    width: 100%;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-actions button {
    width: 100%;
    min-height: 44px;
  }
}
```

Run: `npm test -- tests/unit/modal-mobile.test.js` — PASS

#### REFACTOR

Look for:
- Does `.modal-actions` actually exist as a class? Grep the codebase. If the modal buttons use a different class name, adjust the selector.
- Are there modal-specific styles elsewhere (e.g., `JumpDialog` uses `.jump-dialog` not `.modal-dialog`)? This task only covers the generic Modal component. JumpDialog has its own CSS.

Commit: `git commit -m "feat: add mobile styles for modal dialogs"`

---

## Task 11: Normalize Encounter Panel Breakpoints

**Requirement:** Spec Section 2 — Standardize all encounter panel breakpoints to canonical `600px` and `900px`.

**Files:**
- Modify: `css/panel/danger-warning.css` (800px → 900px)
- Modify: `css/panel/dialogue.css` (768px → 900px)
- Modify: `css/panel/inspection.css` (1000px → 900px)
- Modify: `css/panel/outcome.css` (1000px → 900px)
- Test: `tests/unit/encounter-breakpoint-consistency.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ENCOUNTER_FILES = [
  'combat.css', 'danger-warning.css', 'dialogue.css', 'distress-call.css',
  'inspection.css', 'mechanical-failure.css', 'negotiation.css',
  'outcome.css', 'pirate-encounter.css',
];

const CANONICAL_BREAKPOINTS = [600, 900];

describe('Encounter panel breakpoint consistency', () => {
  it.each(ENCOUNTER_FILES)(
    '%s should only use canonical breakpoints (600px, 900px)',
    (file) => {
      const css = readFileSync(resolve('css/panel', file), 'utf-8');
      const breakpoints = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)];
      breakpoints.forEach((match) => {
        const value = parseInt(match[1], 10);
        expect(
          CANONICAL_BREAKPOINTS,
          `${file} uses non-canonical breakpoint ${value}px`
        ).toContain(value);
      });
    }
  );
});
```

Run: `npm test -- tests/unit/encounter-breakpoint-consistency.test.js`
Expected failure: dialogue.css (768px), danger-warning.css (800px), inspection.css (1000px), outcome.css (1000px).

#### GREEN

Change the `@media` breakpoint values:
- `css/panel/danger-warning.css`: `@media (max-width: 800px)` → `@media (max-width: 900px)`
- `css/panel/dialogue.css`: `@media (max-width: 768px)` → `@media (max-width: 900px)`
- `css/panel/inspection.css`: `@media (max-width: 1000px)` → `@media (max-width: 900px)`
- `css/panel/outcome.css`: `@media (max-width: 1000px)` → `@media (max-width: 900px)`

Add a comment above each media query: `/* Breakpoint matches --breakpoint-tablet */` or `/* Breakpoint matches --breakpoint-mobile */`

Run: `npm test -- tests/unit/encounter-breakpoint-consistency.test.js` — PASS

#### REFACTOR

Look for:
- After changing breakpoints, read the rules inside each changed media query. Do the layout adjustments still make sense at the new threshold? For example, `inspection.css` triggered at 1000px → now 900px. If its rules reduced column widths, that's fine at 900px too. If they did something drastic assuming a very wide screen, adjust.
- Are there non-encounter panel CSS files that also use non-canonical breakpoints? This task only covers encounter files — don't scope-creep.

Commit: `git commit -m "feat: normalize encounter panel breakpoints to canonical 600px and 900px"`

---

## Task 12: Encounter Panels Full-Screen Mobile

**Requirement:** Spec Section 2 — Add `position: fixed` full-viewport treatment at 600px for all encounter panels.

**Files:**
- Modify: `css/panel/combat.css`, `css/panel/danger-warning.css`, `css/panel/dialogue.css`, `css/panel/distress-call.css`, `css/panel/inspection.css`, `css/panel/mechanical-failure.css`, `css/panel/negotiation.css`, `css/panel/outcome.css`, `css/panel/pirate-encounter.css`
- Test: `tests/unit/encounter-fullscreen-mobile.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ENCOUNTER_PANELS = [
  { file: 'combat.css', selector: '.combat-panel' },
  { file: 'danger-warning.css', selector: '.danger-warning-dialog' },
  { file: 'dialogue.css', selector: '.dialogue-panel' },
  { file: 'distress-call.css', selector: '.distress-call-panel' },
  { file: 'inspection.css', selector: '.inspection-panel' },
  { file: 'mechanical-failure.css', selector: '.mechanical-failure-panel' },
  { file: 'negotiation.css', selector: '.negotiation-panel' },
  { file: 'outcome.css', selector: '.outcome-panel' },
  { file: 'pirate-encounter.css', selector: '.pirate-encounter-panel' },
];

describe('Encounter panels full-screen on mobile', () => {
  it.each(ENCOUNTER_PANELS)(
    '$file should have position: fixed in 600px media query',
    ({ file }) => {
      const css = readFileSync(resolve('css/panel', file), 'utf-8');
      const mobileBlock = css.match(/@media\s*\(max-width:\s*600px\)\s*\{([^]*?)\n\}/g);
      expect(mobileBlock).not.toBeNull();
      const combined = mobileBlock.join('\n');
      expect(combined).toContain('position: fixed');
    }
  );
});
```

Run: `npm test -- tests/unit/encounter-fullscreen-mobile.test.js`
Expected failure: Panels don't have `position: fixed` in their 600px blocks.

#### GREEN

For each encounter panel CSS file, in the existing `@media (max-width: 600px)` block, add full-viewport rules to the root panel selector. Merge into existing selector if one exists:

```css
  .combat-panel {  /* use actual selector per file */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    transform: none;
    border-radius: 0;
    overflow-y: auto;
    padding-top: calc(var(--panel-padding, 20px) + var(--safe-top, 0px));
  }
```

Run: `npm test -- tests/unit/encounter-fullscreen-mobile.test.js` — PASS
Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- The full-viewport mobile pattern (`position: fixed; top: 0; left: 0; width/height: 100%...`) is now repeated in `.panel-base`, `.centered-panel`, and 9 encounter panel files. This is acceptable because encounter panels have their own root selectors (not `.panel-base`). Add a comment at the top of each encounter panel's mobile block: `/* Full-screen mobile treatment — matches .panel-base mobile override */`
- Check that no encounter panel's existing 600px rules conflict with the new fixed positioning (e.g., if an existing rule set `width: 90%`, it would fight `width: 100%`). The new rules should come first in the block so existing rules override if needed.

Commit: `git commit -m "feat: add full-screen mobile treatment for all encounter panels"`

---

## Task 13: NarrativeEventPanel Adopts `.centered-panel`

**Requirement:** Spec Section 2 — NarrativeEventPanel uses `.centered-panel` class, removes duplicate positioning.

**Files:**
- Modify: `css/panel/narrative-event.css:1-16` (remove duplicate positioning)
- Modify: `src/features/narrative/NarrativeEventPanel.jsx:75` (add `centered-panel` class)
- Test: `tests/unit/narrative-panel-centered.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('NarrativeEventPanel uses .centered-panel', () => {
  it('NarrativeEventPanel.jsx should include centered-panel class', () => {
    const jsx = readFileSync(
      resolve('src/features/narrative/NarrativeEventPanel.jsx'), 'utf-8'
    );
    expect(jsx).toContain('centered-panel');
  });

  it('narrative-event.css should not duplicate center-positioning', () => {
    const css = readFileSync(resolve('css/panel/narrative-event.css'), 'utf-8');
    expect(css).not.toMatch(
      /#narrative-event-panel\s*\{[^}]*transform:\s*translate\(-50%,\s*-50%\)/s
    );
  });
});
```

Run: `npm test -- tests/unit/narrative-panel-centered.test.js`
Expected failure: JSX doesn't have `centered-panel` class; CSS still has `transform`.

#### GREEN

In `css/panel/narrative-event.css`, remove from `#narrative-event-panel`:
- `position: absolute;`
- `top: 50%;`
- `left: 50%;`
- `transform: translate(-50%, -50%);`

Keep all other properties (width, max-height, padding, background, border, color, font-size, display, z-index, overflow-y).

In `src/features/narrative/NarrativeEventPanel.jsx:75`, change `className="visible"` to `className="centered-panel visible"`.

Run: `npm test -- tests/unit/narrative-panel-centered.test.js` — PASS
Run: `npm test` — All tests pass (desktop unchanged — `.centered-panel` provides same positioning).

#### REFACTOR

Look for:
- Does `#narrative-event-panel` still have `z-index: var(--z-modal)` (1100)? That's higher than `--z-panel-fullscreen` (30). On mobile, the `.centered-panel` override makes it full-screen but the z-index stays at 1100. This is correct — narrative events should appear above other panels, same as on desktop.
- The `display: none` / `.visible` toggle in narrative-event.css still works independently from `.centered-panel`. Verify: `.centered-panel` doesn't set `display`. Correct — it only sets positioning.

Commit: `git commit -m "refactor: NarrativeEventPanel adopts .centered-panel, removes duplicate positioning"`

---

## Task 14: Auto-Clear `viewingSystemId` on Mobile Station Entry

**Requirement:** Spec Section 2 — SystemPanel conflict. On mobile, clear `viewingSystemId` when entering STATION view.

**Files:**
- Modify: `src/App.jsx:246-256` (`handleDock` function)
- Test: `tests/unit/mobile-station-auto-clear.test.js`

#### RED

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-utils';

describe('Auto-clear viewingSystemId on mobile station entry', () => {
  let game;

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn(() => ({
      matches: true, // mobile
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should clear SystemPanel when docking on mobile with a system selected', async () => {
    game = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    game.initNewGame();

    render(
      <GameProvider game={game}>
        <App />
      </GameProvider>
    );

    // Start a new game to get past title screen
    const newGameBtn = screen.getByText(/new game/i);
    fireEvent.click(newGameBtn);

    // Name the ship to get to ORBIT mode
    const nameInput = await screen.findByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Test Ship' } });
    const confirmBtn = screen.getByText(/confirm|accept|start/i);
    fireEvent.click(confirmBtn);

    // Now in ORBIT mode — simulate selecting a system by clicking the
    // System Info button (which sets viewingSystemId)
    await waitFor(() => {
      const sysInfoBtn = screen.queryByRole('button', { name: /system info/i });
      if (sysInfoBtn) fireEvent.click(sysInfoBtn);
    });

    // Verify SystemPanel appeared (viewingSystemId is set)
    // Then dock — which should clear it on mobile
    const dockBtn = screen.queryByRole('button', { name: /dock/i });
    if (dockBtn) fireEvent.click(dockBtn);

    // SystemPanel should be gone after docking on mobile
    await waitFor(() => {
      expect(document.querySelector('.system-panel')).toBeNull();
    });
  });
});
```

Run: `npm test -- tests/unit/mobile-station-auto-clear.test.js`
Expected failure: SystemPanel persists after docking because `handleDock` doesn't clear `viewingSystemId` on mobile yet. The test may need adjustment during implementation based on actual button labels and component rendering — the key assertion is that `.system-panel` disappears after docking on mobile.
If it passes unexpectedly: The test setup may not be selecting a system. Verify that SystemPanel was actually rendered before docking. Add an intermediate assertion if needed.

#### GREEN

In `src/App.jsx`, modify `handleDock` (around line 246). Change the `else` branch:

```js
const handleDock = () => {
  if (viewMode === VIEW_MODES.STATION) {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
  } else {
    game.dock();
    setViewMode(VIEW_MODES.STATION);
    if (isMobile) {
      setViewingSystemId(null);
    }
  }
};
```

`isMobile` comes from the `useMobileLayout()` call already in the function (Task 7).

Run: `npm test -- tests/unit/mobile-station-auto-clear.test.js` — PASS
Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- `handleUndock` (line 258) already clears `viewingSystemId` unconditionally. Should `handleDock` also clear unconditionally (not just on mobile)? The spec says "This also improves desktop UX where the overlap isn't ideal either." Consider removing the `if (isMobile)` guard and always clearing — but the spec specifically says "On mobile, auto-clear." Follow the spec.
- Are there other places where `setViewMode(VIEW_MODES.STATION)` is called that should also clear `viewingSystemId` on mobile? Search `App.jsx` for `VIEW_MODES.STATION`. If there are other entry points to station mode, apply the same logic.

Commit: `git commit -m "feat: auto-clear viewingSystemId on mobile station entry to prevent overlap"`

---

## Task 15: Mobile HUD — Collapsed Summary Bar

**Requirement:** Spec Section 3 — MobileHUD with collapsed bar, expand/collapse, worst resource indicator, and auto-collapse on panel open.

**Files:**
- Create: `src/features/hud/MobileHUD.jsx`
- Test: `tests/unit/mobile-hud.test.jsx`

**Reference:** `src/game/constants.js:219-228` for `CONDITION_WARNING_THRESHOLDS` and `UI_CONDITION_DISPLAY_THRESHOLDS`.

#### RED

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHUD } from '../../src/features/hud/MobileHUD';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/hud/ResourceBar', () => ({
  ResourceBar: () => <div data-testid="resource-bar">ResourceBar</div>,
}));
vi.mock('../../src/features/hud/DateDisplay', () => ({
  DateDisplay: () => <div data-testid="date-display">DateDisplay</div>,
}));
vi.mock('../../src/features/hud/ShipStatus', () => ({
  ShipStatus: () => <div data-testid="ship-status">ShipStatus</div>,
}));
vi.mock('../../src/features/hud/LocationDisplay', () => ({
  LocationDisplay: () => <div data-testid="location-display">LocationDisplay</div>,
}));
vi.mock('../../src/features/hud/QuickAccessButtons', () => ({
  QuickAccessButtons: () => <div data-testid="quick-access">QuickAccessButtons</div>,
}));
vi.mock('../../src/features/hud/ActiveMissions', () => ({
  ActiveMissions: () => <div data-testid="active-missions">ActiveMissions</div>,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    const defaults = {
      shipNameChanged: 'Test Ship',
      creditsChanged: 500,
      fuelChanged: 80,
      shipConditionChanged: { hull: 70, engine: 90, lifeSupport: 15 },
    };
    return defaults[eventName] ?? null;
  },
}));

describe('MobileHUD', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderMobileHUD = (props = {}) =>
    render(
      <MobileProvider isMobile={true}>
        <MobileHUD onDock={() => {}} onSystemInfo={() => {}} panelActive={false} {...props} />
      </MobileProvider>
    );

  it('should render collapsed summary bar by default', () => {
    renderMobileHUD();
    expect(screen.getByText('Test Ship')).toBeTruthy();
    expect(screen.getByText('500 CR')).toBeTruthy();
  });

  it('should show worst resource indicator', () => {
    renderMobileHUD();
    expect(screen.getByText(/Life Sup/i)).toBeTruthy();
    expect(screen.getByText(/15%/)).toBeTruthy();
  });

  it('should expand when summary bar is tapped', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    expect(screen.getByTestId('resource-bar')).toBeTruthy();
    expect(screen.getByTestId('ship-status')).toBeTruthy();
  });

  it('should collapse when summary bar is tapped again', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    fireEvent.click(screen.getByRole('button', { name: /collapse hud/i }));
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });

  it('should collapse when backdrop is tapped', () => {
    renderMobileHUD();
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    fireEvent.click(screen.getByTestId('hud-backdrop'));
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });

  it('should auto-collapse when panelActive becomes true', () => {
    const { rerender } = render(
      <MobileProvider isMobile={true}>
        <MobileHUD onDock={() => {}} onSystemInfo={() => {}} panelActive={false} />
      </MobileProvider>
    );
    // Expand first
    fireEvent.click(screen.getByRole('button', { name: /expand hud/i }));
    expect(screen.getByTestId('resource-bar')).toBeTruthy();

    // Simulate panel opening
    rerender(
      <MobileProvider isMobile={true}>
        <MobileHUD onDock={() => {}} onSystemInfo={() => {}} panelActive={true} />
      </MobileProvider>
    );
    expect(screen.queryByTestId('resource-bar')).toBeNull();
  });
});
```

Run: `npm test -- tests/unit/mobile-hud.test.jsx`
Expected failure: Module not found.

#### GREEN

Create `src/features/hud/MobileHUD.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES, SHIP_CONFIG } from '../../game/constants.js';
import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { LocationDisplay } from './LocationDisplay';
import { QuickAccessButtons } from './QuickAccessButtons';
import { ActiveMissions } from './ActiveMissions.jsx';

function getWorstResources(fuel, condition) {
  const resources = [
    { name: 'Fuel', value: Math.round(fuel ?? 100) },
    { name: 'Hull', value: Math.round(condition?.hull ?? 100) },
    { name: 'Engine', value: Math.round(condition?.engine ?? 100) },
    { name: 'Life Sup', value: Math.round(condition?.lifeSupport ?? 100) },
  ];
  resources.sort((a, b) => a.value - b.value);

  const critical = SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.POOR;
  const criticalResources = resources.filter((r) => r.value < critical);
  if (criticalResources.length >= 2) return criticalResources.slice(0, 2);
  return [resources[0]];
}

function getSeverityClass(value) {
  if (value < SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.POOR) return 'critical';
  if (value < SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.FAIR) return 'warning';
  return 'ok';
}

export function MobileHUD({ onDock, onSystemInfo, panelActive }) {
  const [expanded, setExpanded] = useState(false);
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const condition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);

  useEffect(() => {
    if (panelActive) setExpanded(false);
  }, [panelActive]);

  const worst = getWorstResources(fuel, condition);

  return (
    <>
      <button
        className="mobile-hud-bar"
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse HUD' : 'Expand HUD'}
        aria-expanded={expanded}
      >
        <span className="mobile-hud-ship">{shipName}</span>
        <span className="mobile-hud-credits">{credits ?? 0} CR</span>
        <span className="mobile-hud-resources">
          {worst.map((r) => (
            <span key={r.name} className={`mobile-hud-indicator ${getSeverityClass(r.value)}`}>
              {r.name} {r.value}%
            </span>
          ))}
        </span>
      </button>

      {expanded && (
        <>
          <div
            className="mobile-hud-backdrop"
            data-testid="hud-backdrop"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
          <div className="mobile-hud-expanded" role="region" aria-label="Ship status details">
            <ResourceBar />
            <DateDisplay />
            <ShipStatus />
            <LocationDisplay />
            <QuickAccessButtons onDock={onDock} onSystemInfo={onSystemInfo} />
            <ActiveMissions />
          </div>
        </>
      )}
    </>
  );
}
```

Run: `npm test -- tests/unit/mobile-hud.test.jsx` — PASS (adjust mock event name strings to match actual `EVENT_NAMES` values if needed).

#### REFACTOR

Look for:
- `getWorstResources` and `getSeverityClass` are pure utility functions. Should they live in a separate utils file? Not yet — they're only used here. If another component needs severity colors later, extract then.
- The `panelActive` prop wiring needs to come from `HUD.jsx` or `App.jsx`. This will be wired in Task 16. Verify the prop name is consistent.
- Are `SHIP_CONFIG.UI_CONDITION_DISPLAY_THRESHOLDS.POOR` and `.FAIR` the right thresholds? Check `constants.js:224-228`: POOR=25, FAIR=50. These match the spec's "existing warning thresholds."

Commit: `git commit -m "feat: add MobileHUD component with collapsed bar, expand/collapse, and auto-collapse"`

---

## Task 16: Wire MobileHUD into HUD.jsx

**Requirement:** Spec Section 3 — HUD conditionally renders MobileHUD or desktop layout.

**Files:**
- Modify: `src/features/hud/HUD.jsx`
- Test: `tests/unit/hud-mobile-switch.test.jsx`

#### RED

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { HUD } from '../../src/features/hud/HUD';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/hud/ResourceBar', () => ({
  ResourceBar: () => <div data-testid="resource-bar" />,
}));
vi.mock('../../src/features/hud/DateDisplay', () => ({
  DateDisplay: () => <div data-testid="date-display" />,
}));
vi.mock('../../src/features/hud/ShipStatus', () => ({
  ShipStatus: () => <div data-testid="ship-status" />,
}));
vi.mock('../../src/features/hud/LocationDisplay', () => ({
  LocationDisplay: () => <div data-testid="location-display" />,
}));
vi.mock('../../src/features/hud/QuickAccessButtons', () => ({
  QuickAccessButtons: () => <div data-testid="quick-access" />,
}));
vi.mock('../../src/features/hud/ActiveMissions', () => ({
  ActiveMissions: () => <div data-testid="active-missions" />,
}));
vi.mock('../../src/features/hud/MobileHUD', () => ({
  MobileHUD: () => <div data-testid="mobile-hud" />,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));

afterEach(() => vi.restoreAllMocks());

describe('HUD mobile/desktop switch', () => {
  it('should render desktop HUD when not mobile', () => {
    const { container } = render(
      <MobileProvider isMobile={false}>
        <HUD onDock={() => {}} onSystemInfo={() => {}} />
      </MobileProvider>
    );
    expect(container.querySelector('#game-hud')).toBeTruthy();
    expect(container.querySelector('[data-testid="mobile-hud"]')).toBeNull();
  });

  it('should render MobileHUD when mobile', () => {
    const { container } = render(
      <MobileProvider isMobile={true}>
        <HUD onDock={() => {}} onSystemInfo={() => {}} />
      </MobileProvider>
    );
    expect(container.querySelector('[data-testid="mobile-hud"]')).toBeTruthy();
    expect(container.querySelector('#game-hud')).toBeNull();
  });
});
```

Run: `npm test -- tests/unit/hud-mobile-switch.test.jsx`
Expected failure: HUD always renders desktop.

#### GREEN

Update `src/features/hud/HUD.jsx`:

```jsx
import { ResourceBar } from './ResourceBar';
import { DateDisplay } from './DateDisplay';
import { ShipStatus } from './ShipStatus';
import { LocationDisplay } from './LocationDisplay';
import { QuickAccessButtons } from './QuickAccessButtons';
import { ActiveMissions } from './ActiveMissions.jsx';
import { MobileHUD } from './MobileHUD';
import { useMobile } from '../../context/MobileContext';

export function HUD({ onDock, onSystemInfo, panelActive }) {
  const { isMobile } = useMobile();

  if (isMobile) {
    return <MobileHUD onDock={onDock} onSystemInfo={onSystemInfo} panelActive={panelActive} />;
  }

  return (
    <div id="game-hud" className="visible">
      <ResourceBar />
      <DateDisplay />
      <ShipStatus />
      <LocationDisplay />
      <QuickAccessButtons onDock={onDock} onSystemInfo={onSystemInfo} />
      <ActiveMissions />
    </div>
  );
}
```

Also update `App.jsx` where `<HUD>` is rendered (line ~422) to pass `panelActive`:
```jsx
<HUD onDock={handleDock} onSystemInfo={handleOpenSystemInfo} panelActive={activePanel !== null || viewMode === VIEW_MODES.ENCOUNTER} />
```

Run: `npm test -- tests/unit/hud-mobile-switch.test.jsx` — PASS
Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- Does `panelActive` need to account for other full-screen states beyond `activePanel` and `ENCOUNTER`? Check `viewingSystemId` — on mobile it's cleared on station entry (Task 14), and SystemPanel isn't full-screen on desktop. The `panelActive` signal should cover the cases where something is truly full-screen over the HUD.
- The `panelActive` prop flows `App → HUD → MobileHUD`. On desktop, HUD ignores it. This is clean — no unnecessary prop drilling since it's one level.

Commit: `git commit -m "feat: HUD conditionally renders MobileHUD or desktop layout based on isMobile"`

---

## Task 17: Mobile HUD CSS

**Requirement:** Spec Section 3 — Styles for collapsed bar, expanded overlay, backdrop, severity indicators.

**Files:**
- Modify: `css/hud.css` (add mobile HUD styles at end)
- Test: `tests/unit/mobile-hud-css.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile HUD CSS', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should define .mobile-hud-bar styles', () => {
    expect(css).toMatch(/\.mobile-hud-bar\s*\{/);
  });

  it('should define .mobile-hud-expanded styles', () => {
    expect(css).toMatch(/\.mobile-hud-expanded\s*\{/);
  });

  it('should define .mobile-hud-backdrop styles', () => {
    expect(css).toMatch(/\.mobile-hud-backdrop\s*\{/);
  });

  it('should use z-index variables for mobile HUD layers', () => {
    expect(css).toContain('var(--z-hud-collapsed)');
    expect(css).toContain('var(--z-hud-expanded)');
  });

  it('should define severity color classes', () => {
    expect(css).toMatch(/\.mobile-hud-indicator\.critical/);
    expect(css).toMatch(/\.mobile-hud-indicator\.warning/);
    expect(css).toMatch(/\.mobile-hud-indicator\.ok/);
  });
});
```

Run: `npm test -- tests/unit/mobile-hud-css.test.js`
Expected failure: No mobile HUD styles.

#### GREEN

At the end of `css/hud.css`:

```css
/* Mobile HUD — collapsed summary bar */
.mobile-hud-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 48px;
  padding: 0 12px;
  padding-top: var(--safe-top, 0px);
  background-color: var(--bg-overlay-darker);
  border: none;
  border-bottom: 1px solid var(--border-primary);
  color: var(--color-primary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-medium);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: var(--z-hud-collapsed);
  cursor: pointer;
  text-align: left;
}

.mobile-hud-ship {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.mobile-hud-credits {
  flex: 0 0 auto;
  color: var(--color-white);
}

.mobile-hud-resources {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

.mobile-hud-indicator.ok { color: var(--color-primary); }
.mobile-hud-indicator.warning { color: var(--color-warning); }
.mobile-hud-indicator.critical { color: var(--color-danger); }

/* Mobile HUD — expanded overlay */
.mobile-hud-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-hud-expanded);
}

.mobile-hud-expanded {
  position: fixed;
  top: calc(48px + var(--safe-top, 0px));
  left: 0;
  width: 100%;
  max-height: calc(100vh - 48px - var(--safe-top, 0px));
  overflow-y: auto;
  background-color: var(--bg-overlay-darker);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--section-padding);
  color: var(--color-primary);
  font-family: var(--font-family-mono);
  z-index: var(--z-hud-expanded);
}
```

Run: `npm test -- tests/unit/mobile-hud-css.test.js` — PASS

#### REFACTOR

Look for:
- Do `--color-warning` and `--color-danger` exist in `variables.css`? Verify. If not, use the actual color values or add them.
- The expanded overlay's `top` uses `calc(48px + var(--safe-top, 0px))` to align with the bar bottom on notched phones. Verify this matches visually in Chrome DevTools device emulation with a notched device profile.

Commit: `git commit -m "feat: add mobile HUD CSS for collapsed bar, expanded overlay, and severity indicators"`

---

## Task 18: Station Menu Full-Screen Mobile + PostCreditsStation Verification

**Requirement:** Spec Section 4 — Station menu takes full screen on mobile. Verify PostCreditsStation also works.

**Files:**
- Modify: `css/hud.css` (add mobile override for `#station-interface`)
- Test: `tests/unit/station-mobile.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Station menu mobile styles', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should have a 600px media query for #station-interface', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*#station-interface\s*\{/s
    );
  });

  it('should make station interface fixed full-screen on mobile', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#station-interface\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toContain('position: fixed');
    expect(mobileBlock[1]).toContain('width: 100%');
    expect(mobileBlock[1]).toContain('height: 100%');
  });
});
```

Run: `npm test -- tests/unit/station-mobile.test.js`
Expected failure: No mobile media query for `#station-interface`.

#### GREEN

In `css/hud.css`, add:

```css
/* Mobile station menu — breakpoint: 600px matches --breakpoint-mobile */
@media (max-width: 600px) {
  #station-interface {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    transform: none;
    border-radius: 0;
    padding-top: calc(20px + var(--safe-top, 0px));
    padding-bottom: calc(20px + var(--safe-bottom, 0px));
  }
}
```

Run: `npm test -- tests/unit/station-mobile.test.js` — PASS

#### REFACTOR

Look for:
- **PostCreditsStation verification:** Read `src/features/endgame/PostCreditsStation.jsx`. It uses `<div id="station-interface" className="visible">` (line 28), same as `StationMenu`. Compare the internal structure — does PostCreditsStation have different button layouts, extra sections, or elements that might not fit the full-screen treatment? If so, add targeted CSS overrides. If the structure is similar enough, the shared `#station-interface` mobile CSS covers both.
- The `transform: none` override is needed because the desktop rule has `transform: translateX(-50%)` for centering. Verify this is in the original rule (line 517) — yes it is.
- Station buttons are in `.station-btn` class. Are they already ≥48px tall on mobile? Check and add `min-height: 48px` if needed.

Commit: `git commit -m "feat: add full-screen mobile styles for station menu"`

---

## Task 19: Mobile Camera Toolbar Component

**Requirement:** Spec Section 5 — Floating bottom toolbar with zoom, Find (native select), and settings popover.

**Files:**
- Create: `src/features/navigation/MobileCameraToolbar.jsx`
- Test: `tests/unit/mobile-camera-toolbar.test.jsx`

#### RED

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileCameraToolbar } from '../../src/features/navigation/MobileCameraToolbar';

describe('MobileCameraToolbar', () => {
  afterEach(() => vi.restoreAllMocks());

  const defaultProps = {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFindStar: vi.fn(),
    stars: [
      { id: 0, name: 'Sol' },
      { id: 1, name: 'Alpha Centauri' },
    ],
    toggles: {
      showAntimatter: false,
      showJumpWarnings: true,
      showRotation: true,
      showBoundary: false,
    },
    onToggle: vi.fn(),
  };

  it('should render zoom buttons', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeTruthy();
  });

  it('should render a Find Star select', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('combobox', { name: /find star/i })).toBeTruthy();
  });

  it('should render a settings button', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeTruthy();
  });

  it('should call onZoomIn when pressed', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(defaultProps.onZoomIn).toHaveBeenCalled();
  });

  it('should show settings popover when pressed', () => {
    render(<MobileCameraToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText(/Antimatter/i)).toBeTruthy();
    expect(screen.getByText(/Jump Warnings/i)).toBeTruthy();
  });

  it('all buttons should have mobile-toolbar-btn class', () => {
    const { container } = render(<MobileCameraToolbar {...defaultProps} />);
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn.classList.contains('mobile-toolbar-btn')).toBe(true);
    });
  });
});
```

Run: `npm test -- tests/unit/mobile-camera-toolbar.test.jsx`
Expected failure: Module not found.

#### GREEN

Create `src/features/navigation/MobileCameraToolbar.jsx`:

```jsx
import { useState } from 'react';

export function MobileCameraToolbar({
  onZoomIn, onZoomOut, onFindStar, stars, toggles, onToggle,
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="mobile-camera-toolbar" role="toolbar" aria-label="Starmap controls">
      <button className="mobile-toolbar-btn" onClick={onZoomOut} aria-label="Zoom out">−</button>
      <button className="mobile-toolbar-btn" onClick={onZoomIn} aria-label="Zoom in">+</button>
      <label className="mobile-toolbar-find">
        <select
          className="mobile-toolbar-select"
          onChange={(e) => onFindStar(e.target.value)}
          defaultValue=""
          aria-label="Find star"
        >
          <option value="" disabled>Find...</option>
          {stars.map((star) => (
            <option key={star.id} value={star.id}>{star.name}</option>
          ))}
        </select>
      </label>
      <button
        className="mobile-toolbar-btn"
        onClick={() => setShowSettings(!showSettings)}
        aria-label="Settings"
        aria-expanded={showSettings}
      >
        ⚙
      </button>

      {showSettings && (
        <div className="mobile-toolbar-popover">
          {Object.entries(toggles).map(([key, value]) => {
            const label = key.replace(/^show/, '').replace(/([A-Z])/g, ' $1').trim();
            return (
              <label key={key} className="mobile-toolbar-toggle">
                <input type="checkbox" checked={value} onChange={() => onToggle(key)} />
                {label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

Run: `npm test -- tests/unit/mobile-camera-toolbar.test.jsx` — PASS

#### REFACTOR

Look for:
- The toggle label derivation (`key.replace(/^show/, '').replace(...)`) is a simple string transform. Does it produce correct labels? `showAntimatter` → "Antimatter", `showJumpWarnings` → "Jump Warnings". Yes, correct.
- The `stars` prop expects `[{ id, name }]`. Does `CameraControls.jsx` have stars in that format? Check when wiring in Task 20.

Commit: `git commit -m "feat: add MobileCameraToolbar component with zoom, find, and settings controls"`

---

## Task 20: Wire MobileCameraToolbar into CameraControls

**Requirement:** Spec Section 5 — CameraControls conditionally renders mobile toolbar or desktop panel.

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx`
- Test: `tests/unit/camera-controls-mobile-switch.test.jsx`

#### RED

```jsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MobileProvider } from '../../src/context/MobileContext';

vi.mock('../../src/features/navigation/MobileCameraToolbar', () => ({
  MobileCameraToolbar: () => <div data-testid="mobile-camera-toolbar" />,
}));
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => null,
}));

afterEach(() => vi.restoreAllMocks());

describe('CameraControls mobile/desktop switch', () => {
  it('should render mobile toolbar when isMobile is true', async () => {
    const { CameraControls } = await import(
      '../../src/features/navigation/CameraControls'
    );
    const { container } = render(
      <MobileProvider isMobile={true}>
        <CameraControls />
      </MobileProvider>
    );
    expect(container.querySelector('[data-testid="mobile-camera-toolbar"]')).toBeTruthy();
    expect(container.querySelector('#camera-controls')).toBeNull();
  });

  it('should render desktop controls when isMobile is false', async () => {
    const { CameraControls } = await import(
      '../../src/features/navigation/CameraControls'
    );
    const { container } = render(
      <MobileProvider isMobile={false}>
        <CameraControls />
      </MobileProvider>
    );
    expect(container.querySelector('#camera-controls')).toBeTruthy();
    expect(container.querySelector('[data-testid="mobile-camera-toolbar"]')).toBeNull();
  });
});
```

Run: `npm test -- tests/unit/camera-controls-mobile-switch.test.jsx`
Expected failure: CameraControls always renders desktop.

#### GREEN

In `src/features/navigation/CameraControls.jsx`, add imports:
```js
import { useMobile } from '../../context/MobileContext';
import { MobileCameraToolbar } from './MobileCameraToolbar';
```

At start of component function:
```js
const { isMobile } = useMobile();
```

Add early return for mobile before existing desktop return. Map existing handler/state names to MobileCameraToolbar props — read CameraControls carefully and use its actual variable names for zoom handlers, star list, toggle state, and toggle handler.

Run: `npm test -- tests/unit/camera-controls-mobile-switch.test.jsx` — PASS
Run: `npm test` — All tests pass.

#### REFACTOR

Look for:
- Are the props passed to `MobileCameraToolbar` exactly matching its expected interface? Cross-reference with Task 19's component definition.
- Does CameraControls have any cleanup logic (event listeners, refs) that should still run on mobile? If so, don't skip it with the early return — move it above the conditional.
- Is there shared state between desktop and mobile that could be extracted into a custom hook? Only if significant duplication — don't over-abstract.

Commit: `git commit -m "feat: CameraControls conditionally renders MobileCameraToolbar on mobile"`

---

## Task 21: Mobile Camera Toolbar CSS

**Requirement:** Spec Section 5 — Floating bottom bar with 44px touch targets, safe area padding, settings popover.

**Files:**
- Modify: CSS file where camera controls styles live (check for `#camera-controls` — likely `css/hud.css` or a dedicated file)
- Test: `tests/unit/mobile-camera-toolbar-css.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile camera toolbar CSS', () => {
  // Find the CSS file containing toolbar styles
  const possiblePaths = ['css/panel/camera-controls.css', 'css/camera-controls.css', 'css/hud.css'];
  const cssPath = possiblePaths.find((p) => {
    try {
      return readFileSync(resolve(p), 'utf-8').includes('.mobile-camera-toolbar');
    } catch { return false; }
  });

  it('should define .mobile-camera-toolbar', () => {
    expect(cssPath).toBeDefined();
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toMatch(/\.mobile-camera-toolbar\s*\{/);
  });

  it('should use z-index variable for toolbar', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toContain('var(--z-camera-toolbar)');
  });

  it('should use safe-bottom for toolbar padding', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toContain('--safe-bottom');
  });

  it('should define 44px minimum touch targets for buttons', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toMatch(/\.mobile-toolbar-btn\s*\{[^}]*min-width:\s*44px/s);
    expect(css).toMatch(/\.mobile-toolbar-btn\s*\{[^}]*min-height:\s*44px/s);
  });
});
```

Run: `npm test -- tests/unit/mobile-camera-toolbar-css.test.js`
Expected failure: No toolbar styles.

#### GREEN

Add to the appropriate CSS file:

```css
/* Mobile camera toolbar — floating bottom bar */
.mobile-camera-toolbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(8px + var(--safe-bottom, 0px));
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--border-primary);
  border-bottom: none;
  border-radius: var(--panel-border-radius) var(--panel-border-radius) 0 0;
  z-index: var(--z-camera-toolbar);
  font-family: var(--font-family-mono);
}

.mobile-toolbar-btn {
  min-width: 44px;
  min-height: 44px;
  background-color: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--button-border-radius);
  color: var(--color-primary);
  font-size: var(--font-size-large);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-toolbar-btn:active {
  background-color: rgba(0, 255, 136, 0.2);
}

.mobile-toolbar-select {
  min-height: 44px;
  background-color: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--button-border-radius);
  color: var(--color-primary);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-medium);
  padding: 0 8px;
}

.mobile-toolbar-popover {
  position: absolute;
  bottom: 100%;
  right: 0;
  background-color: rgba(0, 0, 0, 0.95);
  border: 1px solid var(--border-primary);
  border-radius: var(--panel-border-radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 4px;
}

.mobile-toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-white);
  font-size: var(--font-size-medium);
  white-space: nowrap;
}
```

Run: `npm test -- tests/unit/mobile-camera-toolbar-css.test.js` — PASS

#### REFACTOR

Look for:
- The toolbar uses `rgba(0, 0, 0, 0.8)` for background. Is there an existing CSS variable for semi-transparent backgrounds? Check `variables.css` for `--bg-overlay` variants. Use the existing variable if one matches.
- The `border-radius` on the toolbar is `var(--panel-border-radius)` on top corners only. Is this consistent with other floating elements in the game?
- The popover has no `z-index`. It's positioned absolutely within the toolbar, which has `var(--z-camera-toolbar)`. This should be fine — verify the popover appears above the toolbar content.

Commit: `git commit -m "feat: add mobile camera toolbar CSS with touch targets and safe area insets"`

---

## Task 22: Polish — Close Button Touch Targets + Raycasting Threshold

**Requirement:** Spec Section 7 (Polish) — Touch target sizing. Also Spec Section 5 — raycasting threshold.

**Files:**
- Modify: `css/variables.css` (`.close-btn` mobile override)
- Modify: `src/game/engine/interaction.js` or `scene.js` (raycasting threshold — check where raycaster params are set)
- Test: `tests/unit/close-button-touch-target.test.js`

#### RED

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Close button touch targets', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should have a mobile override for .close-btn with 44px minimum', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.close-btn\s*\{[^}]*min-width:\s*44px/s
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.close-btn\s*\{[^}]*min-height:\s*44px/s
    );
  });
});
```

Run: `npm test -- tests/unit/close-button-touch-target.test.js`
Expected failure: No mobile override for `.close-btn`.

#### GREEN

Add to the mobile media query in `css/variables.css`:

```css
  .close-btn {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
```

For raycasting threshold: Check `src/game/engine/interaction.js` or `scene.js` for where the raycaster is created. If there's a `raycaster.params.Points.threshold` or similar, consider making it configurable. This is a manual investigation — if the raycaster threshold is easy to increase (e.g., from 1 to 5 pixels on mobile), do it. If it requires passing `isMobile` into the Three.js engine layer, note it as a follow-up rather than overcomplicating the engine.

Run: `npm test -- tests/unit/close-button-touch-target.test.js` — PASS

#### REFACTOR

Look for:
- Are there other button classes (`.station-btn`, `.jump-btn`, etc.) that should also get 44px minimums on mobile? Scan the codebase. The spec says "touch target sizing" is a polish item — add overrides for any buttons smaller than 44px. Don't exhaustively resize every button — focus on interactive elements players will tap frequently.
- The raycasting threshold change (if made) should be documented with a comment explaining why.

Commit: `git commit -m "feat: ensure close buttons meet 44px touch target minimum on mobile"`

---

## Task 23: Final Verification

**Requirement:** All tests pass, code is clean, spec status updated.

#### RED

Run: `npm test`
Expected: All tests pass.

If any fail: diagnose and fix. Do not proceed until green.

#### GREEN

Run: `npm run lint` — fix any errors.
Run: `npm run format:check` — run `npm run format:write` if needed.
Run: `npm run build` — must succeed.

#### REFACTOR

Final review pass:
- Read through all new CSS added across the plan. Are there duplicated mobile override patterns that could be consolidated? If the same 6-line `position: fixed; top: 0; left: 0; width: 100%; height: 100%; transform: none;` pattern appears in more than 3 places, consider whether those selectors could share a class. But don't over-consolidate — encounter panels have their own specificity needs.
- Check the total number of `@media (max-width: 600px)` blocks in `variables.css`. If there are many, consolidate into one or two well-commented blocks.
- Verify no `console.log` or debug code was left in new files.

Update spec status in `docs/plans/2026-04-09-mobile-responsive-design.md`:
Change `**Status:** Draft` to `**Status:** Implemented`

Commit: `git commit -m "docs: mark mobile responsive design spec as implemented"`

---

## Summary

| Task | Description | Requirement | New Files | Modified Files |
|------|-------------|-------------|-----------|----------------|
| 1 | Z-index scale variables | Spec §1 | 1 test | variables.css |
| 2 | Safe area insets + viewport meta | Spec §1 | 1 test | index.html, variables.css |
| 3 | `.centered-panel` shared class | Spec §1 | 1 test | variables.css |
| 4 | CSS variable extraction | Spec §1 | 1 test | hud.css, modals.css, variables.css |
| 5 | `useMobileLayout()` hook | Spec §1 | hook + test | — |
| 6 | `MobileContext` provider | Spec §1 | context + test | — |
| 7 | Wire MobileProvider into App | Spec §1 | 1 test | App.jsx |
| 8 | Title screen mobile styles | Spec §0 | 1 test | hud.css |
| 9 | `.panel-base` mobile override | Spec §2 | 1 test | variables.css |
| 10 | Modal mobile styles | Spec §2 | 1 test | modals.css |
| 11 | Normalize encounter breakpoints | Spec §2 | 1 test | 4 panel CSS files |
| 12 | Encounter panels full-screen | Spec §2 | 1 test | 9 panel CSS files |
| 13 | NarrativeEventPanel `.centered-panel` | Spec §2 | 1 test | narrative-event.css, NarrativeEventPanel.jsx |
| 14 | Auto-clear viewingSystemId | Spec §2 | 1 test | App.jsx |
| 15 | MobileHUD + auto-collapse | Spec §3 | component + test | — |
| 16 | Wire MobileHUD into HUD | Spec §3 | 1 test | HUD.jsx, App.jsx |
| 17 | Mobile HUD CSS | Spec §3 | 1 test | hud.css |
| 18 | Station full-screen + PostCreditsStation verify | Spec §4 | 1 test | hud.css |
| 19 | MobileCameraToolbar component | Spec §5 | component + test | — |
| 20 | Wire toolbar into CameraControls | Spec §5 | 1 test | CameraControls.jsx |
| 21 | Camera toolbar CSS | Spec §5 | 1 test | CSS file |
| 22 | Touch targets + raycasting threshold | Spec §7 | 1 test | variables.css, interaction.js |
| 23 | Final verification | All | — | spec status |
