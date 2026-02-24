# Tramp Freighter Blues - Spec 08.1: Economic Balance

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete
**Blocks:** 08.8 (Deployment & Launch)

---

## Overview

Balance the economic curves so the game feels fair, rewarding, and progressively challenging. Add difficulty selection and anti-frustration mechanics.

## Goals

- Implement difficulty selection on new game
- Tune progression curve across early/mid/late phases
- Add mercy mechanic for struggling players
- Ensure minimum viable profitable route exists

## Out of Scope

- Cultural region price modifiers (see 08.5)
- Station-specific price bonuses (see 08.3)

---

## Difficulty Tuning

Implement difficulty selection on new game:

```
┌─────────────────────────────────────────────────────────┐
│  NEW GAME                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Difficulty:                                            │
│                                                         │
│  ○ EASY                                                 │
│    Lower debt, forgiving economy, less danger           │
│                                                         │
│  ● NORMAL                                               │
│    Balanced challenge, recommended for first playthrough│
│                                                         │
│  ○ HARD                                                 │
│    Higher debt, volatile markets, frequent pirates      │
│                                                         │
│  Ship Name: [________________]                          │
│                                                         │
│  [START GAME]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Progression Curve

Target earnings by phase:

| Phase | Days  | Avg Credits/Run | Total Earned  | Debt Remaining |
| ----- | ----- | --------------- | ------------- | -------------- |
| Early | 1-30  | 50-150          | 2,000-4,000   | 8,000-9,500    |
| Mid   | 31-90 | 150-400         | 15,000-25,000 | 2,000-5,000    |
| Late  | 91+   | 400-1000        | 40,000+       | 0              |

---

## Anti-Frustration

**Mercy Mechanic:**
If player has < 100 credits and debt > 12,000, Father Okonkwo offers emergency loan:

```
"I can see you're struggling. Take this. Five hundred credits. No interest. Pay me back when you can. Or don't. Just... keep flying."
```

**Minimum Viable Route:**
Ensure Sol ↔ Barnard's Star is always profitable with correct goods.

---

## Implementation Notes

- Difficulty multipliers should live in `src/game/constants.js`
- Difficulty stored in game state and save data
- Mercy mechanic triggers via event engine condition check
- Progression curve validated through playtesting, not hard-enforced

## Success Criteria

- [ ] Difficulty selection UI on new game screen
- [ ] Three difficulty presets affecting debt, economy, and danger
- [ ] Mercy mechanic triggers reliably when conditions met
- [ ] Sol ↔ Barnard's Star route is always profitable
- [ ] Progression feels fair across 30+ minute sessions
