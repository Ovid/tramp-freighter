/**
 * @fileoverview Whisper Dialogue Tree
 * 
 * A mysterious information broker who deals in secrets and intelligence.
 * Uses formal speech with educated vocabulary and cryptic measured tones.
 * Provides intel discounts and trading tips based on relationship tier.
 * 
 * @module dialogue/whisper
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';

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