# README Update Design

**Date:** 2026-02-23
**Goal:** Rewrite README.md as a shareable, player-facing document that frames the game as an AI development experiment and introduces the PAAD framework.

## Context

The current README is significantly out of date. It lists Specs 04-08 as "Planned Features" but all are implemented. The game is feature-complete through Spec 07 with 261 test files and 2,300+ passing tests.

More importantly, the README's purpose has changed. The game is a case study for AI-assisted development — specifically, the four problems captured in the PAAD framework (Pushback, Alignment, Architecture, Degradation).

## Audience

Primary: potential players who are also interested in AI development capabilities.

The shareable sentence: "Someone built a full space trading game with AI to find out where AI coding actually breaks — and identified four core problems."

## Shareability Audit (Talk About Us framework)

Current README fails all four tests:
- **Absence Test:** Can't easily explain to someone what this is
- **Distinctiveness Test:** Feature lists are generic
- **Emotional Resonance Test:** Mostly dry feature taxonomy
- **Values-First Test:** Leads with features instead of purpose

New design targets passing all four.

## Structure

### 1. Opening Hook
- Title: Tramp Freighter Blues
- Bold tagline: "A full game, built entirely with AI — to find out where AI coding actually breaks."
- One-sentence game scope (117 real stars, NPCs, combat, quest line, 2,300+ tests)
- Built with Claude Code
- Honest alpha disclaimer — not polished, never the point
- Pivot: "What I found: four problems. I call them PAAD."

### 2. PAAD Framework
Header: "PAAD: The Four Problems with AI Coding"
Subtitle: PAAD = Pushback · Alignment · Architecture · Degradation

Four subsections, each with:
- Plain-language problem description
- Status (solved / partially solved / unsolved)

- **Pushback:** AI agrees with everything. Largely solved via specialized hooks.
- **Alignment:** AI implements what you asked plus things you didn't. Largely solved via hook-based workflows.
- **Architecture:** AI forces features through bad architecture. Partially solved with diligence and architectural review pauses.
- **Degradation:** Complexity breeds edge cases AI can't see. Unsolved. The hard problem.

### 3. The Game (Evidence)
- Framing: "The result of this experiment is a playable (if unbalanced) space trading survival game."
- Emotional hook: "broke freighter captain hauling cargo through wormhole networks"
- Concrete feature list showing scope (not a spec sheet)
- Explicit "What's not in it" — game balance, difficulty tuning, polish

### 4. Screenshot
- Existing screenshots/main.png (confirmed current)

### 5. Try It
- "Online version coming soon"
- Local install: clone, npm install, npm run dev

### 6. Technical Details
- Stack: React 18, Three.js, Vite
- Platform: Browser-based, no server
- Storage: localStorage
- Tests: Vitest + fast-check

### 7. Contributing
- Brief: feedback and bug reports welcome, open an issue

### 8. License
- MIT, link to LICENSE.md

### 9. Closing
- Quote: "The stars are far apart, but the people who live among them are closer than you think."

## Sections Removed
- Controls (self-explanatory in-game)
- Credits (can live in LICENSE)
- Planned Features (no longer applicable — everything is built)
- Development Status + roadmap link
- How to Play (game teaches itself)

## Implementation Notes
- Single file change: README.md
- No code changes required
- Screenshot reference unchanged
