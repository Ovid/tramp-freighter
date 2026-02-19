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

### Dialogue Integration with Danger Flags (Requirement 10.6)

**Requirement:** "WHEN displaying future NPC interactions and events, THE System SHALL reference past actions"

**Status:** Deferred to dialogue enhancement spec

**Notes:**
- The danger system tracks `dangerFlags` in game state (piratesFought, civiliansSaved, inspectionsBribed, etc.)
- These flags are persisted via save/load and available for dialogue conditions
- Future dialogue trees should check these flags to unlock special dialogue options or modify NPC responses
- Examples:
  - NPCs could comment on player's reputation for helping civilians
  - Pirates might recognize a player who has fought off many attacks
  - Authorities might be suspicious of players who have bribed inspectors

**Dependencies:**
- Danger system must be complete (dangerFlags tracking implemented)
- Dialogue system enhancement spec needed
- New dialogue content must be written that references these flags
