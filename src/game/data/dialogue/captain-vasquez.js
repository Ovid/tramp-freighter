/**
 * Captain Vasquez Dialogue Tree
 * Retired Trader at Epsilon Eridani - mentor figure for new traders.
 * @module dialogue/captain-vasquez
 */

import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  ENDGAME_CONFIG,
  TANAKA_SUPPLY_CONFIG,
} from '../../constants.js';
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
    text: (rep, context) => {
      // Validate required parameters
      if (typeof rep !== 'number') {
        throw new Error(
          'Captain Vasquez dialogue: reputation must be a number'
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
      if (context && rep >= REPUTATION_BOUNDS.WARM_MIN) {
        if (hasGoodKarma(context)) {
          baseText +=
            " I can see you're one of the good ones - the sector needs more traders like you.";
        } else if (hasBadKarma(context)) {
          baseText +=
            " You've got a hard edge to you now. The sector can do that to people.";
        }
      }

      // Add karma-based first impression for new encounters
      if (context && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karmaModifier = getKarmaFirstImpression(context.karma, 'lawful');
        baseText += karmaModifier;
      }

      // Add civilian faction appreciation
      if (
        context &&
        isFriendToCivilians(context) &&
        rep >= REPUTATION_BOUNDS.WARM_MIN
      ) {
        baseText +=
          " Word is you've been helping folks out there. That's the trader spirit I remember.";
      }
      if (context && context.npcState) {
        const npcState = context.npcState;
        if (npcState.loanAmount && npcState.loanAmount > 0) {
          const daysElapsed = context.daysElapsed - npcState.loanDay;
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
        condition: (rep, context) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          return context.canGetTip.available;
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
          // Fall back to reputation-only check if context not available (e.g., in tests)
          if (!context || !context.canRequestStorage) return true;
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
        text: '"I have a message from Yuki Tanaka."',
        next: 'tanaka_message',
        condition: (_rep, context) =>
          context?.getQuestStage?.('tanaka') === 4 &&
          !context?.getQuestState?.('tanaka')?.data?.messageDelivered,
        action: (context) => {
          context.updateQuestData('tanaka', 'messageDelivered', 1);
          return { success: true, message: 'Message delivered.' };
        },
      },
      {
        text: '"I cleared my debt. What now?"',
        next: 'debt_cleared_tanaka_hint',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return context?.debt === 0 && context?.getQuestStage?.('tanaka') === 0;
        },
      },
      {
        text: '"I\'m still pretty green out here."',
        next: 'explore_more',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context.systemsVisited <
            ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
          );
        },
      },
      {
        text: '"Know anyone interesting at Barnard\'s?"',
        next: 'barnards_engineer',
        condition: (_rep, context) => {
          if (!context || context.narrativeFlags?.tanaka_met) return false;
          return (
            context.systemsVisited >=
            ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED
          );
        },
      },
      {
        text: '"I met that engineer at Barnard\'s. She barely talked to me."',
        next: 'tanaka_advice',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          return context.getQuestStage('tanaka') === 0;
        },
      },
      {
        text: '"Any advice on building trust with Tanaka?"',
        next: 'tanaka_patience',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          const stage = context.getQuestStage('tanaka');
          if (stage < 1 || stage >= 4) return false;
          const nextStage = stage + 1;
          return !context.canStartQuestStage('tanaka', nextStage);
        },
      },
      {
        text: '"Tanaka says she\'s ready when I am."',
        next: 'pavonis_prep',
        condition: (_rep, context) => {
          if (!context || !context.narrativeFlags?.tanaka_met) return false;
          const stage = context.getQuestStage('tanaka');
          if (stage !== 4) return false;
          if (!context.hasClaimedStageRewards?.('tanaka')) return false;
          return !context.canStartQuestStage('tanaka', 5);
        },
      },
      {
        text: 'Just checking in. Take care, Captain.',
        next: null,
      },
      {
        text: 'I try to help people when I can.',
        next: 'good_karma_discussion',
        condition: (rep, context) => {
          // Available if player has good karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN &&
            context &&
            hasGoodKarma(context)
          );
        },
      },
      {
        text: 'Sometimes you have to make hard choices out there.',
        next: 'bad_karma_discussion',
        condition: (rep, context) => {
          // Available if player has bad karma and warm+ reputation
          return (
            rep >= REPUTATION_BOUNDS.WARM_MIN && context && hasBadKarma(context)
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
    text: "Cargo storage? Of course! I've got secure space here at the hub. Up to ten units, safe and sound until you return. Consider it a favor between traders - we look out for each other in this business.",
    flags: ['vasquez_storage_discussed'],
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
    text: "Retrieve your cargo? Of course! *checks storage logs* I've got your items safe and sound. Let me get them transferred back to your ship. If your hold's getting full, just let me know - we can work something out.",
    flags: ['vasquez_cargo_retrieved'],
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

  tanaka_message: {
    text: 'Vasquez reads the message slowly. Their expression changes — something between sadness and understanding. "I knew Tanaka back then. Before her sister left. Tell her... tell her I\'m glad she never gave up."',
    choices: [{ text: 'Nod and take your leave.', next: null }],
  },

  explore_more: {
    text: '"You\'re still green. Get a few more systems under your belt — see how the network flows. There are interesting people out there, but they want to see you\'ve earned your stripes first."',
    choices: [
      {
        text: '"Any systems you\'d recommend?"',
        next: 'route_advice',
        repGain: 1,
      },
      {
        text: '"I\'ll get out there."',
        next: 'greeting',
      },
    ],
  },

  barnards_engineer: {
    text: "\"Your ship's got a Tanaka Mark III drive, doesn't it? Heard the designer's daughter works at Barnard's. Engineer named Tanaka — does something with drive modifications.\" He leans in. \"Engineers like that don't grow on trees. Worth introducing yourself.\"",
    choices: [
      {
        text: "\"I'll look her up next time I'm at Barnard's.\"",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"Thanks for the tip, Captain."',
        next: 'greeting',
      },
    ],
  },

  debt_cleared_tanaka_hint: {
    text: "You cleared your debt? That's no small thing out here. Listen, there's someone you should meet. Engineer named Tanaka at Barnard's Star. She's been working on an experimental jump drive — needs a pilot she can trust. With your slate clean, you're exactly the kind of person she's looking for.",
    flags: ['vasquez_tanaka_hint_given'],
    choices: [
      {
        text: '"Sounds interesting. I\'ll check it out."',
        next: null,
        repGain: 1,
      },
      {
        text: '"Why do you think she\'d want my help?"',
        next: 'tanaka_recommendation',
      },
      {
        text: '"Thanks, Captain. I\'ll think about it."',
        next: null,
      },
    ],
  },

  tanaka_recommendation: {
    text: "Because I've been watching you fly. You show up, you deliver, you treat people right. That matters more than credentials out here. Tanaka doesn't trust easily, but if you bring her what she needs — electronics, medicine — she'll warm up. Just be patient.",
    choices: [
      {
        text: '"I appreciate the vote of confidence."',
        next: null,
        repGain: 2,
      },
      {
        text: '"I\'ll head to Barnard\'s when I can."',
        next: null,
        repGain: 1,
      },
    ],
  },

  tanaka_advice: {
    text: `"Tanaka? Yeah, she doesn't hand out trust for free. Bring her research supplies — electronics or medicine. ${TANAKA_SUPPLY_CONFIG.QUANTITY} units at a time." He taps the bar. "Show up consistently. She'll come around when she sees you're serious."`,
    choices: [
      {
        text: '"That\'s helpful. Thanks, Captain."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"I\'ll keep bringing her supplies."',
        next: 'greeting',
      },
    ],
  },

  tanaka_patience: {
    text: '"Building trust with someone like Tanaka takes time. Keep showing up, keep helping with her research. Bring supplies when you can — electronics, medicine. That\'s how it works with the stubborn ones."',
    choices: [
      {
        text: '"Patience isn\'t my strong suit, but I hear you."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"I\'ll keep at it."',
        next: 'greeting',
      },
    ],
  },

  pavonis_prep: {
    text: '"She\'s ready when you are. But a run like that — you\'ll need your ship in top shape. Hull solid, engine running near perfect, enough credits for fuel and supplies, and no debts hanging over you. Get your house in order first."',
    choices: [
      {
        text: '"I\'ll make sure everything\'s squared away."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"How much credits are we talking?"',
        next: 'pavonis_prep_credits',
      },
    ],
  },

  pavonis_prep_credits: {
    text: '"Twenty-five thousand, at least. That\'s fuel, supplies, and margin for the unexpected. Plus your ship needs to be debt-free. No lender\'s going to let you fly off into the void owing them money."',
    choices: [
      {
        text: '"That\'s a lot. I\'d better get trading."',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"Got it. Thanks, Captain."',
        next: 'greeting',
      },
    ],
  },
};
