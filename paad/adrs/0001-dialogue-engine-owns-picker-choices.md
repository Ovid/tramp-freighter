# ADR 0001: The dialogue engine runs picker choices

Date: 2026-11-24
Status: Accepted

## Context

The NPC cargo storage picker
(`docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`) replaces the
storage choices' `action` callbacks with declarative `picker: 'store' |
'retrieve'` choices. `DialoguePanel` opens a modal, and the player picks what
to move.

The store-confirm choice carries `repGain: 2`. `selectChoice`
(`src/game/game-dialogue.js`) applies `repGain` to any valid choice index
without condition. If the only guard were `DialoguePanel` opening the modal
instead of advancing, any other caller of `selectDialogueChoice` (for example,
a future number-key shortcut from the planned a11y pass) would get the
reputation without storing anything and without starting the favor cooldown,
as often as it liked.

## Decision

`selectChoice(npcId, choiceIndex, gameStateManager, { selections })` runs the
picker operation itself. For a choice with `picker`, it calls `storeCargo` or
`retrieveCargo` with `selections`, and it applies `repGain` and `next` only
when that call succeeds. A picker choice with no `selections`, or whose
manager call fails, returns `{ success: false, message }`, grants nothing and
does not advance. The UI's only job is to collect `selections` and show the
returned `message`.

## Alternatives rejected

- **Guard flag** (`{ pickerConfirmed: true }`): the flag is a promise the
  caller makes, not proof that a store happened. A caller that passes it after
  a failed store still gets the reputation.
- **UI-only guard with a warning comment**: this works only if whoever writes
  the next caller reads the comment.
- **The action emits an "open picker" event**: the dialogue advances and
  grants `repGain` before the player picks, so Cancel gives free reputation.

## Consequences

- The rule "reputation only for cargo actually stored" lives in the game
  layer and gets unit tests without React.
- Store and advance happen in one call, so the two steps can't drift apart.
- `selectChoice` returns `{ success, message, display }` for every choice,
  not a display or `null`. `DialogueManager` stores any truthy return as the
  display, so returning a bare result for picker choices would be drawn as a
  dialogue node and crash the app. On `success: false`, `DialogueManager`
  changes no dialogue state.
- `selectDialogueChoice` and `useDialogue().selectChoice` gain an options
  argument and return `{ success, message }` instead of only a success flag.
- Any future choice that needs player input before it takes effect should
  follow the same pattern: a declarative marker on the choice, with the input
  passed to `selectChoice`.
