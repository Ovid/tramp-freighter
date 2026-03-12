import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
  PASSENGER_CONFIG,
  COMMODITY_TYPES,
} from './constants.js';
import { calculateSystemPrices } from './utils/calculators.js';
import { pickRandomFrom } from './utils/seeded-random.js';
import {
  getConnectedSystems as getCachedConnectedSystems,
  getReachableSystems as getCachedReachableSystems,
} from './utils/wormhole-graph.js';
import { WORMHOLE_DATA } from './data/wormhole-data.js';

function pickWeightedDestination(reachable, rng) {
  const weights = reachable.map((r) => 1 / (r.hopCount * r.hopCount));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * totalWeight;
  let chosen = reachable[0];
  for (let i = 0; i < reachable.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      chosen = reachable[i];
      break;
    }
  }
  return chosen;
}

function getConnectedSystemsDirect(systemId, wormholeData) {
  const connected = [];
  for (const [a, b] of wormholeData) {
    if (a === systemId) connected.push(b);
    if (b === systemId) connected.push(a);
  }
  return connected;
}

/**
 * Get all systems reachable from systemId within maxHops jumps.
 * Delegates to the pre-computed cache when using production wormhole data;
 * falls back to BFS for test data.
 */
export function getReachableSystems(systemId, wormholeData, maxHops) {
  if (wormholeData === WORMHOLE_DATA) {
    return getCachedReachableSystems(systemId, maxHops);
  }

  // Fallback BFS for non-production data (tests)
  const visited = new Set([systemId]);
  const result = [];
  let frontier = [systemId];

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier = [];
    for (const current of frontier) {
      for (const neighbor of getConnectedSystemsDirect(current, wormholeData)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          result.push({ systemId: neighbor, hopCount: hop });
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  return result;
}

export function generateCargoRun(
  fromSystem,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random,
  destinationDangerZoneFn = null,
  completionHistory = [],
  currentDay = 0
) {
  const reachable = getReachableSystems(
    fromSystem,
    wormholeData,
    MISSION_CONFIG.MAX_MISSION_HOPS
  );
  if (reachable.length === 0) return null;

  const chosen = pickWeightedDestination(reachable, rng);
  const toSystem = chosen.systemId;
  const hopCount = chosen.hopCount;
  const destStar = starData.find((s) => s.id === toSystem);

  const deadline =
    hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
    MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  // Determine legal vs illegal based on origin zone
  const illegalChance =
    MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE[dangerZone] || 0.15;
  const isIllegal = rng() < illegalChance;

  const cargoPool = isIllegal
    ? MISSION_CARGO_TYPES.illegal
    : MISSION_CARGO_TYPES.legal;
  const good = pickRandomFrom(cargoPool, rng);

  const qtyRange = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY
    : MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY;
  const qty =
    qtyRange.MIN + Math.floor(rng() * (qtyRange.MAX - qtyRange.MIN + 1));

  // Risk-scaled reward
  const baseFee = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE
    : MISSION_CONFIG.CARGO_RUN_BASE_FEE;

  const hopMultiplier = MISSION_CONFIG.HOP_MULTIPLIERS[hopCount] || 1.0;

  const destDangerZone = destinationDangerZoneFn
    ? destinationDangerZoneFn(toSystem)
    : dangerZone;
  const dangerMultiplier =
    MISSION_CONFIG.DANGER_MULTIPLIERS[destDangerZone] || 1.0;

  // Route saturation
  const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
  const recentCompletions = completionHistory.filter(
    (entry) =>
      entry.to === toSystem &&
      entry.from === fromSystem &&
      entry.day > windowStart
  ).length;
  const saturationMultiplier = Math.max(
    MISSION_CONFIG.SATURATION_FLOOR,
    1.0 - recentCompletions * MISSION_CONFIG.SATURATION_PENALTY_PER_RUN
  );

  const reward = Math.ceil(
    baseFee * hopMultiplier * dangerMultiplier * saturationMultiplier
  );

  // Build faction rewards
  const faction = { traders: 2 };
  if (isIllegal) {
    faction.outlaws = 3;
  }

  const failureFaction = { traders: -2 };
  if (isIllegal) {
    failureFaction.outlaws = -2;
  }

  const cargoLabel = good
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: `cargo_run_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'delivery',
    title: `Cargo Run: ${cargoLabel} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: isIllegal
      ? 'Discreet delivery. No questions asked.'
      : 'Standard delivery contract.',
    giver: 'station_master',
    giverSystem: fromSystem,
    hopCount,
    requirements: {
      destination: toSystem,
      deadline,
    },
    destination: {
      systemId: toSystem,
      name: destStar ? destStar.name : `System ${toSystem}`,
    },
    missionCargo: {
      good,
      quantity: qty,
      isIllegal,
    },
    rewards: { credits: reward, faction },
    penalties: { failure: { faction: failureFaction } },
    saturated: saturationMultiplier < 1.0,
  };
}

function generatePersonName(rng) {
  const first = pickRandomFrom(PASSENGER_CONFIG.FIRST_NAMES, rng);
  const last = pickRandomFrom(PASSENGER_CONFIG.LAST_NAMES, rng);
  return `${first} ${last}`;
}

export function generatePassengerMission(
  fromSystem,
  starData,
  wormholeData,
  rng = Math.random,
  completionHistory = [],
  currentDay = 0
) {
  const reachable = getReachableSystems(
    fromSystem,
    wormholeData,
    MISSION_CONFIG.MAX_MISSION_HOPS
  );
  if (reachable.length === 0) return null;

  const chosen = pickWeightedDestination(reachable, rng);
  const toSystem = chosen.systemId;
  const hopCount = chosen.hopCount;
  const destStar = starData.find((s) => s.id === toSystem);

  const typeNames = Object.keys(PASSENGER_CONFIG.TYPES);
  const typeName = pickRandomFrom(typeNames, rng);
  const typeConfig = PASSENGER_CONFIG.TYPES[typeName];

  const name = generatePersonName(rng);
  const dialogue = pickRandomFrom(typeConfig.dialogue, rng);

  const deadline =
    hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
    MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  // Route saturation
  const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
  const recentCompletions = completionHistory.filter(
    (entry) =>
      entry.to === toSystem &&
      entry.from === fromSystem &&
      entry.day > windowStart
  ).length;
  const saturationMultiplier = Math.max(
    MISSION_CONFIG.SATURATION_FLOOR,
    1.0 - recentCompletions * MISSION_CONFIG.SATURATION_PENALTY_PER_RUN
  );

  // Use base prices without active events/market conditions so passenger
  // payments reflect typical route profitability, not transient market swings
  const fromStar = starData.find((s) => s.id === fromSystem);
  const originPrices = calculateSystemPrices(fromStar, currentDay, [], {});
  const destPrices = calculateSystemPrices(destStar, currentDay, [], {});
  const bestMargin = Math.max(
    MISSION_CONFIG.PASSENGER_MARGIN_FLOOR,
    ...COMMODITY_TYPES.map((good) => destPrices[good] - originPrices[good])
  );
  const hopMultiplier = MISSION_CONFIG.HOP_MULTIPLIERS[hopCount] || 1.0;
  const reward = Math.ceil(
    (MISSION_CONFIG.PASSENGER_BASE_FEE +
      bestMargin * typeConfig.cargoSpace * MISSION_CONFIG.PASSENGER_PREMIUM) *
      hopMultiplier *
      saturationMultiplier
  );

  return {
    id: `passenger_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'passenger',
    title: `Passenger: ${name} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: `Transport ${name} to ${destStar ? destStar.name : `System ${toSystem}`}.`,
    giver: 'passenger',
    giverSystem: fromSystem,
    hopCount,
    requirements: {
      destination: toSystem,
      deadline,
      cargoSpace: typeConfig.cargoSpace,
    },
    destination: {
      systemId: toSystem,
      name: destStar ? destStar.name : `System ${toSystem}`,
    },
    rewards: { credits: reward, faction: { civilians: 5 } },
    penalties: { failure: { faction: { civilians: -3 } } },
    saturated: saturationMultiplier < 1.0,
    passenger: {
      name,
      type: typeName,
      satisfaction: PASSENGER_CONFIG.INITIAL_SATISFACTION,
      satisfactionWeights: { ...typeConfig.satisfactionWeights },
      dialogue,
    },
  };
}

export function generateMissionBoard(
  systemId,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random,
  destinationDangerZoneFn = null,
  completionHistory = [],
  currentDay = 0,
  factionReps = null
) {
  const connectionCount =
    wormholeData === WORMHOLE_DATA
      ? getCachedConnectedSystems(systemId).length
      : getConnectedSystemsDirect(systemId, wormholeData).length;
  const boardSize = Math.min(
    Math.max(connectionCount + 1, MISSION_CONFIG.MIN_BOARD_SIZE),
    MISSION_CONFIG.BOARD_SIZE
  );

  const priorityConfig = MISSION_CONFIG.PRIORITY_MISSION;

  const board = [];
  for (let i = 0; i < boardSize; i++) {
    const isPassenger = rng() < 0.3;
    const mission = isPassenger
      ? generatePassengerMission(
          systemId,
          starData,
          wormholeData,
          rng,
          completionHistory,
          currentDay
        )
      : generateCargoRun(
          systemId,
          starData,
          wormholeData,
          dangerZone,
          rng,
          destinationDangerZoneFn,
          completionHistory,
          currentDay
        );
    if (!mission) continue;

    // Check if mission qualifies for priority tier
    if (factionReps && rng() < priorityConfig.BOARD_CHANCE) {
      const isEligible = isPassenger
        ? (factionReps.civilians || 0) >= priorityConfig.CIVILIAN_REP_THRESHOLD
        : (factionReps.traders || 0) >= priorityConfig.TRADER_REP_THRESHOLD;

      if (isEligible) {
        mission.rewards.credits = Math.ceil(
          mission.rewards.credits * priorityConfig.REWARD_MULTIPLIER
        );
        mission.priority = true;
      }
    }

    board.push(mission);
  }
  return board;
}
