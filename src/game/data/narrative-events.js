import { NARRATIVE_EVENT_CONFIG, CONDITION_TYPES } from '../constants.js';

const {
  NARRATIVE_PRIORITY_HIGH,
  NARRATIVE_PRIORITY_DEFAULT,
  NARRATIVE_PRIORITY_LOW,
} = NARRATIVE_EVENT_CONFIG;

/**
 * Narrative event definitions.
 *
 * Each event follows the EventEngine schema:
 * - type: dock | jump | time | condition | chain
 * - category: always 'narrative'
 * - trigger: { system, condition, chance }
 * - content: { text[], speaker, mood, choices[] }
 * - choices[].effects: { costs: {}, rewards: {} }
 */
export const NARRATIVE_EVENTS = [
  // === DOCK EVENTS ===

  {
    id: 'dock_sol_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 0, condition: { type: 'first_dock' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'Sol Station. The heart of human civilization.',
        'Massive. Gleaming. Expensive.',
        'You feel very small, and very poor.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Time to get to work.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'dock_barnards_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 4, condition: { type: 'first_dock' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'The docking clamps engage with a shudder.',
        "Barnard's Station is smaller than you expected — a retrofitted mining platform.",
        "A dock worker waves you toward Bay 3. Her jumpsuit says 'CHEN' in faded stencil.",
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Wave back and head to the trading post.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: 'Stop to introduce yourself.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Ignore her and check your cargo manifest.',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_generic_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.15 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'A dockworker sidles up while you wait for clearance.',
        '"Heard prices on electronics are spiking out near Epsilon Eridani. Just saying."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: '"Thanks for the tip."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: '"Mind your own business."',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_cheap_fuel',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 20 },
      chance: 0.5,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'A mechanic notices your fuel gauge as you dock.',
        '"Running on fumes, huh? I got some fuel canisters that fell off a transport. Half price."',
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: '"Deal."',
          next: null,
          effects: { costs: { credits: 50 }, rewards: {} },
        },
        {
          text: '"No thanks, I like living dangerously."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === JUMP EVENTS ===

  {
    id: 'jump_salvage',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.05 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your sensors ping. Debris field ahead.',
        'Looks like a cargo container. Intact, maybe.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Investigate the wreckage.',
          next: 'jump_salvage_result',
          effects: { costs: { fuel: 2 }, rewards: {} },
        },
        {
          text: 'Keep moving.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_salvage_result',
    type: 'chain',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 0,
    content: {
      text: [
        'You crack the seal. Inside: a crate of spare parts.',
        'Salvage rights. Finders keepers.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Load it up.',
          next: null,
          effects: {
            costs: {},
            rewards: {
              cargo: [
                {
                  good: 'parts',
                  qty: 3,
                  buyPrice: 0,
                  buySystemName: 'Salvaged',
                },
              ],
            },
          },
        },
      ],
    },
  },

  {
    id: 'jump_quiet_moment',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.08 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'The wormhole transit is smooth. Unusually smooth.',
        'For a moment, the stars outside look almost peaceful.',
        'You wonder how many other freighter captains are out here right now, alone with their thoughts.',
      ],
      speaker: null,
      mood: 'calm',
      choices: [
        {
          text: 'Enjoy the silence.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Back to work.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_strange_signal',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.04 },
    once: false,
    cooldown: 7,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your comms array picks up a signal. Old. Looping.',
        'It sounds like a distress beacon, but the encryption is centuries out of date.',
        'Whatever sent it is long gone.',
      ],
      speaker: null,
      mood: 'mysterious',
      choices: [
        {
          text: 'Log the coordinates and move on.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Ignore it. Not your problem.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === TIME EVENTS ===

  {
    id: 'time_debt_warning',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        { type: 'days_past', value: 30 },
        { type: 'debt_above', value: 8000 },
      ],
      chance: 1.0,
    },
    once: false,
    cooldown: 10,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'A message from Marcus Cole.',
        '"Grace period\'s over. Interest starts accruing. Don\'t make me come looking for you."',
      ],
      speaker: 'Marcus Cole',
      mood: 'threatening',
      choices: [
        {
          text: 'Delete message.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'time_news_broadcast',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'days_past', value: 15 },
      chance: 0.2,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'The newsfeed crackles to life.',
        '"...trade disputes continue between the inner and outer colonies. Commodity prices remain volatile..."',
        'Same old story.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Keep listening.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: 'Switch it off.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === CONDITION EVENTS ===

  {
    id: 'cond_low_fuel',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 10 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'The fuel warning light blinks insistently.',
        'You tap it. It keeps blinking.',
        "You're running on fumes.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: 'Better find a station soon.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_hull_damage',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'hull_below', value: 30 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'A deep groan reverberates through the hull.',
        'The patch job from last time is holding, but barely.',
        "One more hard knock and you'll be breathing vacuum.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: 'Note to self: find a repair dock.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_debt_free',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'debt_below', value: 1 },
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'You stare at the balance sheet. Read it again.',
        'Zero. You owe nothing.',
        'The weight lifts. For the first time since you bought this ship, you can breathe.',
      ],
      speaker: null,
      mood: 'triumphant',
      choices: [
        {
          text: "I'm free.",
          next: null,
          effects: { costs: {}, rewards: { karma: 2 } },
        },
      ],
    },
  },

  // === PASSENGER EVENTS ===

  {
    id: 'passenger_complaint_comfort',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_passenger' }, chance: 0.15 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your passenger complains about the cramped quarters.',
        "They're clearly uncomfortable.",
      ],
      speaker: null,
      mood: 'annoyed',
      choices: [
        {
          text: 'Apologize and offer refreshments.',
          next: null,
          effects: {
            costs: { credits: 20 },
            rewards: { passengerSatisfaction: 5 },
          },
        },
        {
          text: "It's a freighter, not a cruise ship.",
          next: null,
          effects: { costs: { passengerSatisfaction: 10 }, rewards: {} },
        },
        {
          text: 'Ignore the complaint.',
          next: null,
          effects: { costs: { passengerSatisfaction: 5 }, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'passenger_wealthy_tip',
    type: 'dock',
    category: 'narrative',
    trigger: { condition: { type: 'has_wealthy_passenger' }, chance: 0.5 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your wealthy passenger is impressed with your service.',
        'They offer a generous tip.',
      ],
      speaker: null,
      mood: 'pleased',
      choices: [
        {
          text: 'Accept graciously.',
          next: null,
          effects: { costs: {}, rewards: { credits: 500 } },
        },
        {
          text: 'Decline politely.',
          next: null,
          effects: { costs: {}, rewards: { passengerSatisfaction: 10 } },
        },
      ],
    },
  },

  {
    id: 'passenger_family_children',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_family_passenger' }, chance: 0.2 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'The children are getting restless.',
        'The parents look apologetic.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Show them the cockpit.',
          next: null,
          effects: { costs: {}, rewards: { passengerSatisfaction: 15 } },
        },
        {
          text: 'Give them some snacks.',
          next: null,
          effects: {
            costs: { credits: 10 },
            rewards: { passengerSatisfaction: 10 },
          },
        },
        {
          text: 'Ignore it.',
          next: null,
          effects: { costs: { passengerSatisfaction: 5 }, rewards: {} },
        },
      ],
    },
  },

  // === QUEST EVENTS ===

  {
    id: 'tanaka_intro',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: 4,
      condition: [
        { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
        { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 0 },
      ],
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        "A woman in engineer's coveralls watches your ship dock. She approaches as you exit the airlock.",
        '"Tanaka drive. Mark III, if I\'m not mistaken."',
        'She circles your ship, running a hand along the hull.',
        '"I\'m Yuki Tanaka. I designed that drive. Well, my father did. I improved it."',
      ],
      speaker: 'Yuki Tanaka',
      mood: 'mysterious',
      choices: [
        {
          text: '"It\'s a good drive. Reliable."',
          next: null,
          effects: { rewards: { karma: 1 } },
          flags: ['tanaka_met'],
        },
        {
          text: '"You\'re THE Tanaka? I\'ve heard of you."',
          next: null,
          effects: { rewards: { karma: 1 } },
          flags: ['tanaka_met'],
        },
        {
          text: '"What do you want?"',
          next: null,
          effects: {},
          flags: ['tanaka_met'],
        },
      ],
    },
  },
];
