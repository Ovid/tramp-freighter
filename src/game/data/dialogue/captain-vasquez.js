/**
 * @fileoverview Captain Vasquez Dialogue Tree
 *
 * Retired Trader at Epsilon Eridani - A retired freighter captain who serves as a mentor
 * figure for new traders. Uses warm speech with simple vocabulary and shares trading stories
 * from her experience. Provides valuable trading tips and hints about endgame content.
 *
 * @module dialogue/captain-vasquez
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../../constants.js';
import {
  hasGoodKarma,
  hasBadKarma,
  isFriendToCivilians,
  getKarmaFirstImpression,
} from './faction-karma-conditions.js';

/**
 * Captain Vasquez Dialogue Tree - Retired Trader at Epsilon Eridani
 *
 * Character Profile:
 * - Role: Retired Trader at Epsilon Eridani
 * - Personality: Mentor figure for new traders, warm and experienced
 * - Speech Style: Warm vocabulary, simple terms, shares trading stories
 * - Benefits: Valuable trading tips and hints about endgame content (Pavonis route)
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
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error(
          'Captain Vasquez dialogue: reputation must be a number'
        );
      }
      // Validate optional parameters when provided
      if (gameStateManager !== undefined && !gameStateManager) {
        throw new Error(
          'Captain Vasquez dialogue: gameStateManager cannot be null when provided'
        );
      }
      if (npcId !== undefined && !npcId) {
        throw new Error(
          'Captain Vasquez dialogue: npcId cannot be empty when provided'
        );
      }

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

      // Add karma-based commentary for established relationships
      if (gameStateManager && rep >= REPUTATION_BOUNDS.WARM_MIN) {
        if (hasGoodKarma(gameStateManager)) {
          baseText +=
            " I can see you're one of the good ones - the sector needs more traders like you.";
        } else if (hasBadKarma(gameStateManager)) {
          baseText +=
            " You've got a hard edge to you now. The sector can do that to people.";
        }
      }

      // Add karma-based first impression for new encounters
      if (gameStateManager && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karma = gameStateManager.getKarma();
        const karmaModifier = getKarmaFirstImpression(karma, 'lawful');
        baseText += karmaModifier;
      }

      // Add civilian faction appreciation
      if (
        gameStateManager &&
        isFriendToCivilians(gameStateManager) &&
        rep >= REPUTATION_BOUNDS.WARM_MIN
      ) {
        baseText +=
          " Word is you've been helping folks out there. That's the trader spirit I remember.";
      }
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
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and favor availability
          if (rep < REPUTATION_BOUNDS.FRIENDLY_MIN) return false;
          // Fall back to reputation-only check if gameStateManager not available (e.g., in tests)
          if (!gameStateManager || !gameStateManager.canRequestFavor)
            return true;
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
        condition: (_rep, gameStateManager, npcId) => {
          // Check if NPC has an outstanding loan
          const npcState = gameStateManager.getNPCState(npcId);
          return Boolean(npcState.loanAmount && npcState.loanAmount > 0);
        },
      },
      {
        text: 'I want to retrieve my stored cargo.',
        next: 'retrieve_cargo',
        condition: (_rep, gameStateManager, npcId) => {
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
      {
        text: 'I try to help people when I can.',
        next: 'good_karma_discussion',
        condition: (rep, gameStateManager) => {
          // Available if player has good karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            gameStateManager &&
            hasGoodKarma(gameStateManager)
          );
        },
      },
      {
        text: 'Sometimes you have to make hard choices out there.',
        next: 'bad_karma_discussion',
        condition: (rep, gameStateManager) => {
          // Available if player has bad karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            gameStateManager &&
            hasBadKarma(gameStateManager)
          );
        },
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

  good_karma_discussion: {
    text: "That's the spirit I like to hear! You know, back in my day, traders looked out for each other. We understood that helping others wasn't just good business - it was the right thing to do. The sector's a better place when people like you are out there.",
    flags: ['vasquez_good_karma_discussion'],
    choices: [
      {
        text: 'We all need to stick together.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'It just feels right to help when I can.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  bad_karma_discussion: {
    text: "I can see the weight in your eyes, captain. The sector can be cruel, and sometimes it forces us into corners we never wanted to be in. I've seen good traders make bad choices just to survive. The important thing is remembering who you want to be.",
    flags: ['vasquez_bad_karma_discussion'],
    choices: [
      {
        text: 'I do what I have to do to survive.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: "I want to do better, but it's not always easy.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Sometimes there are no good choices.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },
};
