# Yumi Tanaka Post-Credits NPC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Yumi Tanaka as a post-credits NPC at Delta Pavonis with fourth-wall-breaking dialogue.

**Architecture:** Yumi is a standard NPC (hidden, revealed by `post_credits` flag) with a dialogue tree that uses `context.npcState.interactions` to track which comedy round to show. After credits scroll, App.jsx transitions to a simplified `PostCreditsStation` component instead of the full StationMenu. The starmap and HUD remain active so the player can look around.

**Tech Stack:** React 18, existing dialogue/NPC systems, Vitest

---

### Task 1: Add Yumi NPC definition

**Files:**
- Modify: `src/game/data/npc-data.js`

**Step 1: Write the failing test**

Create `tests/unit/yumi-npc.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { YUMI_TANAKA_POSTCREDITS, ALL_NPCS, validateNPCDefinition } from '../../src/game/data/npc-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';

describe('Yumi Tanaka NPC definition', () => {
  it('passes NPC validation', () => {
    expect(() => validateNPCDefinition(YUMI_TANAKA_POSTCREDITS)).not.toThrow();
  });

  it('is located at Delta Pavonis', () => {
    expect(YUMI_TANAKA_POSTCREDITS.system).toBe(ENDGAME_CONFIG.DELTA_PAVONIS_ID);
  });

  it('is hidden with post_credits reveal flag', () => {
    expect(YUMI_TANAKA_POSTCREDITS.hidden).toBe(true);
    expect(YUMI_TANAKA_POSTCREDITS.revealFlag).toBe('post_credits');
  });

  it('starts at Warm reputation', () => {
    expect(YUMI_TANAKA_POSTCREDITS.initialRep).toBe(10);
  });

  it('is included in ALL_NPCS', () => {
    expect(ALL_NPCS).toContain(YUMI_TANAKA_POSTCREDITS);
  });

  it('has Colony Director role', () => {
    expect(YUMI_TANAKA_POSTCREDITS.role).toBe('Colony Director');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/yumi-npc.test.js`
Expected: FAIL - `YUMI_TANAKA_POSTCREDITS` is not exported

**Step 3: Write the implementation**

Add to `src/game/data/npc-data.js` before `ALL_NPCS`:

```javascript
import { ENDGAME_CONFIG } from '../constants.js';

export const YUMI_TANAKA_POSTCREDITS = {
  id: 'yumi_delta_pavonis',
  name: 'Yumi Tanaka',
  role: 'Colony Director',
  system: ENDGAME_CONFIG.DELTA_PAVONIS_ID,
  station: 'Delta Pavonis Colony',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_HIGH,
    greed: NPC_PERSONALITY_VALUES.GREED_NONE,
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_HIGH,
    morality: NPC_PERSONALITY_VALUES.MORALITY_MODERATE,
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'simple',
    quirk: 'Fourth-wall-breaking irreverence.',
  },
  description:
    'Colony Director at Delta Pavonis. Tanaka\'s sister. Seems to know more than she should.',
  initialRep: REPUTATION_BOUNDS.WARM_MIN,
  tips: [],
  discountService: null,
  tierBenefits: {
    warm: { discount: 0, benefit: 'Post-credits banter.' },
    friendly: { discount: 0, benefit: 'More post-credits banter.' },
    trusted: { discount: 0, benefit: 'Even more post-credits banter.' },
    family: { discount: 0, benefit: 'Maximum post-credits banter.' },
  },
  hidden: true,
  revealFlag: 'post_credits',
};
```

Note: `ENDGAME_CONFIG` is already imported in constants.js; you need to import `REPUTATION_BOUNDS` at the top of npc-data.js (it's already available via constants.js). Add `YUMI_TANAKA_POSTCREDITS` to the `ALL_NPCS` array.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/yumi-npc.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass (existing NPC validation also passes with new NPC)

**Step 6: Commit**

```
git add tests/unit/yumi-npc.test.js src/game/data/npc-data.js
git commit -m "feat: add Yumi Tanaka NPC definition for post-credits scene"
```

---

### Task 2: Create Yumi's dialogue tree

**Files:**
- Create: `src/game/data/dialogue/yumi-tanaka.js`
- Modify: `src/game/data/dialogue-trees.js`

**Step 1: Write the failing test**

Add to `tests/unit/yumi-npc.test.js`:

```javascript
import { YUMI_TANAKA_POSTCREDITS_DIALOGUE } from '../../src/game/data/dialogue/yumi-tanaka.js';
import { validateDialogueTree } from '../../src/game/data/dialogue/validation.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';

describe('Yumi Tanaka dialogue tree', () => {
  it('passes dialogue validation', () => {
    expect(() => validateDialogueTree(YUMI_TANAKA_POSTCREDITS_DIALOGUE)).not.toThrow();
  });

  it('is registered in ALL_DIALOGUE_TREES', () => {
    expect(ALL_DIALOGUE_TREES.yumi_delta_pavonis).toBe(YUMI_TANAKA_POSTCREDITS_DIALOGUE);
  });

  it('greeting text varies by interaction round', () => {
    const greeting = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting;
    const makeCtx = (interactions) => ({ npcState: { interactions } });

    expect(greeting.text(10, makeCtx(0))).toContain("still here");
    expect(greeting.text(10, makeCtx(1))).toContain("you're back");
    expect(greeting.text(10, makeCtx(2))).toContain("Seriously");
    expect(greeting.text(10, makeCtx(3))).toContain("game is over");
    expect(greeting.text(10, makeCtx(99))).toContain("game is over");
  });

  it('round 1 choices only visible when interactions === 0', () => {
    const choices = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting.choices;
    const round1Choices = choices.filter(
      (c) => c.condition && c.condition(10, { npcState: { interactions: 0 } })
    );
    const round1ChoicesAtRound2 = choices.filter(
      (c) => c.condition && c.condition(10, { npcState: { interactions: 1 } })
    );
    // Round 1 should have 3 conversation choices (goodbye has no condition)
    expect(round1Choices.length).toBe(3);
    // Those same choices should not appear in round 2
    const r1Texts = round1Choices.map((c) => c.text);
    const r2Texts = round1ChoicesAtRound2.map((c) => c.text);
    expect(r1Texts.some((t) => r2Texts.includes(t))).toBe(false);
  });

  it('response nodes increment interactions via action', () => {
    const r1Response = YUMI_TANAKA_POSTCREDITS_DIALOGUE.r1_find;
    expect(r1Response).toBeDefined();
    const goodbyeChoice = r1Response.choices[0];
    const mockCtx = { npcState: { interactions: 0 } };
    goodbyeChoice.action(mockCtx);
    expect(mockCtx.npcState.interactions).toBe(1);
  });

  it('goodbye choice in greeting increments interactions', () => {
    const choices = YUMI_TANAKA_POSTCREDITS_DIALOGUE.greeting.choices;
    const goodbye = choices.find((c) => !c.condition && c.text.includes('Goodbye'));
    expect(goodbye).toBeDefined();
    const mockCtx = { npcState: { interactions: 0 } };
    goodbye.action(mockCtx);
    expect(mockCtx.npcState.interactions).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/yumi-npc.test.js`
Expected: FAIL - module not found

**Step 3: Write the dialogue tree**

Create `src/game/data/dialogue/yumi-tanaka.js`:

```javascript
/**
 * @fileoverview Yumi Tanaka Post-Credits Dialogue Tree
 *
 * Fourth-wall-breaking comedy dialogue for the post-credits scene.
 * Three rounds of escalating exasperation, then a loop.
 * Tracks rounds via context.npcState.interactions.
 *
 * @module dialogue/yumi-tanaka
 */

const advanceRound = (context) => {
  context.npcState.interactions++;
  return { success: true };
};

export const YUMI_TANAKA_POSTCREDITS_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      const round = context.npcState.interactions;
      if (round === 0) {
        return '"You\'re still here? The credits rolled. The story\'s over. What exactly are you expecting?"';
      }
      if (round === 1) {
        return '"Oh, you\'re back. Most people take the hint when the credits roll. You\'re not most people, apparently."';
      }
      if (round === 2) {
        return '"Seriously? What are you still doing here? Do you just... live in menus? Is that your thing?"';
      }
      return '"You again. I\'m starting to think you don\'t have anywhere else to be. ...I mean, you literally don\'t. The game is over."';
    },
    choices: [
      // Round 1 choices
      {
        text: '"I came all this way to find you."',
        next: 'r1_find',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"Is there a secret ending?"',
        next: 'r1_secret',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"What\'s Delta Pavonis like?"',
        next: 'r1_colony',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      // Round 2 choices
      {
        text: '"Your sister talks about you a lot."',
        next: 'r2_sister',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"So what do you actually do here?"',
        next: 'r2_job',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"Any advice for a freighter captain?"',
        next: 'r2_advice',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      // Round 3 choices
      {
        text: '"I like it here."',
        next: 'r3_like',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"Tell me about the Meridian voyage."',
        next: 'r3_meridian',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"Will I ever see Tanaka again?"',
        next: 'r3_tanaka',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      // Goodbye (always available, no condition)
      {
        text: '"Goodbye."',
        next: null,
        action: advanceRound,
      },
    ],
  },

  // Round 1 responses
  r1_find: {
    text: '"That\'s sweet. Really. But I\'ve been here for ten years. I wasn\'t lost. Yuki just worries."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r1_secret: {
    text: '"This isn\'t that kind of game. There\'s no hidden boss. No post-credits sequel hook. Just me and a lot of paperwork."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r1_colony: {
    text: '"Dusty. Underfunded. The food is terrible. But we built it ourselves, so we pretend to like it."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },

  // Round 2 responses
  r2_sister: {
    text: '"Let me guess — she described me as \'driven but emotionally unavailable.\' That\'s engineer for \'I miss you.\'"',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r2_job: {
    text: '"I run a colony of three thousand people on a planet that actively tries to kill us every Tuesday. It\'s like project management, but with more radiation."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r2_advice: {
    text: '"Yeah. When the credits roll, leave. That\'s advice for life, really."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },

  // Round 3 responses
  r3_like: {
    text: '"There is literally nothing here. I\'m an NPC in a post-credits scene. My entire existence is this conversation. Go outside."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r3_meridian: {
    text: '"Ten years on a colony ship. You know what the entertainment was? A database of 20th-century films and a man named Doug who knew card tricks. I have seen every card trick, Captain."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r3_tanaka: {
    text: '"She\'s on your ship, genius. ...Wait, does she not come with you after—? Ugh, I\'ll talk to the developers."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
};
```

**Step 4: Register in dialogue-trees.js**

Add import and registration in `src/game/data/dialogue-trees.js`:

```javascript
import { YUMI_TANAKA_POSTCREDITS_DIALOGUE } from './dialogue/yumi-tanaka.js';
```

Add to exports and to `ALL_DIALOGUE_TREES`:
```javascript
yumi_delta_pavonis: YUMI_TANAKA_POSTCREDITS_DIALOGUE,
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/unit/yumi-npc.test.js`
Expected: PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```
git add src/game/data/dialogue/yumi-tanaka.js src/game/data/dialogue-trees.js tests/unit/yumi-npc.test.js
git commit -m "feat: add Yumi Tanaka post-credits dialogue tree"
```

---

### Task 3: Create PostCreditsStation component

**Files:**
- Create: `src/features/endgame/PostCreditsStation.jsx`

**Step 1: Write the component**

This is a UI component. Create `src/features/endgame/PostCreditsStation.jsx`:

```jsx
import { useMemo } from 'react';
import { useGameState } from '../../context/GameContext';
import { STAR_DATA } from '../../game/data/star-data';
import { getNPCsAtSystem } from '../../game/game-npcs';
import { ENDGAME_CONFIG } from '../../game/constants';
import { Button } from '../../components/Button.jsx';

export function PostCreditsStation({ onOpenPanel, onReturnToTitle }) {
  const gameStateManager = useGameState();
  const systemId = ENDGAME_CONFIG.DELTA_PAVONIS_ID;
  const system = STAR_DATA.find((s) => s.id === systemId);

  const npcsAtSystem = getNPCsAtSystem(systemId, { post_credits: true });

  const npcDisplayData = useMemo(() => {
    return npcsAtSystem.map((npc) => {
      const npcState = gameStateManager.getNPCState(npc.id);
      const tier = gameStateManager.getRepTier(npcState.rep);
      return { id: npc.id, name: npc.name, role: npc.role, tierName: tier.name };
    });
  }, [npcsAtSystem, gameStateManager]);

  return (
    <div id="station-interface" className="visible">
      <h2>{system?.name || 'Delta Pavonis'} Colony</h2>
      <div className="station-info">
        <div className="info-row">
          <span className="label">System:</span>
          <span>{system?.name || 'Delta Pavonis'}</span>
        </div>
      </div>

      {npcsAtSystem.length > 0 && (
        <div className="station-people">
          <h3>PEOPLE</h3>
          <div className="npc-list">
            {npcDisplayData.map((npcDisplay) => (
              <button
                key={npcDisplay.id}
                className="npc-btn"
                onClick={() => onOpenPanel('dialogue', npcDisplay.id)}
              >
                <span className="npc-name">{npcDisplay.name}</span>
                <span className="npc-role">{npcDisplay.role}</span>
                <span
                  className={`npc-tier tier-${npcDisplay.tierName.toLowerCase()}`}
                >
                  {npcDisplay.tierName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="station-actions">
        <Button onClick={onReturnToTitle}>Return to Title</Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```
git add src/features/endgame/PostCreditsStation.jsx
git commit -m "feat: add PostCreditsStation component for post-credits dock"
```

---

### Task 4: Wire up EndCredits -> PostCreditsStation transition

**Files:**
- Modify: `src/features/endgame/EndCredits.jsx`
- Modify: `src/features/endgame/Epilogue.jsx`
- Modify: `src/App.jsx`

**Step 1: Modify EndCredits.jsx**

Change the `onReturnToTitle` prop to `onCreditsComplete`. When scroll finishes, call `onCreditsComplete` instead of showing "Return to Title" button:

In `EndCredits.jsx`:
- Rename prop: `onReturnToTitle` -> `onCreditsComplete`
- Replace the `scrollFinished` render block: instead of showing a "Return to Title" button, call `onCreditsComplete()` via a `useEffect` when `scrollFinished` becomes true.

```jsx
export function EndCredits({ onCreditsComplete }) {
  // ... existing code ...

  useEffect(() => {
    if (scrollFinished) {
      onCreditsComplete();
    }
  }, [scrollFinished, onCreditsComplete]);

  // Remove the scrollFinished button block entirely
  // Keep the skip button for during scroll
  return (
    <div id="end-credits" onClick={scrollFinished ? undefined : handleSkip}>
      <div className="credits-center">
        <div className="credits-scroll" ref={scrollRef}>
          {/* ... existing credits content ... */}
        </div>
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
    </div>
  );
}
```

**Step 2: Modify Epilogue.jsx**

Change `onReturnToTitle` to `onCreditsComplete` and pass it through to EndCredits:

```jsx
export function Epilogue({ onReturnToTitle, onCreditsComplete }) {
  // ... existing code ...

  if (phase === 'credits') {
    return <EndCredits onCreditsComplete={onCreditsComplete} />;
  }

  // ... rest stays the same (epilogue/stats phases still use existing buttons) ...
}
```

**Step 3: Modify App.jsx**

Add `postCredits` state and `handleCreditsComplete` handler. Add a `POST_CREDITS` view mode constant. Update rendering logic.

Changes:
1. Add state: `const [postCredits, setPostCredits] = useState(false);`
2. Add handler:
```javascript
const handleCreditsComplete = () => {
  gameStateManager.setNarrativeFlag('post_credits', true);
  setPostCredits(true);
  setViewMode(VIEW_MODES.STATION);
};
```
3. In the Epilogue render block, pass both callbacks:
```jsx
<Epilogue
  onReturnToTitle={handleReturnToTitle}
  onCreditsComplete={handleCreditsComplete}
/>
```
4. In the STATION render block, conditionally render PostCreditsStation:
```jsx
{viewMode === VIEW_MODES.STATION && (
  <>
    <MissionCompleteNotifier />
    {postCredits ? (
      <PostCreditsStation
        onOpenPanel={handleOpenPanel}
        onReturnToTitle={handleReturnToTitle}
      />
    ) : (
      <StationMenu
        onOpenPanel={handleOpenPanel}
        onUndock={handleUndock}
      />
    )}
  </>
)}
```
5. Import PostCreditsStation at the top.

**Step 4: Check if setNarrativeFlag exists**

Look for `setNarrativeFlag` in game-state-manager.js. If it doesn't exist, the `post_credits` flag can be set directly: `gameStateManager.getState().world.narrativeFlags.post_credits = true;` (or via whatever mechanism exists). The flag is needed so `getNPCsAtSystem` reveals Yumi.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Manual verification**

Run `npm run dev` and use the dev admin panel to trigger epilogue preview. Verify:
1. Credits scroll and complete
2. Transition to Delta Pavonis station dock
3. Yumi appears in PEOPLE section as "Yumi Tanaka - Colony Director - Warm"
4. Clicking Yumi opens dialogue with round 1 text
5. Picking a choice shows response, goodbye closes dialogue
6. Talking again shows round 2
7. Round 3 then loop round work
8. "Return to Title" button works
9. HUD dock button undocks to orbit (starmap visible)
10. Docking again returns to PostCreditsStation

**Step 7: Commit**

```
git add src/features/endgame/EndCredits.jsx src/features/endgame/Epilogue.jsx src/App.jsx src/features/endgame/PostCreditsStation.jsx
git commit -m "feat: wire up post-credits station transition with Yumi Tanaka"
```

---

### Task 5: Final verification and cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Manual end-to-end test**

Using dev admin panel, verify the complete flow: epilogue -> stats -> credits -> post-credits station -> Yumi dialogue (all rounds) -> return to title.

**Step 4: Final commit if any cleanup was needed**

Only if changes were required from steps 1-3.
