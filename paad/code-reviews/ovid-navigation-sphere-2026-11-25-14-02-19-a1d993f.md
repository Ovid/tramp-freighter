# Agentic Code Review: ovid/navigation-sphere

* **Date:** 2026-11-25 14:02:19
* **Model:** claude-opus-5-5
* **PAAD version:** 2.1.0
* **Branch:** ovid/navigation-sphere -> main
* **Commit:** a1d993f8696bb434f5031ef427ea93df2eb47098
* **Files changed:** 56 | **Lines changed:** +3627 / -448
* **Diff size category:** Large

## Executive Summary

The branch is in good shape. Specialists checked the star data consistency, the wormhole filters for rumors and events, and old-save compatibility, and found no correctness problems there. The one Important bug is in the new label decluttering: stars behind the camera are still projected onto the screen, so their labels can hide labels the player can see. Four specialists found this independently. The other findings are small. Two scope decisions also need your call: label decluttering was added, and multi-star primaries were renamed, against the design doc's out-of-scope list.

## Critical Issues

None found.

## Important Issues

### [I1] Stars behind the camera compete in label declutter and hide visible labels
- **File:** `src/game/engine/stars.js:388` (`updateLabels`; boxes passed to `declutterLabels` at :405, defined in `src/game/engine/starmap-math.js`)
- **Bug:** `updateLabels` builds a declutter box for every star at least `LABEL_CONFIG.hideDistance` (60) away, without checking whether the star is in front of the camera. `Vector3.project` on a point behind the camera gives a mirrored x/y position on screen, with NDC z > 1. The box's `depth` is the plain distance to the camera, so `byClaimOrder` can let an undrawn star behind the camera claim screen space before a visible star farther ahead. The sibling `pickStar` already guards against this (`if (depth <= camera.near) continue;`), and the design doc says stars behind the camera are skipped.
- **Impact:** When the player zooms in (`controls.minDistance` is 50) or pans inside the star field, labels of visible stars disappear for no visible reason. That defeats the declutter feature's purpose of keeping the map readable.
- **Suggested fix:** After projecting, set `star.label.visible = false` and `continue` when `_labelNdc.z > 1`, or when view-space depth is at or below `camera.near` (the same test `pickStar` uses). Better still, share one helper that projects to screen pixels, or returns null behind the camera, between `pickStar` and `updateLabels`. Add a unit test with one star behind the camera whose mirrored box overlaps a visible label.
- **Confidence:** High
- **Found by:** Logic & Correctness, Error Handling, Contract & Integration, Spec Compliance (`claude-opus-5-5`)

## Suggestions

- **[S1]** `src/features/navigation/CameraControls.jsx:39-42` vs `src/features/navigation/StarMapCanvas.jsx:137`: the animation loop reads reduced-motion once, at mount, but the slider reads it on every render. If the player changes the OS setting mid-session while still on the default speed, the slider can say "Off" while the map keeps rotating. Resolve the value once and share it, or subscribe both to the matchMedia `change` event. (Concurrency & State, Medium)
- **[S2]** `src/features/navigation/StarMapCanvas.jsx:301`: the comment says "Selected and current-system labels always show", but pinned labels are still hidden in two cases. One is within `hideDistance`, because that check runs before the pinned check in `updateLabels`. The other is when the two pinned labels overlap, where the farther one loses. Exempt pinned labels from both checks, or reword the comment. (Spec Compliance, Medium)
- **[S3]** `src/game/utils/star-systems.js:1-13`, `src/game/engine/stars.js:165`, `CameraControls.jsx:52-57` vs `docs/plans/2026-11-25-navigation-sphere-design.md:41,45-47,52-55` and `docs/plans/2026-11-25-navigation-sphere-plan.md:15,1188,1202-1206,1261,1296,1321`: the design and plan still specify a `getSystemName` helper and letter-suffixed star names. Commit fc7df82 removed the helper and renamed the data. Update the docs, or add an ADR, to match whichever version you keep (see OOSA2). (Spec Compliance, High)
- **[S4]** `CLAUDE.md:11`, `README.md:5,52`, `notes/uat.md:12,15`, `notes/star-connections.md` (many lines): these still say "117 real star systems" and use old names such as "Procyon A" and "Sirius A". The UAT notes tell testers to target "Procyon A", which no longer appears on the map. Change the wording to "117 real stars in 84 systems" and update the names. (Spec Compliance, Medium)
- **[S5]** `tests/property/camera-controls.property.test.jsx` (21 lines), `tests/unit/star-finder-sort-order.test.jsx:45,48`, `tests/unit/camera-controls-mobile-switch.test.jsx:43,46,63,66`: these fixtures still pass the removed `onToggleRotation` prop and `cameraState.autoRotationEnabled`. They pass only because React ignores unknown props, and they don't exercise the `autoRotationSpeed` preference. Remove the stale props. (Contract & Integration, Medium)
- **[S6]** `src/game/mission-generator.js:195,206-208,289-290,300-302`, `src/game/state/managers/debt.js:435-437` → `src/features/hud/ActiveMissions.jsx:70-73`: missions in old saves keep stored names such as "Sirius A" after the rename. Cosmetic only, because matching uses `systemId`. Already recorded in `docs/backlog.md` ("Missions in old saves still name 'L 726-8 A' and similar"), so no new action. (Contract & Integration, Medium)

## Out-of-Scope Additions

> **Handoff instructions for any agent processing this report:** The entries below are code this branch added that the spec did not promise. They may be legitimate "while I'm here" fixes for issues exposed by this work, or scope creep that should live in a separate PR. Do **not** assume they should stay on this branch, and do **not** assume they should be reverted. Present them to the user **as a single batched ask**: "These M additions weren't promised by the spec — keep, split into a separate PR, or revert?" The user decides per item.
>
> Out-of-scope additions are flagged for this PR only — they do not persist to either backlog.

### [OOSA1] Label decluttering, full-brightness pinned labels, and fade-band retune
- **File:** `src/game/engine/starmap-math.js` (`declutterLabels`, `byClaimOrder`, `overlapsKept`), `src/game/engine/stars.js` (`updateLabels`: `viewport`/`pinnedStars`, `labelBox`, pinned opacity), `src/game/engine/interaction.js` (`getCurrentSystemStar`), `src/game/constants.js` (`LABEL_DECLUTTER_INSET_PX`; `LABEL_CONFIG` minOpacity 0.3→0.15, nearDistance 100→450, farDistance 500→950), `src/features/navigation/StarMapCanvas.jsx` (wiring)
- **Addition:** Labels that overlap a nearer or pinned label are hidden. Selected and current-system labels are pinned at full brightness, and the fade band was retuned. The design (§2) and plan (Task 11) cover only fixed-size labels, distance fade and `hideDistance`. These came from post-UAT commits 5adcd32, f7e0e29 and a1d993f. The plan's "tune by eye" line may cover the constant retune, but it doesn't cover the declutter algorithm. I1 and S2 are defects inside this addition.
- **Suggested intent source:** `docs/plans/2026-11-25-navigation-sphere-design.md`, `docs/plans/2026-11-25-navigation-sphere-plan.md`, commit messages
- **Confidence:** High
- **Found by:** Spec Compliance (`claude-opus-5-5`)

### [OOSA2] Multi-star primaries renamed to their system name, plus a new `starName` field
- **File:** `src/game/data/star-data.js:2-5` plus 27 renamed primary rows (e.g. :13-14); `src/features/navigation/SystemPanel.jsx` (`s.starName ?? s.name`); `src/game/data/npc-data.js:238,258,328`; `src/game/data/dialogue/whisper.js:4,37,40`
- **Addition:** Commit fc7df82 changes `name` on every primary that has companions ("Sirius A" → "Sirius") and adds `starName`. The new name now shows on every screen. The design says "Star names keep their letters" (design.md:41), and its Out of scope section explicitly lists "Renaming 'Sirius A' to 'Sirius' in station and HUD text". Related: S3 (doc drift) and S6 (old-save names).
- **Suggested intent source:** `docs/plans/2026-11-25-navigation-sphere-design.md`
- **Confidence:** High
- **Found by:** Spec Compliance (`claude-opus-5-5`)

## Review Metadata

- **Agents dispatched:** Logic & Correctness — findings (1); Error Handling & Edge Cases — findings (1); Contract & Integration — findings (5); Concurrency & State — findings (1); Security — bailed: security no-boundary (both partitions); Spec Compliance — findings (7). Large diff: each lens ran as 2 instances. Partition A covered starmap rendering, interaction, camera, rotation and constants; partition B covered star data, systems helpers, SystemPanel, rumors and events, and copy. The first Concurrency & State A instance lost its first tool result and reviewed nothing, so it was re-dispatched and the retry's output was used.
- **Scope:** changed files (56) plus adjacent files traced in Phase 1: `src/game/engine/scene.js` (OrbitControls limits); the STAR_DATA consumers `src/features/hud/LocationDisplay.jsx`, `src/features/station/StationMenu.jsx`, `src/features/endgame/PostCreditsStation.jsx` and `src/features/dev-admin/DevAdminPanel.jsx`; code that could match star names as strings, plus the preference handlers for `autoRotationSpeed`. Specialists also read `src/game/mission-generator.js`, `src/game/state/managers/debt.js`, `src/features/hud/ActiveMissions.jsx`, `tests/test-data.js` and the CameraControls test files.
- **Raw findings:** 15 (before verification)
- **Verified findings:** 9 (after verification)
- **Filtered out:** 6. Three were duplicates merged into I1, and one into S3. Two were rejected: (1) `isWormholeConnected` reading the global wormhole table is the decision ADR 0002 documents, and it has no observable effect; (2) `tests/test-data.js` with old names still fits the current schema, and no test depends on those strings.
- **Out-of-scope findings:** 0 (Critical: 0, Important: 0, Suggestion: 0)
- **Out-of-scope additions:** 2
- **Backlog:** 0 new entries added, 0 re-confirmed (see `paad/code-reviews/backlog.md`)
- **Steering files consulted:** CLAUDE.md, DEVELOPMENT.md (referenced), paad/config/paad.md
- **Intent sources consulted:** docs/plans/2026-11-25-navigation-sphere-design.md, docs/plans/2026-11-25-navigation-sphere-plan.md, paad/adrs/0002-gameplay-targets-wormhole-connected-systems.md, recent commit messages, notes/uat.md, docs/backlog.md
- **Verifier warnings:** none
