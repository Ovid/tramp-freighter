import { WORMHOLE_DATA } from '../data/wormhole-data.js';
import { STAR_DATA } from '../data/star-data.js';

// Lazy-initialized cache — built once on first access, never recomputed
let adjacencyMap = null;
let shortestPaths = null;
let starNameMap = null;

/**
 * Build a Map<systemId, Set<systemId>> from the static wormhole pair array.
 * Each pair is bidirectional.
 */
function buildAdjacencyMap() {
  const map = new Map();

  for (const [a, b] of WORMHOLE_DATA) {
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a).add(b);
    map.get(b).add(a);
  }

  return map;
}

/**
 * Build a Map<systemId, string> for fast name lookups from STAR_DATA.
 */
function buildStarNameMap() {
  const map = new Map();
  for (const star of STAR_DATA) {
    map.set(star.id, star.name);
  }
  return map;
}

/**
 * BFS from every node that appears in the adjacency map.
 * Stores shortest paths between all reachable pairs.
 *
 * Returns Map<"fromId-toId", { hops, path }>
 * where path is an array of system IDs from source to destination.
 */
function buildShortestPaths(adjMap) {
  const paths = new Map();
  const nodes = Array.from(adjMap.keys());

  for (const source of nodes) {
    // BFS from source
    const visited = new Map(); // systemId -> { hops, parent }
    visited.set(source, { hops: 0, parent: null });
    const queue = [source];

    while (queue.length > 0) {
      const current = queue.shift();
      const currentHops = visited.get(current).hops;
      const neighbors = adjMap.get(current);

      if (!neighbors) continue;

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, { hops: currentHops + 1, parent: current });
          queue.push(neighbor);
        }
      }
    }

    // Reconstruct paths from source to every visited node
    for (const [dest, info] of visited) {
      if (dest === source) continue;

      const path = [];
      let node = dest;
      while (node !== null) {
        path.push(node);
        node = visited.get(node).parent;
      }
      path.reverse();

      paths.set(`${source}-${dest}`, { hops: info.hops, path });
    }
  }

  return paths;
}

/**
 * Ensure the cache is initialized. Called lazily on first API access.
 */
function ensureInitialized() {
  if (adjacencyMap === null) {
    adjacencyMap = buildAdjacencyMap();
    shortestPaths = buildShortestPaths(adjacencyMap);
    starNameMap = buildStarNameMap();
  }
}

/**
 * Get all systems directly connected to a given system via wormholes.
 *
 * @param {number} systemId - System ID to look up
 * @returns {number[]} Array of connected system IDs
 */
export function getConnectedSystems(systemId) {
  ensureInitialized();
  const neighbors = adjacencyMap.get(systemId);
  return neighbors ? Array.from(neighbors) : [];
}

/**
 * Get the shortest path between two systems.
 *
 * @param {number} fromId - Origin system ID
 * @param {number} toId - Destination system ID
 * @returns {{ hops: number, path: number[], systemNames: string[] } | null}
 *   null if no path exists between the systems
 */
export function getShortestPath(fromId, toId) {
  ensureInitialized();

  // Same system — zero-hop path
  if (fromId === toId) {
    const name = starNameMap.get(fromId) || `System ${fromId}`;
    return { hops: 0, path: [fromId], systemNames: [name] };
  }

  const key = `${fromId}-${toId}`;
  const cached = shortestPaths.get(key);
  if (!cached) return null;

  const systemNames = cached.path.map(
    (id) => starNameMap.get(id) || `System ${id}`
  );

  return { hops: cached.hops, path: [...cached.path], systemNames };
}

/**
 * Get all systems reachable from a given system within maxHops jumps.
 * Uses the pre-computed shortest paths rather than re-running BFS.
 *
 * @param {number} systemId - Origin system ID
 * @param {number} maxHops - Maximum number of jumps
 * @returns {{ systemId: number, hopCount: number }[]}
 *   Array sorted by hopCount ascending, then systemId ascending
 */
export function getReachableSystems(systemId, maxHops) {
  ensureInitialized();

  if (maxHops <= 0) return [];
  if (!adjacencyMap.has(systemId)) return [];

  const result = [];

  // Scan all pre-computed paths from this source
  for (const [key, value] of shortestPaths) {
    // Keys are "fromId-toId" — only consider paths from our source
    if (!key.startsWith(`${systemId}-`)) continue;
    if (value.hops <= maxHops) {
      const destId = value.path[value.path.length - 1];
      result.push({ systemId: destId, hopCount: value.hops });
    }
  }

  // Sort by hopCount ascending, then systemId ascending for stability
  result.sort((a, b) => a.hopCount - b.hopCount || a.systemId - b.systemId);

  return result;
}

/**
 * Reset the cache — only for testing purposes.
 * Allows tests to re-initialize with mocked data.
 */
export function _resetCacheForTesting() {
  adjacencyMap = null;
  shortestPaths = null;
  starNameMap = null;
}
