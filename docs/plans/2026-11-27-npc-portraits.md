# NPC & Encounter Portraits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show character portraits in NPC dialogue and the four danger
encounter panels, plus thumbnails in the end-credits cast list.

**Architecture:** Source PNGs in `images/` are renamed to their game keys and
converted by a shell script into 384px WebPs under `public/portraits/`. Vite
serves `public/` as-is. One pure URL helper (`getPortraitUrl`) and one
`<Portrait>` component (an `<img>` that renders nothing if the file fails to
load) are dropped into each panel. There are no new game-state reads, because
every key is already a prop or an encounter field.

**Tech Stack:** React 18, Vite (`public/` dir, `import.meta.env.BASE_URL`),
Vitest + Testing Library, `cwebp` (Homebrew `webp`).

**Design doc:** `docs/plans/2026-11-27-npc-portraits-design.md`

---

## Conventions for every task

- Run single test files with `npm test -- <path>`. The `--` is required;
  without it the arguments are dropped silently.
- `.test.jsx` files run in jsdom; `.test.js` files run in node.
- Tests must produce no stderr/console noise.
- Commit with plain `-m` strings only. No heredocs, no `$(...)`. Every commit
  ends with `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- In Vitest, `BASE_URL` is `/`, so expected URLs in panel tests are literal
  strings like `/portraits/pirate/strong.webp`. Write them out as literals.
  Don't build them with `getPortraitUrl`, or the test would just be checking
  the helper against itself.

---

### Task 1: Rename source art to game keys

The filename is the lookup key. The source tree mirrors the shipped tree
(`images/npc/`, `images/pirate/`, `images/encounter/`), so the build script
can map paths without a table.

**Files:**
- Move: all 18 PNGs in `images/`
- Modify: `images/README.md`

**Step 1: Move the files**

Run from the repo root:

```bash
mkdir -p images/npc images/pirate images/encounter
git mv "images/Captain Vasquez at Eridani Hub.png" images/npc/vasquez_epsilon.png
git mv "images/Father Okonkwo, Space Station Chaplain.png" images/npc/okonkwo_ross154.png
git mv "images/Lucky Liu at Wolf 359.png" images/npc/liu_wolf359.png
git mv "images/Marcus Cole on the Amber CRT.png" images/npc/cole_sol.png
git mv "images/Rusty Rodriguez in the Repair Bay.png" images/npc/rodriguez_procyon.png
git mv "images/Station Master Kowalski on Comms.png" images/npc/kowalski_alpha_centauri.png
git mv "images/Tau Ceti Station Administrator.png" images/npc/kim_tau_ceti.png
git mv "images/Wei Chen of Bore Station 7.png" images/npc/chen_barnards.png
git mv "images/Whisper beneath the green data lens.png" images/npc/whisper_sirius.png
git mv "images/Yuki Tanaka at Bore Station 7.png" images/npc/tanaka_barnards.png
git mv "images/Yumi Tanaka on the Alien Frontier.png" images/npc/yumi_delta_pavonis.png
git mv images/Zara\ Osman\ at\ Luyten*Outpost.png images/npc/osman_luyten.png
git mv "images/Desperate Pirate on a CRT.png" images/pirate/weak.png
git mv "images/Red-Glow Space Pirate Portrait.png" images/pirate/moderate.png
git mv "images/Red-Eyed Raider Captain.png" images/pirate/strong.png
git mv "images/Scarred space pirate warlord on CRT.png" images/pirate/dangerous.png
git mv "images/Retro Customs Inspector with Cyan Scanner.png" images/encounter/inspection.png
git mv "images/Mayday pilot on amber comms.png" images/encounter/distress.png
```

(The Osman filename contains a curly apostrophe `’`, hence the glob.)

**Step 2: Verify**

Run: `ls images/*.png 2>/dev/null | wc -l; ls images/npc | wc -l; ls images/pirate images/encounter`
Expected: `0`, `12`, then `dangerous.png moderate.png strong.png weak.png` and
`distress.png inspection.png`.

**Step 3: Record the original titles in `images/README.md`**

Keep the existing two lines and append:

```markdown

## Original titles

| File                                | Original title                            |
| ----------------------------------- | ----------------------------------------- |
| `npc/vasquez_epsilon.png`           | Captain Vasquez at Eridani Hub            |
| `npc/okonkwo_ross154.png`           | Father Okonkwo, Space Station Chaplain    |
| `npc/liu_wolf359.png`               | Lucky Liu at Wolf 359                     |
| `npc/cole_sol.png`                  | Marcus Cole on the Amber CRT              |
| `npc/rodriguez_procyon.png`         | Rusty Rodriguez in the Repair Bay         |
| `npc/kowalski_alpha_centauri.png`   | Station Master Kowalski on Comms          |
| `npc/kim_tau_ceti.png`              | Tau Ceti Station Administrator            |
| `npc/chen_barnards.png`             | Wei Chen of Bore Station 7                |
| `npc/whisper_sirius.png`            | Whisper beneath the green data lens       |
| `npc/tanaka_barnards.png`           | Yuki Tanaka at Bore Station 7             |
| `npc/yumi_delta_pavonis.png`        | Yumi Tanaka on the Alien Frontier         |
| `npc/osman_luyten.png`              | Zara Osman at Luyten’s Outpost            |
| `pirate/weak.png`                   | Desperate Pirate on a CRT                 |
| `pirate/moderate.png`               | Red-Glow Space Pirate Portrait            |
| `pirate/strong.png`                 | Red-Eyed Raider Captain                   |
| `pirate/dangerous.png`              | Scarred space pirate warlord on CRT       |
| `encounter/inspection.png`          | Retro Customs Inspector with Cyan Scanner |
| `encounter/distress.png`            | Mayday pilot on amber comms               |

Filenames are lookup keys: `npc/<npcId>`, `pirate/<threatLevel>`,
`encounter/<type>`. Run `scripts/build-portraits.sh` after adding or
replacing art.
```

**Step 4: Commit**

```bash
git add images
git commit -m "chore(images): rename portrait source art to game keys" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Build script and shipped WebPs

**Files:**
- Create: `scripts/build-portraits.sh`
- Create: `public/portraits/**/*.webp` (generated)

**Step 1: Write the script**

`cwebp -resize` handles the resize itself, so `sips` isn't needed. All source
images are square (1254×1254), so a fixed 384×384 resize doesn't distort them.

```bash
#!/usr/bin/env bash
# Regenerate shipped portrait WebPs from the source PNGs in images/.
# Re-run only when art is added or replaced; both trees are committed so
# builds and CI never need cwebp. Requires: brew install webp
set -euo pipefail

src=images
out=public/portraits
size=384
quality=80

for png in "$src"/*/*.png; do
  rel=${png#"$src"/}
  dest="$out/${rel%.png}.webp"
  mkdir -p "$(dirname "$dest")"
  cwebp -quiet -q "$quality" -resize "$size" "$size" "$png" -o "$dest"
done
```

**Step 2: Run it**

```bash
chmod +x scripts/build-portraits.sh
scripts/build-portraits.sh
find public/portraits -name '*.webp' | wc -l
du -sh public/portraits
```

Expected: `18`, with a total under 1 MB. If it's over, lower `quality`
and re-run.

**Step 3: Eyeball one**

Run: `open public/portraits/pirate/strong.webp`
Expected: a sharp 384px portrait with no visible artefacts.

**Step 4: Commit**

```bash
git add scripts/build-portraits.sh public/portraits
git commit -m "feat(portraits): build 384px WebP portraits from source art" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `getPortraitUrl`

It must use `BASE_URL`, because `vite.config.js` supports sub-path deploys via
`VITE_BASE_PATH`. A hardcoded `/` would break those deploys.

**Files:**
- Create: `src/features/portraits/portrait-url.js`
- Test: `tests/unit/portrait-url.test.js`

**Step 1: Write the failing test**

Stub a non-default base. With the default `/`, a hardcoded `/portraits/...`
would also pass.

```js
import { describe, it, expect, afterEach, vi } from 'vitest';
import { getPortraitUrl } from '../../src/features/portraits/portrait-url.js';

describe('getPortraitUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes the deploy base path', () => {
    vi.stubEnv('BASE_URL', '/tramp/');
    expect(getPortraitUrl('npc', 'cole_sol')).toBe(
      '/tramp/portraits/npc/cole_sol.webp'
    );
  });
});
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/portrait-url.test.js`
Expected: FAIL, because the module can't be resolved.

**Step 3: Implement**

```js
// BASE_URL, not '/', because VITE_BASE_PATH sub-path deploys serve public/
// under a prefix.
export function getPortraitUrl(category, key) {
  return `${import.meta.env.BASE_URL}portraits/${category}/${key}.webp`;
}
```

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/unit/portrait-url.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/portraits/portrait-url.js tests/unit/portrait-url.test.js
git commit -m "feat(portraits): add getPortraitUrl honouring BASE_URL" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `<Portrait>` component

**Files:**
- Create: `src/features/portraits/Portrait.jsx`
- Test: `tests/unit/portrait.test.jsx`

**Step 1: Write the first failing test**

```jsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Portrait } from '../../src/features/portraits/Portrait.jsx';

describe('Portrait', () => {
  it('renders a decorative lazy image', () => {
    const { container } = render(<Portrait src="/portraits/npc/cole_sol.webp" />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/portraits/npc/cole_sol.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('portrait');
  });
});
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/portrait.test.jsx`
Expected: FAIL, because the module can't be resolved.

**Step 3: Implement**

The size lives in CSS, via `className`, so no numbers are needed in JS.
The component remembers *which* `src` failed, not just "failed". That way a
new `src` gets a fresh attempt instead of staying hidden.

```jsx
import { useState } from 'react';

/**
 * Character portrait. Decorative (alt=""), because the character's name is the
 * adjacent heading. Missing art renders nothing rather than a broken icon;
 * tests/unit/portrait-assets.test.js is what catches missing files.
 */
export function Portrait({ src, className = 'portrait' }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (failedSrc === src) return null;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
```

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/unit/portrait.test.jsx`
Expected: PASS.

**Step 5: Add the error test (RED, then GREEN)**

Add inside the `describe`:

```jsx
  it('renders nothing once the image fails to load', () => {
    const { container } = render(<Portrait src="/portraits/npc/nobody.webp" />);
    fireEvent.error(container.querySelector('img'));
    expect(container.firstChild).toBeNull();
  });
```

Run: `npm test -- tests/unit/portrait.test.jsx`
Expected: PASS, because the implementation already handles this. To confirm
the test actually exercises that path, temporarily delete the `onError`
prop, watch the test FAIL, then put the prop back.

**Step 6: Commit**

```bash
git add src/features/portraits/Portrait.jsx tests/unit/portrait.test.jsx
git commit -m "feat(portraits): add Portrait component that hides missing art" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Asset completeness test

At runtime the fallback hides missing art, so this test is the only thing
that catches a rename typo or a renamed threat level. Threat levels aren't
hardcoded here. Each one is produced by running the real `determineThreatLevel`,
so if the calculator renames a level, this test fails.

**Files:**
- Test: `tests/unit/portrait-assets.test.js`

**Step 1: Write the test**

```js
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { determineThreatLevel } from '../../src/game/utils/calculators.js';
import { THREAT_LEVEL_CONFIG } from '../../src/game/constants.js';

const portraitExists = (category, key) =>
  existsSync(`public/portraits/${category}/${key}.webp`);

function makeGameState({ cargoValue = 0, hull = 100, outlawRep = 0 } = {}) {
  return {
    ship: { cargo: [{ qty: 1, buyPrice: cargoValue }], hull },
    player: { factions: { outlaws: outlawRep } },
  };
}

// One state per branch of determineThreatLevel, so every level the game can
// produce is checked against the shipped files.
const THREAT_STATES = [
  makeGameState({ cargoValue: THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS + 1 }),
  makeGameState({ cargoValue: THREAT_LEVEL_CONFIG.CARGO_VALUE_STRONG + 1 }),
  makeGameState(),
  makeGameState({ outlawRep: -THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK - 1 }),
];

describe('portrait assets', () => {
  it.each(ALL_NPCS.map((npc) => npc.id))('has a portrait for NPC %s', (id) => {
    expect(portraitExists('npc', id)).toBe(true);
  });

  it('has a portrait for every pirate threat level', () => {
    const levels = THREAT_STATES.map(determineThreatLevel);
    // Guards the fixtures: if two states collapse onto one level, a level
    // would go unchecked.
    expect(new Set(levels).size).toBe(4);
    for (const level of levels) {
      expect(portraitExists('pirate', level), level).toBe(true);
    }
  });

  it.each(['inspection', 'distress'])('has a portrait for %s', (key) => {
    expect(portraitExists('encounter', key)).toBe(true);
  });
});
```

**Step 2: Run it**

Run: `npm test -- tests/unit/portrait-assets.test.js`
Expected: PASS (the files are from Task 2), with no console output.

**Step 3: Prove it bites**

Run:

```bash
mv public/portraits/pirate/strong.webp /tmp/strong.webp
npm test -- tests/unit/portrait-assets.test.js   # expect FAIL naming "strong"
mv /tmp/strong.webp public/portraits/pirate/strong.webp
```

**Step 4: Commit**

```bash
git add tests/unit/portrait-assets.test.js
git commit -m "test(portraits): require shipped art for every NPC, threat level and encounter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Shared portrait CSS

**Files:**
- Create: `css/panel/portrait.css`
- Modify: `src/main.jsx` (add the import after `'../css/panel/pirate-encounter.css'`)

**Step 1: Write the CSS**

```css
/* Portrait on the left, text on the right; wraps with a smaller centred
   portrait on narrow screens. Fixed sizes reserve space so lazy loading
   doesn't shift layout. */
.portrait-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.portrait-row > :last-child {
  flex: 1;
  min-width: 0;
}

.portrait {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  object-fit: cover;
  border: 1px solid var(--color-primary);
}

.portrait-thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  margin-right: 12px;
  object-fit: cover;
  border: 1px solid var(--color-primary);
}

@media (max-width: 600px) {
  .portrait-row {
    flex-direction: column;
    align-items: center;
  }

  .portrait {
    width: 96px;
    height: 96px;
  }
}
```

**Step 2: Import it in `src/main.jsx`**

```js
import '../css/panel/portrait.css';
```

**Step 3: Verify**

Run: `npm run lint && bash scripts/lint-css-font-sizes.sh`
Expected: no errors.

**Step 4: Commit**

```bash
git add css/panel/portrait.css src/main.jsx
git commit -m "feat(portraits): add shared portrait row styles" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Pirate encounter panel

**Files:**
- Modify: `src/features/danger/PirateEncounterPanel.jsx` (~line 118, the
  `.threat-info` block)
- Test: `tests/unit/portrait-panels.test.jsx`

**Step 1: Write the failing test**

Create `tests/unit/portrait-panels.test.jsx`. The mocks are copied from
`tests/unit/encounter-dismiss-flee.test.jsx`; the panels need them to render
without a `GameProvider`.

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PirateEncounterPanel } from '../../src/features/danger/PirateEncounterPanel.jsx';

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    const defaults = {
      hullChanged: 100,
      engineChanged: 100,
      fuelChanged: 100,
      lifeSupportChanged: 100,
      cargoChanged: [],
      hiddenCargoChanged: [],
      creditsChanged: 1000,
      upgradesChanged: [],
      quirksChanged: [],
      karmaChanged: 0,
      factionRepChanged: {
        authorities: 0,
        outlaws: 0,
        civilians: 0,
        traders: 0,
      },
      currentSystemChanged: 0,
      intelligenceChanged: {},
    };
    return defaults[eventName] ?? null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({}),
}));

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGame: () => ({
    getDangerZone: () => 'safe',
  }),
}));

const noop = () => {};
const portraitSrc = (container) =>
  container.querySelector('img.portrait')?.getAttribute('src');

describe('encounter panel portraits', () => {
  it('PirateEncounterPanel shows the portrait for its threat level', () => {
    const { container } = render(
      <PirateEncounterPanel
        encounter={{ threatLevel: 'strong' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/pirate/strong.webp');
  });
});
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/portrait-panels.test.jsx`
Expected: FAIL, because `portraitSrc` returns `undefined`.

**Step 3: Implement**

Add the imports (internal modules, then components, per the import order
in CLAUDE.md):

```jsx
import { getPortraitUrl } from '../portraits/portrait-url.js';
import { Portrait } from '../portraits/Portrait.jsx';
```

Wrap the existing `<div className="threat-info">…</div>` element in a
portrait row. Leave its contents unchanged:

```jsx
<div className="portrait-row">
  <Portrait src={getPortraitUrl('pirate', threatLevel)} />
  <div className="threat-info">
    {/* existing contents unchanged */}
  </div>
</div>
```

Use the existing local `threatLevel` (line 95, which already defaults to
`'moderate'`), not `encounter.threatLevel`.

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/unit/portrait-panels.test.jsx tests/unit/encounter-dismiss-flee.test.jsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/danger/PirateEncounterPanel.jsx tests/unit/portrait-panels.test.jsx
git commit -m "feat(portraits): show pirate portrait by threat level in encounter panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Negotiation panel

**Files:**
- Modify: `src/features/danger/NegotiationPanel.jsx` (~line 89, the
  `.context-info` block)
- Test: `tests/unit/portrait-panels.test.jsx`

**Step 1: Write the failing test**

Add the import `NegotiationPanel` from
`'../../src/features/danger/NegotiationPanel.jsx'`, and add:

```jsx
  it('NegotiationPanel shows the portrait for its threat level', () => {
    const { container } = render(
      <NegotiationPanel
        encounter={{ threatLevel: 'dangerous' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/pirate/dangerous.webp');
  });
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/portrait-panels.test.jsx`
Expected: the new test FAILS.

**Step 3: Implement**

Add the same two imports as in Task 7. Wrap `<div className="context-info">…</div>`:

```jsx
<div className="portrait-row">
  <Portrait src={getPortraitUrl('pirate', encounter.threatLevel)} />
  <div className="context-info">
    {/* existing contents unchanged */}
  </div>
</div>
```

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/unit/portrait-panels.test.jsx tests/unit/encounter-dismiss-flee.test.jsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/danger/NegotiationPanel.jsx tests/unit/portrait-panels.test.jsx
git commit -m "feat(portraits): show pirate portrait in negotiation panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Inspection panel

**Files:**
- Modify: `src/features/danger/InspectionPanel.jsx` (~line 79, the
  `.inspection-info` block)
- Test: `tests/unit/portrait-panels.test.jsx`

**Step 1: Write the failing test**

Import `InspectionPanel` from `'../../src/features/danger/InspectionPanel.jsx'`:

```jsx
  it('InspectionPanel shows the customs inspector', () => {
    const { container } = render(
      <InspectionPanel
        inspection={{ securityLevel: 'standard' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/encounter/inspection.webp');
  });
```

**Step 2: Run it and confirm it fails.** Run `npm test -- tests/unit/portrait-panels.test.jsx`; the new test should FAIL.

**Step 3: Implement**

Add the same two imports. Wrap `<div className="inspection-info">…</div>`:

```jsx
<div className="portrait-row">
  <Portrait src={getPortraitUrl('encounter', 'inspection')} />
  <div className="inspection-info">
    {/* existing contents unchanged */}
  </div>
</div>
```

**Step 4: Run it and confirm it passes.** Run the same command as Task 8, Step 4, plus `tests/integration/inspection-panel-click.test.js`.

**Step 5: Commit**

```bash
git add src/features/danger/InspectionPanel.jsx tests/unit/portrait-panels.test.jsx
git commit -m "feat(portraits): show customs inspector portrait in inspection panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Distress call panel

**Files:**
- Modify: `src/features/danger/DistressCallPanel.jsx` (~line 88, the
  `.call-details` block)
- Test: `tests/unit/portrait-panels.test.jsx`

**Step 1: Write the failing test**

Import `DistressCallPanel` from `'../../src/features/danger/DistressCallPanel.jsx'`:

```jsx
  it('DistressCallPanel shows the mayday pilot', () => {
    const { container } = render(
      <DistressCallPanel
        distressCall={{ description: 'Help!', type: 'stranded' }}
        onChoice={noop}
        onClose={noop}
      />
    );
    expect(portraitSrc(container)).toBe('/portraits/encounter/distress.webp');
  });
```

**Step 2: Run it and confirm it fails.**

**Step 3: Implement**

Add the same two imports. Wrap `<div className="call-details">…</div>`:

```jsx
<div className="portrait-row">
  <Portrait src={getPortraitUrl('encounter', 'distress')} />
  <div className="call-details">
    {/* existing contents unchanged */}
  </div>
</div>
```

**Step 4: Run it and confirm it passes.** Run `npm test -- tests/unit/portrait-panels.test.jsx tests/unit/encounter-dismiss-flee.test.jsx`.

**Step 5: Commit**

```bash
git add src/features/danger/DistressCallPanel.jsx tests/unit/portrait-panels.test.jsx
git commit -m "feat(portraits): show mayday pilot portrait in distress call panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Dialogue panel

`PostCreditsStation` needs no change, because it opens this same panel.

**Files:**
- Modify: `src/features/dialogue/DialoguePanel.jsx` (~line 219, the
  `.dialogue-text` block)
- Test: `tests/integration/dialogue-portrait.integration.test.jsx`

**Step 1: Write the failing test**

This follows the setup in `tests/integration/dialogue-panel-lifecycle.integration.test.jsx`:
a real `GameCoordinator` inside a `GameProvider`, because the dialogue loads
asynchronously.

```jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

describe('DialoguePanel portrait', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('console', { log: vi.fn(), error: vi.fn(), warn: vi.fn() });
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the NPC's portrait beside their dialogue", async () => {
    const { container } = render(
      <GameProvider game={game}>
        <DialoguePanel npcId="chen_barnards" onClose={vi.fn()} />
      </GameProvider>
    );

    await waitFor(() => {
      expect(
        container.querySelector('img.portrait')?.getAttribute('src')
      ).toBe('/portraits/npc/chen_barnards.webp');
    });
  });
});
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/integration/dialogue-portrait.integration.test.jsx`
Expected: FAIL from the `waitFor` timeout, with `undefined` as the src.

**Step 3: Implement**

Add the imports:

```jsx
import { getPortraitUrl } from '../portraits/portrait-url.js';
import { Portrait } from '../portraits/Portrait.jsx';
```

Wrap the existing `.dialogue-text` element:

```jsx
<div className="portrait-row">
  <Portrait src={getPortraitUrl('npc', npcId)} />
  <div className="dialogue-text">
    <p>{dialogueDisplay.text}</p>
  </div>
</div>
```

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/integration/dialogue-portrait.integration.test.jsx tests/integration/dialogue-panel-lifecycle.integration.test.jsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/dialogue/DialoguePanel.jsx tests/integration/dialogue-portrait.integration.test.jsx
git commit -m "feat(portraits): show NPC portrait beside dialogue text" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: End-credits cast thumbnails

**Files:**
- Modify: `src/features/endgame/EndCredits.jsx` (~line 177, the cast rows)
- Test: `tests/unit/end-credits.test.jsx`

**Step 1: Write the failing test**

Add an import `ALL_NPCS` from `'../../src/game/data/npc-data.js'`, and add
this inside the existing `describe`:

```jsx
  it('shows a portrait thumbnail for each cast member', () => {
    const { container } = render(
      <EndCredits onCreditsComplete={onCreditsComplete} />
    );
    const srcs = [
      ...container.querySelectorAll('.credits-cast-row img.portrait-thumb'),
    ].map((img) => img.getAttribute('src'));
    expect(srcs).toEqual(
      ALL_NPCS.map((npc) => `/portraits/npc/${npc.id}.webp`)
    );
  });
```

**Step 2: Run it and confirm it fails**

Run: `npm test -- tests/unit/end-credits.test.jsx`
Expected: the new test FAILS, because `srcs` is `[]`.

**Step 3: Implement**

Add the same two imports. Insert the thumbnail before the name in the
dynamic cast row:

```jsx
<div key={npc.id} className="credits-cast-row">
  <Portrait
    src={getPortraitUrl('npc', npc.id)}
    className="portrait-thumb"
  />
  <span className="credits-cast-name">{npc.name}</span>
  ...
```

The row uses `align-items: baseline`, which lines an `<img>` up by its bottom
edge. If the thumbnails look misaligned in Task 13, add
`.credits-cast-row { align-items: center; }` to `src/features/endgame/endgame.css`.

**Step 4: Run it and confirm it passes**

Run: `npm test -- tests/unit/end-credits.test.jsx tests/unit/epilogue-credits-phase.test.jsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/endgame/EndCredits.jsx tests/unit/end-credits.test.jsx
git commit -m "feat(portraits): add NPC thumbnails to end-credits cast list" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Full verification and visual check

**Step 1: Full suite and checks**

Run: `npm run all`
Expected: lint and format are clean, and all tests pass with no stderr warnings.
If Prettier reformats anything, commit it separately as
`style: prettier formatting`.

**Step 2: Production build includes the portraits**

Run: `npm run build && find dist/portraits -name '*.webp' | wc -l`
Expected: `18`.

**Step 3: Sub-path deploy**

Run: `VITE_BASE_PATH=/tramp/ npm run build && grep -o 'portraits/' dist/assets/*.js | head -1`
Expected: the build succeeds. The URL is assembled at runtime from `BASE_URL`,
which Task 3's test already covers. Rebuild with a plain `npm run build`
afterwards.

**Step 4: Eyeball it in the browser**

Run `npm run dev` and use the dev admin panel previews
(`src/features/dev-admin/`) to open each encounter panel. Then dock at a
station and talk to an NPC. Check the following, on desktop and with the
window under 600px wide:

- The portrait sits left of the text and wraps above it on narrow widths.
- Each pirate threat level shows a different face.
- The credits show 48px thumbnails beside names (preview the epilogue from
  the dev admin panel).

Fix anything that looks off in `css/panel/portrait.css`, then commit.

---

## Out of scope (per design doc)

- `CombatPanel` portraits.
- Thumbnails on StationMenu / PostCreditsStation NPC list buttons.
- `MechanicalFailurePanel` (no art exists).
