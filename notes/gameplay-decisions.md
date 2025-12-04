# Gameplay Decisions Log

This document records key gameplay and implementation decisions made during spec development to ensure consistency across phases.

## Phase 1: Core Loop

### Cargo Management

**Decision: Separate Stacks for Different Purchase Prices**
- When a player buys the same good at different prices, they are stored as separate cargo stacks
- Example: Buying 10 grain @ ₡24, then 10 grain @ ₡30 creates two distinct cargo entries
- Rationale: Clearest profit tracking for MVP, shows player exactly what they paid for each batch

**Decision: Player Chooses Which Stack to Sell**
- When selling goods with multiple stacks, the player selects which specific stack to sell from
- The UI will show all stacks separately with their purchase prices
- Rationale: Gives player control over profit optimization and inventory management

**Decision: Initial Cargo Priced at Sol Rates**
- The starting 20 units of grain are recorded at Sol's grain price (₡24)
- Rationale: Player starts at Sol, so this creates consistent profit calculations

**Decision: Cargo Capacity by Total Units**
- Cargo capacity (50 units) counts total quantity across all goods and stacks
- All goods take the same amount of space (1 unit = 1 capacity)
- Rationale: Simple for MVP, avoids complexity of weight/volume systems

### Storage

**Decision: Browser localStorage for All Persistence**
- All game state is stored in browser localStorage
- No server-side storage or cloud saves in Phase 1
- Rationale: Simplest implementation for single-player browser game

### Trading Interface

**Decision: Fixed Buy/Sell Quantities**
- Buy options: 1 unit, 10 units, or maximum affordable
- Sell options: 1 unit or all units from selected stack
- Rationale: Covers common use cases without overwhelming the UI

### Error Handling

**Decision: Visible Auto-Dismissing Notifications**
- Error messages (insufficient fuel, no connection, etc.) display in a notification area
- Messages auto-dismiss after 3 seconds
- Rationale: Non-intrusive feedback that doesn't require player acknowledgment

**Decision: Graceful Save Data Failure**
- Corrupted or incompatible save data triggers a new game with default values
- Player is notified when this occurs
- Rationale: Prevents crashes, allows game to remain playable

### Fuel Management

**Decision: Prevent Refueling Beyond 100%**
- Refuel transactions cannot exceed 100% fuel capacity
- UI should disable or adjust options that would exceed capacity
- Rationale: Prevents invalid states and wasted credits

---

## Future Phases

(Decisions from later phases will be added here)
