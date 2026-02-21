/**
 * @fileoverview Marcus Cole Dialogue Tree
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * Greeting text varies by heat tier (debt pressure level):
 * - Low (0-20): Professional, brief. Financial tips available.
 * - Medium (21-45): Curt. Mentions patterns. Warns about terms.
 * - High (46-70): Threatening. References consequences. Offers a job.
 * - Critical (71-100): Cold fury. Mandatory mission delivery.
 *
 * @module dialogue/marcus-cole
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

/**
 * Safely retrieves the heat tier from the game state manager.
 * Returns 'low' if the manager is unavailable or lacks the method.
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {string} Heat tier: 'low', 'medium', 'high', or 'critical'
 */
function safeGetHeatTier(gameStateManager) {
  if (gameStateManager && typeof gameStateManager.getHeatTier === 'function') {
    return gameStateManager.getHeatTier();
  }
  return 'low';
}

/**
 * Returns the heat-tier-appropriate greeting text.
 * Falls back to reputation-based variants within each tier.
 *
 * @param {number} rep - Current reputation with Cole
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {string} Greeting text
 */
function getGreetingText(rep, gameStateManager) {
  const heatTier = safeGetHeatTier(gameStateManager);

  switch (heatTier) {
    case 'critical':
      return 'You know why I am here. No more games. No more excuses. You will do exactly as I say, or I will recoup my investment through other means. Sit down.';

    case 'high':
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "You're running out of time. I've been patient. More than patient. But patience has a price, and yours is coming due. I have a job for you.";
      }
      return 'I warned you. I warned you and you did not listen. Now we do things my way. I have a job for you, and you will take it.';

    case 'medium':
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "I've been watching your numbers. You show promise, but your debt trajectory concerns me. Don't make me adjust the terms.";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "I see a pattern forming in your account. It's not one I like. We need to discuss your repayment schedule.";
      }
      return 'Your account is trending in the wrong direction. I notice these things. I notice everything. We should talk about your obligations.';

    case 'low':
    default:
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return 'Ah, my most reliable client. Your account is in order. How may I assist you today?';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return "You're punctual. I appreciate that in a debtor. What brings you to my office?";
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'Your debt remains outstanding. I trust you have good news for me.';
      }
      return 'You have considerable nerve showing your face here. This had better be about payment.';
  }
}

/**
 * Marcus Cole Dialogue Tree - Loan Shark at Sol
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Uses formal speech with educated vocabulary and short clipped sentences.
 *
 * Dialogue Flow:
 * - greeting → debt_talk → (payment_plan | defiant_response) → greeting
 * - greeting → business (NEUTRAL_MIN tier) → business_details → greeting
 * - greeting → cole_threat (high heat) → (comply | refuse_job) → greeting
 * - greeting → cole_demand (critical heat) → comply_demand → greeting
 */
export const MARCUS_COLE_DIALOGUE = {
  greeting: {
    text: (rep, gameStateManager) => getGreetingText(rep, gameStateManager),
    choices: [
      {
        text: 'About my debt...',
        next: 'debt_talk',
      },
      {
        text: 'Any financial tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const heatTier = safeGetHeatTier(gameStateManager);
          if (heatTier !== 'low') return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'I wanted to discuss business opportunities.',
        next: 'business',
        condition: (rep, gameStateManager) => {
          if (rep < REPUTATION_BOUNDS.NEUTRAL_MIN) return false;
          const heatTier = safeGetHeatTier(gameStateManager);
          return heatTier === 'low' || heatTier === 'medium';
        },
      },
      {
        text: 'What kind of job?',
        next: 'cole_threat',
        condition: (_rep, gameStateManager) => {
          const heatTier = safeGetHeatTier(gameStateManager);
          return heatTier === 'high';
        },
      },
      {
        text: "I'm listening.",
        next: 'cole_demand',
        condition: (_rep, gameStateManager) => {
          const heatTier = safeGetHeatTier(gameStateManager);
          return heatTier === 'critical';
        },
      },
      {
        text: "Just checking in. I'll be going now.",
        next: null,
      },
    ],
  },

  debt_talk: {
    text: (rep, gameStateManager) => {
      const heatTier = safeGetHeatTier(gameStateManager);

      if (heatTier === 'critical') {
        return 'Your debt is no longer a topic of negotiation. It is a fact. And facts have consequences. The only question is whether those consequences work for you or against you.';
      }
      if (heatTier === 'high') {
        if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
          return 'Your balance grows while your payments stagnate. I have been more than fair. Do not mistake my composure for weakness.';
        }
        return 'Your balance grows. Your payments do not. I have been more than fair. Do not mistake my composure for weakness.';
      }
      if (heatTier === 'medium') {
        return 'The terms were clear when you signed. Interest accrues. Payments are expected. I suggest you prioritize accordingly.';
      }
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return 'Your account is current. The terms remain as agreed. Continue making regular payments and we shall have no difficulties.';
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Ten thousand credits. Plus interest. The terms were clear when you signed. I expect regular payments. Defaulting would be... inadvisable.';
      }
      return 'Your debt is substantial and your payment history is lacking. I advise you to make this a priority. I am not a patient man.';
    },
    choices: [
      {
        text: 'I need more time to pay.',
        next: 'payment_plan',
        repGain: -1,
        condition: (_rep, gameStateManager) => {
          const heatTier = safeGetHeatTier(gameStateManager);
          return heatTier !== 'critical';
        },
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
    text: (rep, gameStateManager) => {
      const heatTier = safeGetHeatTier(gameStateManager);

      if (heatTier === 'critical' || heatTier === 'high') {
        return 'Defiance. How refreshing. And how foolish. You seem to forget who holds the ledger. I could make one call and every station in the sector would freeze your accounts. Choose your next words very carefully.';
      }
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Threats? I deal in facts. Fact: you owe me money. Fact: I have resources you lack. Fact: cooperation serves us both better than confrontation. Consider your position carefully.';
      }
      return 'Threats? From you? I have ruined men with more credits and more connections than you will ever possess. Cooperation is your only viable option. Consider that carefully.';
    },
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

  cole_threat: {
    text: 'A delivery. Simple enough for someone of your... capabilities. A package needs to reach a specific destination within a specific timeframe. Complete it, and I reduce your debt. Refuse, and your situation becomes considerably less comfortable.',
    choices: [
      {
        text: "I'll take the job.",
        next: 'comply',
        repGain: 2,
      },
      {
        text: "I don't run errands for anyone.",
        next: 'refuse_job',
        repGain: -5,
      },
      {
        text: 'What are the details?',
        next: 'comply',
        repGain: 1,
      },
    ],
  },

  comply: {
    text: 'Good. Pragmatism suits you. Check your mission log for the details. Deliver on time and in full. No questions about the contents. No detours. We understand each other.',
    choices: [
      {
        text: 'Understood.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "You'll get your delivery.",
        next: null,
      },
    ],
  },

  refuse_job: {
    text: 'Refusing work from your creditor. Bold. Stupid, but bold. The offer stands. It will not improve with time. Neither will your account balance. Think carefully before I lose what little patience I have left.',
    choices: [
      {
        text: 'Fine. I will do it.',
        next: 'comply',
        repGain: 1,
      },
      {
        text: 'I said no.',
        next: null,
        repGain: -3,
      },
    ],
  },

  cole_demand: {
    text: 'This is not a request. This is not a negotiation. You have a package to deliver. You will deliver it. The destination and deadline are non-negotiable. Fail, and I start liquidating your assets. Beginning with your ship.',
    choices: [
      {
        text: 'I understand. I will handle it.',
        next: 'comply_demand',
        repGain: 1,
      },
      {
        text: 'You cannot take my ship.',
        next: 'comply_demand',
        repGain: -2,
      },
    ],
  },

  comply_demand: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'We have a history, you and I. That history is the only reason you still have options. Do not waste this chance. Check your mission log. Go.';
      }
      return 'I own your debt. I own your schedule. Until that balance reads zero, I own your priorities. Check your mission log. Now leave my office and get it done.';
    },
    choices: [
      {
        text: 'Consider it done.',
        next: null,
      },
    ],
  },
};
