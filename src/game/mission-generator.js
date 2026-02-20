import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
  NAVIGATION_CONFIG,
  PASSENGER_CONFIG,
} from './constants.js';
import { pickRandomFrom } from './utils/seeded-random.js';

export function getConnectedSystems(systemId, wormholeData) {
  const connected = [];
  for (const [a, b] of wormholeData) {
    if (a === systemId) connected.push(b);
    if (b === systemId) connected.push(a);
  }
  return connected;
}

export function getReachableSystems(systemId, wormholeData, maxHops) {
  const visited = new Set([systemId]);
  const result = [];
  let frontier = [systemId];

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier = [];
    for (const current of frontier) {
      for (const neighbor of getConnectedSystems(current, wormholeData)) {
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

function calculateDistance(star1, star2) {
  const r = Math.hypot(star1.x - star2.x, star1.y - star2.y, star1.z - star2.z);
  return r * NAVIGATION_CONFIG.LY_PER_UNIT;
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

  // Weighted destination selection: weight = 1 / hopCount²
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

  const toSystem = chosen.systemId;
  const hopCount = chosen.hopCount;
  const fromStar = starData.find((s) => s.id === fromSystem);
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

  // Weighted destination selection: weight = 1 / hopCount²
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

  const tier = PASSENGER_CONFIG.PAYMENT_TIERS[typeConfig.paymentTier];
  const reward = Math.ceil(
    (tier.min + rng() * (tier.max - tier.min)) * saturationMultiplier
  );

  return {
    id: `passenger_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'passenger',
    title: `Passenger: ${name}`,
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
  rng = Math.random
) {
  const board = [];
  for (let i = 0; i < MISSION_CONFIG.BOARD_SIZE; i++) {
    const isPassenger = rng() < 0.3;
    const mission = isPassenger
      ? generatePassengerMission(systemId, starData, wormholeData, rng)
      : generateCargoRun(systemId, starData, wormholeData, dangerZone, rng);
    if (mission) board.push(mission);
  }
  return board;
}
