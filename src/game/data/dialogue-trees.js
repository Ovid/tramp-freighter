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

// Import individual dialogue trees for use in ALL_DIALOGUE_TREES
import { WEI_CHEN_DIALOGUE } from './dialogue/wei-chen.js';
import { MARCUS_COLE_DIALOGUE } from './dialogue/marcus-cole.js';
import { FATHER_OKONKWO_DIALOGUE } from './dialogue/father-okonkwo.js';
import { WHISPER_DIALOGUE } from './dialogue/whisper.js';
import { CAPTAIN_VASQUEZ_DIALOGUE } from './dialogue/captain-vasquez.js';
import { DR_SARAH_KIM_DIALOGUE } from './dialogue/dr-sarah-kim.js';
import { RUSTY_RODRIGUEZ_DIALOGUE } from './dialogue/rusty-rodriguez.js';
import { ZARA_OSMAN_DIALOGUE } from './dialogue/zara-osman.js';

// Re-export individual dialogue trees
export { WEI_CHEN_DIALOGUE } from './dialogue/wei-chen.js';
export { MARCUS_COLE_DIALOGUE } from './dialogue/marcus-cole.js';
export { FATHER_OKONKWO_DIALOGUE } from './dialogue/father-okonkwo.js';
export { WHISPER_DIALOGUE } from './dialogue/whisper.js';
export { CAPTAIN_VASQUEZ_DIALOGUE } from './dialogue/captain-vasquez.js';
export { DR_SARAH_KIM_DIALOGUE } from './dialogue/dr-sarah-kim.js';
export { RUSTY_RODRIGUEZ_DIALOGUE } from './dialogue/rusty-rodriguez.js';
export { ZARA_OSMAN_DIALOGUE } from './dialogue/zara-osman.js';

/**
 * "Rusty" Rodriguez Dialogue Tree - Mechanic at Procyon
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
