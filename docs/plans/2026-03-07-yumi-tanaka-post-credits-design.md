# Yumi Tanaka -- Post-Credits NPC at Delta Pavonis

## Overview

After end credits finish scrolling, the game transitions to the Delta Pavonis
station dock instead of showing "Return to Title." Yumi Tanaka -- Tanaka's
sister, Colony Director -- appears as the sole NPC. She delivers irreverent,
fourth-wall-breaking dialogue in the spirit of Ferris Bueller's post-credits
scene. Pure comedy, no mechanical effects. A "Return to Title" option is always
available, but the player is never forced out.

## Flow

```
EndCredits scroll completes
  -> viewMode transitions to STATION
  -> currentSystemId set to Delta Pavonis
  -> Yumi appears as sole NPC on dock
  -> "Return to Title" available as station UI element
  -> Player can talk to Yumi, view starmap, or leave whenever they want
```

After credits, the "Return to Title" button in EndCredits is replaced by a
transition to the station dock at Delta Pavonis. The station renders normally
(starmap visible, station menu functional) but with limited actions -- no
trading, missions, or services. Just the dock with Yumi and a way out.

## NPC Definition

- **ID:** `yumi_delta_pavonis`
- **Name:** Yumi Tanaka
- **Role:** Colony Director
- **System:** Delta Pavonis (system ID TBD -- may need adding to star data)
- **Station:** Delta Pavonis Colony
- **Initial Rep:** Warm (fixed, not progression-based)
- **Hidden:** true (only appears in post-credits state)
- **No quest, no tier benefits, no tips, no discounts**

## Dialogue Structure

Three rounds of escalating fourth-wall-breaking comedy. Each round triggers
when the player clicks Yumi's NPC button. After exhausting all three rounds,
subsequent clicks show a short repeating loop quip.

Every round ends with a "Goodbye" choice that closes dialogue. No choice has
any mechanical effect -- no rep changes, no state mutations, no items.

### Round 1 -- "You're still here?"

**Opening:**
"You're still here? The credits rolled. The story's over. What exactly are you
expecting?"

**Choices:**

1. "I came all this way to find you."
   -> "That's sweet. Really. But I've been here for ten years. I wasn't lost.
      Yuki just worries."

2. "Is there a secret ending?"
   -> "This isn't that kind of game. There's no hidden boss. No post-credits
      sequel hook. Just me and a lot of paperwork."

3. "What's Delta Pavonis like?"
   -> "Dusty. Underfunded. The food is terrible. But we built it ourselves, so
      we pretend to like it."

4. "Goodbye."
   -> Closes dialogue.

### Round 2 -- "Oh, you're back."

**Opening:**
"Oh, you're back. Most people take the hint when the credits roll. You're not
most people, apparently."

**Choices:**

1. "Your sister talks about you a lot."
   -> "Let me guess -- she described me as 'driven but emotionally
      unavailable.' That's engineer for 'I miss you.'"

2. "So what do you actually do here?"
   -> "I run a colony of three thousand people on a planet that actively tries
      to kill us every Tuesday. It's like project management, but with more
      radiation."

3. "Any advice for a freighter captain?"
   -> "Yeah. When the credits roll, leave. That's advice for life, really."

4. "Goodbye."
   -> Closes dialogue.

### Round 3 -- "Seriously?"

**Opening:**
"Seriously? What are you still doing here? Do you just... live in menus? Is
that your thing?"

**Choices:**

1. "I like it here."
   -> "There is literally nothing here. I'm an NPC in a post-credits scene. My
      entire existence is this conversation. Go outside."

2. "Tell me about the Meridian voyage."
   -> "Ten years on a colony ship. You know what the entertainment was? A
      database of 20th-century films and a man named Doug who knew card tricks.
      I have seen every card trick, Captain."

3. "Will I ever see Tanaka again?"
   -> "She's on your ship, genius. ...Wait, does she not come with you
      after--? Ugh, I'll talk to the developers."

4. "Goodbye."
   -> Closes dialogue.

### Loop (Round 4+)

**Opening:**
"You again. I'm starting to think you don't have anywhere else to be. ...I
mean, you literally don't. The game is over."

**Choices:**

1. "Goodbye."
   -> Closes dialogue.

## Implementation Notes

### Station at Delta Pavonis

Delta Pavonis is not currently in the star data (the 117 systems are within
20 LY of Sol; Delta Pavonis is ~19.9 LY so it may or may not be included).
The post-credits station may need special handling:

- If Delta Pavonis exists in star data: use it directly
- If not: create a minimal system entry or handle the post-credits dock as a
  special-case view that doesn't require full system data

Station services (trade, refuel, repairs, etc.) should be hidden or disabled.
Only the NPC list (Yumi) and "Return to Title" should be active.

### Dialogue Implementation

Yumi's dialogue tree uses the existing dialogue system but with a twist: it
tracks which "round" the player is on via NPC interaction count or a simple
flag/counter.

The greeting node checks round state to deliver escalating openings:
- Round 1 (interactions === 0): "You're still here?"
- Round 2 (interactions === 1): "Oh, you're back."
- Round 3 (interactions === 2): "Seriously?"
- Round 4+ (interactions >= 3): Loop quip

Each round's choices use conditions gated on the same counter so only the
current round's options appear.

### EndCredits Transition

Modify `EndCredits.jsx` completion handler:
- Instead of showing "Return to Title" button, call a new callback
  (e.g., `onCreditsComplete`) that transitions to the post-credits station
- App.jsx handles this by setting viewMode to STATION and currentSystemId to
  Delta Pavonis
- A game state flag (e.g., `postCredits: true`) signals that the station
  should render in post-credits mode (limited services, Yumi visible)

### Return to Title

"Return to Title" is available as a persistent UI element on the post-credits
station screen (not buried in Yumi's dialogue). Player leaves when they choose
to. The game is over -- this is a victory lap.
