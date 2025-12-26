# Notes

- When summarizing a long conversation, I've found that sometimes it gets
  confused and continues to the next task. I had it work on one task that was
  complex and I went to lunch. I came back and found it had poorly implemented
  three tasks.
- When migrating from vanilla JS to React, I had to temporarily have steering
  docs listing both old and new tech stacks. That meant my context on task
  launch was much larger, often around 30-40% instead of 20%. That made tasks
  harder to complete as they hit the context window limits.
- I instructed Kiro to break down notes/tramp-freighter-04.md into two new
  specs, parts 1 and 2. It did so, expanding examples tremendously/. Each new
  spec was larger than the original notes/tramp-freighter-04.md. The original
  04 spec was so large that Kiro was really struggling to clarify and align
  it, so I reverted and took this "split" approach. Even though the size of
  the two specs were not much smaller individually (20%) than the original
  04 spec, the requirements document for part 1 shrunk from 800 lines to about
  160. Much easier to manage!

# TODO

- Blur further stars and routes
- Swap dock/station info buttons
- i18n?
- GCT
- Ensure all individual js modules have unit tests
- We no longer need the migrateFromV1toV12 code
- Economic events: we can find them, but do they last long enough to matter?
  Is the ship info worth it?
- COMMODITY_TYPES duplication
- Ability to rename ship
- X/Y/Z should be fixed for star data. Get more star info?
- Admin process for adjusting data for testing
- On jump, panel not always hidden.
- Economic events should last longer (and not have the popup every time)
- Dead code check
- Duplicate tests?
- System info to show tech level?
- Lots of HTML in tests (<div id ...). Refactor?
- Multi-route jumps?
- Needs a tutorial.
- Some kind of "Achievement" system (visited all stars, for example)
- No messages occur when I cannot refuel (100% or no money)

# Fixed

- Cannot refuel to 100%?
- Arbitrage bug: you can always sell at a profit something you just bought
- Steering should note that files neeed single responsibilities
- When clicking on a star, the others stars change colors.
- Remove vendor/ (I think)
- Why are tests being skipped?
- Cargo
  - See cargo capacity and remaining capacity
  - Consolidate stacks if item and "bought at" are the same
- Fix star distances and locations.
- Economy
  notes/realistic_economy.md
  We are a single-player game, so perhaps the more you sell or buy in a
  system, the more the prices drop or rise based on your individual
  activity, before slowly returning to baseline? That forces players to look
  for other places to buy/sell.
- Is there any reason to keep the old calculateGoodPrice() function now that
  we have dynamic pricing?
- Easy way to figure out which stars I can travel to.
- Travel indicator instead of instant travel?
- Trade info: if your trade info is older than the last time you visited that
  star, the info should automatically be updated with the accurate data.
  Source should be that you visited the star, or "information broker"

# Steering

- Avoid unnecessary wrapper functions
- Each .js file should have a single purpose
- No task is finished until the entire test suite passes (`npm test`)
- All tasks should be self-contained and leave the system in a working or
  improved state. DO NOT SCHEDULE tests for a later task, or hook in a newly
  built component for a later task. This is because we might have to pause the
  project and when we come back, we might not realize the system is in a
  transition state that could be unstable.
- Before you write a defensive check for a variable, check if it's guaranteed
  to exist. You don't write `if (state) ...` if `state` always exists.

# Context Issues

A discussion with Kiro:

When I run my "kwality" hook (`.kiro/hooks/ai-code-review-audit.kiro.hook`), we have the various steering documents loaded. I'm immediately at 48% of my context window consumed before we even start. Can you tell me what's causing this behavior? Having context consumed this quickly makes it harder to maintain session quality.

Kiro
Including Steering Documents

coding-standards.md

product.md

structure.md

tech.md

ux-patterns.md
Looking at your context consumption issue, I can identify several factors contributing to the 48% usage before you even start:

Primary Culprits

1. Steering Document Size

Your steering documents are comprehensive and detailed:

coding-standards.md - Extremely detailed (covers vanilla JS, React, testing, performance, etc.)
tech.md - Full tech stack documentation
structure.md - Complete project structure
product.md - Product overview
ux-patterns.md - UX guidelines
These are all loaded automatically for every interaction.

2. Open Editor Files

You have 50+ files open in your editor, and Kiro loads context about all of them. That's a significant amount of metadata.

3. Steering Document Overlap

There's substantial overlap between documents:

coding-standards.md covers both vanilla JS AND React patterns
tech.md documents both old and new architecture
Both contain similar information about testing, imports, etc.
Recommendations
Immediate Actions:

Split coding-standards.md into separate files:

coding-standards-core.md (general JS, performance, naming)
coding-standards-react.md (React-specific patterns)
Use inclusion: manual for the React one, load it only when needed
Use Conditional Inclusion for steering files:

---

inclusion: fileMatch
fileMatchPattern: '\*_/_.jsx'

---

This way React standards only load when working with React files.

Archive Completed Migration Docs in tech.md:

Remove vanilla JS controller patterns (you're done migrating)
Remove old module organization details
Keep only current React architecture
Close Unused Editor Files:

You have 50+ files open
Close completed test files and components you're not actively working on
Consolidate Overlapping Content:

Remove duplicate import/testing guidance between files
Reference other docs instead of repeating content
Structural Changes:

.kiro/steering/
├── core.md (always loaded - minimal essentials)
├── react.md (fileMatch: **/\*.jsx)
├── testing.md (fileMatch: **/_.test._)
├── performance.md (inclusion: manual)
└── migration-archive.md (inclusion: manual)
This tould reduce your baseline context by ~60-70%, giving you much more room to work with actual code during sessions.
