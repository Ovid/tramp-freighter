# Navigation Sphere Usability Design

Covers GitHub issues #51 (drag selects a star), #54 (rotation speed), #55
(labels, reticle, and click targets) and #56 (multi-star systems).

## Background

- Companion stars (the B, C and D stars) have no wormholes and no stations, so
  the player can never travel to them. In the data they are identified only by
  name suffix, and that rule is unreliable. `Lalande 27173 D` has no B/C
  suffix. Six groups have companions at different coordinates from their
  primary. Proxima has no "A" star to group with.
- Unreachable stars leak into gameplay. Rumors can name them
  (`game-information-broker.js` `generateRumor`), and economic events can start
  on them (`game-events.js`). This applies to the 33 companions and also to 11
  other stars with no wormholes (for example Ross 882 and Wolf 1481). Delta
  Pavonis is one of the 11, and so is Proxima Centauri once it is its own
  system. The player reaches it only through the victory run,
  and the post-credits station has no market.
- Players currently learn about companions only from an overlapping map label,
  plus the spectral class shown when they click it.
- The map rotates `0.2` degrees **per frame**, so it spins twice as fast on a
  120Hz display as on a 60Hz one.
- Labels and the reticle are sized in world units. Labels are part of the
  raycast click targets, so near objects block clicks on far ones.
- OrbitControls still fires `click` after a drag.

## Goals

The map stays readable, and drags stop selecting stars. All 117 real stars stay
in the game. Multi-star systems teach the player more than they do now, not
less.

## 1. Multi-star systems (#56)

**Data (`src/game/data/star-data.js`)**
- Every companion row (all B/C/D stars except Proxima, 33 rows) gets a
  `primary: <id>` field.
- `Proxima Centauri C` is renamed to `Proxima Centauri`. It has no `primary`
  and stays a separate point on the map.
- A primary with companions is named for its system (`name: 'Sirius'`) and
  keeps its lettered star name in a new `starName` field (`'Sirius A'`).
  Companions keep their letters ("Sirius B"). Ids do not change. (Changed
  after UAT; see "Changes after UAT".)

**Helpers (new file in `src/game/utils/`)**
- `isCompanion(star)`: true when the star has a `primary`.
- `getCompanions(starData, id)`: returns the companion stars of a system.
- `starKind(type)`: maps the spectral-class prefix to a plain-English kind of
  star, for example M → red dwarf, D → white dwarf, L/T → brown dwarf. The
  table lives in `constants.js`.

**Consumers**
- `stars.js`: skip companions, and label each system with its `name`.
- Find Star (`CameraControls.jsx`, `MobileCameraToolbar.jsx`): skip
  companions, and list system names.
- `SystemPanel.jsx`: the title is the system name. Multi-star systems get a
  "Stars" list in the form "Sirius A: A1, main-sequence star" and "Sirius B:
  DA2, white dwarf", using `starName ?? name`.
- `game-information-broker.js` rumors (both the best-price rumor and the
  event hint) and `game-events.js` events: skip every star that is not
  connected in the wormhole graph (`getConnectedSystems(id).length === 0` from
  `wormhole-graph.js`). This covers all 44 wormhole-less stars, including
  companions, Proxima Centauri and Delta Pavonis. See `paad/adrs/0002-gameplay-targets-wormhole-connected-systems.md`.
- Instructions and credits: change the wording to "117 real stars in 84
  systems", and update `credits-data.test.js`.
- Credits "Filmed on location" (`credits-data.js`): "and 107 other star
  systems" becomes "and 74 other star systems" (84 systems minus the 10 named),
  with a test. "Stars Featured: 117 of 131 known" counts stars and stays.

**Old saves:** an economic event may already exist on a companion star. Such
events expire and the lookups that read them already tolerate it, so no
migration is needed. Tests confirm such an event expires normally and the
rumor hint skips it.

## 2. Labels, reticle and picking (#55, #51)

**Screen-size units**
- With `sizeAttenuation: false`, a sprite's `scale` is a fraction of viewport
  height, not pixels. On-screen height is `scale / tan(fov/2) × H/2`. Sizes are
  therefore given in CSS px in `constants.js` (`LABEL_HEIGHT_PX`,
  `RETICLE_SIZE_PX`, `CURRENT_SYSTEM_SIZE_PX`), and converted with
  `scale = px × 2·tan(fov/2) / canvasHeight`. Recompute this in
  `onWindowResize`, so sizes match on desktop and mobile in either
  orientation. This is the same unit `pickStar` uses.

**Labels**
- Make labels sprites with `sizeAttenuation: false`, so they are a fixed size
  on screen (`LABEL_HEIGHT_PX`).
- Anchor each label above its star with `sprite.center` instead of a +15
  world-unit offset.
- `updateLabelScale` becomes `updateLabels`. Opacity still fades with
  distance. Labels closer than `LABEL_CONFIG.hideDistance` are hidden.

**Reticle and current-system marker**
- Change both from a world-space Mesh to a Sprite with
  `sizeAttenuation: false`. Remove the per-frame `lookAt`.
- Pulse and spin stay, using scale and `material.rotation`. The pulse
  multiplies the px-derived base scale; it must not set scale to about 1,
  which on a non-attenuated sprite fills most of the screen.

**Picking (replaces the raycaster)**
- New pure function `pickStar(...)`, which works as follows:
  - Take the pointer position relative to the canvas rectangle, not the
    window.
  - Project each system star to pixel coordinates, skipping stars behind the
    camera.
  - A star is a hit when the pointer is within `max(MIN_PICK_RADIUS_PX,
    apparent radius in px)` of it. Among hits, the star closest to the pointer
    on screen wins.
  - Labels are not clickable.
- A click that hits nothing deselects, as it does today.

**Drag versus click (#51)**
- Record the position on `pointerdown`. If the click lands more than
  `CLICK_DRAG_THRESHOLD_PX` (5) from that position, ignore the click entirely:
  no selection and no deselection. A drag that ends back within 5px of where
  it started counts as a click; that is rare enough to accept.
- Touch uses larger values, because a fingertip drifts during a tap and is
  less precise than a mouse: `CLICK_DRAG_THRESHOLD_TOUCH_PX` (10) and
  `MIN_PICK_RADIUS_TOUCH_PX` (22). The `pointerType` comes from
  `pointerdown`, because Safari's `click` event doesn't carry one.

## 3. Rotation speed (#54)

- Measure rotation in degrees per second, multiplied by the frame time `dt`.
  Cap `dt` at about 100ms.
- Add a new preference `autoRotationSpeed` to `DEFAULT_PREFERENCES`, using the
  existing `setPreference` and `PREFERENCES_CHANGED` mechanism. The default is
  `null`, which resolves to 0 under reduced motion and otherwise to
  `VISUAL_CONFIG.autoRotationDefaultSpeed`.
- Values: default 3°/s, range 0–12°/s in steps of 0.5. All three go in
  `constants.js`.
- `StarMapCanvas` drops its local `autoRotationEnabled` state. The animation
  loop reads the speed from a ref.
- In both desktop and mobile settings, the "Star Rotation" toggle becomes
  `<input type="range">` with `aria-label` and `aria-valuetext` ("Off" at 0).

## Order and verification

Work on branch `ovid/navigation-sphere`, test-first, with each step leaving the
full suite, lint and format passing:

1. #51 drag threshold
2. #54 rotation speed
3. #55 labels, reticle and `pickStar`
4. #56 multi-star systems

**Tests**
- `pickStar` unit tests: the star closest on screen wins, the minimum radius
  catches distant stars, and stars behind the camera are ignored.
- A `pickStar` property test (at least 100 runs): the result is never a star
  outside the pick radius.
- Unit tests for the drag threshold, the label hide cutoff, `dt` scaling and
  capping, preference defaults, the helper functions, the px-to-scale
  conversion, and the credits "74 other star systems" line.
- Unit tests for the reachability filter in rumors and events: a companion and
  a wormhole-less primary such as Ross 882 are never named and never get an
  event.

**UAT**
- Check that wormhole lines stay readable in dense areas.
- Check the reticle is the same size near and far.
- Check labels and the reticle are the same pixel size on desktop and on a
  phone in landscape and portrait.
- Click a distant star sitting just beside a near one.
- Drag the map and check the selection does not change.
- Check rotation at 0, 3 and 12°/s, and with reduced motion on.
- Check Sirius shows as one point whose panel lists A and B.
- Check Find Star has 84 entries.

## Changes after UAT

Both were added after UAT and kept after code review.

- **System names in the data.** The plan's `getSystemName` helper dropped
  " A" only on the map, so stations, the HUD, NPC lines and dialogue still
  said "Sirius A" for a place the map called "Sirius". The 26 primaries with
  companions were renamed in `star-data.js` instead, with `starName` holding
  the lettered name for the system's star list, and the helper was removed.
  Missions in old saves keep their stored names (see `docs/backlog.md`).
- **Label decluttering.** Fixed-size labels overlap in dense views, so a
  label is hidden when it overlaps one already shown (`declutterLabels` in
  `starmap-math.js`). The selected and current-system labels are pinned: they
  claim space before unpinned labels and never fade. Pinned labels are still
  hidden within `hideDistance`, and a farther pinned label loses to a nearer
  pinned one. Stars behind the camera are skipped. The fade band was retuned
  (`LABEL_CONFIG`: minOpacity 0.15, nearDistance 450, farDistance 950).

## Out of scope

- Flavour text for each system.
- The contested-system id bug (`[7, 10]` should be `[7, 13]`), which is in
  `docs/backlog.md`.
