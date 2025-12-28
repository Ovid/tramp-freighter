/**
 * @fileoverview Marcus Cole Dialogue Tree
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * @module dialogue/marcus-cole
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

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
