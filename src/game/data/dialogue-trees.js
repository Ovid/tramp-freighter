/**
 * @fileoverview Dialogue Tree Data Structures
 *
 * ## Why Function-Based Text Generation
 *
 * Text functions enable reputation-responsive dialogue without duplicating content.
 * NPCs can acknowledge relationship progression naturally, making interactions feel
 * personal and meaningful rather than static.
 *
 * ## Why Conditional Choice Visibility
 *
 * Reputation-gated choices create progression incentives - players must build
 * relationships to unlock deeper conversations and story content. This supports
 * the "You Know These People" design pillar.
 *
 * ## Why Immediate Reputation Application
 *
 * Reputation changes apply before navigation to ensure conditional content
 * becomes available immediately. This prevents confusing delays where players
 * must exit and re-enter dialogue to see new options.
 *
 * @module DialogueTrees
 */

import { REPUTATION_BOUNDS } from '../constants.js';

/**
 * Validates that all required constants are properly defined
 * Call this during game initialization to catch configuration errors early
 * @throws {Error} If any required constants are missing or invalid
 */
export function validateRequiredConstants() {
  const requiredBounds = [
    'MIN',
    'MAX',
    'HOSTILE_MAX',
    'COLD_MIN',
    'COLD_MAX',
    'NEUTRAL_MIN',
    'NEUTRAL_MAX',
    'WARM_MIN',
    'WARM_MAX',
    'FRIENDLY_MIN',
    'FRIENDLY_MAX',
    'TRUSTED_MIN',
    'TRUSTED_MAX',
    'FAMILY_MIN',
  ];

  if (!REPUTATION_BOUNDS || typeof REPUTATION_BOUNDS !== 'object') {
    throw new Error(
      'REPUTATION_BOUNDS must be defined as an object in constants.js'
    );
  }

  for (const bound of requiredBounds) {
    if (!(bound in REPUTATION_BOUNDS)) {
      throw new Error(
        `Missing required reputation bound: REPUTATION_BOUNDS.${bound}`
      );
    }
    if (typeof REPUTATION_BOUNDS[bound] !== 'number') {
      throw new Error(
        `REPUTATION_BOUNDS.${bound} must be a number, got ${typeof REPUTATION_BOUNDS[bound]}`
      );
    }
  }

  // Validate bounds are in logical order for tier minimums
  const tierMins = [
    REPUTATION_BOUNDS.MIN,
    REPUTATION_BOUNDS.COLD_MIN,
    REPUTATION_BOUNDS.NEUTRAL_MIN,
    REPUTATION_BOUNDS.WARM_MIN,
    REPUTATION_BOUNDS.FRIENDLY_MIN,
    REPUTATION_BOUNDS.TRUSTED_MIN,
    REPUTATION_BOUNDS.FAMILY_MIN,
  ];

  for (let i = 1; i < tierMins.length; i++) {
    if (tierMins[i] <= tierMins[i - 1]) {
      throw new Error(
        `Reputation tier minimums must be in ascending order. ${tierMins[i]} <= ${tierMins[i - 1]}`
      );
    }
  }

  // Validate that MAX is greater than all other bounds
  if (REPUTATION_BOUNDS.MAX <= REPUTATION_BOUNDS.FAMILY_MIN) {
    throw new Error(
      `REPUTATION_BOUNDS.MAX (${REPUTATION_BOUNDS.MAX}) must be greater than FAMILY_MIN (${REPUTATION_BOUNDS.FAMILY_MIN})`
    );
  }
}

// Basic module-level validation - only check existence
if (!REPUTATION_BOUNDS) {
  throw new Error('REPUTATION_BOUNDS must be imported from constants.js');
}

/**
 * Validates that a dialogue tree has the required structure
 * @param {Object} tree - Dialogue tree to validate
 * @throws {Error} If tree structure is invalid
 */
export function validateDialogueTree(tree) {
  if (!tree || typeof tree !== 'object') {
    throw new Error('Dialogue tree must be an object');
  }

  if (!tree.greeting) {
    throw new Error('Dialogue tree must have a greeting node');
  }

  // Validate each node in the tree
  for (const [nodeId, node] of Object.entries(tree)) {
    validateDialogueNode(nodeId, node);
  }
}

/**
 * Validates that a dialogue node has the required structure
 * @param {string} nodeId - Node identifier for error messages
 * @param {Object} node - Dialogue node to validate
 * @throws {Error} If node structure is invalid
 */
export function validateDialogueNode(nodeId, node) {
  if (!node || typeof node !== 'object') {
    throw new Error(`Dialogue node '${nodeId}' must be an object`);
  }

  if (!node.text) {
    throw new Error(`Dialogue node '${nodeId}' must have text property`);
  }

  if (typeof node.text !== 'string' && typeof node.text !== 'function') {
    throw new Error(
      `Dialogue node '${nodeId}' text must be string or function`
    );
  }

  if (!Array.isArray(node.choices)) {
    throw new Error(`Dialogue node '${nodeId}' must have choices array`);
  }

  // Validate each choice
  node.choices.forEach((choice, index) => {
    validateDialogueChoice(nodeId, index, choice);
  });
}

/**
 * Validates that a dialogue choice has the required structure
 * @param {string} nodeId - Node identifier for error messages
 * @param {number} choiceIndex - Choice index for error messages
 * @param {Object} choice - Dialogue choice to validate
 * @throws {Error} If choice structure is invalid
 */
export function validateDialogueChoice(nodeId, choiceIndex, choice) {
  if (!choice || typeof choice !== 'object') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' must be an object`
    );
  }

  if (!choice.text || typeof choice.text !== 'string') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' must have text string`
    );
  }

  // next can be string or null
  if (choice.next !== null && typeof choice.next !== 'string') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' next must be string or null`
    );
  }

  // repGain is optional but must be number if present
  if (choice.repGain !== undefined && typeof choice.repGain !== 'number') {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' repGain must be number`
    );
  }

  // condition is optional but must be function if present
  if (
    choice.condition !== undefined &&
    typeof choice.condition !== 'function'
  ) {
    throw new Error(
      `Choice ${choiceIndex} in node '${nodeId}' condition must be function`
    );
  }
}

/**
 * Wei Chen Dialogue Tree - Dock Worker at Barnard's Star
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * Dialogue Flow:
 * - greeting → small_talk → (boring_response | honest_work) → greeting
 * - greeting → backstory (FRIENDLY_MIN tier) → backstory_2 → greeting
 */
export const WEI_CHEN_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'Hey there, friend! Good to see you again. Ship treating you well?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Oh, it's you. How's business? Ship holding together?";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Another trader. Docking fees paid? Good. What you need?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'You again. Keep your business quick. Got work to do.';
      } else {
        return "Don't want trouble. State your business and move along.";
      }
    },
    choices: [
      {
        text: "Just making conversation. How's work?",
        next: 'small_talk',
      },
      {
        text: 'Tell me about yourself.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Nothing right now. Take care.',
        next: null,
      },
    ],
  },

  small_talk: {
    text: "Work's work. Docks don't run themselves. Ships come, ships go. Some captains know what they're doing, others... well, you learn to spot the difference.",
    choices: [
      {
        text: 'Sounds boring.',
        next: 'boring_response',
        repGain: -2,
      },
      {
        text: 'Honest work is good work.',
        next: 'honest_work',
        repGain: 3,
      },
      {
        text: 'I should let you get back to it.',
        next: 'greeting',
      },
    ],
  },

  boring_response: {
    text: "Boring? Maybe to you. But every ship that docks safe, every cargo load that gets where it's going... that matters. Not everything has to be exciting to be important.",
    choices: [
      {
        text: "You're right. I didn't mean to sound dismissive.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'If you say so.',
        next: 'greeting',
      },
    ],
  },

  honest_work: {
    text: "Exactly. Used to think excitement was everything. Adventure, risk, big scores... learned better. Steady work, steady pay, steady ground under your feet. That's worth something.",
    choices: [
      {
        text: "Sounds like there's a story there.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Wise words. Thanks for the chat.',
        next: 'greeting',
      },
    ],
  },

  backstory: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "Since you asked... used to captain my own ship. The 'Lucky Strike.' Thought I was smart, taking risks others wouldn't. One bad deal with the wrong people, and... well, now I work the docks. Ship's gone, crew scattered. But I'm still here.";
      } else {
        return "Had my own ship once. Made some bad choices, trusted wrong people. Lost everything. But that's ancient history now. Docks are good to me.";
      }
    },
    flags: ['chen_backstory_1'],
    choices: [
      {
        text: "I'm sorry that happened to you.",
        next: 'backstory_2',
        repGain: 3,
      },
      {
        text: 'What kind of bad deal?',
        next: 'backstory_2',
        repGain: 1,
      },
      {
        text: 'We all make mistakes.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  backstory_2: {
    text: "Appreciate that. Point is, learned my lesson. These days I help other captains avoid the same mistakes. See a lot of young hotshots come through here, think they know everything. Try to give them good advice when they'll listen.",
    flags: ['chen_backstory_2'],
    choices: [
      {
        text: 'Any advice for me?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for sharing that with me.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },
};

/**
 * Marcus Cole Dialogue Tree - Loan Shark at Sol
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * Dialogue Flow:
 * - greeting → debt_talk → (payment_plan | defiant_response) → greeting
 * - greeting → business (NEUTRAL_MIN tier) → business_details → greeting
 */
export const MARCUS_COLE_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return 'Ah, my most reliable client. Your account shows consistent progress. How may I assist you today?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "You're punctual. I appreciate that in a debtor. What brings you to my office?";
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'Your debt remains outstanding. I trust you have good news for me.';
      } else {
        return 'You have considerable nerve showing your face here. This had better be about payment.';
      }
    },
    choices: [
      {
        text: 'About my debt...',
        next: 'debt_talk',
      },
      {
        text: 'I wanted to discuss business opportunities.',
        next: 'business',
        condition: (rep) => rep >= REPUTATION_BOUNDS.NEUTRAL_MIN,
      },
      {
        text: "Just checking in. I'll be going now.",
        next: null,
      },
    ],
  },

  debt_talk: {
    text: 'Ten thousand credits. Plus interest. The terms were clear when you signed. I expect regular payments. Defaulting would be... inadvisable.',
    choices: [
      {
        text: 'I need more time to pay.',
        next: 'payment_plan',
        repGain: -1,
      },
      {
        text: "I'll pay when I can. Don't threaten me.",
        next: 'defiant_response',
        repGain: -5,
      },
      {
        text: "I understand. I'm working on it.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  payment_plan: {
    text: "Time is money. My money. However, I'm not unreasonable. Continue trading. Make regular payments. Show progress. I can be patient with those who demonstrate good faith.",
    choices: [
      {
        text: 'Thank you for being understanding.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll do my best.",
        next: 'greeting',
      },
    ],
  },

  defiant_response: {
    text: 'Threats? I deal in facts. Fact: you owe me money. Fact: I have resources you lack. Fact: cooperation serves us both better than confrontation. Consider your position carefully.',
    choices: [
      {
        text: "You're right. I apologize.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "I'll remember that.",
        next: 'greeting',
      },
    ],
  },

  business: {
    text: 'Business. Yes. I appreciate directness. I have connections throughout the sector. Information. Opportunities. For the right client, I can provide... guidance.',
    choices: [
      {
        text: 'What kind of opportunities?',
        next: 'business_details',
        repGain: 1,
      },
      {
        text: 'Maybe another time.',
        next: 'greeting',
      },
    ],
  },

  business_details: {
    text: 'Market intelligence. Cargo manifests. Shipping schedules. Knowledge is profit, properly applied. Of course, such services require trust. And trust must be earned.',
    choices: [
      {
        text: 'How do I earn that trust?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll keep that in mind.",
        next: 'greeting',
      },
    ],
  },
};

/**
 * Father Okonkwo Dialogue Tree - Chaplain at Ross 154
 *
 * Station chaplain and medic who serves travelers' spiritual and physical needs.
 * Uses warm speech with educated vocabulary and religious metaphors.
 *
 * Dialogue Flow:
 * - greeting → faith_talk → (agree | skeptical) → greeting
 * - greeting → help (WARM_MIN tier) → help_details → greeting
 */
export const FATHER_OKONKWO_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'My dear friend! Your presence brings light to this station. How may I serve you today? Are you well in body and spirit?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Welcome back, child. It does my heart good to see you safe. The void between stars can be lonely - you're always welcome here.";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Peace be with you, traveler. You look weary from your journey. Please, rest a moment. How can I help you?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'Even the lost are welcome in this place. Whatever burdens you carry, there is always hope for redemption.';
      } else {
        return 'I see pain in your eyes, child. This is a place of healing. Whatever darkness follows you, it cannot enter here.';
      }
    },
    choices: [
      {
        text: 'Tell me about your faith.',
        next: 'faith_talk',
      },
      {
        text: 'I could use some help.',
        next: 'help',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'Just passing through. Thank you.',
        next: null,
      },
    ],
  },

  faith_talk: {
    text: "Faith is like navigation, child. When you're lost in the dark between stars, you need something to guide you home. For some, it's instruments and charts. For others, it's the light within. Both can lead you safely to port.",
    choices: [
      {
        text: "That's a beautiful way to put it.",
        next: 'agree',
        repGain: 3,
      },
      {
        text: 'I prefer to rely on instruments.',
        next: 'skeptical',
        repGain: -1,
      },
      {
        text: "I'll think about that.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  agree: {
    text: 'You have wisdom, my friend. The universe is vast and full of wonders. Whether we find meaning in the dance of planets or the kindness of strangers, what matters is that we find it. Connection. Purpose. Love.',
    choices: [
      {
        text: 'Thank you for that perspective.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'You have a gift for words, Father.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  skeptical: {
    text: "And there's wisdom in that too, child. Good instruments save lives. But even the best navigation computer can't tell you why the journey matters. That's something each soul must discover for themselves.",
    choices: [
      {
        text: "Maybe you're right about that.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I suppose we all find our own way.',
        next: 'greeting',
      },
    ],
  },

  help: {
    text: 'Of course, dear one. This station serves all who travel the void. Medical supplies, spiritual counsel, a safe harbor in the storm. What weighs on your heart?',
    choices: [
      {
        text: 'What kind of help do you offer?',
        next: 'help_details',
        repGain: 1,
      },
      {
        text: "Just knowing you're here helps.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  help_details: {
    text: 'Medical care for the body, guidance for the spirit, and sometimes just a listening ear. The void between stars is cold, but human kindness can warm even the darkest journey. You need never face your troubles alone.',
    flags: ['okonkwo_help_offered'],
    choices: [
      {
        text: 'That means more than you know.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "Thank you, Father. I'll remember that.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },
};

/**
 * Whisper Dialogue Tree - Information Broker at Sirius A
 *
 * A mysterious information broker who deals in secrets and intelligence.
 * Uses formal speech with educated vocabulary and cryptic measured tones.
 * Provides intel discounts and trading tips based on relationship tier.
 *
 * Dialogue Flow:
 * - greeting → intel_business → (intel_details | intel_prices) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const WHISPER_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "I've been expecting you. We need to talk.";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'Good to see you. I have something interesting.';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return 'Ah, a familiar face. Looking for intel?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Welcome. I deal in information. What do you need?';
      } else {
        // Cold or Hostile
        return 'Information costs credits.';
      }
    },
    choices: [
      {
        text: 'Tell me about your information services.',
        next: 'intel_business',
      },
      {
        text: 'Any trading tips for me?',
        next: 'ask_tip',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Nothing right now. Until next time.',
        next: null,
      },
    ],
  },

  intel_business: {
    text: 'Information is the most valuable commodity in the sector. Market conditions, shipping schedules, customs patterns... I know what moves where, and when. Knowledge properly applied becomes profit.',
    choices: [
      {
        text: 'What kind of information do you have?',
        next: 'intel_details',
        repGain: 1,
      },
      {
        text: 'How much do your services cost?',
        next: 'intel_prices',
      },
      {
        text: 'Interesting. I may be back.',
        next: 'greeting',
      },
    ],
  },

  intel_details: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return 'For trusted clients, I provide advance warnings. Customs sweeps, inspection schedules, enforcement patterns. Information that keeps cargo manifests... flexible.';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'Market intelligence, shipping manifests, price trends. I also hear rumors - some more reliable than others. For established clients, I share the better sources.';
      } else {
        return 'Basic market data, shipping schedules, general sector news. Standard intelligence package. Build a relationship with me, and access to... deeper information becomes available.';
      }
    },
    choices: [
      {
        text: 'That could be very useful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I prefer to gather my own information.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  intel_prices: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return 'For family... information flows freely. Consider it an investment in our mutual success.';
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return 'Trusted clients receive preferential rates. Fifteen percent below standard pricing. Trust is a rare commodity - I reward it accordingly.';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return 'Regular clients enjoy a modest discount. Ten percent below posted rates. Loyalty has its privileges, even in the information trade.';
      } else {
        return 'Standard rates apply. Credits for information, information for credits. Simple transaction.';
      }
    },
    choices: [
      {
        text: 'Fair enough. I may need your services.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "I'll keep that in mind.",
        next: 'greeting',
      },
    ],
  },

  ask_tip: {
    text: 'Knowledge shared is knowledge multiplied. I have something that might interest you...',
    flags: ['whisper_tip_requested'],
    choices: [
      {
        text: 'I appreciate the information.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Useful. Thank you.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: 'An emergency loan... Five hundred credits is a significant sum. But trust, once established, must be honored. I can arrange this, with the understanding that repayment is expected within thirty days.',
    flags: ['whisper_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'Let me think about it.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage... I maintain secure facilities for valued clients. Up to ten units, held safely until you return. Consider it a service between associates.',
    flags: ['whisper_storage_discussed'],
    choices: [
      {
        text: 'That would be very helpful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good to know that option exists.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};

/**
 * Captain Vasquez Dialogue Tree - Retired Trader at Epsilon Eridani
 *
 * A retired freighter captain who serves as a mentor figure for new traders.
 * Uses warm speech with simple vocabulary and shares trading stories from her experience.
 * Provides valuable trading tips and hints about endgame content (Pavonis route).
 *
 * Dialogue Flow:
 * - greeting → trading_talk → (route_advice | fuel_costs) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → backstory (FRIENDLY_MIN tier) → pavonis_hints → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const CAPTAIN_VASQUEZ_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return "Well hello there, family! Come, sit with me. I was just thinking about the old days when traders looked out for each other. How's your ship treating you?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "My trusted friend! Good to see you again. You know, I've been around these routes for decades, and I can tell you're one of the good ones. What brings you by?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return "Hey there, friend! Always a pleasure to see a fellow trader. You're looking more confident each time I see you. Ship running well?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Oh, it's you again! Good to see you're still out there making runs. How's the trading life treating you?";
      } else {
        // Neutral (starts at rep 5, so likely Neutral)
        return "Welcome, captain. I'm Vasquez - used to run freight through these systems myself. What can I do for you?";
      }
    },
    choices: [
      {
        text: 'Tell me about trading in this sector.',
        next: 'trading_talk',
      },
      {
        text: 'Any trading tips for me?',
        next: 'ask_tip',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'Tell me about your trading days.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Just checking in. Take care, Captain.',
        next: null,
      },
    ],
  },

  trading_talk: {
    text: "Ah, trading! Been at it for thirty years before I retired. This sector's got good bones - reliable routes, steady demand. The key is understanding each system's needs. Mining stations always want manufactured goods, rich systems pay premium for luxuries.",
    choices: [
      {
        text: 'What routes do you recommend?',
        next: 'route_advice',
        repGain: 1,
      },
      {
        text: 'Fuel costs seem high on long routes.',
        next: 'fuel_costs',
        repGain: 1,
      },
      {
        text: 'Thanks for the insight.',
        next: 'greeting',
      },
    ],
  },

  route_advice: {
    text: "Smart question! The Barnard's-Procyon-Sirius triangle is solid for beginners. Short jumps, good margins. Once you've got capital, the Sol-Alpha Centauri luxury run pays well. But watch your fuel - nothing worse than being stranded between systems.",
    choices: [
      {
        text: 'Any routes to avoid?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I appreciate the advice.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  fuel_costs: {
    text: "Tell me about it! Fuel's the trader's constant enemy. Back in my day, we'd plan routes like military campaigns - every jump calculated, every ton of cargo justified. Upgrade your engine when you can. Efficiency pays for itself.",
    choices: [
      {
        text: 'How do you calculate profitable routes?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good advice. Thank you.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  ask_tip: {
    text: "Of course! Always happy to share what I know with a fellow trader. Here's something that might help you out there...",
    flags: ['vasquez_tip_requested'],
    choices: [
      {
        text: 'That information is very helpful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for the tip, Captain.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  backstory: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "Thirty years running freight through known space. Started with a beat-up hauler, worked my way up to a proper freighter. Seen systems bloom and fade, watched the trade routes evolve. But there's still unexplored space out there... places like Pavonis that call to the adventurous.";
      } else {
        return 'Been trading these routes since before some of these stations were built. Started small, worked hard, saved every credit. Retired comfortable, but I miss the freedom of the void sometimes. The thrill of a good run, you know?';
      }
    },
    flags: ['vasquez_backstory_shared'],
    choices: [
      {
        text: 'Tell me about Pavonis.',
        next: 'pavonis_hints',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
        repGain: 1,
      },
      {
        text: 'What made you retire?',
        next: 'retirement_story',
        repGain: 2,
      },
      {
        text: 'Sounds like quite a career.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  pavonis_hints: {
    text: "Pavonis... now that's a name I haven't spoken in years. It's out there, beyond the known routes. They say it's rich in rare minerals, but the journey... you'd need a Range Extender to even attempt it. Most traders think it's a myth, but I've seen the old charts. Someday, someone with the right equipment and enough courage will make that run.",
    flags: ['vasquez_pavonis_discussed'],
    choices: [
      {
        text: 'Where would I find a Range Extender?',
        next: 'range_extender_hint',
        repGain: 2,
      },
      {
        text: 'Sounds like a dangerous journey.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  range_extender_hint: {
    text: "That's the million-credit question, isn't it? Range Extenders are military tech, highly restricted. But I've heard rumors... certain contacts in the outer systems might know someone who knows someone. Build your reputation, make the right friends, and maybe someday you'll find what you're looking for.",
    flags: ['vasquez_range_extender_hint'],
    choices: [
      {
        text: 'I appreciate you sharing this with me.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "I'll keep that in mind.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  retirement_story: {
    text: "Age, mostly. Reflexes slow down, and space doesn't forgive mistakes. Plus, I'd saved enough to live comfortably. But the real reason? I wanted to help the next generation of traders. Share what I learned, maybe save a few from the mistakes I made.",
    choices: [
      {
        text: 'What mistakes should I avoid?',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "That's very generous of you.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  request_loan: {
    text: "An emergency loan? Well, I've been where you are - sometimes the void throws you a curve and you need help. Five hundred credits, to be repaid within thirty days. I trust you're good for it, or we wouldn't be having this conversation.",
    flags: ['vasquez_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms. Thank you.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'Let me think about it first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: "Cargo storage? Of course! I've got secure space here at the hub. Up to ten units, safe and sound until you return. Consider it a favor between traders - we look out for each other in this business.",
    flags: ['vasquez_storage_discussed'],
    choices: [
      {
        text: 'That would be a huge help.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I appreciate the offer.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};

/**
 * Dr. Sarah Kim Dialogue Tree - Station Administrator at Tau Ceti
 *
 * An efficient station administrator who values professionalism and proper procedures.
 * Uses formal speech with technical vocabulary and frequently cites regulations.
 * Provides operational tips and docking-related benefits based on relationship tier.
 *
 * Dialogue Flow:
 * - greeting → station_operations → (procedures_important | efficiency_matters) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const DR_SARAH_KIM_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return "Welcome back! It's always a pleasure to work with such a professional trader. Your operational standards are exemplary. How may I assist you today?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return 'Good to see you again. Your consistent adherence to station protocols is noted and appreciated. What can I help you with?';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'Hello there! Your professional approach to station operations has been refreshing. How are things going for you?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Welcome back to Tau Ceti Station. I've noticed your attention to proper procedures. What brings you by today?";
      } else {
        // Neutral, Cold, or Hostile
        return 'Welcome to Tau Ceti Station. Please ensure all documentation is in order. How may I direct you?';
      }
    },
    choices: [
      {
        text: 'Tell me about station operations.',
        next: 'station_operations',
      },
      {
        text: 'Any operational tips for me?',
        next: 'ask_tip',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Nothing right now. Thank you.',
        next: null,
      },
    ],
  },

  station_operations: {
    text: 'Tau Ceti Station operates under strict efficiency protocols per Regulation 47-B. We maintain the highest standards for cargo handling, customs processing, and vessel maintenance. Proper documentation and adherence to procedures ensures smooth operations for everyone.',
    choices: [
      {
        text: 'Procedures are important for safety.',
        next: 'procedures_important',
        repGain: 3,
      },
      {
        text: 'Efficiency matters in trading.',
        next: 'efficiency_matters',
        repGain: 2,
      },
      {
        text: 'Sometimes regulations slow things down.',
        next: 'regulation_defense',
        repGain: -2,
      },
      {
        text: 'I understand. Thank you.',
        next: 'greeting',
      },
    ],
  },

  procedures_important: {
    text: 'Exactly! You understand the importance of systematic operations. Regulation 23-C clearly states that proper procedures prevent 94% of operational incidents. Professional traders like yourself make my job much easier.',
    choices: [
      {
        text: 'I appreciate well-run stations.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good systems benefit everyone.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  efficiency_matters: {
    text: 'Precisely. Efficient operations benefit all parties - reduced processing time, lower operational costs, improved safety margins. When traders follow established protocols, we can process requests 40% faster according to our latest efficiency metrics.',
    choices: [
      {
        text: 'Those are impressive numbers.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll keep that in mind.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  regulation_defense: {
    text: 'I understand that perspective, but consider this: Regulation 15-D exists because uncontrolled cargo transfers resulted in three major incidents in 2387. These procedures exist to protect everyone - traders, station personnel, and cargo integrity.',
    choices: [
      {
        text: "I hadn't considered the safety aspect.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Fair point about the incidents.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Still seems excessive to me.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "Certainly. Operational efficiency is improved through proper planning and adherence to established protocols. Here's something that should help optimize your trading operations...",
    flags: ['kim_tip_requested'],
    choices: [
      {
        text: 'That information is very useful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thank you for the operational guidance.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: 'An emergency loan request... Per Financial Regulation 12-A, I can authorize a five hundred credit emergency advance for trusted traders with established operational records. Standard thirty-day repayment terms apply.',
    flags: ['kim_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'Let me review the terms first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage services are available under Station Protocol 8-C for established traders. We can accommodate up to ten units in our secure storage facility. All items are logged and tracked per standard inventory procedures.',
    flags: ['kim_storage_discussed'],
    choices: [
      {
        text: 'That would be very helpful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good to know that service exists.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};

/**
 * "Rusty" Rodriguez Dialogue Tree - Mechanic at Procyon
 *
 * A gruff but skilled mechanic who loves ships more than people. Uses technical
 * vocabulary with ship personification quirks and provides repair-focused tips.
 * Offers repair service discounts based on relationship tier.
 *
 * Personality: High trust (0.7), low-moderate greed (0.4), high loyalty (0.8), moderate morality (0.5)
 * Speech: Gruff greeting style, technical vocabulary, ship personification quirk
 *
 * Dialogue Flow:
 * - greeting → ship_talk → (ship_care | maintenance_matters) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const RUSTY_RODRIGUEZ_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return "Well, well! Look who's back. Your ship's been treating you right, I hope? She's a good one - I can tell by how you care for her. What can old Rusty do for you today?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "Good to see you again, captain. Your ship's looking better each time I see her. You're learning to treat her right. What brings you to my shop?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return "Hey there! Your ship's been behaving herself, I hope? I can always tell when a captain knows what they're doing. How can I help you?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Back again, eh? Your ship's looking decent. Better than some of the rust buckets that limp in here. What do you need?";
      } else {
        // Neutral, Cold, or Hostile
        return "Another ship, another captain. Let me guess - something's broken and you need it fixed yesterday. What's the problem?";
      }
    },
    choices: [
      {
        text: 'Tell me about ship maintenance.',
        next: 'ship_talk',
      },
      {
        text: 'Any maintenance tips for me?',
        next: 'ask_tip',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Nothing right now. Thanks, Rusty.',
        next: null,
      },
    ],
  },

  ship_talk: {
    text: "Ships are living things, you know. Not literally, but... they got personalities. Quirks. Moods. Treat 'em right, and they'll get you home safe. Neglect 'em, and they'll strand you in the void when you least expect it. Your ship talks to you - you just gotta learn to listen.",
    choices: [
      {
        text: 'I try to take good care of my ship.',
        next: 'ship_care',
        repGain: 3,
      },
      {
        text: 'Regular maintenance is important.',
        next: 'maintenance_matters',
        repGain: 2,
      },
      {
        text: "It's just a machine to me.",
        next: 'just_machine',
        repGain: -2,
      },
      {
        text: 'Interesting perspective.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  ship_care: {
    text: "Now that's what I like to hear! A captain who respects their ship. She'll remember that kindness when things get rough out there. I've seen ships push beyond their limits for captains who treated 'em right. It's not just maintenance - it's partnership.",
    choices: [
      {
        text: 'My ship and I are a team.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'She deserves the best care I can give.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  maintenance_matters: {
    text: "Exactly! Regular maintenance isn't just about preventing breakdowns - though that's important too. It's about understanding your ship's rhythms. When the engine sounds different, when the hull flexes under stress, when life support cycles change. Knowledge keeps you alive out there.",
    choices: [
      {
        text: 'What should I watch for specifically?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good advice. Thank you.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  just_machine: {
    text: "Just a machine? *shakes head* That's where you're wrong, captain. Machines don't develop quirks that save your life. Machines don't push past their specs when you need 'em most. Your ship's more than metal and circuits - she's your lifeline. Better start treating her like one.",
    choices: [
      {
        text: "Maybe you're right about that.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll think about what you said.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Still just a machine to me.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "Sure thing, captain. Been working on ships for twenty years - learned a thing or two about keeping 'em healthy. Here's something that might save you some trouble down the line...",
    flags: ['rusty_tip_requested'],
    choices: [
      {
        text: 'That could save me a lot of trouble.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for the maintenance advice.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: "Emergency loan, eh? Five hundred credits... *wipes hands on coveralls* Look, I know what it's like when your ship needs work and your wallet's empty. I can spot you the credits, but I expect it back in thirty days. Fair enough?",
    flags: ['rusty_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms. Thank you.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'Let me think about it first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: "Cargo storage? Sure, I got secure space in the back of the shop. Up to ten units, safe from the elements and prying eyes. Consider it a favor between professionals - we mechanics gotta stick together, even if you're on the other side of the wrench.",
    flags: ['rusty_storage_discussed'],
    choices: [
      {
        text: 'That would be a huge help.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I appreciate the offer, Rusty.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};

/**
 * Zara Osman Dialogue Tree - Trader at Luyten's Star
 *
 * A sharp trader with connections across the sector who is competitive but fair.
 * Uses casual speech with slang vocabulary and trading jargon quirks.
 * Provides market-focused tips and trading expertise based on relationship tier.
 *
 * Personality: Moderate trust (0.5), moderate-high greed (0.6), moderate loyalty (0.6), moderate morality (0.5)
 * Speech: Casual greeting style, slang vocabulary, trading jargon quirk
 *
 * Dialogue Flow:
 * - greeting → trading_business → (market_knowledge | competition_talk) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const ZARA_OSMAN_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        return "Hey there, partner! Always good to see family in the trade. Business has been solid - how about you? Ready to make some serious credits together?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "Well, well! Look who's back. You've really got the hang of this trading game, haven't you? What's the play today, hotshot?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return "Hey, good to see you again! You're starting to get a real feel for the markets. I like that in a trader. What brings you by?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Back for more action, eh? I can respect that. The markets have been interesting lately. What's your angle?";
      } else {
        // Neutral, Cold, or Hostile
        return "Another trader looking to make their fortune. The sector's got room for everyone... if you know what you're doing. What do you need?";
      }
    },
    choices: [
      {
        text: 'Tell me about the trading business.',
        next: 'trading_business',
      },
      {
        text: 'Got any market tips for me?',
        next: 'ask_tip',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'Nothing right now. Catch you later.',
        next: null,
      },
    ],
  },

  trading_business: {
    text: "Trading's all about reading the flow, you know? Markets breathe - they expand, contract, shift with the currents. Smart money follows the patterns, but smarter money gets ahead of them. It's not just buy low, sell high - it's knowing when the tide's about to turn.",
    choices: [
      {
        text: 'How do you read market patterns?',
        next: 'market_knowledge',
        repGain: 2,
      },
      {
        text: 'Sounds like tough competition out there.',
        next: 'competition_talk',
        repGain: 1,
      },
      {
        text: 'The markets can be unpredictable.',
        next: 'market_unpredictable',
        repGain: 1,
      },
      {
        text: 'Interesting perspective.',
        next: 'greeting',
      },
    ],
  },

  market_knowledge: {
    text: "Now you're asking the right questions! It's all about connections, intel, and timing. Watch the mining stations - when they're flush with ore, luxury systems are your goldmine. Economic events ripple through the sector like waves. Catch the wave right, and you ride it to profit city.",
    choices: [
      {
        text: 'Where do you get your market intel?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'That makes a lot of sense.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  competition_talk: {
    text: "Competition keeps us sharp, keeps the markets honest. I don't mind other traders making credits - sector's big enough for everyone who's got the skills. But I do mind amateurs crashing prices with panic selling. That hurts everyone's bottom line.",
    choices: [
      {
        text: 'How do you deal with price crashes?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Fair competition benefits everyone.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Every trader for themselves, I say.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  market_unpredictable: {
    text: "True that! Markets can flip faster than a ship in a gravity well. That's why you need multiple angles - diversified cargo, flexible routes, solid contacts. Never put all your credits in one trade, no matter how sweet it looks. The void's full of traders who learned that lesson the hard way.",
    choices: [
      {
        text: 'Diversification is smart strategy.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good advice. Thanks.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  ask_tip: {
    text: "Sure thing! Always happy to share market wisdom with a fellow trader. Information flows both ways in this business - what goes around, comes around. Here's something hot off the trade networks...",
    flags: ['osman_tip_requested'],
    choices: [
      {
        text: 'That intel could be worth serious credits.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for the market tip, Zara.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: "Emergency loan? Five hundred credits... *leans back in chair* Look, I've been where you are - sometimes the markets throw you a curveball and you need capital fast. I can front you the credits, but standard terms apply - thirty days, no extensions. Deal?",
    flags: ['osman_loan_discussed'],
    choices: [
      {
        text: 'Deal. I appreciate this, Zara.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'Let me think about those terms.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: "Cargo storage? Yeah, I can swing that. Got secure space here at the outpost - up to ten units, climate controlled, the works. Consider it professional courtesy between traders. We gotta look out for each other in this business.",
    flags: ['osman_storage_discussed'],
    choices: [
      {
        text: 'That would really help me out.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Professional courtesy appreciated.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};

/**
 * All dialogue trees in the game
 * Maps NPC IDs to their dialogue trees
 */
export const ALL_DIALOGUE_TREES = {
  chen_barnards: WEI_CHEN_DIALOGUE,
  cole_sol: MARCUS_COLE_DIALOGUE,
  okonkwo_ross154: FATHER_OKONKWO_DIALOGUE,
  whisper_sirius: WHISPER_DIALOGUE,
  vasquez_epsilon: CAPTAIN_VASQUEZ_DIALOGUE,
  kim_tau_ceti: DR_SARAH_KIM_DIALOGUE,
  rodriguez_procyon: RUSTY_RODRIGUEZ_DIALOGUE,
  osman_luyten: ZARA_OSMAN_DIALOGUE,
};

/**
 * Validates all dialogue trees and required constants in the game
 * Call this during game initialization to ensure data integrity
 * @throws {Error} If any dialogue tree or constants are invalid
 */
export function validateAllDialogueTrees() {
  // Validate constants first
  validateRequiredConstants();

  // Then validate all dialogue trees
  Object.entries(ALL_DIALOGUE_TREES).forEach(([npcId, tree]) => {
    try {
      validateDialogueTree(tree);
    } catch (error) {
      throw new Error(
        `Invalid dialogue tree for NPC '${npcId}': ${error.message}`
      );
    }
  });
}
