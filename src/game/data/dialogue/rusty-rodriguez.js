/**
 * @fileoverview "Rusty" Rodriguez Dialogue Tree
 *
 * A gruff but skilled mechanic who loves ships more than people. Uses technical
 * vocabulary with ship personification quirks and provides repair-focused tips.
 * Offers repair service discounts based on relationship tier.
 *
 * @module dialogue/rusty-rodriguez
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';

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
    text: (rep, context) => {
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

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
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
      {
        text: 'Can you store some cargo for me?',
        next: 'request_storage',
        condition: (rep, context) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          return context.canRequestStorage.available;
        },
      },
      {
        text: 'I want to repay my loan.',
        next: 'repay_loan',
        condition: (_rep, context) => {
          // Check if NPC has an outstanding loan
          const npcState = context.npcState;
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (_rep, context) => {
          // Check if NPC has stored cargo
          const npcState = context.npcState;
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
        action: (context) => {
          return context.requestLoan();
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
        action: (context) => {
          return context.storeCargo();
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
        action: (context) => {
          return context.repayLoan();
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
        action: (context) => {
          return context.retrieveCargo();
        },
      },
      {
        text: 'Let me make some room first.',
        next: 'greeting',
      },
    ],
  },
};
