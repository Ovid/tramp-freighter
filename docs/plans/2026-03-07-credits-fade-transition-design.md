# Credits Fade Transition Design

## Problem

After Voyage Statistics, players may think the game is over and leave before clicking "Credits" to see the scrolling end credits. Even when they do click, the abrupt switch doesn't signal that a new experience is starting.

## Solution

Add a cinematic fade-to-black transition between the Voyage Statistics screen and the scrolling EndCredits.

## Behavior

1. Player clicks "Credits" button on Voyage Statistics
2. The stats panel fades to black (~800ms)
3. Brief black hold (~400ms)
4. Phase switches to EndCredits
5. EndCredits container fades in from black (~800ms) as text scrolls up from below viewport

## Implementation

- Add `'fading'` intermediate phase in `Epilogue.jsx`
- On "Credits" click: set phase to `'fading'`, apply CSS fade-out
- On fade-out animation end: switch to `'credits'` phase
- EndCredits gets a CSS fade-in animation on mount
- Timing constants in `constants.js`
- CSS animations in `endgame.css`
