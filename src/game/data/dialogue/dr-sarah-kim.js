/**
 * @fileoverview Dr. Sarah Kim Dialogue Tree
 *
 * Station Administrator at Tau Ceti - An efficient administrator who values professionalism
 * and proper procedures. Uses formal speech with technical vocabulary and frequently cites
 * regulations. Provides operational tips and docking-related benefits based on relationship tier.
 *
 * @module dialogue/dr-sarah-kim
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';

/**
 * Dr. Sarah Kim Dialogue Tree - Station Administrator at Tau Ceti
 *
 * Character Profile:
 * - Role: Station Administrator at Tau Ceti
 * - Personality: Efficient, values professionalism and proper procedures
 * - Speech Style: Formal vocabulary, technical terms, frequently cites regulations
 * - Benefits: Operational tips and docking-related services based on relationship tier
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
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error('Dr. Sarah Kim dialogue: reputation must be a number');
      }
      // Validate optional parameters when provided
      if (gameStateManager !== undefined && !gameStateManager) {
        throw new Error(
          'Dr. Sarah Kim dialogue: gameStateManager cannot be null when provided'
        );
      }
      if (npcId !== undefined && !npcId) {
        throw new Error(
          'Dr. Sarah Kim dialogue: npcId cannot be empty when provided'
        );
      }

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

      // Add loan status if there's an outstanding loan (when game state is available)
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
