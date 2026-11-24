/**
 * @fileoverview Station Master Kowalski Dialogue Tree
 *
 * A veteran station master who has seen everything and respects competence above all.
 * Uses gruff speech with simple vocabulary and no-nonsense direct communication.
 * Provides station operation tips and docking-related benefits based on relationship tier.
 *
 * @module dialogue/station-master-kowalski
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';
import { buildStorageDialogue } from './storage-dialogue.js';

const STORAGE = buildStorageDialogue({
  requestText: `Cargo storage? We maintain secure storage for established traders. Up to ${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT} units in our bonded warehouse. Professional service for professional traders. Standard security protocols apply.`,
  requestFlag: 'kowalski_storage_discussed',
  storeConfirmText: 'That would be very helpful.',
  storeDeclineText: 'I appreciate the professional service.',
  retrieveText:
    'Cargo retrieval request processed. *accesses station inventory* Your items are secured in bonded storage per standard protocols. Initiating transfer to your vessel. Note that transfer capacity is limited by your current cargo hold status.',
  retrieveFlag: 'kowalski_cargo_retrieved',
  retrieveDeclineText: 'Let me make room in my hold first.',
});

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
 * - greeting → request_storage → picker → greeting (storage via buildStorageDialogue)
 */
export const STATION_MASTER_KOWALSKI_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
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

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText += `\n\n*Your loan of ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits is overdue, captain. Station policy requires immediate repayment.*`;
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*Reminder: Your loan of ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits is due in ${daysRemaining} days. Station policy - no extensions.*`;
          } else {
            baseText += `\n\n*Outstanding loan: ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits, ${daysRemaining} days remaining per station policy.*`;
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
        condition: (rep, context) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          return context.canGetTip.available;
        },
      },
      {
        text: 'I need an emergency loan.',
        next: 'request_loan',
        condition: (rep, context) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.TRUSTED_MIN) return false;
          return context.canRequestLoan.available;
        },
      },
      STORAGE.storeGreetingChoice,
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (_rep, context) => {
          // Check if NPC has an outstanding loan
          const npcState = context.npcState;
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      STORAGE.retrieveGreetingChoice,
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
    text: `Emergency loan? ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits... *checks records* Your operational record shows competence and reliability. I can authorize the advance, but I expect repayment within ${NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE} days. Station policy - no exceptions.`,
    flags: ['kowalski_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: 'Let me consider the terms first.',
        next: 'greeting',
      },
    ],
  },

  repay_loan: {
    text: `Loan repayment acknowledged. *checks station records* ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits, as agreed. Your prompt attention to financial obligations is noted. Professional conduct like this keeps the station running smoothly.`,
    flags: ['kowalski_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thank you for the loan.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
        },
      },
      {
        text: 'I need more time to gather the full amount.',
        next: 'greeting',
      },
    ],
  },

  ...STORAGE.nodes,
};
