import {
  BASE_PRICES,
  MISSION_CONFIG,
  NAVIGATION_CONFIG,
  PASSENGER_CONFIG,
} from './constants.js';

export function getConnectedSystems(systemId, wormholeData) {
  const connected = [];
  for (const [a, b] of wormholeData) {
    if (a === systemId) connected.push(b);
    if (b === systemId) connected.push(a);
  }
  return connected;
}

function calculateDistance(star1, star2) {
  const r = Math.hypot(star1.x - star2.x, star1.y - star2.y, star1.z - star2.z);
  return r * NAVIGATION_CONFIG.LY_PER_UNIT;
}

export function generateCargoRun(
  fromSystem,
  starData,
  wormholeData,
  rng = Math.random
) {
  const connectedIds = getConnectedSystems(fromSystem, wormholeData);
  if (connectedIds.length === 0) return null;

  const toSystem = connectedIds[Math.floor(rng() * connectedIds.length)];
  const fromStar = starData.find((s) => s.id === fromSystem);
  const destStar = starData.find((s) => s.id === toSystem);

  const tradeableGoods = ['grain', 'ore', 'tritium', 'parts'];
  const good = tradeableGoods[Math.floor(rng() * tradeableGoods.length)];
  const qty = 10 + Math.floor(rng() * 20);

  const distance =
    fromStar && destStar ? calculateDistance(fromStar, destStar) : 5;
  const deadline =
    Math.ceil(distance * 2) + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  const reward = Math.ceil(
    qty * BASE_PRICES[good] * MISSION_CONFIG.REWARD_MARKUP
  );

  return {
    id: `cargo_run_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'delivery',
    title: `Cargo Run: ${good} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: 'Standard delivery contract.',
    giver: 'station_master',
    giverSystem: fromSystem,
    requirements: {
      cargo: good,
      quantity: qty,
      destination: toSystem,
      deadline,
    },
    rewards: { credits: reward },
    penalties: { failure: {} },
  };
}

function generatePersonName(rng) {
  const first =
    PASSENGER_CONFIG.FIRST_NAMES[
      Math.floor(rng() * PASSENGER_CONFIG.FIRST_NAMES.length)
    ];
  const last =
    PASSENGER_CONFIG.LAST_NAMES[
      Math.floor(rng() * PASSENGER_CONFIG.LAST_NAMES.length)
    ];
  return `${first} ${last}`;
}

export function generatePassengerMission(
  fromSystem,
  starData,
  wormholeData,
  rng = Math.random
) {
  const connectedIds = getConnectedSystems(fromSystem, wormholeData);
  if (connectedIds.length === 0) return null;

  const toSystem = connectedIds[Math.floor(rng() * connectedIds.length)];
  const fromStar = starData.find((s) => s.id === fromSystem);
  const destStar = starData.find((s) => s.id === toSystem);

  const typeNames = Object.keys(PASSENGER_CONFIG.TYPES);
  const typeName = typeNames[Math.floor(rng() * typeNames.length)];
  const typeConfig = PASSENGER_CONFIG.TYPES[typeName];

  const name = generatePersonName(rng);
  const dialogue =
    typeConfig.dialogue[Math.floor(rng() * typeConfig.dialogue.length)];

  const distance =
    fromStar && destStar ? calculateDistance(fromStar, destStar) : 5;
  const deadline =
    Math.ceil(distance * 2) + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  const tier = PASSENGER_CONFIG.PAYMENT_TIERS[typeConfig.paymentTier];
  const reward = Math.ceil(tier.min + rng() * (tier.max - tier.min));

  return {
    id: `passenger_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'passenger',
    title: `Passenger: ${name}`,
    description: `Transport ${name} to ${destStar ? destStar.name : `System ${toSystem}`}.`,
    giver: 'passenger',
    giverSystem: fromSystem,
    requirements: {
      destination: toSystem,
      deadline,
      cargoSpace: typeConfig.cargoSpace,
    },
    rewards: { credits: reward, faction: { civilians: 5 } },
    penalties: { failure: { faction: { civilians: -3 } } },
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
  rng = Math.random
) {
  const board = [];
  for (let i = 0; i < MISSION_CONFIG.BOARD_SIZE; i++) {
    const isPassenger = rng() < 0.3;
    const mission = isPassenger
      ? generatePassengerMission(systemId, starData, wormholeData, rng)
      : generateCargoRun(systemId, starData, wormholeData, rng);
    if (mission) board.push(mission);
  }
  return board;
}
