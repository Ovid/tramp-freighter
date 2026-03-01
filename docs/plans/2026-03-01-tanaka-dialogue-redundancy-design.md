# Tanaka Dialogue Redundancy Fix

## Problem

When the player completes a mission stage and returns to Yuki Tanaka, her
greeting text already acknowledges the accomplishment. But the player's
dialogue choice then restates the same information, creating redundant and
immersion-breaking exchanges.

Example (Stage 2):

> Yuki: "You found all 5 samples. Excellent work."
> Player: "I have all five exotic material samples."

She just said that. The player sounds like they weren't listening.

## Scope

Four mission completion choices in `src/game/data/dialogue/tanaka-dialogue.js`,
all in the `greeting` node's choices array.

## Changes

All replacement texts use a warm, humble tone consistent with a personable
captain who doesn't over-explain.

### Stage 1 (line 125)

- Yuki greeting context: "The field test data looks excellent..."
- Old: `"The field test is complete."`
- New: `"Glad the data worked out. She handled well out there."`

### Stage 2 (line 107)

- Yuki greeting context: "You found all 5 samples. Excellent work..."
- Old: `"I have all five exotic material samples."`
- New: `"Took some searching, but it was worth the trip."`

### Stage 3 (line 89)

- Yuki greeting context: "The prototype integration is complete. Your ship performed admirably."
- Old: `"The prototype test went well."`
- New: `"Your work is impressive, Tanaka. The ship feels different."`

### Stage 4 (line 71)

- Yuki greeting context: "You delivered the message. Thank you."
- Old: `"I delivered the message to Vasquez."`
- New: `"Vasquez understood. They'll take care of it."`

## Testing

- Update any existing tests that assert on the old choice text strings.
- Verify dialogue flow still connects correctly (choices still navigate to the
  same `next` nodes with the same conditions and actions).

## Files Modified

- `src/game/data/dialogue/tanaka-dialogue.js`
- Any test files that reference the old choice text
