/**
 * @fileoverview Dialogue Tree Data Structures
 *
 * Defines branching conversation trees for all NPCs in the game. Each dialogue tree
 * contains nodes with NPC text and player response choices. Text can be static strings
 * or functions that generate dynamic content based on reputation. Choices can have
 * condition functions to control visibility based on relationship level.
 *
 * ## Architecture Integration
 *
 * Dialogue trees integrate with the NPC reputation system through:
 * - **Dynamic Text**: Text functions receive current reputation and generate contextual responses
 * - **Conditional Choices**: Choice visibility controlled by reputation thresholds (e.g., backstory requires rep >= 30)
 * - **Reputation Changes**: Choices can modify reputation via `repGain` property
 * - **Story Flags**: Dialogue nodes can set persistent flags in NPC state for quest tracking
 *
 * ## Game State Integration
 *
 * Dialogue execution affects game state through:
 * - **Reputation Modification**: Applied before advancing to next node (ensures immediate effect)
 * - **Story Flag Setting**: Flags added to NPC state before navigation (enables conditional content)
 * - **Trust Modifiers**: Reputation gains affected by NPC personality traits and ship quirks
 * - **Interaction Tracking**: Last interaction timestamp and total interaction count updated
 *
 * ## Usage Patterns
 *
 * ```javascript
 * // Import specific trees for dialogue engine
 * import { WEI_CHEN_DIALOGUE } from './dialogue-trees.js';
 *
 * // Import all trees for system initialization
 * import { ALL_DIALOGUE_TREES, validateAllDialogueTrees } from './dialogue-trees.js';
 *
 * // Validate tree structure during game initialization
 * validateAllDialogueTrees(); // Throws if any tree is malformed
 *
 * // Execute dialogue with reputation-based text
 * const greetingText = WEI_CHEN_DIALOGUE.greeting.text(currentReputation);
 *
 * // Filter choices by reputation conditions
 * const availableChoices = node.choices.filter(choice =>
 *   !choice.condition || choice.condition(currentReputation)
 * );
 * ```
 *
 * ## Dialogue Node Structure
 *
 * Each dialogue node contains:
 * - `text`: String or function(reputation) returning contextual NPC dialogue
 * - `choices`: Array of player response options
 * - `flags`: Optional array of story flags to set when node is visited
 *
 * Each choice contains:
 * - `text`: Player response text (always static string)
 * - `next`: Next node ID or null to end dialogue
 * - `repGain`: Optional reputation change (applied before navigation)
 * - `condition`: Optional function(reputation) controlling choice visibility
 *
 * @module DialogueTrees
 */

import { REPUTATION_BOUNDS } from '../constants.js';

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
 * - greeting → backstory (rep >= 30) → backstory_2 → greeting
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
 * - greeting → business (rep >= 0) → business_details → greeting
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
 * - greeting → help (rep >= 10) → help_details → greeting
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
 * All dialogue trees in the game
 * Maps NPC IDs to their dialogue trees
 */
export const ALL_DIALOGUE_TREES = {
  chen_barnards: WEI_CHEN_DIALOGUE,
  cole_sol: MARCUS_COLE_DIALOGUE,
  okonkwo_ross154: FATHER_OKONKWO_DIALOGUE,
};

/**
 * Validates all dialogue trees in the game
 * Call this during game initialization to ensure data integrity
 * @throws {Error} If any dialogue tree is invalid
 */
export function validateAllDialogueTrees() {
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
