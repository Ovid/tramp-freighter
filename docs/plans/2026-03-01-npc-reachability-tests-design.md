# NPC Reachability Tests Design

## Problem

Captain Vasquez was assigned to system 3 (Proxima Centauri C), which is unreachable via wormhole gates. This made her inaccessible to players. The bug was fixed by moving her to system 13 (Epsilon Eridani), but no test existed to prevent this class of bug from recurring.

## Solution

Add three tests to `tests/unit/all-npc-data-validation.test.js` in a new `describe` block for reachability validation.

### Test 1: All NPC systems have reachable flag

For each NPC in `ALL_NPCS`, look up their `system` ID in `STAR_DATA` and assert `r === 1`. Fast, direct guard rail with per-NPC failure messages.

### Test 2: All NPC systems reachable from Sol via wormhole traversal

Build a bidirectional adjacency list from `WORMHOLE_DATA`. BFS from Sol (system 0) to compute the set of reachable system IDs. Assert every NPC's `system` is in that set. Catches bugs even if the `r` flag is itself wrong.

### Test 3: Cross-check `r` flag against graph reachability

For every system in `STAR_DATA`, verify `r === 1` if and only if the system appears in the BFS-reachable set. Keeps the two data sources honest.

## Imports Needed

- `ALL_NPCS` from `npc-data.js`
- `STAR_DATA` from `star-data.js`
- `WORMHOLE_DATA` from `wormhole-data.js`

## Location

All tests added to `tests/unit/all-npc-data-validation.test.js` in a new `describe('NPC System Reachability')` block.
