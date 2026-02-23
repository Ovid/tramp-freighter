# README Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite README.md to frame the game as an AI development experiment introducing the PAAD framework.

**Architecture:** Single file replacement. No code changes, no tests affected.

**Tech Stack:** Markdown

**Design doc:** `docs/plans/2026-02-23-readme-update-design.md`

---

### Task 1: Rewrite README.md

**Files:**
- Modify: `README.md` (full replacement)

**Step 1: Write the new README**

Replace the entire contents of `README.md` with the following structure, in this exact order:

1. **Title:** `# Tramp Freighter Blues`

2. **Tagline (bold):** "A full game, built entirely with AI — to find out where AI coding actually breaks."

3. **Scope paragraph:** One sentence listing what's in the game (117 real star systems, NPC relationships, pirate combat, branching dialogue, multi-stage quest line, 2,300+ tests). State it was built with Claude Code.

4. **Alpha disclaimer paragraph:** Not a polished product. Alpha — minimal game balancing, rough edges. That was never the point. The point was to push AI-assisted development and document where it fails. Pivot: "What I found: four problems. I call them PAAD."

5. **Screenshot:** `![Tramp Freighter Blues](screenshots/main.png)`

6. **PAAD section:** `## PAAD: The Four Problems with AI Coding`
   - Subtitle: `**PAAD = Pushback · Alignment · Architecture · Degradation**`
   - Four `###` subsections, each with:
     - Plain-language problem description (2-3 sentences)
     - **Status:** line (Largely solved / Partially solved / Unsolved)
   - Content per the design doc (Pushback: AI agrees with everything, solved via hooks. Alignment: scope creep from AI, solved via hooks. Architecture: AI forces features through bad structure, partially solved with review pauses. Degradation: complexity breeds invisible edge cases, unsolved.)

7. **The Game section:** `## The Game`
   - Framing sentence: result of experiment, playable if unbalanced
   - Emotional hook: "broke freighter captain hauling cargo..."
   - Bullet list of what's in it (8 items per design doc)
   - **What's not in it:** Game balance. Alpha disclaimer.

8. **Try It section:** `## Try It`
   - "Online version coming soon."
   - Local install: clone, npm install, npm run dev, open localhost:5173

9. **Technical Details section:** `## Technical Details`
   - Four bullets: Stack, Platform, Storage, Tests

10. **Contributing section:** `## Contributing`
    - Personal project, feedback and bug reports welcome, open an issue

11. **License section:** `## License`
    - MIT License, link to LICENSE.md

12. **Closing:** Horizontal rule, then italic quote: "The stars are far apart, but the people who live among them are closer than you think."

**Step 2: Review the README**

Read the file back and verify:
- All 9 design sections present in order
- Screenshot reference is `screenshots/main.png`
- No leftover content from old README (Planned Features, Controls, Credits, How to Play, Development Status)
- PAAD acronym expanded correctly
- Alpha status is clear and honest

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with PAAD framework and current game state"
```
