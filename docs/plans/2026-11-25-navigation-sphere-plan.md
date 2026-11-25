# Navigation Sphere Usability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Make the star map readable and predictable. Drags stop selecting
stars (#51), rotation speed is frame-rate independent and adjustable (#54),
labels, the reticle and click targets are a fixed size on screen (#55), and
multi-star systems show as one point (#56).

**Architecture:** The pure screen-space math (drag test, rotation angle,
px-to-sprite-scale, `pickStar`) lives in one new module,
`src/game/engine/starmap-math.js`. `StarMapCanvas` wires it into pointer
events and the animation loop. Star-system helpers (`isCompanion`,
`getSystemName`, `getCompanions`, `starKind`) live in
`src/game/utils/star-systems.js`. Rumors and events filter on a new
`isWormholeConnected` in `wormhole-graph.js` (ADR 0002).

**Tech Stack:** React 18, Three.js 0.150, Vitest (jsdom for `.jsx`),
fast-check, Testing Library.

**Design:** `docs/plans/2026-11-25-navigation-sphere-design.md`. Read it
first.

> **Superseded in part:** `getSystemName` was removed after UAT. Primaries
> with companions are now named for their system in `star-data.js`, with
> `starName` for the lettered name. Label decluttering was also added. Read
> "Changes after UAT" in the design; the steps below that mention
> `getSystemName` describe what was first built, not the current code.

---

## Ground rules (read once)

- Branch: `ovid/navigation-sphere` (already checked out).
- TDD: one failing test → minimal code → green → commit. Never batch several
  failing tests.
- Every magic number goes in `src/game/constants.js`.
- After each task run `npm test`, `npm run lint` and `npm run format:check`.
  All three must pass before the commit. Fix formatting with
  `npm run format:write`.
- Run one file with `npm test -- tests/unit/<file>`. Note the `--`.
- Commits: plain `git commit -m "subject" -m "body"`. No heredocs, no `$(...)`.
  End with `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- Tests must not print to stderr. Mock `console` when testing error paths.
- Three.js facts you need:
  - A `Sprite` with `sizeAttenuation: false` has a `scale` that is a fraction
    of viewport height. On-screen height in px is
    `scale / tan(fov/2) × H/2`, so `scale = px × 2·tan(fov/2) / H`.
  - All `Sprite`s share **one** geometry. Never call `sprite.geometry.dispose()`
    on a single sprite.
  - `SpriteMaterial.rotation` spins a sprite in screen space.
  - `sprite.center` is the anchor in the sprite's own units. `(0.5, 0)` puts
    the anchor at the bottom middle, and a negative `y` lifts the sprite above
    its position.

---

## Phase 1: Drag versus click (#51)

### Task 1: Constants and `isDrag`

**Files:**
- Modify: `src/game/constants.js` (add a new block after `LABEL_CONFIG`, around line 906)
- Create: `src/game/engine/starmap-math.js`
- Test: `tests/unit/starmap-math.test.js`

**Step 1: Add the config block** (constants alone don't need a test)

```js
/**
 * Star map screen-space configuration.
 *
 * Sizes are CSS pixels so labels, reticles and click targets look the same
 * on every screen. starmap-math.js converts px to sprite scale.
 */
export const STARMAP_CONFIG = Object.freeze({
  CLICK_DRAG_THRESHOLD_PX: 5,
  // A fingertip drifts further than a mouse during a tap, and browsers still
  // fire click within their touch slop (~15px)
  CLICK_DRAG_THRESHOLD_TOUCH_PX: 10,
  MIN_PICK_RADIUS_PX: 12,
  MIN_PICK_RADIUS_TOUCH_PX: 22,
  LABEL_HEIGHT_PX: 28,
  RETICLE_SIZE_PX: 96,
  CURRENT_SYSTEM_SIZE_PX: 115,
  MAX_FRAME_DT_SEC: 0.1,
});
```

**Step 2: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { isDrag } from '../../src/game/engine/starmap-math.js';
import { STARMAP_CONFIG } from '../../src/game/constants.js';

describe('isDrag', () => {
  const T = STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX;

  it('is false when the pointer did not move', () => {
    expect(isDrag({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
  });

  it('is false at exactly the threshold', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: T, y: 0 })).toBe(false);
  });

  it('is true just past the threshold, diagonally', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: T, y: 1 })).toBe(true);
  });

  it('is false when there was no pointerdown', () => {
    expect(isDrag(null, { x: 100, y: 100 })).toBe(false);
  });

  it('uses the larger touch threshold for a touch pointerdown', () => {
    const TT = STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_TOUCH_PX;
    const down = { x: 0, y: 0, pointerType: 'touch' };
    expect(isDrag(down, { x: TT, y: 0 })).toBe(false);
    expect(isDrag(down, { x: TT + 1, y: 0 })).toBe(true);
  });
});
```

Add the touch test as its own RED → GREEN after the first four pass.

**Step 3:** `npm test -- tests/unit/starmap-math.test.js` → FAIL (module not found).

**Step 4: Implement**

```js
import { STARMAP_CONFIG } from '../constants.js';

/**
 * OrbitControls still fires `click` after a drag. Comparing the click
 * position with the pointerdown position tells a drag from a click.
 * `down.pointerType` comes from pointerdown; Safari's click has none.
 */
export function isDrag(down, up) {
  if (!down) return false;
  const threshold =
    down.pointerType === 'touch'
      ? STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_TOUCH_PX
      : STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX;
  return Math.hypot(up.x - down.x, up.y - down.y) > threshold;
}

/** Fingertips need a bigger target than a mouse pointer. */
export function minPickRadiusFor(pointerType) {
  return pointerType === 'touch'
    ? STARMAP_CONFIG.MIN_PICK_RADIUS_TOUCH_PX
    : STARMAP_CONFIG.MIN_PICK_RADIUS_PX;
}
```

Add `minPickRadiusFor` with its own RED → GREEN test (`'touch'` gives the
touch radius; `'mouse'`, `'pen'` and `undefined` give `MIN_PICK_RADIUS_PX`).

**Step 5:** Run the test → PASS. Then run the full suite, lint and format.

**Step 6: Commit**

```bash
git add src/game/constants.js src/game/engine/starmap-math.js tests/unit/starmap-math.test.js
git commit -m "feat(starmap): add drag threshold helper" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Ignore clicks that end a drag

**Files:**
- Modify: `src/features/navigation/StarMapCanvas.jsx:145-197` (the click handler) and its cleanup (~line 330)
- Test: `tests/unit/starmap-drag-click.test.jsx`

**Step 1: Write the failing test.** Copy the top of
`tests/property/starmap-scene-initialization.property.test.jsx` (imports,
`createMockSceneComponents`, and the three `vi.mock` calls) into the new
file, then add:

```jsx
import * as THREE from 'three';
import { STARMAP_CONFIG } from '../../src/game/constants.js';

describe('StarMapCanvas drag versus click', () => {
  // The mock sprites have no `layers`, so the real raycaster throws inside
  // the click listener. A throw also leaves both callbacks uncalled, which
  // would let the drag test pass on unfixed code. Stubbing the hit test
  // makes an unfixed click reach onSystemDeselected. Task 10 deletes this
  // along with the raycaster.
  beforeEach(() => {
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue(
      []
    );
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ignores a click that ends past the drag threshold', async () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    const onSystemSelected = vi.fn();
    const onSystemDeselected = vi.fn();

    render(
      <GameProvider game={game}>
        <StarMapCanvas
          onSystemSelected={onSystemSelected}
          onSystemDeselected={onSystemDeselected}
        />
      </GameProvider>
    );

    const { initScene } = await import('../../src/game/engine/scene');
    const canvas = initScene.mock.results.at(-1).value.renderer.domElement;

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 100, clientY: 100 })
    );
    canvas.dispatchEvent(
      new MouseEvent('click', {
        clientX: 100 + STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX + 1,
        clientY: 100,
      })
    );

    expect(onSystemSelected).not.toHaveBeenCalled();
    expect(onSystemDeselected).not.toHaveBeenCalled();
  });

  it('a click without a drag still reaches the handler', async () => {
    // render exactly as above, then:
    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 100, clientY: 100 })
    );
    canvas.dispatchEvent(
      new MouseEvent('click', { clientX: 100, clientY: 100 })
    );
    expect(onSystemDeselected).toHaveBeenCalledTimes(1);
  });
});
```

jsdom has no `PointerEvent` constructor. A `MouseEvent` named `pointerdown`
reaches a `pointerdown` listener with `clientX` and `clientY`. To send a
touch `pointerType`, set it on the event first:
`Object.defineProperty(e, 'pointerType', { value: 'touch' })`.

**Step 2:** Run it. The drag test FAILS on its assertion, because the
stubbed raycaster finds nothing and the handler calls `onSystemDeselected`.
The control test passes already; it guards against a handler that never
runs. There must be no uncaught error in the output. If there is one, the
stub is not in place.

**Step 3: Implement.** In `StarMapCanvas.jsx`, inside
`if (stars && stars.length > 0) {`:

```js
let pointerDownAt = null;
handlePointerDown = (event) => {
  pointerDownAt = {
    x: event.clientX,
    y: event.clientY,
    pointerType: event.pointerType,
  };
};
```

Declare `let handlePointerDown = null;` next to `let handleCanvasClick = null;`.
At the top of `handleCanvasClick`:

```js
if (isDrag(pointerDownAt, { x: event.clientX, y: event.clientY })) {
  return;
}
```

Register it with `renderer.domElement.addEventListener('pointerdown', handlePointerDown);`
beside the click listener. Remove it in the cleanup, beside the click
removal. Import `isDrag` from `'../../game/engine/starmap-math'`.

**Step 4:** Run the test → PASS. Run the full suite, lint and format.

**Step 5: Commit**: `fix(starmap): don't select or deselect a star at the end of a drag` (#51).

---

## Phase 2: Rotation speed (#54)

### Task 3: Rotation constants, `rotationAngle` and `resolveAutoRotationSpeed`

**Files:**
- Modify: `src/game/constants.js` (`VISUAL_CONFIG`, ~line 839)
- Modify: `src/game/engine/starmap-math.js`
- Test: `tests/unit/starmap-math.test.js`

**Step 1:** In `VISUAL_CONFIG`, add these beside `autoRotationSpeed: 0.2`
(search for it):

```js
  autoRotationDefaultSpeed: 3, // degrees per second
  autoRotationMaxSpeed: 12, // degrees per second (old 0.2°/frame at 60Hz)
  autoRotationStep: 0.5,
```

**Do not remove `autoRotationSpeed` yet.** `StarMapCanvas.jsx:274` still reads
it. Without it, `animate()` computes `NaN`, writes it into `camera.position`
every frame, and the map goes blank. Unit tests don't catch this. Task 5
removes it once `StarMapCanvas` stops reading it.

**Step 2: Failing tests, added one at a time** (RED/GREEN each):

```js
import {
  rotationAngle,
  resolveAutoRotationSpeed,
} from '../../src/game/engine/starmap-math.js';
import { VISUAL_CONFIG } from '../../src/game/constants.js';

describe('rotationAngle', () => {
  it('scales degrees per second by frame time, in radians', () => {
    expect(rotationAngle(10, 0.05)).toBeCloseTo((0.5 * Math.PI) / 180);
  });

  it('caps the frame time so a background tab does not jump', () => {
    expect(rotationAngle(10, 5)).toBeCloseTo(
      (10 * STARMAP_CONFIG.MAX_FRAME_DT_SEC * Math.PI) / 180
    );
  });

  it('treats negative frame time as zero', () => {
    expect(rotationAngle(10, -1)).toBe(0);
  });
});

describe('resolveAutoRotationSpeed', () => {
  it('uses the stored preference, including 0', () => {
    expect(resolveAutoRotationSpeed(6, false)).toBe(6);
    expect(resolveAutoRotationSpeed(0, false)).toBe(0);
    expect(resolveAutoRotationSpeed(6, true)).toBe(6);
  });

  it('defaults to the configured speed when unset', () => {
    expect(resolveAutoRotationSpeed(null, false)).toBe(
      VISUAL_CONFIG.autoRotationDefaultSpeed
    );
    expect(resolveAutoRotationSpeed(undefined, false)).toBe(
      VISUAL_CONFIG.autoRotationDefaultSpeed
    );
  });

  it('defaults to 0 under reduced motion', () => {
    expect(resolveAutoRotationSpeed(null, true)).toBe(0);
  });
});
```

**Step 3: Implement**

```js
const DEG_TO_RAD = Math.PI / 180;

/** Rotation for one frame. Frame time is capped so rotation stays smooth. */
export function rotationAngle(speedDegPerSec, dtSec) {
  const dt = Math.min(Math.max(dtSec, 0), STARMAP_CONFIG.MAX_FRAME_DT_SEC);
  return speedDegPerSec * dt * DEG_TO_RAD;
}

/** null/undefined means "player never chose": default, or 0 for reduced motion. */
export function resolveAutoRotationSpeed(preference, reducedMotion) {
  if (preference !== null && preference !== undefined) return preference;
  return reducedMotion ? 0 : VISUAL_CONFIG.autoRotationDefaultSpeed;
}
```

Import `VISUAL_CONFIG` too.

**Step 4:** Green, then the full suite. **Commit**: `feat(starmap): frame-rate independent rotation helpers`.

### Task 4: `autoRotationSpeed` preference

**Files:**
- Modify: `src/game/constants.js:557` (`DEFAULT_PREFERENCES`)
- Test: `tests/unit/preferences.test.js`

**Step 1: Failing test**

```js
it('autoRotationSpeed defaults to null (resolved at the star map)', () => {
  expect(gsm.getPreference('autoRotationSpeed')).toBeNull();
});

it('autoRotationSpeed of 0 is kept, not replaced by the default', () => {
  gsm.setPreference('autoRotationSpeed', 0);
  expect(gsm.getPreference('autoRotationSpeed')).toBe(0);
});
```

**Step 2:** Run it. The first test FAILS because `getPreference` returns `undefined`.

**Step 3:** Add `autoRotationSpeed: null,` to `DEFAULT_PREFERENCES`.

**Step 4:** Green. Old saves without the key read `undefined`, and
`resolveAutoRotationSpeed` treats that the same as `null`, so no migration is
needed. **Commit**: `feat(prefs): add autoRotationSpeed preference`.

### Task 5: Animation loop reads the preference

**Files:**
- Modify: `src/features/navigation/StarMapCanvas.jsx`

There is no new unit test here, because the loop is covered by Task 3's pure
helpers. UAT checks the feel.

**Step 1: Replace local state with the preference**
- Delete the `autoRotationEnabled` `useState`, `autoRotationRef`, the
  "Keep ref in sync" effect, and `handleToggleRotation`.
- Add:

```js
const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
const autoRotationPrefRef = useRef(preferences?.autoRotationSpeed);
useEffect(() => {
  autoRotationPrefRef.current = preferences?.autoRotationSpeed;
}, [preferences]);
```

**Step 2: In `animate()`**, before the rotation block:

```js
const dt = currentTime - lastFrameTime;
lastFrameTime = currentTime;
const speed = resolveAutoRotationSpeed(
  autoRotationPrefRef.current,
  reducedMotion
);
```

Declare `let lastFrameTime = Date.now() / 1000;` just before `function animate()`.
Change the condition to `if (speed > 0 && controls && controls.target)`, and set
`const rotationSpeed = rotationAngle(speed, dt);`. Update the "degrees per
frame" comment.

**Step 3:** Change `cameraState={{ autoRotationEnabled, boundaryVisible }}` to
`cameraState={{ boundaryVisible }}` and remove the `onToggleRotation` prop.
Task 6 removes them from `CameraControls`.

**Step 4:** Delete `autoRotationSpeed` from `VISUAL_CONFIG`. Then
`grep -rn "autoRotationSpeed" src tests` should show only the preference key
(`DEFAULT_PREFERENCES`, `preferences?.autoRotationSpeed`), not
`VISUAL_CONFIG.autoRotationSpeed`.

**Step 5:** Run the full suite and lint. **Commit**: `fix(starmap): rotate in degrees per second from a preference` (#54).

### Task 6: Rotation slider, desktop

**Files:**
- Create: `src/features/navigation/RotationSpeedSlider.jsx`
- Modify: `src/features/navigation/CameraControls.jsx:15-30, 136-146`
- Modify: the CSS file that defines `.settings-toggle-row` (find it with `grep -rn "settings-toggle-row" src --include=*.css`)
- Test: `tests/unit/rotation-speed-slider.test.jsx`, plus updates to
  `tests/unit/settings-panel.test.jsx` and
  `tests/property/camera-controls.property.test.jsx`

**Step 1: Failing test for the slider**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RotationSpeedSlider } from '../../src/features/navigation/RotationSpeedSlider';
import { VISUAL_CONFIG } from '../../src/game/constants';

describe('RotationSpeedSlider', () => {
  it('is a labelled range with the configured bounds', () => {
    render(<RotationSpeedSlider value={3} onChange={() => {}} />);
    const input = screen.getByLabelText('Star Rotation');
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe(String(VISUAL_CONFIG.autoRotationMaxSpeed));
    expect(input.step).toBe(String(VISUAL_CONFIG.autoRotationStep));
    expect(input.getAttribute('aria-valuetext')).toBe('3 degrees per second');
  });

  it('announces Off at 0', () => {
    render(<RotationSpeedSlider value={0} onChange={() => {}} />);
    expect(
      screen.getByLabelText('Star Rotation').getAttribute('aria-valuetext')
    ).toBe('Off');
  });

  it('reports the new value as a number', () => {
    const onChange = vi.fn();
    render(<RotationSpeedSlider value={3} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Star Rotation'), {
      target: { value: '6.5' },
    });
    expect(onChange).toHaveBeenCalledWith(6.5);
  });
});
```

**Step 2:** FAIL. **Step 3: Implement**

```jsx
import { VISUAL_CONFIG } from '../../game/constants';

export function RotationSpeedSlider({ value, onChange, className }) {
  return (
    <input
      type="range"
      className={className}
      min={0}
      max={VISUAL_CONFIG.autoRotationMaxSpeed}
      step={VISUAL_CONFIG.autoRotationStep}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Star Rotation"
      aria-valuetext={value === 0 ? 'Off' : `${value} degrees per second`}
    />
  );
}
```

**Step 4: Wire up CameraControls.**
- Remove `onToggleRotation` from the props.
- Add:

```js
const autoRotationSpeed = resolveAutoRotationSpeed(
  preferences?.autoRotationSpeed,
  prefersReducedMotion()
);
const setAutoRotationSpeed = (value) =>
  game.setPreference('autoRotationSpeed', value);
```

- Replace the Star Rotation checkbox `<label>` with:

```jsx
<label className="settings-toggle-row">
  <span className="settings-label">Star Rotation</span>
  <RotationSpeedSlider
    className="settings-range-input"
    value={autoRotationSpeed}
    onChange={setAutoRotationSpeed}
  />
</label>
```

- CSS: add `.settings-range-input { width: 6rem; }` next to `.settings-toggle-row`.

**Step 5: Update the old tests** (they assert a checkbox and `onToggleRotation`):
- `tests/unit/settings-panel.test.jsx:76-108`. Assert the Star Rotation input
  is a range with value `3`, and that changing it to `6` calls
  `game.setPreference('autoRotationSpeed', 6)`. Add `setPreference: vi.fn()`
  to that file's `useGame` mock if it is missing.
- `tests/property/camera-controls.property.test.jsx`, the "Star Rotation"
  case around lines 140-178: same change. Drop the rerender-with-`false` part.
- Leave the `autoRotationEnabled` and `onToggleRotation` props in other test
  files alone. They are now ignored, which is harmless. Delete them only if a
  test asserts on them.

**Step 6:** Run the full suite, lint and format. **Commit**: `feat(settings): star rotation speed slider`.

### Task 7: Rotation slider, mobile

**Files:**
- Modify: `src/features/navigation/MobileCameraToolbar.jsx`
- Modify: `src/features/navigation/CameraControls.jsx:72-100` (mobile branch)
- Test: `tests/unit/mobile-camera-toolbar.test.jsx`

**Step 1: Failing test**

```jsx
it('shows a rotation slider in settings and reports changes', () => {
  const onRotationSpeedChange = vi.fn();
  render(
    <MobileCameraToolbar
      {...baseProps}
      rotationSpeed={3}
      onRotationSpeedChange={onRotationSpeedChange}
    />
  );
  fireEvent.click(screen.getByLabelText('Settings'));
  fireEvent.change(screen.getByLabelText('Star Rotation'), {
    target: { value: '0' },
  });
  expect(onRotationSpeedChange).toHaveBeenCalledWith(0);
});
```

Use whatever prop set the file already passes as `baseProps`.

**Step 2:** FAIL. **Step 3: Implement.** Add the `rotationSpeed` and
`onRotationSpeedChange` props. Inside `.mobile-toolbar-popover`, before the
toggles:

```jsx
{onRotationSpeedChange && (
  <label className="mobile-toolbar-toggle">
    Star Rotation
    <RotationSpeedSlider
      value={rotationSpeed}
      onChange={onRotationSpeedChange}
    />
  </label>
)}
```

In the `CameraControls` mobile branch, remove `showStarRotation` from both
`toggles` and `handlers`. Pass `rotationSpeed={autoRotationSpeed}` and
`onRotationSpeedChange={setAutoRotationSpeed}`.

**Step 4:** Run the full suite, lint and format. **Commit**: `feat(mobile): star rotation speed slider`.

---

## Phase 3: Labels, reticle and picking (#55)

### Task 8: `pxToSpriteScale`

**Files:** `src/game/engine/starmap-math.js`, `tests/unit/starmap-math.test.js`

**Step 1: Failing test**

```js
it('pxToSpriteScale converts CSS px to non-attenuated sprite scale', () => {
  // 60° FOV: on-screen px = scale / tan(30°) × H/2
  const scale = pxToSpriteScale(100, 60, 1000);
  expect(scale).toBeCloseTo((100 * 2 * Math.tan(Math.PI / 6)) / 1000);
  const backToPx = (scale / Math.tan(Math.PI / 6)) * (1000 / 2);
  expect(backToPx).toBeCloseTo(100);
});
```

**Step 2:** FAIL. **Step 3: Implement**

```js
/**
 * A sizeAttenuation:false sprite's scale is a fraction of viewport height,
 * so a fixed pixel size needs the viewport height and field of view.
 */
export function pxToSpriteScale(px, fovDeg, viewportHeightPx) {
  return (px * 2 * Math.tan((fovDeg * DEG_TO_RAD) / 2)) / viewportHeightPx;
}
```

**Step 4:** Green. **Commit**: `feat(starmap): px to sprite scale conversion`.

### Task 9: `pickStar`

**Files:** `src/game/engine/starmap-math.js`, `tests/unit/pick-star.test.js`,
`tests/property/pick-star.property.test.js`

Shared test setup (the file runs in jsdom so real `three` works; add
`// @vitest-environment jsdom` as line 1, like `star-selection-reticles.test.js`):

```js
import * as THREE from 'three';
import { pickStar } from '../../src/game/engine/starmap-math.js';

const W = 1000;
const H = 1000;

function makeCamera() {
  const camera = new THREE.PerspectiveCamera(60, W / H, 1, 10000);
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}

function star(id, x, y, z, size = 0.001) {
  return {
    data: { id },
    position: new THREE.Vector3(x, y, z),
    sprite: { scale: new THREE.Vector3(size, size, 1) },
  };
}

const pick = (x, y, stars, minRadiusPx = 20) =>
  pickStar({ x, y, width: W, height: H, camera: makeCamera(), stars, minRadiusPx });
```

**Step 1: Failing tests, one at a time**

```js
it('hits a star under the pointer', () => {
  const a = star(1, 0, 0, 0);
  expect(pick(500, 500, [a])).toBe(a);
});

it('returns null when nothing is within the pick radius', () => {
  expect(pick(900, 900, [star(1, 0, 0, 0)])).toBeNull();
});

it('picks the star closest on screen when several are in range', () => {
  // 2 world units at depth 100 is about 17px
  const a = star(1, 0, 0, 0);
  const b = star(2, 2, 0, 0);
  expect(pick(515, 500, [a, b])).toBe(b);
});

it('uses the minimum radius so a distant star is clickable', () => {
  const far = star(1, 0, 0, -5000);
  expect(pick(508, 500, [far], 12)).toBe(far);
  expect(pick(520, 500, [far], 12)).toBeNull();
});

it('ignores stars behind the camera', () => {
  expect(pick(500, 500, [star(1, 0, 0, 200)])).toBeNull();
});

it('a large near star does not hide a distant star beside it', () => {
  const near = star(1, 0, 0, 50, 20); // ~170px apparent radius
  const far = star(2, 40, 0, -900); // ~35px right of centre
  expect(pick(535, 500, [near, far])).toBe(far);
});
```

**Step 2: Implement**

```js
import * as THREE from 'three';

// Reused so clicks don't allocate
const _view = new THREE.Vector3();
const _ndc = new THREE.Vector3();

/**
 * Screen-space star picking. A star is hit within max(minRadiusPx, its
 * apparent radius); the closest hit on screen wins, so a big near star
 * can't block a distant one beside it.
 *
 * x, y are CSS px relative to the canvas; width/height are the canvas CSS size.
 */
export function pickStar({
  x,
  y,
  width,
  height,
  camera,
  stars,
  minRadiusPx = STARMAP_CONFIG.MIN_PICK_RADIUS_PX,
}) {
  camera.updateMatrixWorld();
  const tanHalfFov = Math.tan((camera.fov * DEG_TO_RAD) / 2);
  let best = null;
  let bestDistance = Infinity;

  for (const s of stars) {
    _view.copy(s.position).applyMatrix4(camera.matrixWorldInverse);
    const depth = -_view.z;
    if (depth <= camera.near) continue;

    _ndc.copy(s.position).project(camera);
    const sx = ((_ndc.x + 1) / 2) * width;
    const sy = ((1 - _ndc.y) / 2) * height;
    const apparentRadius =
      (s.sprite.scale.y / 2 / (depth * tanHalfFov)) * (height / 2);
    const distance = Math.hypot(x - sx, y - sy);

    if (
      distance <= Math.max(minRadiusPx, apparentRadius) &&
      distance < bestDistance
    ) {
      best = s;
      bestDistance = distance;
    }
  }
  return best;
}
```

Add each test RED → GREEN. Most will pass once the function exists; that's
fine after the first.

**Step 3: Property test** (`tests/property/pick-star.property.test.js`, jsdom
header, reuse the helpers above):

```js
// Feature: navigation sphere (#55). Property: pickStar never returns a star
// outside the pick radius.
it('never returns a star outside the pick radius', () => {
  const coord = fc.double({ min: -300, max: 300, noNaN: true });
  fc.assert(
    fc.property(
      fc.array(fc.tuple(coord, coord, coord), { minLength: 1, maxLength: 20 }),
      fc.integer({ min: 0, max: W }),
      fc.integer({ min: 0, max: H }),
      (positions, px, py) => {
        const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
        camera.position.set(0, 0, 700);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const stars = positions.map(([x, y, z], i) => star(i, x, y, z));
        const hit = pickStar({ x: px, y: py, width: W, height: H, camera, stars, minRadiusPx: 12 });
        if (hit === null) return true;
        // Independent check: tiny sprites, so the radius is the minimum
        const p = hit.position.clone().project(camera);
        const sx = ((p.x + 1) / 2) * W;
        const sy = ((1 - p.y) / 2) * H;
        return Math.hypot(px - sx, py - sy) <= 12 && hit.position.z < 700;
      }
    ),
    { numRuns: 200 }
  );
});
```

**Step 4:** Run the full suite. **Commit**: `feat(starmap): screen-space pickStar`.

### Task 10: Replace the raycaster with `pickStar`

**Files:**
- Modify: `src/features/navigation/StarMapCanvas.jsx:145-197`
- Test: `tests/unit/starmap-drag-click.test.jsx`

**Step 1: Failing test.** Partially mock `pickStar` in the Task 2 test file:

```js
vi.mock('../../src/game/engine/starmap-math', async (importOriginal) => ({
  ...(await importOriginal()),
  pickStar: vi.fn(() => null),
}));
```

Add:

```jsx
it('a click without a drag picks relative to the canvas, and deselects on a miss', async () => {
  // render exactly as in the first test, then:
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 800, height: 600 });
  canvas.dispatchEvent(new MouseEvent('pointerdown', { clientX: 110, clientY: 120 }));
  canvas.dispatchEvent(new MouseEvent('click', { clientX: 110, clientY: 120 }));

  const { pickStar } = await import('../../src/game/engine/starmap-math');
  expect(pickStar).toHaveBeenCalledWith(
    expect.objectContaining({ x: 100, y: 100, width: 800, height: 600 })
  );
  expect(onSystemDeselected).toHaveBeenCalledTimes(1);
});

it('a touch tap picks with the touch radius', async () => {
  // render as above; dispatch pointerdown with pointerType 'touch'
  // (see Task 2 for how), then a click at the same point
  const { pickStar } = await import('../../src/game/engine/starmap-math');
  expect(pickStar).toHaveBeenCalledWith(
    expect.objectContaining({
      minRadiusPx: STARMAP_CONFIG.MIN_PICK_RADIUS_TOUCH_PX,
    })
  );
});
```

Clear the `pickStar` mock between tests (`vi.mocked(pickStar).mockClear()`
in `beforeEach`).

**Step 2:** FAIL (the raycaster is still in place).

**Step 3: Implement.** Delete the `raycaster`, `mouse` and `clickableObjects`
code. The click handler becomes:

```js
handleCanvasClick = (event) => {
  if (isDrag(pointerDownAt, { x: event.clientX, y: event.clientY })) {
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  const clickedStar = pickStar({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    width: rect.width,
    height: rect.height,
    camera,
    stars,
    minRadiusPx: minPickRadiusFor(pointerDownAt?.pointerType),
  });

  if (clickedStar) {
    selectStar(clickedStar, scene, camera);
    props.onSystemSelected?.(clickedStar.data.id);
  } else {
    deselectStar();
    props.onSystemDeselected?.();
  }
};
```

Remove the `THREE.Raycaster` use. Keep `import * as THREE` if the file still
uses `THREE.Vector3`. Import `minPickRadiusFor` with `pickStar`. In the test
file, delete Task 2's `Raycaster.prototype.intersectObjects` stub and its
`THREE` import. The mocked `pickStar` now does that job.

**Step 4:** Run the full suite. `tests/integration/app-starmap-provider-integration.test.jsx`
mocks `Raycaster`. That mock is now unused and harmless; delete it only if lint
complains. **Commit**: `fix(starmap): pick stars in screen space; labels no longer block clicks` (#55).

### Task 11: Fixed-size labels

**Files:**
- Modify: `src/game/constants.js` (`LABEL_CONFIG`, ~line 899)
- Modify: `src/game/engine/stars.js:51-100` (`createLabel`), `:160-164`, `:315-388` (label sizing)
- Modify: `src/features/navigation/StarMapCanvas.jsx` (call site, resize)
- Modify: `tests/unit/config-objects-structure.test.js:48`
- Test: `tests/unit/update-labels.test.js`

**Step 1: Constants.** In `LABEL_CONFIG`, remove `minFontSize`. Keep
`maxFontSize`, which is the canvas font size. Add:

```js
  hideDistance: 60, // labels nearer the camera than this hide (they obscure lanes)
  anchorCenterY: -0.3, // sprite.center.y: lifts the label above its star
```

Change `config-objects-structure.test.js:48` to expect `hideDistance` in
place of `minFontSize`.

**Step 2: Failing test** (jsdom header):

```js
import * as THREE from 'three';
import { updateLabels } from '../../src/game/engine/stars.js';
import { LABEL_CONFIG, STARMAP_CONFIG } from '../../src/game/constants.js';

function labelledStar(z) {
  return {
    position: new THREE.Vector3(0, 0, z),
    label: {
      visible: true,
      scale: new THREE.Vector3(),
      material: { opacity: 0, map: { image: { width: 200, height: 40 } } },
    },
  };
}

describe('updateLabels', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
  camera.position.set(0, 0, 0);
  const unitsPerPx = 0.002;

  it('hides labels closer than hideDistance', () => {
    const s = labelledStar(-(LABEL_CONFIG.hideDistance - 1));
    updateLabels([s], camera, unitsPerPx);
    expect(s.label.visible).toBe(false);
  });

  it('shows farther labels at a fixed screen height, keeping aspect', () => {
    const s = labelledStar(-LABEL_CONFIG.farDistance * 2);
    updateLabels([s], camera, unitsPerPx);
    const h = STARMAP_CONFIG.LABEL_HEIGHT_PX * unitsPerPx;
    expect(s.label.visible).toBe(true);
    expect(s.label.scale.y).toBeCloseTo(h);
    expect(s.label.scale.x).toBeCloseTo(h * 5);
    expect(s.label.material.opacity).toBe(LABEL_CONFIG.minOpacity);
  });

  it('label size does not depend on distance', () => {
    const near = labelledStar(-LABEL_CONFIG.nearDistance);
    const far = labelledStar(-LABEL_CONFIG.farDistance);
    updateLabels([near, far], camera, unitsPerPx);
    expect(near.label.scale.y).toBe(far.label.scale.y);
  });
});
```

**Step 3:** FAIL (`updateLabels` is not exported).

**Step 4: Implement** in `stars.js`:
- `createLabel`: add `sizeAttenuation: false` to the `SpriteMaterial`. After
  creating the sprite, call `sprite.center.set(0.5, LABEL_CONFIG.anchorCenterY);`.
  Delete the scale lines, because `updateLabels` sets the scale every frame.
- `createStarSystems`: `label.position.set(data.x, data.y, data.z);` (no `+ 15`).
  Update the comment to say the anchor offset lives in `sprite.center`.
- Replace `calculateLabelProperties` with `calculateLabelOpacity(distance)`,
  which returns only the opacity, interpolated as today.
- Replace `updateLabelScale` with:

```js
export function updateLabels(stars, camera, unitsPerPx) {
  const height = STARMAP_CONFIG.LABEL_HEIGHT_PX * unitsPerPx;
  for (const star of stars) {
    if (!star.label) continue;
    const distance = _tempLabelDistance
      .subVectors(camera.position, star.position)
      .length();
    if (distance < LABEL_CONFIG.hideDistance) {
      star.label.visible = false;
      continue;
    }
    star.label.visible = true;
    star.label.material.opacity = calculateLabelOpacity(distance);
    const canvas = star.label.material.map.image;
    star.label.scale.set(height * (canvas.width / canvas.height), height, 1);
  }
}
```

**Step 5: StarMapCanvas.**
- Import `updateLabels` (drop `updateLabelScale`) and `pxToSpriteScale`.
- After `initScene`:

```js
// The renderer fills the window (scene.js onWindowResize), so its height is
// window.innerHeight. unitsPerPx turns CSS px into sprite scale.
let unitsPerPx = pxToSpriteScale(1, camera.fov, window.innerHeight);
```

- In `handleResize`, after `onWindowResize(...)`, recompute `unitsPerPx` the
  same way.
- In `animate()`: `updateLabels(stars, camera, unitsPerPx);`.

The StarMapCanvas test mocks have no `camera.fov`, so `unitsPerPx` is `NaN`
there. Their mock stars have no labels, so nothing reads it.

**Step 6:** Run the full suite, lint and format. **Commit**: `fix(starmap): fixed-size labels that hide when very close` (#55).

### Task 12: Fixed-size reticle and current-system marker

**Files:**
- Modify: `src/game/engine/stars.js:288-318` (`createSelectionRing`)
- Modify: `src/game/engine/interaction.js`
- Modify: `src/features/navigation/StarMapCanvas.jsx` (animation loop)
- Modify: `src/game/constants.js` (`VISUAL_CONFIG`)
- Test: `tests/unit/star-selection-reticles.test.js`
- Modify: `tests/property/selection-ring-animations.property.test.js`
- Check: `tests/unit/dual-reticles.test.js`,
  `tests/integration/star-selection-integration.test.js`

**Step 1: Failing test.** Add to `star-selection-reticles.test.js`:

```js
it('reticle is a fixed-size sprite in px', () => {
  const ring = createSelectionRing();
  expect(ring).toBeInstanceOf(THREE.Sprite);
  expect(ring.material.sizeAttenuation).toBe(false);

  selectStar(stars[0], scene, camera);
  const unitsPerPx = 0.002;
  updateSelectionRingAnimations(0, true, unitsPerPx);
  expect(stars[0].selectionRing.scale.x).toBeCloseTo(
    STARMAP_CONFIG.RETICLE_SIZE_PX * unitsPerPx
  );
});
```

**Step 2:** FAIL.

**Step 3: Implement**
- `createSelectionRing`: build
  `new THREE.SpriteMaterial({ map, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: false })`
  once into `sharedReticleMaterial`, and return `new THREE.Sprite(sharedReticleMaterial)`.
  Delete the `PlaneGeometry`.
- `interaction.js`:
  - `selectStar`: delete `star.selectionRing.lookAt(camera.position)`.
  - `updateCurrentSystemIndicator`: delete `lookAt`, the
    `currentSystemBaseScale` `scale.set`, and
    **`currentSystemIndicator.geometry.dispose()`**. Sprites share one
    geometry, so disposing it breaks every sprite. Keep `scene.remove`.
    Leave the `camera` parameter in the signature to avoid churn at call sites.
  - `updateSelectionRingAnimations(time, reducedMotion, unitsPerPx)`:

```js
const ringBase = STARMAP_CONFIG.RETICLE_SIZE_PX * unitsPerPx;
const markerBase = STARMAP_CONFIG.CURRENT_SYSTEM_SIZE_PX * unitsPerPx;
```

  Selection ring: `scale.set(ringBase * pulse, ringBase * pulse, 1)`, where
  `pulse` is `1` under reduced motion and otherwise the existing
  `1 + sin(...) * selectionRingScaleAmplitude`. Rotation goes to
  `ring.material.rotation` (`0` under reduced motion).

  Current-system marker: same pattern with `markerBase`, and
  `pulse = 1 + sin(...) * currentSystemScaleAmplitude`. Rotation goes to
  `currentSystemIndicator.material.rotation`. That material is its own clone,
  so it spins independently.
- Constants: remove `selectionRingSize` and `currentSystemBaseScale` from
  `VISUAL_CONFIG`. Grep first; Task 12 removes the only uses.
- `StarMapCanvas` `animate()`: `updateSelectionRingAnimations(currentTime, reducedMotion, unitsPerPx);`.
  Delete the two `lookAt(camera.position)` blocks. Keep the
  "current indicator always visible" check.

**Step 4: Update the existing reticle tests**
- `THREE.Mesh` → `THREE.Sprite`, and `MeshBasicMaterial` → `SpriteMaterial`
  (lines 63, 65, 101, 277).
- "ring with correct size" (line 68): delete it. The new test covers size.
- Lines 292-303 ("indicator larger than selection ring"): assert that after
  `updateSelectionRingAnimations(0, true, 0.002)` the indicator's `scale.x`
  is greater than the selected ring's.
- Rotation tests (line 389 and the indicator test): read `material.rotation`
  in place of `rotation.z`.
- Every `updateSelectionRingAnimations(t, ...)` call needs a third argument,
  `0.002`.

**Step 4b: Update `tests/property/selection-ring-animations.property.test.js`.**
The whole file fails without these changes:
- Every `updateSelectionRingAnimations(time)` call (14 of them) gets
  `false, UNITS_PER_PX` with `const UNITS_PER_PX = 0.002;` at the top.
- The scale-bounds assertions (lines ~50–51 and ~217–218) assert an absolute
  `0.92`–`1.08`. Change them to `ringBase × (1 ± selectionRingScaleAmplitude)`,
  where `ringBase = STARMAP_CONFIG.RETICLE_SIZE_PX * UNITS_PER_PX`. That keeps
  the property that the pulse stays in bounds.
- The rotation properties (lines ~136–180) read `selectionRing.rotation.z`.
  Change them to `selectionRing.material.rotation`.

**Step 4c: Check the other callers.** `tests/unit/dual-reticles.test.js` and
`tests/integration/star-selection-integration.test.js` call
`updateCurrentSystemIndicator`, which no longer disposes geometry, calls
`lookAt`, or sets `currentSystemBaseScale`. They have no scale, rotation or
`Mesh` assertions today, so they should pass. Run them and fix any assertion
on the removed behaviour.

**Step 5:** Run the full suite, lint and format. **Commit**: `fix(starmap): reticle and current-system marker are a fixed size on screen` (#55).

---

## Phase 4: Multi-star systems (#56)

### Task 13: Star data

**Files:**
- Modify: `src/game/data/star-data.js`
- Modify: `tests/unit/distance-calculations.test.js:19, 49, 104, 159`
- Test: `tests/unit/star-data-systems.test.js`

**Step 1: Failing test**

```js
import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

const companions = STAR_DATA.filter((s) => s.primary !== undefined);
const byId = new Map(STAR_DATA.map((s) => [s.id, s]));

describe('star data: multi-star systems', () => {
  it('has 33 companions and 84 systems', () => {
    expect(companions).toHaveLength(33);
    expect(STAR_DATA.length - companions.length).toBe(84);
  });

  it('every primary is an existing star that is not itself a companion', () => {
    for (const c of companions) {
      const p = byId.get(c.primary);
      expect(p, c.name).toBeDefined();
      expect(p.primary, c.name).toBeUndefined();
    }
  });

  it('no companion has a wormhole', () => {
    const linked = new Set(WORMHOLE_DATA.flat());
    expect(companions.filter((c) => linked.has(c.id))).toEqual([]);
  });

  it('Proxima Centauri is its own system', () => {
    const proxima = byId.get(3);
    expect(proxima.name).toBe('Proxima Centauri');
    expect(proxima.primary).toBeUndefined();
  });
});
```

**Step 2:** FAIL.

**Step 3: Implement.** Rename id 3 to `'Proxima Centauri'`. Add
`primary: <id>,` after `r: 0,` on each of these rows (`companion id → primary id`):

```
2→1   8→7   10→9  17→16 18→16 20→19 22→21 24→23 26→25 29→28
30→28 38→37 41→40 44→43 47→46 59→58 60→58 62→61 70→69 71→69
74→73 77→76 79→78 86→85 93→92 97→96 100→99 101→99 102→99
107→106 110→109 111→109 113→112
```

Update the comment at the top of the file to mention `primary`. Update
`distance-calculations.test.js` to use `'Proxima Centauri'`.
(`custom-select.test.jsx` only uses the string as a label, so leave it.)

**Step 4:** Run the full suite. **Commit**: `feat(data): link companion stars to their primary`.

### Task 14: Star-system helpers

**Files:**
- Modify: `src/game/constants.js` (add `STAR_KINDS` near `VISUAL_CONFIG`)
- Create: `src/game/utils/star-systems.js`
- Test: `tests/unit/star-systems.test.js`

**Step 1: Failing tests, one per function**

```js
import {
  isCompanion,
  getSystemName,
  getCompanions,
  starKind,
} from '../../src/game/utils/star-systems.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';

const byName = (n) => STAR_DATA.find((s) => s.name === n);

it('isCompanion', () => {
  expect(isCompanion(byName('Sirius B'))).toBe(true);
  expect(isCompanion(byName('Sirius A'))).toBe(false);
  expect(isCompanion(byName('Proxima Centauri'))).toBe(false);
});

it('getSystemName drops " A" only for stars with companions', () => {
  expect(getSystemName(byName('Sirius A'))).toBe('Sirius');
  expect(getSystemName(byName('Lalande 27173 A'))).toBe('Lalande 27173');
  expect(getSystemName(byName("Barnard's Star"))).toBe("Barnard's Star");
  expect(getSystemName(byName('Proxima Centauri'))).toBe('Proxima Centauri');
});

it('getCompanions', () => {
  expect(getCompanions(STAR_DATA, 99).map((s) => s.name)).toEqual([
    'Lalande 27173 B',
    'Lalande 27173 C',
    'Lalande 27173 D',
  ]);
  expect(getCompanions(STAR_DATA, 0)).toEqual([]);
});

it('starKind maps spectral class to plain English', () => {
  expect(starKind('A1')).toBe('main-sequence star');
  expect(starKind('G2')).toBe('main-sequence star');
  expect(starKind('M5.5')).toBe('red dwarf');
  expect(starKind('DA2')).toBe('white dwarf');
  expect(starKind('L8')).toBe('brown dwarf');
  expect(starKind('T6')).toBe('brown dwarf');
  expect(starKind('X9')).toBe('star');
});
```

**Step 2: Implement.** Constants:

```js
/** Plain-English kind of star by spectral-class prefix (SystemPanel). */
export const STAR_KINDS = Object.freeze({
  O: 'main-sequence star',
  B: 'main-sequence star',
  A: 'main-sequence star',
  F: 'main-sequence star',
  G: 'main-sequence star',
  K: 'main-sequence star',
  M: 'red dwarf',
  D: 'white dwarf',
  L: 'brown dwarf',
  T: 'brown dwarf',
  Y: 'brown dwarf',
});
```

`src/game/utils/star-systems.js`:

```js
import { STAR_DATA } from '../data/star-data.js';
import { STAR_KINDS } from '../constants.js';

export function isCompanion(star) {
  return star.primary !== undefined;
}

const PRIMARY_IDS = new Set(STAR_DATA.filter(isCompanion).map((s) => s.primary));

/** "Sirius A" is "Sirius" on the map; a lone star keeps its name. */
export function getSystemName(star) {
  return PRIMARY_IDS.has(star.id) && star.name.endsWith(' A')
    ? star.name.slice(0, -2)
    : star.name;
}

export function getCompanions(starData, id) {
  return starData.filter((s) => s.primary === id);
}

export function starKind(type) {
  return STAR_KINDS[type?.charAt(0).toUpperCase()] ?? 'star';
}
```

**Step 3:** Run the full suite. **Commit**: `feat(stars): multi-star system helpers`.

### Task 15: The map shows one point per system

**Files:**
- Modify: `src/game/engine/stars.js:117-185` (`createStarSystems`)
- Test: `tests/unit/star-rendering-visuals.test.js` (read how it stubs canvas `getContext` and reuse that)

**Step 1: Failing test**

```js
it('creates one star per system, skipping companions', () => {
  const stars = createStarSystems(new THREE.Scene(), STAR_DATA);
  expect(stars).toHaveLength(84);
  expect(stars.some((s) => s.data.primary !== undefined)).toBe(false);
});
```

**Step 2: Implement.** At the top of the `forEach` add
`if (isCompanion(data)) return;`. Create the label with
`createLabel(getSystemName(data), LABEL_CONFIG.maxFontSize)`. Update the
"117 star sprites" comments to say "one sprite per system".

**Step 3:** Run the full suite. Wormhole lines use ids that are never
companions, so they are unaffected. **Commit**: `feat(starmap): draw multi-star systems as one point` (#56).

### Task 16: Find Star lists systems

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx:43-46`
- Test: `tests/unit/star-finder-sort-order.test.jsx` (or a new case in it)

**Step 1: Failing test.** Using that file's mocks with `useStarData`
returning the real `STAR_DATA`, open settings and read the Find Star options.
Expect 84 options, one labelled with `Sirius` (after the visited-checkmark
prefix), and none containing `Sirius B` or `Sirius A`. Also cover the mobile
toolbar with `MobileCameraToolbar` given the same `stars`.

**Step 2: Implement**

```js
const sortedStars = useMemo(() => {
  if (!starData) return [];
  return starData
    .filter((s) => !isCompanion(s))
    .map((s) => ({ id: s.id, name: getSystemName(s) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}, [starData]);
```

Desktop and mobile already render `star.name` and `star.id` from this list.

**Step 3:** Run the full suite, and fix any sort-order expectations that
changed. **Commit**: `feat(starmap): Find Star lists 84 systems` (#56).

### Task 17: SystemPanel title and "Stars" list

**Files:**
- Modify: `src/features/navigation/SystemPanel.jsx` (both `<h3>` at ~150 and ~267, and both `system-details` blocks)
- Test: `tests/integration/system-panel-stars.integration.test.jsx`

**Step 1: Failing test.** Copy the render setup from
`tests/integration/system-panel-starmap-context.test.jsx`, the "wrapped in
StarmapProvider" case, with `viewingSystemId={7}` (Sirius A):

```jsx
expect(screen.getByRole('heading', { name: 'Sirius' })).toBeTruthy();
expect(screen.getByText('Sirius A: A1, main-sequence star')).toBeTruthy();
expect(screen.getByText('Sirius B: DA2, white dwarf')).toBeTruthy();
```

Add a second case: `viewingSystemId={4}` (Barnard's Star) shows no "Stars" list.

**Step 2: Implement.** In `SystemPanel.jsx`, add a small component in the same file:

```jsx
function SystemStars({ star, starData }) {
  const companions = getCompanions(starData, star.id);
  if (companions.length === 0) return null;
  return (
    <div className="system-property system-stars">
      <span className="label">Stars:</span>
      <ul className="value">
        {[star, ...companions].map((s) => (
          <li key={s.id}>{`${s.name}: ${s.type}, ${starKind(s.type)}`}</li>
        ))}
      </ul>
    </div>
  );
}
```

In both branches, change the `<h3>` to `{getSystemName(viewingSystem)}`, and
render `<SystemStars star={viewingSystem} starData={starData} />` right after
the Spectral Class row. If the `<ul>` needs styling, add
`.system-stars ul { margin: 0; padding-left: 1rem; }` in the panel's CSS.

**Step 3:** Run the full suite. **Commit**: `feat(system-panel): show the stars of multi-star systems` (#56).

### Task 18: Rumors and events only use wormhole-connected systems

**Files:**
- Modify: `src/game/utils/wormhole-graph.js` (add `isWormholeConnected`)
- Modify: `src/game/game-information-broker.js:185-224`
- Modify: `src/game/game-events.js:85` (`updateEvents` loop, **not** `isSystemEligible`)
- Test: `tests/unit/wormhole-graph.test.js`, `tests/unit/rumor-event-reachability.test.js`

**Step 1: Failing test, graph**

```js
it('isWormholeConnected', () => {
  expect(isWormholeConnected(0)).toBe(true); // Sol
  expect(isWormholeConnected(8)).toBe(false); // Sirius B (companion)
  expect(isWormholeConnected(104)).toBe(false); // Ross 882 (no lanes)
  expect(isWormholeConnected(115)).toBe(false); // Delta Pavonis
});
```

Implement:

```js
/** Gameplay targets (rumors, events) must be reachable by lane. See ADR 0002. */
export function isWormholeConnected(systemId) {
  return getConnectedSystems(systemId).length > 0;
}
```

Commit: `feat(graph): isWormholeConnected`.

**Step 2: Failing tests, rumors and events.** Use the real `STAR_DATA`.

```js
it('the best-price rumor never names an unconnected system', () => {
  for (let day = 0; day < 200; day++) {
    const state = { /* minimal gameState as in information-broker-coverage.test.js, daysElapsed: day, activeEvents: [] */ };
    const rumor = InformationBroker.generateRumor(state, STAR_DATA);
    for (const s of STAR_DATA.filter((s) => !isWormholeConnected(s.id))) {
      expect(rumor).not.toContain(` ${s.name} `);
    }
  }
});

it('the event hint skips events on unconnected systems', () => {
  // activeEvents: one festival on Sirius B (id 8) only
  // over 200 days, no rumor mentions 'Sirius B'
});

it('updateEvents never starts an event on an unconnected system', () => {
  let state = { /* gameState as in economic-events-lifecycle.test.js */ };
  for (let day = 0; day < 365; day++) {
    state.player.daysElapsed = day;
    state.world.activeEvents = EconomicEventsSystem.updateEvents(state, STAR_DATA);
    for (const e of state.world.activeEvents) {
      expect(isWormholeConnected(e.systemId)).toBe(true);
    }
  }
});

it('an old-save event on a companion still expires normally', () => {
  const old = { id: 'festival_8_0', type: 'festival', systemId: 8, startDay: 0, endDay: 5, modifiers: {} };
  // state with activeEvents [old], daysElapsed 6
  const after = EconomicEventsSystem.updateEvents(state, STAR_DATA);
  expect(after.find((e) => e.id === old.id)).toBeUndefined();
});
```

Copy the exact `gameState` shape from the files named in the comments. Don't
invent fields.

**Step 3: Implement**
- `generateRumor`, event hint:

```js
const hintEvents = activeEvents.filter((e) => isWormholeConnected(e.systemId));
if (hintEvents.length > 0 && rng.next() < 0.5) {
  const marketDisruption = rng.pickRandom(hintEvents);
```

- `generateRumor`, best-price loop: first line `if (!isWormholeConnected(system.id)) continue;`.
- `updateEvents`: first line in `for (const system of starData)`:
  `if (!isWormholeConnected(system.id)) continue;`. Keep it out of
  `isSystemEligible`, whose tests use fake systems.

**Step 4: Run the full suite.** Expect failures in tests that use fake star
data whose ids are unconnected in the real graph. For example,
`information-broker-coverage.test.js` uses id 2 ("Barnard"), but real id 2 is
Alpha Centauri B, and id 3 is Proxima. Fix each failing fixture by moving its
target to a connected id, such as `0`, `1` or `4`. Check with
`isWormholeConnected`. Don't weaken the assertion.

**Step 5: Commit**: `fix(rumors,events): only target wormhole-connected systems` (#56, ADR 0002).

### Task 19: Instructions and credits wording

**Files:**
- Modify: `src/features/instructions/InstructionsModal.jsx:44`
- Modify: `src/features/endgame/credits-data.js:114`
- Test: `tests/unit/instructions-modal.test.jsx`, `tests/unit/credits-data.test.js`

**Step 1: Failing tests**

```js
// instructions-modal.test.jsx
it('describes 117 real stars in 84 systems', () => {
  render(<InstructionsModal isOpen onClose={() => {}} shipName="Test" />);
  expect(screen.getByText(/117 real stars in 84 systems/)).toBeTruthy();
});

// credits-data.test.js
it('filmed-on-location count matches the 84 systems', () => {
  const location = CREDITS_SECTIONS.find((s) => s.type === 'location');
  expect(location.lines).toContain('and 74 other star systems');
});
```

Match the render call to the file's existing tests.

**Step 2: Implement.**
- Instructions: "The starmap shows 117 real stars in 84 systems, connected by wormhole lanes."
- Credits: `'and 74 other star systems'`.
- Leave "Stars Featured: 117 of 131 known", which counts stars.

**Step 3:** Run the full suite. **Commit**: `docs(ui): describe 117 stars in 84 systems`.

---

## Final check

1. Run `npm run all` (clean + test) → green, with no stderr noise.
2. Run `grep -rn "updateLabelScale\|autoRotationEnabled\|selectionRingSize\|currentSystemBaseScale\|Raycaster" src`
   → no matches.
3. UAT (use `ovid-uat`). Use the list in the design doc:
   - Wormhole lines are readable in dense areas.
   - The reticle is the same size near and far, and the same pixel size on
     desktop and on a phone in landscape and portrait.
   - Clicking a distant star beside a near one selects the distant star.
   - Dragging does not change the selection.
   - On a phone, tapping distant stars selects them reliably, and a
     one-finger drag does not change the selection.
   - Rotation works at 0, 3 and 12°/s, and stays at 0 by default with reduced
     motion on.
   - Sirius is one point, and its panel lists A and B.
   - Find Star has 84 entries.
   - Tune `STARMAP_CONFIG` px sizes (including the touch values) and `LABEL_CONFIG.hideDistance` by eye if
     needed. They are first guesses.
