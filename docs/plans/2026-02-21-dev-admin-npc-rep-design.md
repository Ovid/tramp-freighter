# Dev Admin Panel: NPC Reputation Controls

## Problem

UAT scenarios often require specific NPC reputation levels (e.g., testing Trusted-tier benefits requires rep >= 60). Currently there's no way to set NPC reputations without playing through the game, making these scenarios difficult to test. The dev admin panel already has controls for karma, faction rep, ship stats, cargo, and encounters, but not NPC reputation.

## Design

### Backend: NPCManager

Add `setNpcRep(npcId, value)` to `NPCManager` (`src/game/state/managers/npc.js`):

- Directly sets `state.npcs[npcId].rep` to `Math.round(clamp(value, -100, 100))`
- Does NOT update `lastInteraction` or `interactions` (those are gameplay artifacts)
- Bypasses the trust multiplier entirely (dev tool needs exact values)
- Emits `npcsChanged` event for React re-renders

Add corresponding delegation method to `GameStateManager`.

### Frontend: DevAdminPanel

Add a collapsible "NPC Reputation" section to `DevAdminPanel.jsx`, positioned after the Faction Reputation section.

**Per NPC (all 11):**
- NPC name + role label (e.g., "Wei Chen - Dock Worker")
- Current rep value and tier name (e.g., "15 (Warm)")
- Numeric input (-100 to 100) + "Set" button
- Quick-set tier buttons with midpoint values:
  - Hostile (-75), Cold (-30), Neutral (0), Warm (20)
  - Friendly (45), Trusted (75), Family (95)

**Behavior:**
- Section starts collapsed by default
- Subscribes to `npcsChanged` via `useGameEvent` for live updates
- Matches existing dev panel styling and patterns

### Tier Reference

| Tier     | Range        | Midpoint |
|----------|-------------|----------|
| Hostile  | -100 to -50 | -75      |
| Cold     | -49 to -10  | -30      |
| Neutral  | -9 to 9     | 0        |
| Warm     | 10 to 29    | 20       |
| Friendly | 30 to 59    | 45       |
| Trusted  | 60 to 89    | 75       |
| Family   | 90 to 100   | 95       |

## Files to Modify

1. `src/game/state/managers/npc.js` - Add `setNpcRep()` method
2. `src/game/state/game-state-manager.js` - Add delegation method
3. `src/features/dev-admin/DevAdminPanel.jsx` - Add NPC Reputation section

## Testing

- Unit test for `setNpcRep`: verifies clamping, rounding, event emission, trust bypass
- Verify dev panel renders all NPCs with correct current values
- Verify tier buttons set expected values
