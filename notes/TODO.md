# TODO

- Worth offering some kind of political issues with different factions and
  star systems?
- Data based on stars and wormholes is static and anything based on that data
  should be cached. For example, "BFS pathfinder in mission-generator.js
  (getReachableSystems())". Are there other examples?
- Maybe make ship upgrades a key to the endgame? You can only get certain
  upgrades by completing missions, and some of those upgrades are necessary to
  complete later missions. This would make the endgame more engaging and less
  grindy.
- Message variations: all messages should have at least three variants, each
  meaning the same thing, but phrased differently. They get chosen at random.
  This allows players to have a more of a feeling that the game is "variable"
  and alive.

Endgame NOT FULLY TESTED (2)
    1. Mission 2-4 gameplay — Accepted missions but advanced quest stages via admin to
  test endgame efficiently. Individual mission mechanics (exotic material collection,
  prototype jump, message delivery) not gameplay-tested.
    2. Epilogue variations — Only saw one epilogue path (moderate karma). High
  karma/low karma/smuggler variations not tested.

- NPC portraits?  Player have a name?
    Images for other things? Need to create a theme that I can use
    consistently.
    (warm → friendly → trusted → family).

	* Wei Chen - Dock Worker at Bore Station 7 (Barnard's Star)
	    * 	Former ship captain who lost her ship in a bad deal
	    * 	Casual, simple speech with dropped articles
	* Marcus Cole - Loan Shark at Sol Central (Sol)
	    * 	Your creditor with cold, calculating demeanor
	    * 	Starts at -20 reputation (cold relationship)
	    * 	Can become ally if debt paid honestly
	* Father Okonkwo - Chaplain/Medic at Ross 154
	    * 	Moral compass of the game
	    * 	Offers no-interest loans with moral strings attached
	* Whisper - Information Broker at Sirius Exchange (Sirius A)
	    * 	Mysterious info broker who knows everyone's secrets
	    * 	Provides intel discount service
	    * 	Network hub character
	* Captain Vasquez - Retired Trader at Epsilon Eridani
	    * 	Mentor figure with higher starting reputation
	    * 	Provides tips and old route maps
	    * 	Designed as player's "first friend"
	* Dr. Sarah Kim - Medical professional (location not specified in snippets)
	* Rusty Rodriguez - Engineer/mechanic (provides repair service discounts)
	* Zara Osman - Trader/merchant character
	* Station Master Kowalski - Administrator at Tau Ceti Station
	    * 	By-the-book, respects professionalism
	    * 	Provides docking service discounts
	    * 	Cites regulations
	* Lucky Liu - Professional Gambler
	    * 	Risk-taker who loves long odds
	    * 	Uses gambling metaphors
	    * 	No service discounts but offers risk-related benefits

- Can we make this work on mobile?
- i18n?
- Liskov and Law of Demeter?
- GCT
- We no longer need the migrateFromV1toV12 code
- Economic events: we can find them, but do they last long enough to matter?
- Economic events should last longer (and not have the popup every time)
- Duplicate tests?
- Lots of HTML in tests (<div id ...). Refactor?
- Multi-route jumps?

# Notes

1. Smaller specs are better
2. Don't skip optional tasks (TODO)
3. Tabs you have open fill context!
4. Fix bad architecture FIRST!

> Question: currently when you start a new task, you're at almost 50% context
> consumed. What is causing this much context to be consumed when you start a
> new task?

With the above, I realised that my game state manager was almost 1 meg and a
god object. When context gets out of control, it's a code smell!

> Finding 1: Missing Coverage for Requirement 1.1, 1.2, 1.3 (Hostile/Cold/Neutral Tier Behaviors)
> Severity: Critical
> 
> Issue: Requirements 1.1, 1.2, and 1.3 define specific behaviors for Hostile, Cold, and Neutral tiers, but there are no tasks to implement these behaviors:
> 
> Req 1.1: Hostile tier - "refuse service, may report smuggling, and tip off pirates"
> Req 1.2: Cold tier - "minimal interaction, no tips, and standard prices"
> Req 1.3: Neutral tier - "standard service and generic dialogue"
> Current State:
> 
> Task 4.1 only implements discount calculation (0% for these tiers)
> No tasks implement service refusal for Hostile NPCs
> No tasks implement the "report smuggling" or "tip off pirates" mechanics
> The design document's TIER_DISCOUNTS config only covers discounts, not service refusal
> Options:
> 
> Option A: Add implementation tasks for negative tier behaviors
> 
> Add new tasks to implement service refusal for Hostile NPCs
> Add tasks for smuggling reports and pirate tip-offs (may require new game systems)
> Add tasks for minimal interaction behavior at Cold tier
> Option B: Defer negative tier behaviors to a future spec
> 
> Update requirements to remove 1.1, 1.2, 1.3 from this spec
> Create a note that these behaviors will be implemented in a "danger systems" or "consequences" spec
> Keep only the discount-related aspects (0% discount for these tiers)
> Option C: Simplify requirements to match current scope
> 
> Revise Req 1.1-1.3 to only specify "no discounts, no tips" for these tiers
> Remove the smuggling/pirate mechanics from this spec entirely
> Recommendation: Option B - These negative consequences (pirates, smuggling reports) are complex systems that likely belong in a separate "danger" spec. The current spec focuses on benefits from relationships. Update requirements to clarify that negative tier behaviors beyond "no benefits" are out of scope for this spec.

> Finding 3: Missing Coverage for NPC-Specific Tier Benefits (Requirements 4.8-4.10, 5.8-5.10, etc.)
> Severity: Important
> 
> Issue: Each NPC has unique tier-specific benefits beyond discounts that are not covered by tasks. For example:
> 
> Whisper (Req 4.8-4.10): 10% intel discount at Warm, free rumors at Friendly, advance inspection warnings at Trusted
> Captain Vasquez (Req 5.8-5.10): Trading tips at Warm, old star charts at Friendly, co-investment at Trusted
> Dr. Sarah Kim (Req 6.8-6.10): Expedited docking at Warm, waived docking fees at Friendly, customs inspection notice at Trusted
> Rusty Rodriguez (Req 7.8-7.10): 5% repair discount at Warm, 15% at Friendly, free diagnostics at Trusted
> Zara Osman (Req 8.8-8.10): Price hints at Warm, price shift notice at Friendly, 105% buy rate at Trusted
> Station Master Kowalski (Req 9.8-9.10): Priority docking at Warm, station storage at Friendly, emergency fuel at Trusted
> Lucky Liu (Req 10.8-10.10): Gambling tips at Warm, ₡500 stake at Friendly, insider info at Trusted
> Current State:
> 
> Tasks 9.1-9.7 only cover adding NPC definitions with tierBenefits configuration
> The design includes tierBenefits in NPC definitions but these are just descriptive strings
> No tasks implement the actual mechanics for these unique benefits (co-investment, star charts, 105% buy rate, etc.)
> Options:
> 
> Option A: Add implementation tasks for each unique benefit
> 
> Add tasks to implement each NPC's unique tier benefits
> This would significantly expand the scope (potentially 20+ new tasks)
> Option B: Defer unique benefits to future NPC-specific specs
> 
> Keep only the generic benefits (discounts, tips, favors) in this spec
> Update requirements to note that unique benefits like "co-investment" and "star charts" are deferred
> Create placeholder tierBenefits that describe future functionality
> Option C: Simplify unique benefits to use existing systems
> 
> Map unique benefits to existing mechanics where possible (e.g., "free rumors" = free tip, "price hints" = tip system)
> Defer truly unique mechanics (co-investment, star charts, 105% buy rate) to future specs
> Recommendation: Option C - Many of these "unique" benefits can be implemented using the existing tip and discount systems. Truly unique mechanics like co-investment and star charts should be deferred to avoid scope creep.

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

# Fixed

- Blur further stars and routes (tried in two different sessions. failed
  badly. Bokeh effect blurred everything. Tried post processing, but it
  failed. Eventually, Claude Opus 4.5 decided to "fall back to the simpler fog
  effect". This meant no code changes. I gave up)
- Swap dock/station info buttons
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
