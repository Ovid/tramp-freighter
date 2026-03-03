/**
 * @fileoverview Lucky Liu Dialogue Tree
 *
 * A professional gambler and risk-taker who loves long odds and respects bold moves.
 * Uses casual speech with slang vocabulary and gambling metaphors throughout conversation.
 * Provides risk-taking tips and high-stakes opportunities based on relationship tier.
 *
 * @module dialogue/lucky-liu
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COLE_DEBT_CONFIG,
} from '../../constants.js';

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
    text: (rep, context) => {
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

      // Add loan status if there's an outstanding loan (only if context provided)
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
          const daysRemaining =
            NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - daysElapsed;

          if (daysRemaining <= 0) {
            baseText += `\n\n*About that stake I fronted you - ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits, and the house always collects. Time to settle up, sport.*`;
          } else if (daysRemaining <= COLE_DEBT_CONFIG.LOAN_REMINDER_DAYS) {
            baseText += `\n\n*Quick reminder about your stake - ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits due in ${daysRemaining} days. Don't let it ride too long, yeah?*`;
          } else {
            baseText += `\n\n*Oh, and you still owe me ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits from that stake - ${daysRemaining} days left on the clock.*`;
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
    text: `Emergency loan? *leans back in chair* ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits... Now that's interesting. Most people come to me for stakes, not loans. But I like your style - sometimes you gotta double down when you're short on chips. ${NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE} days to pay it back, standard terms. You in?`,
    flags: ['liu_loan_discussed'],
    choices: [
      {
        text: 'Deal. I appreciate the stake, Lucky.',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.requestLoan();
        },
      },
      {
        text: 'Let me think about those odds first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: `Cargo storage? Sure thing, sport. I got secure space in the back - up to ${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT} units, safe from sticky fingers and prying eyes. Consider it a favor between players. Sometimes you gotta stash your winnings before the next big game, right?`,
    flags: ['liu_storage_discussed'],
    choices: [
      {
        text: 'That would really help my game.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.storeCargo();
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
    text: `Loan repayment? *grins and checks his ledger* ${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} credits, right on schedule. I like a player who knows when to cash out and settle their debts. Shows you understand the game - it's not just about the big wins, it's about staying in action.`,
    flags: ['liu_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits. Thanks for the stake.',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.repayLoan();
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
