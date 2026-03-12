import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { MISSION_CONFIG, NAVIGATION_CONFIG } from '../../src/game/constants.js';
import { getReachableSystems } from '../../src/game/mission-generator.js';

function distanceLY(a, b) {
  return (
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * NAVIGATION_CONFIG.LY_PER_UNIT
  );
}

function jumpTime(dist) {
  return Math.max(1, Math.ceil(dist * 0.5));
}

describe('Mission deadline feasibility (production data)', () => {
  const starById = new Map(STAR_DATA.map((s) => [s.id, s]));

  // Build adjacency for independent path reconstruction
  const adj = new Map();
  for (const s of STAR_DATA) adj.set(s.id, []);
  for (const [a, b] of WORMHOLE_DATA) {
    adj.get(a).push(b);
    adj.get(b).push(a);
  }

  // Independent BFS to compute travel days (verifies wormhole-graph calculation)
  function computeTravelDays(fromId, toId) {
    if (fromId === toId) return 0;
    const visited = new Map();
    visited.set(fromId, null);
    const queue = [fromId];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, current);
          queue.push(neighbor);
          if (neighbor === toId) {
            const path = [toId];
            let node = toId;
            while (visited.get(node) !== null) {
              node = visited.get(node);
              path.push(node);
            }
            path.reverse();
            let totalDays = 0;
            for (let i = 0; i < path.length - 1; i++) {
              const d = distanceLY(
                starById.get(path[i]),
                starById.get(path[i + 1])
              );
              totalDays += jumpTime(d);
            }
            return totalDays;
          }
        }
      }
    }
    return Infinity;
  }

  it('every mission route must have a deadline >= actual travel time', () => {
    const failures = [];

    for (const origin of STAR_DATA) {
      const reachable = getReachableSystems(
        origin.id,
        WORMHOLE_DATA,
        MISSION_CONFIG.MAX_MISSION_HOPS
      );

      for (const dest of reachable) {
        const independentTravelDays = computeTravelDays(
          origin.id,
          dest.systemId
        );
        const deadline = dest.travelDays + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

        if (independentTravelDays > deadline) {
          const destStar = starById.get(dest.systemId);
          failures.push(
            `${origin.name} -> ${destStar.name}: ` +
              `${dest.hopCount}-hop, travel=${independentTravelDays}d, deadline=${deadline}d`
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('travelDays from getReachableSystems matches independent calculation', () => {
    const mismatches = [];

    for (const origin of STAR_DATA) {
      const reachable = getReachableSystems(
        origin.id,
        WORMHOLE_DATA,
        MISSION_CONFIG.MAX_MISSION_HOPS
      );

      for (const dest of reachable) {
        const independent = computeTravelDays(origin.id, dest.systemId);
        if (dest.travelDays !== independent) {
          const destStar = starById.get(dest.systemId);
          mismatches.push(
            `${origin.name} -> ${destStar.name}: ` +
              `getReachable=${dest.travelDays}d, independent=${independent}d`
          );
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});
