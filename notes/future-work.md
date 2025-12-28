# Future Work

This document tracks features and requirements that are out of scope for current specs but should be implemented in future phases.

## Danger System - Deferred Features

### Ending Epilogues (Requirement 9.7)

**Requirement:** "WHEN generating ending epilogues, THE System SHALL contribute different outcomes based on final karma score"

**Status:** Deferred to endgame/polish spec

**Notes:**
- Karma is being tracked in the danger system (-100 to +100 range)
- The karma value will be available for epilogue generation when the endgame system is implemented
- Epilogue variations should reflect the player's moral choices throughout the game
- Consider tiers: very negative karma (villain ending), negative (morally gray), neutral, positive (hero), very positive (saint)

**Dependencies:**
- Danger system must be complete (karma tracking implemented)
- Endgame conditions must be defined
- Epilogue text content must be written
