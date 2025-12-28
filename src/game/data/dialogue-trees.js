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

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../constants.js';

// Re-export validation functions from dedicated validation module
export {
  validateRequiredConstants,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
} from './dialogue/validation.js';

// Import validation functions for use in validateAllDialogueTrees
import {
  validateRequiredConstants,
  validateDialogueTree,
} from './dialogue/validation.js';

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
        text: 'Any dock worker tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
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

  ask_tip: {
    text: "Dock worker tip? Sure. Been working these docks for years - learned a few things about keeping cargo and ships safe. Here's something that might help you out there...",
    flags: ['chen_tip_requested'],
    choices: [
      {
        text: "That's really helpful. Thanks!",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good to know. I appreciate it.',
        next: 'greeting',
        repGain: 1,
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
        text: 'Any financial tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
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

  ask_tip: {
    text: "Financial advice? Very well. Credit management is a skill few traders master. Debt is a tool - dangerous in the wrong hands, powerful when properly applied. Here's something that might improve your financial position...",
    flags: ['cole_tip_requested'],
    choices: [
      {
        text: "That's valuable advice. Thank you.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll consider that. Thanks.",
        next: 'greeting',
        repGain: 1,
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
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText = "I've been expecting you. We need to talk.";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText = 'Good to see you. I have something interesting.';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText = 'Ah, a familiar face. Looking for intel?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        baseText = 'Welcome. I deal in information. What do you need?';
      } else {
        // Cold or Hostile
        baseText = 'Information costs credits.';
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*Your loan of ₡500 is overdue. Immediate repayment is required.*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Reminder: Your loan of ₡500 is due in ${daysRemaining} days.*`;
          } else {
            baseText += `\n\n*Outstanding loan: ₡500, ${daysRemaining} days remaining.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about your information services.',
        next: 'intel_business',
      },
      {
        text: 'Any trading tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'Good to know that option exists.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: 'Loan repayment... Yes, I see the record. Five hundred credits, as agreed. Your prompt attention to obligations is noted and appreciated.',
    flags: ['whisper_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to gather the credits.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: 'Cargo retrieval... Yes, I have your items secured. Let me transfer them back to your ship. Note that if your cargo hold is full, some items may need to remain in storage.',
    flags: ['whisper_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some space first.',
        next: 'greeting',
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
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "Well hello there, family! Come, sit with me. I was just thinking about the old days when traders looked out for each other. How's your ship treating you?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "My trusted friend! Good to see you again. You know, I've been around these routes for decades, and I can tell you're one of the good ones. What brings you by?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "Hey there, friend! Always a pleasure to see a fellow trader. You're looking more confident each time I see you. Ship running well?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "Oh, it's you again! Good to see you're still out there making runs. How's the trading life treating you?";
      } else {
        // Neutral (starts at rep 5, so likely Neutral)
        baseText =
          "Welcome, captain. I'm Vasquez - used to run freight through these systems myself. What can I do for you?";
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*Captain, your loan of ₡500 is overdue. I trust this is just an oversight?*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Just a friendly reminder - your loan of ₡500 is due in ${daysRemaining} days.*`;
          } else {
            baseText += `\n\n*By the way, you still owe me ₡500 - ${daysRemaining} days left to repay.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about trading in this sector.',
        next: 'trading_talk',
      },
      {
        text: 'Any trading tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'Tell me about your trading days.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'I appreciate the offer.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "Loan repayment? Of course! *checks records* Five hundred credits, right on schedule. I appreciate traders who honor their commitments - it's what keeps this business running on trust.",
    flags: ['vasquez_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thanks for the help.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need a bit more time to get the credits.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "Retrieve your cargo? Of course! *checks storage logs* I've got your items safe and sound. Let me get them transferred back to your ship. If your hold's getting full, just let me know - we can work something out.",
    flags: ['vasquez_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some room first.',
        next: 'greeting',
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
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "Welcome back! It's always a pleasure to work with such a professional trader. Your operational standards are exemplary. How may I assist you today?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          'Good to see you again. Your consistent adherence to station protocols is noted and appreciated. What can I help you with?';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          'Hello there! Your professional approach to station operations has been refreshing. How are things going for you?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "Welcome back to Tau Ceti Station. I've noticed your attention to proper procedures. What brings you by today?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          'Welcome to Tau Ceti Station. Please ensure all documentation is in order. How may I direct you?';
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*Per Financial Regulation 12-A, your loan of ₡500 is overdue. Immediate repayment is required.*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Financial reminder: Your loan of ₡500 is due in ${daysRemaining} days per standard terms.*`;
          } else {
            baseText += `\n\n*Outstanding financial obligation: ₡500, ${daysRemaining} days remaining per agreement.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about station operations.',
        next: 'station_operations',
      },
      {
        text: 'Any operational tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'Good to know that service exists.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: 'Loan repayment processing... Per Financial Regulation 12-A, I can confirm receipt of your five hundred credit repayment. Transaction logged and your account is now current. Thank you for your prompt attention to financial obligations.',
    flags: ['kim_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to gather the credits.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: 'Cargo retrieval request acknowledged. Per Station Protocol 8-C, I can transfer your stored items back to your vessel. Please note that transfer capacity is limited by your current cargo hold availability.',
    flags: ['kim_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some space first.',
        next: 'greeting',
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
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "Well, well! Look who's back. Your ship's been treating you right, I hope? She's a good one - I can tell by how you care for her. What can old Rusty do for you today?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "Good to see you again, captain. Your ship's looking better each time I see her. You're learning to treat her right. What brings you to my shop?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "Hey there! Your ship's been behaving herself, I hope? I can always tell when a captain knows what they're doing. How can I help you?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "Back again, eh? Your ship's looking decent. Better than some of the rust buckets that limp in here. What do you need?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "Another ship, another captain. Let me guess - something's broken and you need it fixed yesterday. What's the problem?";
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*About that loan, captain... five hundred credits, and it was due yesterday. Your ship needs you to be reliable.*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Don't forget - you owe me five hundred credits, due in ${daysRemaining} days. Your ship's counting on you.*`;
          } else {
            baseText += `\n\n*By the way, you still owe me five hundred credits - ${daysRemaining} days left to pay up.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about ship maintenance.',
        next: 'ship_talk',
      },
      {
        text: 'Any maintenance tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'storage'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'I appreciate the offer, Rusty.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "Loan repayment? *wipes hands on coveralls* Good to see you're keeping your word, captain. Five hundred credits, right? Your ship'll be proud - she likes it when her captain's reliable.",
    flags: ['rusty_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thanks for the help.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need a bit more time to get the credits.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "Retrieve your cargo? Sure thing, captain. *heads to the back* Got your stuff safe and sound. Let me get it loaded back onto your ship. If your hold's getting tight, just say the word - we can work something out.",
    flags: ['rusty_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some room first.',
        next: 'greeting',
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
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          'Hey there, partner! Always good to see family in the trade. Business has been solid - how about you? Ready to make some serious credits together?';
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "Well, well! Look who's back. You've really got the hang of this trading game, haven't you? What's the play today, hotshot?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "Hey, good to see you again! You're starting to get a real feel for the markets. I like that in a trader. What brings you by?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "Back for more action, eh? I can respect that. The markets have been interesting lately. What's your angle?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "Another trader looking to make their fortune. The sector's got room for everyone... if you know what you're doing. What do you need?";
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              "\n\n*Hey, about that loan - five hundred credits, and the clock's run out. Time to settle up, partner.*";
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Quick reminder - you owe me five hundred credits, due in ${daysRemaining} days. Don't let it slip, yeah?*`;
          } else {
            baseText += `\n\n*Oh, and you still owe me five hundred credits - ${daysRemaining} days left on the clock.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about the trading business.',
        next: 'trading_business',
      },
      {
        text: 'Got any market tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'storage'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
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
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
      },
      {
        text: 'Let me think about those terms.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage? Yeah, I can swing that. Got secure space here at the outpost - up to ten units, climate controlled, the works. Consider it professional courtesy between traders. We gotta look out for each other in this business.',
    flags: ['osman_storage_discussed'],
    choices: [
      {
        text: 'That would really help me out.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'Professional courtesy appreciated.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "Loan repayment? *checks her ledger* Right, five hundred credits. Good to see you're keeping your word - that's what separates the pros from the amateurs in this business. Reputation's everything in the trade.",
    flags: ['osman_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thanks for the stake.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to get the credits together.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "Retrieve your cargo? No problem, sport. *heads to storage* Got your stuff locked up tight - climate controlled, security monitored, the full package. Let me get it transferred back to your ship. If your hold's getting cramped, we can work something out.",
    flags: ['osman_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me clear some space first.',
        next: 'greeting',
      },
    ],
  },
};

/**
 * Station Master Kowalski Dialogue Tree - Station Master at Alpha Centauri
 *
 * A veteran station master who has seen everything and respects competence above all.
 * Uses gruff speech with simple vocabulary and no-nonsense direct communication.
 * Provides station operation tips and docking-related benefits based on relationship tier.
 *
 * Personality: Low trust (0.3), low-moderate greed (0.4), high loyalty (0.7), high morality (0.7)
 * Speech: Gruff greeting style, simple vocabulary, no-nonsense direct quirk
 *
 * Dialogue Flow:
 * - greeting → station_business → (competence_matters | standards_important) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const STATION_MASTER_KOWALSKI_DIALOGUE = {
  greeting: {
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "Well, look who's back! You've proven yourself a real professional, captain. This station runs better with traders like you. What do you need?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          'Good to see you again, captain. Your professional approach to station operations is noted. How can I help you today?';
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "You're becoming a regular here. I appreciate traders who follow procedures and respect the station. What brings you by?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          "Back again, I see. You're learning how things work around here. That's good. What do you need?";
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "Another trader. Docking fees paid? Good. Keep it professional and we won't have problems. What's your business?";
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*Your loan of five hundred credits is overdue, captain. Station policy requires immediate repayment.*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Reminder: Your loan of five hundred credits is due in ${daysRemaining} days. Station policy - no extensions.*`;
          } else {
            baseText += `\n\n*Outstanding loan: five hundred credits, ${daysRemaining} days remaining per station policy.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about running this station.',
        next: 'station_business',
      },
      {
        text: 'Any station operation tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'storage'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
      },
      {
        text: 'Nothing right now. Thanks, Station Master.',
        next: null,
      },
    ],
  },

  station_business: {
    text: "Running a station isn't glamorous work, but it's important work. We keep the lights on, the air flowing, and the docks clear. Traders come and go, but the station endures. Takes competence, discipline, and respect for proper procedures. No room for cowboys or hotshots here.",
    choices: [
      {
        text: 'Competence is what matters most.',
        next: 'competence_matters',
        repGain: 3,
      },
      {
        text: 'Standards are important for safety.',
        next: 'standards_important',
        repGain: 2,
      },
      {
        text: 'Sounds like a lot of bureaucracy.',
        next: 'bureaucracy_response',
        repGain: -2,
      },
      {
        text: 'I understand. Thank you.',
        next: 'greeting',
      },
    ],
  },

  competence_matters: {
    text: "Exactly. I don't care if you're young or old, human or otherwise. Can you dock without scraping the hull? Do you follow safety protocols? Do you pay your fees on time? That's what matters. Competence earns respect around here.",
    choices: [
      {
        text: 'I try to be professional in all my dealings.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good standards benefit everyone.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  standards_important: {
    text: "Right. Standards aren't about making life difficult - they're about keeping people alive. Seen too many accidents from sloppy procedures, rushed docking, ignored safety checks. Every regulation here is written in someone's blood. Remember that.",
    choices: [
      {
        text: 'I never thought of it that way.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Safety should always come first.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  bureaucracy_response: {
    text: "Bureaucracy? *narrows eyes* That's what amateurs call proper procedures. When your ship's life support fails and you need emergency docking, you'll be grateful for our 'bureaucracy.' It's what keeps this station running when everything else goes to hell.",
    choices: [
      {
        text: "You're right. I apologize for that comment.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "I didn't mean to sound dismissive.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Still seems like a lot of red tape.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "Station operations tip? Sure. Been running stations for twenty years - learned a few things about efficient operations. Here's something that might help you work better with station personnel...",
    flags: ['kowalski_tip_requested'],
    choices: [
      {
        text: 'That information is very useful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for the operational advice.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: 'Emergency loan? Five hundred credits... *checks records* Your operational record shows competence and reliability. I can authorize the advance, but I expect repayment within thirty days. Station policy - no exceptions.',
    flags: ['kowalski_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms.',
        next: 'greeting',
        repGain: 3,
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
      },
      {
        text: 'Let me consider the terms first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage? We maintain secure storage for established traders. Up to ten units in our bonded warehouse. Professional service for professional traders. Standard security protocols apply.',
    flags: ['kowalski_storage_discussed'],
    choices: [
      {
        text: 'That would be very helpful.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'I appreciate the professional service.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: 'Loan repayment acknowledged. *checks station records* Five hundred credits, as agreed. Your prompt attention to financial obligations is noted. Professional conduct like this keeps the station running smoothly.',
    flags: ['kowalski_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thank you for the loan.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to gather the full amount.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: 'Cargo retrieval request processed. *accesses station inventory* Your items are secured in bonded storage per standard protocols. Initiating transfer to your vessel. Note that transfer capacity is limited by your current cargo hold status.',
    flags: ['kowalski_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make room in my hold first.',
        next: 'greeting',
      },
    ],
  },
};

/**
 * "Lucky" Liu Dialogue Tree - Gambler at Wolf 359
 *
 * A professional gambler and risk-taker who loves long odds and respects bold moves.
 * Uses casual speech with slang vocabulary and gambling metaphors throughout conversation.
 * Provides risk-taking tips and high-stakes opportunities based on relationship tier.
 *
 * Personality: Moderate-high trust (0.6), very high greed (0.8), low loyalty (0.4), low morality (0.3)
 * Speech: Casual greeting style, slang vocabulary, gambling metaphors quirk
 *
 * Dialogue Flow:
 * - greeting → gambling_talk → (risk_philosophy | odds_discussion) → greeting
 * - greeting → ask_tip (conditional on canGetTip) → tip_response → greeting
 * - greeting → request_loan (conditional on Trusted tier) → loan_response → greeting
 * - greeting → request_storage (conditional on Friendly tier) → storage_response → greeting
 */
export const LUCKY_LIU_DIALOGUE = {
  greeting: {
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FAMILY_MIN) {
        baseText =
          "Hey, high roller! Welcome back to my table. You've got the stones to play in the big leagues now. What's the action today, partner?";
      } else if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        baseText =
          "Well, well! Look who's learned to play the odds. You're developing a real taste for the game, aren't you? What brings you to Lucky's corner?";
      } else if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText =
          "Hey there, sport! Good to see someone who's not afraid to take a chance. The house always wins, but smart players know when to bet big. What's your play?";
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText =
          'Back for more action, eh? I like that in a trader. Fortune favors the bold, as they say. What can Lucky do for you?';
      } else {
        // Neutral, Cold, or Hostile
        baseText =
          "Another player at the table. Question is - you here to play, or just watch from the sidelines? What's your game, captain?";
      }

      // Add loan status if there's an outstanding loan (only if gameStateManager and npcId provided)
      if (gameStateManager && npcId) {
        const npcState = gameStateManager.getNPCState(npcId);
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const currentDay = gameStateManager.getState().player.daysElapsed;
          const daysElapsed = currentDay - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText +=
              '\n\n*About that stake I fronted you - five hundred credits, and the house always collects. Time to settle up, sport.*';
          } else if (daysRemaining <= 5) {
            baseText += `\n\n*Quick reminder about your stake - five hundred credits due in ${daysRemaining} days. Don't let it ride too long, yeah?*`;
          } else {
            baseText += `\n\n*Oh, and you still owe me five hundred credits from that stake - ${daysRemaining} days left on the clock.*`;
          }
        }
      }

      return baseText;
    },
    choices: [
      {
        text: 'Tell me about the gambling business.',
        next: 'gambling_talk',
      },
      {
        text: 'Got any risk-taking tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'loan'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          const favorAvailability = gameStateManager.canRequestFavor(
            npcId,
            'storage'
          );
          return favorAvailability.available;
        },
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (rep, gameStateManager, npcId) => {
          // Check if NPC has stored cargo
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(
            npcState.storedCargo && npcState.storedCargo.length > 0
          );
        },
      },
      {
        text: 'Nothing right now. See you around, Lucky.',
        next: null,
      },
    ],
  },

  gambling_talk: {
    text: "Gambling? Nah, that's what amateurs call it. I prefer 'calculated risk assessment with profit potential.' See, most folks play it safe - small bets, sure things, steady returns. But the real money? That's in reading the odds everyone else is too scared to touch. High risk, high reward, baby!",
    choices: [
      {
        text: "What's your philosophy on taking risks?",
        next: 'risk_philosophy',
        repGain: 2,
      },
      {
        text: 'How do you calculate the odds?',
        next: 'odds_discussion',
        repGain: 1,
      },
      {
        text: 'I prefer safer investments myself.',
        next: 'safe_investments',
        repGain: -1,
      },
      {
        text: 'Interesting perspective.',
        next: 'greeting',
      },
    ],
  },

  risk_philosophy: {
    text: "My philosophy? Simple - scared money don't make money. You gotta be willing to lose it all to win big. But here's the kicker - it ain't about being reckless. It's about knowing when the deck's stacked in your favor and having the guts to go all-in when the moment's right.",
    choices: [
      {
        text: 'When do you know the moment is right?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'That takes real courage.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Sounds like a good way to go broke.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  odds_discussion: {
    text: "Calculating odds? That's where most people get it wrong - they only look at the numbers. But the real odds include things you can't quantify: desperation, greed, fear, timing. A cargo run that looks like a sure loss on paper might be pure gold if you know the right people are getting desperate.",
    choices: [
      {
        text: 'Information is part of the equation.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Psychology matters as much as math.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "Numbers don't lie, though.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  safe_investments: {
    text: "Safe investments? *chuckles* Sure, you'll make your 3% return, sleep well at night, retire comfortably at 70. But while you're playing it safe, someone else is making the big score. Life's a gamble anyway - might as well make it an interesting one.",
    choices: [
      {
        text: 'Maybe I should take more chances.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "There's wisdom in both approaches.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "I'll stick with steady returns.",
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "Risk-taking tip? Oh, I got plenty of those! See, most traders think small - they're afraid to bet big when the cards are hot. But here's something that might change your perspective on opportunity...",
    flags: ['liu_tip_requested'],
    choices: [
      {
        text: 'That could be worth serious credits.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for the gambling wisdom, Lucky.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: "Emergency loan? *leans back in chair* Five hundred credits... Now that's interesting. Most people come to me for stakes, not loans. But I like your style - sometimes you gotta double down when you're short on chips. Thirty days to pay it back, standard terms. You in?",
    flags: ['liu_loan_discussed'],
    choices: [
      {
        text: 'Deal. I appreciate the stake, Lucky.',
        next: 'greeting',
        repGain: 3,
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
      },
      {
        text: 'Let me think about those odds first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage? Sure thing, sport. I got secure space in the back - up to ten units, safe from sticky fingers and prying eyes. Consider it a favor between players. Sometimes you gotta stash your winnings before the next big game, right?',
    flags: ['liu_storage_discussed'],
    choices: [
      {
        text: 'That would really help my game.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'Thanks for looking out for a fellow player.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: "Loan repayment? *grins and checks his ledger* Five hundred credits, right on schedule. I like a player who knows when to cash out and settle their debts. Shows you understand the game - it's not just about the big wins, it's about staying in action.",
    flags: ['liu_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thanks for the stake.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to get the full amount.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: "Retrieve your stash? *heads to the back room* No problem, sport. Got your goods locked up tight - better security than most banks, and twice as discreet. Let me get your cargo transferred back to your ship. If your hold's getting crowded, we can work out the details.",
    flags: ['liu_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some room first.',
        next: 'greeting',
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
  kowalski_alpha_centauri: STATION_MASTER_KOWALSKI_DIALOGUE,
  liu_wolf359: LUCKY_LIU_DIALOGUE,
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
