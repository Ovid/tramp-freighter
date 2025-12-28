/**
 * @fileoverview Zara Osman Dialogue Tree
 * 
 * A sharp trader with connections across the sector who is competitive but fair.
 * Uses casual speech with slang vocabulary and trading jargon quirks.
 * Provides market-focused tips and trading expertise based on relationship tier.
 * 
 * @module dialogue/zara-osman
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';

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