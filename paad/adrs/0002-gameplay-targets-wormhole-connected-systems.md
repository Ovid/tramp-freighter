# ADR 0002: Rumors and events target only wormhole-connected systems

Date: 2026-11-25
Status: Accepted

## Context

The navigation sphere design
(`docs/plans/2026-11-25-navigation-sphere-design.md`) stops rumors and
economic events from naming stars the player cannot trade at. Its first
version filtered out only companion stars (`isCompanion`). That misses 11
other stars that have no wormholes (for example Ross 882, Wolf 1481, Delta
Pavonis, and Proxima Centauri once it is its own system). In total, 44 of the
117 stars appear in no `WORMHOLE_DATA` pair.

Delta Pavonis is reached once, through the victory run
(`markVictory` → `updateLocation(DELTA_PAVONIS_ID)`). The post-credits
station that follows has no market, info broker or undocking. Normal jumps
need a wormhole connection (`game-navigation.js`).

## Decision

Rumors (the best-price rumor and the event hint) and economic events consider
only systems with at least one wormhole connection, using
`getConnectedSystems(id).length > 0` from `src/game/utils/wormhole-graph.js`.
`isCompanion` is used for display only (map, Find Star, SystemPanel).

## Alternatives rejected

- **Filter companions only**: rumors can still send the player to 11
  unreachable places. One of them is a "good prices at Delta Pavonis" rumor,
  which contradicts Tanaka's "No wormhole connection" line.
- **Use the data's `r` flag**: 36 stars that are not companions have `r: 0`,
  including many that do have wormholes, so `r` does not mean reachable.

## Consequences

- One rule covers companions, wormhole-less primaries, and any star added
  later with no lanes.
- If a later feature gives Delta Pavonis (or another wormhole-less system) a
  working market, for example a post-victory free-trade mode, that feature
  must widen this filter.
- Other gameplay selectors that pick target systems (missions already use the
  wormhole graph) should follow the same rule.
