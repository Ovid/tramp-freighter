# End Credits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a cinematic auto-scrolling end credits sequence to the epilogue, replacing the placeholder credits phase, with the starmap visible behind a semi-transparent credits column.

**Architecture:** A new `EndCredits` component replaces the static credits phase in `Epilogue.jsx`. Credits content is defined in a separate data file (`credits-data.js`) with the NPC cast list generated dynamically from `ALL_NPCS`. A CSS keyframe animation scrolls the credits at ~25px/sec. The dev admin panel gets a "Preview Epilogue" button that emits an event to trigger the full epilogue flow.

**Tech Stack:** React 18, CSS @keyframes, existing game state hooks (`useGameAction`), existing event system (`EVENT_NAMES`)

---

### Task 1: Create credits-data.js (static content)

**Files:**
- Create: `src/features/endgame/credits-data.js`
- Test: `tests/unit/credits-data.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { CREDITS_SECTIONS, buildCastList } from '../../src/features/endgame/credits-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Credits data', () => {
  it('CREDITS_SECTIONS is a non-empty array of { type, lines } objects', () => {
    expect(Array.isArray(CREDITS_SECTIONS)).toBe(true);
    expect(CREDITS_SECTIONS.length).toBeGreaterThan(0);
    for (const section of CREDITS_SECTIONS) {
      expect(section).toHaveProperty('type');
      expect(section).toHaveProperty('lines');
      expect(Array.isArray(section.lines)).toBe(true);
    }
  });

  it('buildCastList returns one entry per NPC from ALL_NPCS', () => {
    const cast = buildCastList();
    expect(cast).toHaveLength(ALL_NPCS.length);
    for (const entry of cast) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('role');
    }
  });

  it('includes disclaimer section', () => {
    const disclaimer = CREDITS_SECTIONS.find((s) => s.type === 'disclaimer');
    expect(disclaimer).toBeDefined();
    expect(disclaimer.lines.join(' ')).toContain('fictitious');
  });

  it('includes closing quote', () => {
    const closing = CREDITS_SECTIONS.find((s) => s.type === 'quote');
    expect(closing).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/credits-data.test.js`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```js
import { ALL_NPCS } from '../../game/data/npc-data.js';

export function buildCastList() {
  return ALL_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));
}

export const CREDITS_SECTIONS = [
  {
    type: 'title',
    lines: ['TRAMP FREIGHTER BLUES'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'role',
    lines: ['Directed by', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Screenplay by', 'Claude'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['CAST', '(All NPCs played by themselves)'],
  },
  // NPC cast list is built dynamically by the component via buildCastList()
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['PRODUCTION'],
  },
  {
    type: 'role',
    lines: ['Produced by', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Executive Producer', 'Claude'],
  },
  {
    type: 'role',
    lines: ['Art Direction', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Sound Design', 'The Void of Space'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['ENGINEERING'],
  },
  {
    type: 'credit-pair',
    lines: [
      'Game Engine ............... React 18',
      '3D Starmap ................ Three.js',
      'Build System .............. Vite',
      'Test Framework ............ Vitest',
      'Property Testing .......... fast-check',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['NAVIGATION'],
  },
  {
    type: 'credit-pair',
    lines: [
      'Star Catalogue ............ HYG Stellar Database',
      'Wormhole Cartography ...... Purely Fictional',
      'Number of Real Stars ...... 117',
      'Distance from Sol ......... 20 light-years',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['FILMED ON LOCATION'],
  },
  {
    type: 'location',
    lines: [
      "Sol \u00b7 Alpha Centauri \u00b7 Barnard's Star",
      'Sirius \u00b7 Wolf 359 \u00b7 Tau Ceti',
      'Epsilon Eridani \u00b7 Procyon \u00b7 Ross 154',
      "Luyten's Star",
      'and 107 other star systems',
      'that were kind enough not to move',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['SPECIAL THANKS'],
  },
  {
    type: 'thanks',
    lines: [
      'The real stars within 20 light-years of Sol,',
      'for existing in convenient locations.',
    ],
  },
  {
    type: 'thanks',
    lines: [
      'Every freighter captain who kept flying',
      'when the numbers said to quit.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'humor',
    lines: [
      'No NPCs were harmed during the making of this game.',
      '(Except by pirates. And customs officers. And occasionally you.)',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'disclaimer',
    lines: [
      'All characters appearing in this work are fictitious.',
      'Any resemblance to real persons, living or dead,',
      'is purely coincidental.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'thankyou',
    lines: ['THANK YOU FOR PLAYING'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'quote',
    lines: ['\u201cThe stars don\u2019t judge. They just burn.\u201d'],
  },
];
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/credits-data.test.js`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/features/endgame/credits-data.js tests/unit/credits-data.test.js
git commit -m "feat: add credits data with NPC cast list builder"
```

---

### Task 2: Create EndCredits component

**Files:**
- Create: `src/features/endgame/EndCredits.jsx`
- Test: `tests/unit/end-credits.test.jsx`

**Step 1: Write the failing test**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndCredits } from '../../src/features/endgame/EndCredits.jsx';

// Mock useGameAction to provide ship name
vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    getShipName: () => 'The Rusty Bucket',
  }),
}));

// Mock GameContext
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getShip: () => ({ name: 'The Rusty Bucket' }),
  }),
}));

describe('EndCredits', () => {
  const onReturnToTitle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the game title', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('renders NPC cast members', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText(/Wei Chen/)).toBeTruthy();
    expect(screen.getByText(/Marcus Cole/)).toBeTruthy();
  });

  it('renders the player ship name', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText('The Rusty Bucket')).toBeTruthy();
    expect(screen.getByText('as itself')).toBeTruthy();
  });

  it('renders skip button', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByLabelText('Skip credits')).toBeTruthy();
  });

  it('shows Return to Title button when skip is clicked', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    fireEvent.click(screen.getByLabelText('Skip credits'));
    expect(screen.getByText('Return to Title')).toBeTruthy();
  });

  it('calls onReturnToTitle when Return to Title button is clicked', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    fireEvent.click(screen.getByLabelText('Skip credits'));
    fireEvent.click(screen.getByText('Return to Title'));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });

  it('renders disclaimer text', () => {
    render(<EndCredits onReturnToTitle={onReturnToTitle} />);
    expect(screen.getByText(/fictitious/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/end-credits.test.jsx`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```jsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGameState } from '../../context/GameContext.js';
import { Button } from '../../components/Button.jsx';
import { CREDITS_SECTIONS, buildCastList } from './credits-data.js';
import { CREDITS_CONFIG } from '../../game/constants.js';
import './endgame.css';

export function EndCredits({ onReturnToTitle }) {
  const gameStateManager = useGameState();
  const [scrollFinished, setScrollFinished] = useState(false);
  const scrollRef = useRef(null);
  const animationRef = useRef(null);

  const shipName = useMemo(
    () => gameStateManager.getShip()?.name || 'Your Ship',
    [gameStateManager]
  );
  const cast = useMemo(() => buildCastList(), []);

  const handleSkip = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
    }
    setScrollFinished(true);
  }, []);

  // Keyboard skip (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Start scroll animation after mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || scrollFinished) return;

    // Calculate duration from content height for consistent speed
    const contentHeight = el.scrollHeight;
    const viewportHeight = window.innerHeight;
    const totalDistance = contentHeight + viewportHeight;
    const durationMs = (totalDistance / CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC) * 1000;

    const animation = el.animate(
      [
        { transform: `translateY(${viewportHeight}px)` },
        { transform: `translateY(-${contentHeight}px)` },
      ],
      {
        duration: durationMs,
        easing: 'linear',
        fill: 'forwards',
      }
    );

    animationRef.current = animation;
    animation.onfinish = () => setScrollFinished(true);

    return () => animation.cancel();
  }, [scrollFinished]);

  const renderSection = (section, idx) => {
    switch (section.type) {
      case 'title':
        return (
          <div key={idx} className="credits-section credits-title">
            {section.lines.map((line, i) => (
              <h1 key={i}>{line}</h1>
            ))}
          </div>
        );
      case 'separator':
        return <div key={idx} className="credits-separator" />;
      case 'heading':
        return (
          <div key={idx} className="credits-section credits-heading">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      case 'role':
        return (
          <div key={idx} className="credits-section credits-role">
            <div className="credits-role-title">{section.lines[0]}</div>
            <div className="credits-role-name">{section.lines[1]}</div>
          </div>
        );
      case 'thankyou':
        return (
          <div key={idx} className="credits-section credits-thankyou">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      case 'quote':
        return (
          <div key={idx} className="credits-section credits-quote">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      default:
        return (
          <div key={idx} className="credits-section credits-body">
            {section.lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
    }
  };

  // Find the index where cast should be inserted (after the 'heading' with CAST)
  const castHeadingIdx = CREDITS_SECTIONS.findIndex(
    (s) => s.type === 'heading' && s.lines[0] === 'CAST'
  );

  const beforeCast = CREDITS_SECTIONS.slice(0, castHeadingIdx + 1);
  const afterCast = CREDITS_SECTIONS.slice(castHeadingIdx + 1);

  return (
    <div id="end-credits" onClick={scrollFinished ? undefined : handleSkip}>
      <div className="credits-scroll" ref={scrollRef}>
        {beforeCast.map(renderSection)}

        {/* Dynamic NPC cast list */}
        <div className="credits-section credits-cast">
          {cast.map((npc) => (
            <div key={npc.name} className="credits-cast-row">
              <span className="credits-cast-name">{npc.name}</span>
              <span className="credits-cast-dots" />
              <span className="credits-cast-role">{npc.role}</span>
            </div>
          ))}
          <div className="credits-cast-ship">
            <div>And introducing</div>
            <div className="credits-ship-name">{shipName}</div>
            <div>as itself</div>
          </div>
        </div>

        {afterCast.map((section, idx) =>
          renderSection(section, idx + castHeadingIdx + 1)
        )}
      </div>

      {!scrollFinished && (
        <button
          className="credits-skip-btn"
          onClick={handleSkip}
          aria-label="Skip credits"
        >
          Skip
        </button>
      )}

      {scrollFinished && (
        <div className="credits-end-buttons">
          <Button onClick={onReturnToTitle}>Return to Title</Button>
        </div>
      )}
    </div>
  );
}
```

**Note:** This references `CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC` which will be added to constants in Task 4. For the test to pass, we need to add the constant first. However, we can use a local fallback for now — or reorder. Since the test mocks don't need the animation to run, the test will pass without the constant being perfect. If the import fails, add a temporary `const SCROLL_SPEED = 25` and replace it in Task 4.

Actually, to keep TDD clean, let's define the constant inline in this file for now and extract it in Task 4:

Replace the import line `import { CREDITS_CONFIG } from '../../game/constants.js';` with:

```js
const SCROLL_SPEED_PX_PER_SEC = 25;
```

And replace `CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC` with `SCROLL_SPEED_PX_PER_SEC` in the animation calc. Task 4 will extract this to constants.js.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/end-credits.test.jsx`
Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/features/endgame/EndCredits.jsx tests/unit/end-credits.test.jsx
git commit -m "feat: add EndCredits component with scroll animation and skip"
```

---

### Task 3: Add credits CSS styles

**Files:**
- Modify: `src/features/endgame/endgame.css` (add credits styles, modify `#epilogue` background)

**Step 1: Read the current file** (already read above)

**Step 2: Add CSS for end credits**

Append the following to `endgame.css` and change `#epilogue` background from `black` to `transparent`:

Changes to existing rule at line 5 — change `#epilogue` within the `#pavonis-run, #epilogue` rule:

Split the combined rule. `#pavonis-run` keeps `background: black`. `#epilogue` gets `background: transparent`.

Replace lines 1-21 with:

```css
/* Import CSS Variables */
@import '../../../css/variables.css';

#pavonis-run {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  color: var(--color-white);
  z-index: var(--z-modal);
}

#epilogue {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-white);
  z-index: var(--z-modal);
  overflow-y: auto;
}
```

Then append at the end of the file:

```css
/* End Credits scroll */
#end-credits {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: var(--z-modal);
  cursor: pointer;
}

.credits-scroll {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  padding: 40px;
  background-color: rgba(0, 0, 0, 0.7);
  text-align: center;
  font-family: var(--font-family-mono);
}

/* Title */
.credits-title h1 {
  color: var(--color-primary);
  font-size: 32px;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
  margin: 0;
}

/* Section separator */
.credits-separator {
  height: 60px;
}

/* Section headings (CAST, PRODUCTION, etc.) */
.credits-heading {
  color: var(--color-primary);
  font-size: var(--font-size-xxlarge);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 15px;
}

.credits-heading div:not(:first-child) {
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-size-large);
  font-style: italic;
  text-transform: none;
  letter-spacing: 0;
  margin-top: 4px;
}

/* Role credits (Directed by / Name) */
.credits-role {
  margin-bottom: 10px;
}

.credits-role-title {
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-size-large);
  margin-bottom: 4px;
}

.credits-role-name {
  color: var(--color-white);
  font-size: var(--font-size-xlarge);
}

/* Cast list */
.credits-cast {
  text-align: left;
  margin: 0 auto;
  max-width: 460px;
}

.credits-cast-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 3px 0;
  font-size: var(--font-size-large);
}

.credits-cast-name {
  color: var(--color-white);
  white-space: nowrap;
}

.credits-cast-dots {
  flex: 1;
  margin: 0 8px;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.2);
  min-width: 20px;
  position: relative;
  top: -4px;
}

.credits-cast-role {
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.credits-cast-ship {
  text-align: center;
  margin-top: 25px;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-large);
}

.credits-ship-name {
  color: var(--color-primary);
  font-size: var(--font-size-xlarge);
  margin: 6px 0;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
}

/* Body text (engineering, navigation, location, thanks, humor, disclaimer) */
.credits-body {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-large);
  line-height: 1.8;
}

/* Thank you */
.credits-thankyou {
  color: var(--color-primary);
  font-size: var(--font-size-title);
  letter-spacing: 3px;
  text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
}

/* Closing quote */
.credits-quote {
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-size-large);
  font-style: italic;
}

/* Skip button */
.credits-skip-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.4);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-normal);
  padding: 6px 16px;
  border-radius: var(--button-border-radius);
  cursor: pointer;
  transition: var(--transition-fast);
  z-index: calc(var(--z-modal) + 1);
}

.credits-skip-btn:hover {
  color: var(--color-white);
  border-color: rgba(255, 255, 255, 0.6);
}

/* Return to Title after credits end */
.credits-end-buttons {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: calc(var(--z-modal) + 1);
  animation: credits-fade-in 1s ease forwards;
}

@keyframes credits-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Step 3: Verify visually** (will be done during UAT, no automated CSS test needed)

**Step 4: Commit**

```bash
git add src/features/endgame/endgame.css
git commit -m "feat: add end credits CSS with scroll animation and starmap transparency"
```

---

### Task 4: Extract scroll speed constant and wire into EndCredits

**Files:**
- Modify: `src/game/constants.js` (add `CREDITS_CONFIG`)
- Modify: `src/features/endgame/EndCredits.jsx` (import from constants)
- Test: `tests/unit/credits-data.test.js` (add constant test)

**Step 1: Add test for the constant**

Add to `tests/unit/credits-data.test.js`:

```js
import { CREDITS_CONFIG } from '../../src/game/constants.js';

it('CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC is a positive number', () => {
  expect(CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC).toBeGreaterThan(0);
  expect(typeof CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC).toBe('number');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/credits-data.test.js`
Expected: FAIL — CREDITS_CONFIG not exported

**Step 3: Add constant to constants.js**

Find the end of `constants.js` (before the final `});` or after the last export). Add:

```js
export const CREDITS_CONFIG = Object.freeze({
  SCROLL_SPEED_PX_PER_SEC: 25,
});
```

Then update `EndCredits.jsx`:
- Replace `const SCROLL_SPEED_PX_PER_SEC = 25;` with `import { CREDITS_CONFIG } from '../../game/constants.js';`
- Replace `SCROLL_SPEED_PX_PER_SEC` usage with `CREDITS_CONFIG.SCROLL_SPEED_PX_PER_SEC`

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/credits-data.test.js tests/unit/end-credits.test.jsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/game/constants.js src/features/endgame/EndCredits.jsx tests/unit/credits-data.test.js
git commit -m "refactor: extract CREDITS_CONFIG scroll speed to constants.js"
```

---

### Task 5: Wire EndCredits into Epilogue component

**Files:**
- Modify: `src/features/endgame/Epilogue.jsx` (replace credits phase with EndCredits)
- Test: `tests/unit/epilogue-credits-phase.test.jsx` (new test for the integration)

**Step 1: Write the failing test**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Epilogue } from '../../src/features/endgame/Epilogue.jsx';

// Mock useGameAction
vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    getEpilogueData: () => [{ id: 'arrival', text: 'Test arrival text' }],
    getEpilogueStats: () => ({
      daysElapsed: 100,
      systemsVisited: 5,
      creditsEarned: 10000,
      missionsCompleted: 3,
      trustedNPCs: 1,
      cargoHauled: 200,
      jumpsCompleted: 50,
    }),
  }),
}));

// Mock GameContext for EndCredits
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getShip: () => ({ name: 'Test Ship' }),
  }),
}));

describe('Epilogue credits phase', () => {
  it('renders EndCredits component when navigating to credits phase', () => {
    const onReturnToTitle = vi.fn();
    render(<Epilogue onReturnToTitle={onReturnToTitle} />);

    // Navigate through: Epilogue -> Stats -> Credits
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));

    // EndCredits should render the game title in the scrolling credits
    expect(screen.getByText('TRAMP FREIGHTER BLUES')).toBeTruthy();
  });

  it('EndCredits passes onReturnToTitle through', () => {
    const onReturnToTitle = vi.fn();
    render(<Epilogue onReturnToTitle={onReturnToTitle} />);

    // Navigate to credits
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Credits'));

    // Skip credits and click return
    fireEvent.click(screen.getByLabelText('Skip credits'));
    fireEvent.click(screen.getByText('Return to Title'));
    expect(onReturnToTitle).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/epilogue-credits-phase.test.jsx`
Expected: FAIL — Epilogue still renders old credits placeholder

**Step 3: Modify Epilogue.jsx**

Replace the entire file:

```jsx
import { useMemo, useState } from 'react';
import { useGameAction } from '../../hooks/useGameAction.js';
import { Button } from '../../components/Button.jsx';
import { EndCredits } from './EndCredits.jsx';
import { gameDayToDate } from '../../game/utils/date-utils.js';
import './endgame.css';

export function Epilogue({ onReturnToTitle }) {
  const { getEpilogueData, getEpilogueStats } = useGameAction();
  const [phase, setPhase] = useState('epilogue');

  const sections = useMemo(() => getEpilogueData(), [getEpilogueData]);
  const stats = useMemo(() => getEpilogueStats(), [getEpilogueStats]);

  if (phase === 'credits') {
    return <EndCredits onReturnToTitle={onReturnToTitle} />;
  }

  if (phase === 'stats') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>VOYAGE STATISTICS</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span>Final date:</span>
              <span>{gameDayToDate(stats.daysElapsed ?? 0)}</span>
            </div>
            <div className="stat-row">
              <span>Systems visited:</span>
              <span>{stats.systemsVisited}</span>
            </div>
            <div className="stat-row">
              <span>Credits earned:</span>
              <span>{'\u20A1'}{stats.creditsEarned.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>Missions completed:</span>
              <span>{stats.missionsCompleted}</span>
            </div>
            <div className="stat-row">
              <span>NPCs at Trusted or higher:</span>
              <span>{stats.trustedNPCs}</span>
            </div>
            <div className="stat-row">
              <span>Cargo hauled:</span>
              <span>{stats.cargoHauled} units</span>
            </div>
            <div className="stat-row">
              <span>Jumps made:</span>
              <span>{stats.jumpsCompleted}</span>
            </div>
          </div>
          <Button onClick={() => setPhase('credits')}>Credits</Button>
        </div>
      </div>
    );
  }

  return (
    <div id="epilogue" className="visible">
      <div className="endgame-panel">
        <h2>EPILOGUE</h2>
        {sections.map((section) => (
          <p key={section.id} className="epilogue-text">
            {section.text}
          </p>
        ))}
        <Button onClick={() => setPhase('stats')}>Continue</Button>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/epilogue-credits-phase.test.jsx tests/unit/epilogue.test.js`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/features/endgame/Epilogue.jsx tests/unit/epilogue-credits-phase.test.jsx
git commit -m "feat: wire EndCredits into Epilogue, replacing placeholder credits phase"
```

---

### Task 6: Add dev admin "Preview Epilogue" button

**Files:**
- Modify: `src/game/constants.js` (add `EPILOGUE_PREVIEW_TRIGGERED` event name)
- Modify: `src/features/dev-admin/DevAdminPanel.jsx` (add Endgame section)
- Modify: `src/App.jsx` (listen for preview event)
- Test: `tests/unit/dev-admin-epilogue-preview.test.jsx`

**Step 1: Write the failing test**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';

// Mock all dependencies
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getPlayer: () => ({ credits: 1000, debt: 0 }),
    getShip: () => ({
      fuel: 100,
      hull: 100,
      engine: 100,
      lifeSupport: 100,
      cargo: [],
      hiddenCargo: [],
      quirks: [],
      upgrades: [],
    }),
    getShipCondition: () => ({ hull: 100, engine: 100, lifeSupport: 100 }),
    getKarma: () => 0,
    getFactionReps: () => ({
      authorities: 0,
      traders: 0,
      outlaws: 0,
      civilians: 0,
    }),
    getState: () => ({ npcs: {} }),
    getCurrentSystem: () => 0,
    getDangerZone: () => 'safe',
    calculatePirateEncounterChance: () => 0,
    calculateInspectionChance: () => 0,
    getDangerFlags: () => ({}),
    getHiddenCargo: () => [],
    emit: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => undefined,
}));

describe('DevAdminPanel epilogue preview', () => {
  it('renders Preview Epilogue button', () => {
    render(<DevAdminPanel onClose={vi.fn()} />);
    expect(screen.getByText('Preview Epilogue')).toBeTruthy();
  });

  it('emits EPILOGUE_PREVIEW_TRIGGERED event when clicked', () => {
    const emitFn = vi.fn();
    vi.mocked(
      await import('../../src/context/GameContext')
    ).useGameState.mockReturnValue({
      // ... same mock as above but with emit: emitFn
    });
    // This approach is complex; simpler: just check the button exists
    // and that clicking it calls emit. We'll test the wiring in integration.
    render(<DevAdminPanel onClose={vi.fn()} />);
    expect(screen.getByText('Preview Epilogue')).toBeTruthy();
  });
});
```

Actually, the test mock setup for DevAdminPanel is complex. Let's simplify:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { EVENT_NAMES } from '../../src/game/constants.js';

const mockEmit = vi.fn();

vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getPlayer: () => ({ credits: 1000, debt: 0 }),
    getShip: () => ({
      fuel: 100, hull: 100, engine: 100, lifeSupport: 100,
      cargo: [], hiddenCargo: [], quirks: [], upgrades: [],
    }),
    getShipCondition: () => ({ hull: 100, engine: 100, lifeSupport: 100 }),
    getKarma: () => 0,
    getFactionReps: () => ({ authorities: 0, traders: 0, outlaws: 0, civilians: 0 }),
    getState: () => ({ npcs: {} }),
    getCurrentSystem: () => 0,
    getDangerZone: () => 'safe',
    calculatePirateEncounterChance: () => 0,
    calculateInspectionChance: () => 0,
    getDangerFlags: () => ({}),
    getHiddenCargo: () => [],
    emit: (...args) => mockEmit(...args),
    checkDistressCall: () => null,
  }),
}));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: () => undefined,
}));

describe('DevAdminPanel epilogue preview', () => {
  it('renders Preview Epilogue button in Endgame section', () => {
    render(<DevAdminPanel onClose={vi.fn()} />);
    expect(screen.getByText('Endgame')).toBeTruthy();
    expect(screen.getByText('Preview Epilogue')).toBeTruthy();
  });

  it('emits EPILOGUE_PREVIEW_TRIGGERED when Preview Epilogue is clicked', () => {
    mockEmit.mockClear();
    render(<DevAdminPanel onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Preview Epilogue'));
    expect(mockEmit).toHaveBeenCalledWith(
      EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED,
      true
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/dev-admin-epilogue-preview.test.jsx`
Expected: FAIL — EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED undefined, button not found

**Step 3: Add event name to constants.js**

In `src/game/constants.js`, inside the `EVENT_NAMES` object, after `PAVONIS_RUN_TRIGGERED`:

```js
  EPILOGUE_PREVIEW_TRIGGERED: 'epiloguePreviewTriggered',
```

**Step 4: Add button to DevAdminPanel.jsx**

Before the `<div className="dev-admin-warning">` line (line 825), add:

```jsx
      {/* Endgame Section */}
      <div className="dev-admin-section">
        <h3>Endgame</h3>
        <div className="dev-admin-encounter-buttons">
          <button
            onClick={() =>
              gameStateManager.emit(
                EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED,
                true
              )
            }
          >
            Preview Epilogue
          </button>
        </div>
      </div>
```

Add `EVENT_NAMES` to the import from constants.js if not already present (check: it's already imported at line 9).

**Step 5: Add listener in App.jsx**

In `src/App.jsx`:

Add the event subscription near line 70 (after `pavonisRunEvent`):

```js
  const epiloguePreviewEvent = useGameEvent(EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED);
```

Add effect near line 466 (after the pavonisRunEvent effect):

```js
  useEffect(() => {
    if (epiloguePreviewEvent) {
      setShowDevAdmin(false);
      setViewMode(VIEW_MODES.EPILOGUE);
    }
  }, [epiloguePreviewEvent]);
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- tests/unit/dev-admin-epilogue-preview.test.jsx`
Expected: PASS (2 tests)

**Step 7: Commit**

```bash
git add src/game/constants.js src/features/dev-admin/DevAdminPanel.jsx src/App.jsx tests/unit/dev-admin-epilogue-preview.test.jsx
git commit -m "feat: add Preview Epilogue button to dev admin panel"
```

---

### Task 7: Full test suite + cleanup

**Files:**
- No new files

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS. If any existing tests broke (especially epilogue, settings-panel, or App tests), fix them.

**Step 2: Run lint and format**

Run: `npm run all`
Expected: Clean exit. Fix any lint or format issues.

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint and test issues from end credits feature"
```

---

Plan complete and saved to `docs/plans/2026-03-07-end-credits-design.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints

Which approach?