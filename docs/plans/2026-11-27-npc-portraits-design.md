# NPC & Encounter Portraits — Design

## Goal

Show character portraits when talking to NPCs and during danger encounters,
plus thumbnails in the end-credits cast list. Source art lives in `images/`.

## Assets

- `images/` keeps the original 1254px PNGs (source art, ~2 MB each). Files are
  renamed to their game key; the original descriptive titles move into
  `images/README.md`.
- `scripts/build-portraits.sh` (macOS `sips` + `cwebp`, no new npm dependency)
  converts them to 384px WebP in `public/portraits/`. Both directories are
  committed; the script is re-run only when art is added.
- Shipped size: under 1 MB total, down from about 38 MB.

The filename is the lookup key. No mapping table.

| Source image                              | Shipped path                              |
| ----------------------------------------- | ----------------------------------------- |
| Each of the 12 named NPCs                 | `portraits/npc/<npcId>.webp`              |
| Tau Ceti Station Administrator            | `portraits/npc/kim_tau_ceti.webp`         |
| Wei Chen of Bore Station 7                | `portraits/npc/chen_barnards.webp`        |
| Desperate Pirate on a CRT                 | `portraits/pirate/weak.webp`              |
| Red-Glow Space Pirate Portrait             | `portraits/pirate/moderate.webp`          |
| Red-Eyed Raider Captain                   | `portraits/pirate/strong.webp`            |
| Scarred space pirate warlord on CRT       | `portraits/pirate/dangerous.webp`         |
| Retro Customs Inspector with Cyan Scanner | `portraits/encounter/inspection.webp`     |
| Mayday pilot on amber comms               | `portraits/encounter/distress.webp`       |

The pirate threat levels come from `calculators.js` (`weak | moderate | strong |
dangerous`) and map one-to-one, so no seeded random pick is needed.

## Components

- `src/features/portraits/portrait-url.js`: `getPortraitUrl(category, key)`
  returns `${import.meta.env.BASE_URL}portraits/${category}/${key}.webp`.
  It must use `BASE_URL` because `vite.config` supports `VITE_BASE_PATH`
  sub-path deploys.
- `<Portrait src />`: an `<img>` with `alt=""` (decorative, because the name is
  the adjacent heading), `loading="lazy"`, fixed square size so the layout
  doesn't shift, and CRT-green border. On `onError` it renders `null`, so
  missing art leaves no gap and no broken icon.
- Shared `.portrait-row` CSS: portrait about 160px on the left, text on the
  right. On mobile it wraps, with a smaller portrait centred above the text.

## Placement

| Where                  | Key                                   | Position                    |
| ---------------------- | ------------------------------------- | --------------------------- |
| `DialoguePanel`        | `npcId` prop                          | Beside NPC's spoken text    |
| `PirateEncounterPanel` | `encounter.threatLevel`               | Beside encounter text       |
| `NegotiationPanel`     | `encounter.threatLevel`               | Beside encounter text       |
| `InspectionPanel`      | `'inspection'`                        | Beside encounter text       |
| `DistressCallPanel`    | `'distress'`                          | Beside encounter text       |
| `EndCredits` cast rows | `npc.id`                              | ~48px thumbnail before name |

`PostCreditsStation` needs no change because it opens `DialoguePanel`.
No new game-state reads: every key is already a prop or encounter field.

## Out of scope

- `CombatPanel` (a results screen; a one-line addition later if wanted).
- Thumbnails on StationMenu / PostCreditsStation NPC list buttons.

## Testing (TDD)

1. `getPortraitUrl` builds the path with `BASE_URL`.
2. `<Portrait>` renders `<img alt="">`; renders nothing after an `error` event.
3. Asset completeness: a file exists in `public/portraits/` for every NPC in
   `npc-data.js`, every threat level, plus `inspection` and `distress`. The
   fallback hides missing art at runtime, so this test is what catches rename
   typos or renamed threat levels. Adding an NPC without art fails it on
   purpose.
4. One render assertion per wired panel (correct `src`).
