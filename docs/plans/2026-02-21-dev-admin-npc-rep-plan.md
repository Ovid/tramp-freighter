# Dev Admin NPC Reputation Controls — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add NPC reputation controls to the dev admin panel so UAT testers can set any NPC to any reputation level.

**Architecture:** Add a `setNpcRep(npcId, value)` method to `NPCManager` that directly sets reputation (bypassing trust multipliers), delegate it through `GameStateManager`, then add a collapsible UI section to `DevAdminPanel` with per-NPC numeric inputs and tier quick-buttons.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern (useGameEvent/useGameAction)

---

### Task 1: Add setNpcRep to NPCManager (test)

**Files:**
- Create: `tests/unit/npc-set-rep.test.js`

**Step 1: Write the failing tests**

Create `tests/unit/npc-set-rep.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('NPCManager.setNpcRep', () => {
  function createGame() {
    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    return gsm;
  }

  it('should set NPC reputation to the exact value provided', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 75);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(75);
  });

  it('should clamp values above 100 to 100', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 150);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(100);
  });

  it('should clamp values below -100 to -100', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', -200);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(-100);
  });

  it('should round floating-point values', () => {
    const gsm = createGame();
    gsm.setNpcRep('chen_barnards', 42.7);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(43);
  });

  it('should NOT update lastInteraction or interactions count', () => {
    const gsm = createGame();
    const npcState = gsm.getNPCState('chen_barnards');
    const originalLastInteraction = npcState.lastInteraction;
    const originalInteractions = npcState.interactions;

    gsm.setNpcRep('chen_barnards', 50);

    expect(npcState.lastInteraction).toBe(originalLastInteraction);
    expect(npcState.interactions).toBe(originalInteractions);
  });

  it('should bypass trust multiplier (set exact value regardless of NPC personality)', () => {
    const gsm = createGame();
    // Wei Chen has trust: 0.3, but setNpcRep should bypass this
    gsm.setNpcRep('chen_barnards', 60);
    expect(gsm.getNPCState('chen_barnards').rep).toBe(60);
  });

  it('should emit npcsChanged event', () => {
    const gsm = createGame();
    const handler = vi.fn();
    gsm.on('npcsChanged', handler);

    gsm.setNpcRep('chen_barnards', 50);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should throw for unknown NPC ID', () => {
    const gsm = createGame();
    expect(() => gsm.setNpcRep('nonexistent_npc', 50)).toThrow('Unknown NPC ID');
  });

  it('should save game after setting rep', () => {
    const gsm = createGame();
    const saveSpy = vi.spyOn(gsm, 'saveGame');

    gsm.setNpcRep('chen_barnards', 50);

    expect(saveSpy).toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/npc-set-rep.test.js`
Expected: FAIL — `gsm.setNpcRep is not a function`

---

### Task 2: Add setNpcRep to NPCManager (implementation)

**Files:**
- Modify: `src/game/state/managers/npc.js` (add method after `modifyRep`, around line 149)
- Modify: `src/game/state/game-state-manager.js` (add delegation after `modifyRep` delegation, around line 400)

**Step 3: Implement setNpcRep in NPCManager**

Add this method to `NPCManager` in `src/game/state/managers/npc.js` right after the `modifyRep` method (after line 149):

```js
  /**
   * Set NPC reputation to an exact value (dev tool)
   *
   * Bypasses trust multiplier and does not update interaction tracking.
   * Used by dev admin panel for testing tier-gated behaviors.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} value - Target reputation value (-100 to 100)
   */
  setNpcRep(npcId, value) {
    this.validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);
    npcState.rep = Math.round(Math.max(-100, Math.min(100, value)));
  }
```

**Step 4: Add delegation in GameStateManager**

Add this after the `modifyRep` delegation (after line 400 in `game-state-manager.js`):

```js
  setNpcRep(npcId, value) {
    this.npcManager.setNpcRep(npcId, value);
    this.emit('npcsChanged', { ...this.state.npcs });
    this.saveGame();
  }
```

**Step 5: Run tests to verify they pass**

Run: `npm test -- tests/unit/npc-set-rep.test.js`
Expected: All 8 tests PASS

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add tests/unit/npc-set-rep.test.js src/game/state/managers/npc.js src/game/state/game-state-manager.js
git commit -m "feat: add setNpcRep for dev admin NPC reputation control"
```

---

### Task 3: Add NPC Reputation section to DevAdminPanel (implementation)

**Files:**
- Modify: `src/features/dev-admin/DevAdminPanel.jsx`

**Context for the implementer:**
- The panel already imports `useGameEvent` (line 3) and `useGameState` (line 2)
- NPC data comes from `ALL_NPCS` in `src/game/data/npc-data.js` — each NPC has `id`, `name`, `role`
- `REPUTATION_TIERS` from `src/game/constants.js` has tier objects with `name`, `min`, `max`
- The faction rep section (lines 473-507) is the best pattern to follow
- The section goes between Faction Reputation (line 507) and Ship Quirks (line 509)
- `npcsChanged` is the event name to subscribe to (emitted by `setNpcRep`)
- `gameStateManager.getNPCState(npcId)` returns `{ rep, ... }`
- `gameStateManager.getRepTier(rep)` returns `{ name, min, max }`
- `gameStateManager.setNpcRep(npcId, value)` sets exact rep value

**Step 8: Add imports and state**

At the top of `DevAdminPanel.jsx`, add to the existing imports from constants:

```js
import {
  SHIP_CONFIG,
  COMMODITY_TYPES,
  FACTION_CONFIG,
  REPUTATION_TIERS,
} from '../../game/constants.js';
import { ALL_NPCS } from '../../game/data/npc-data.js';
```

Add state inside the component (after the existing `useGameEvent` subscriptions, around line 30):

```js
  const npcs = useGameEvent('npcsChanged');

  // NPC reputation section collapse state
  const [npcSectionOpen, setNpcSectionOpen] = useState(false);
  // NPC reputation input fields — keyed by npcId
  const [npcRepInputs, setNpcRepInputs] = useState({});
```

**Step 9: Add NPC initialization in the mount useEffect**

In the existing `useEffect` that initializes values (around line 91-110), add NPC initialization inside the `if (player && ship)` block:

```js
      // Initialize NPC rep inputs
      const npcInputs = {};
      ALL_NPCS.forEach((npc) => {
        const npcState = gameStateManager.getNPCState(npc.id);
        npcInputs[npc.id] = String(npcState.rep);
      });
      setNpcRepInputs(npcInputs);
```

**Step 10: Add useEffect to sync NPC inputs when npcsChanged fires**

Add a new `useEffect` after the existing sync effects (after line 86):

```js
  useEffect(() => {
    if (npcs) {
      const npcInputs = {};
      ALL_NPCS.forEach((npc) => {
        const npcState = npcs[npc.id];
        if (npcState) {
          npcInputs[npc.id] = String(npcState.rep);
        }
      });
      setNpcRepInputs(npcInputs);
    }
  }, [npcs]);
```

**Step 11: Add handler functions**

Add after the existing `handleQuickFactionRep` function (after line 199):

```js
  // Handlers for NPC reputation
  const handleSetNpcRep = (npcId) => {
    const amount = parseInt(npcRepInputs[npcId]);
    if (!isNaN(amount) && amount >= -100 && amount <= 100) {
      gameStateManager.setNpcRep(npcId, amount);
    }
  };

  const handleQuickNpcRep = (npcId, value) => {
    gameStateManager.setNpcRep(npcId, value);
    setNpcRepInputs((prev) => ({ ...prev, [npcId]: String(value) }));
  };
```

**Step 12: Add JSX section**

Insert this between the Faction Reputation section closing `</div>` (line 507) and the Ship Quirks section comment (line 509):

```jsx
      {/* NPC Reputation Section */}
      <div className="dev-admin-section">
        <h3
          onClick={() => setNpcSectionOpen(!npcSectionOpen)}
          style={{ cursor: 'pointer' }}
        >
          NPC Reputation {npcSectionOpen ? '▼' : '▶'}
        </h3>
        {npcSectionOpen &&
          ALL_NPCS.map((npc) => {
            const npcState = gameStateManager.getNPCState(npc.id);
            const tier = gameStateManager.getRepTier(npcState.rep);
            return (
              <div key={npc.id} className="dev-admin-faction-row">
                <div className="dev-admin-npc-label">
                  {npc.name} — {npc.role}{' '}
                  <span className="dev-admin-npc-tier">
                    {npcState.rep} ({tier.name})
                  </span>
                </div>
                <div className="dev-admin-control">
                  <input
                    type="number"
                    value={npcRepInputs[npc.id] || '0'}
                    onChange={(e) =>
                      setNpcRepInputs((prev) => ({
                        ...prev,
                        [npc.id]: e.target.value,
                      }))
                    }
                    min="-100"
                    max="100"
                  />
                  <button onClick={() => handleSetNpcRep(npc.id)}>Set</button>
                </div>
                <div className="dev-admin-quick-buttons">
                  <button onClick={() => handleQuickNpcRep(npc.id, -75)}>
                    Hostile
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, -30)}>
                    Cold
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, 0)}>
                    Neutral
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, 20)}>
                    Warm
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, 45)}>
                    Friendly
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, 75)}>
                    Trusted
                  </button>
                  <button onClick={() => handleQuickNpcRep(npc.id, 95)}>
                    Family
                  </button>
                </div>
              </div>
            );
          })}
      </div>
```

**Step 13: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 14: Commit**

```bash
git add src/features/dev-admin/DevAdminPanel.jsx
git commit -m "feat: add NPC reputation section to dev admin panel"
```

---

### Task 4: Manual verification (UAT)

**Step 15: Start dev server and verify**

Run: `npm run dev`

1. Open browser to http://localhost:5173
2. Ensure `.dev` file exists at project root
3. Start a new game, open dev admin panel
4. Verify "NPC Reputation" section appears (collapsed by default)
5. Click to expand — all 11 NPCs listed with name, role, current rep, tier
6. Set Wei Chen to 75 using numeric input — verify shows "75 (Trusted)"
7. Click "Family" quick button — verify shows "95 (Family)"
8. Click "Hostile" quick button — verify shows "-75 (Hostile)"
9. Close and reopen panel — verify values persisted

**Step 16: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address UAT findings for NPC reputation controls"
```
