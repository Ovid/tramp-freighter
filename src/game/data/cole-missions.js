export const COLE_FAVOR_MISSIONS = [
  {
    id: 'cole_courier',
    type: 'delivery',
    source: 'cole',
    title: 'Sealed Package',
    description: 'Cole needs a sealed package delivered. No questions asked.',
    requirements: {
      deadline: 21,
      cargoSpace: 1,
    },
    missionCargo: {
      good: 'sealed_package',
      quantity: 1,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 8,
  },
  {
    id: 'cole_passenger',
    type: 'passenger',
    source: 'cole',
    title: 'Discreet Passenger',
    description: "One of Cole's associates needs quiet transport.",
    requirements: {
      deadline: 14,
      cargoSpace: 5,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 10,
  },
  {
    id: 'cole_intimidation',
    type: 'delivery',
    source: 'cole',
    title: 'Show of Presence',
    description: 'Dock at the specified station. Your arrival is the message.',
    requirements: {
      deadline: 21,
      cargoSpace: 0,
    },
    reward: 0,
    abandonable: false,
    coleRepReward: 12,
  },
];
