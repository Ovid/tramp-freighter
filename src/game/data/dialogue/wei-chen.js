/**
 * @fileoverview Wei Chen Dialogue Tree
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * @module dialogue/wei-chen
 */

import { REPUTATION_BOUNDS } from '../../constants.js';
import {
  hasFactionRep,
  hasGoodKarma,
  hasBadKarma,
  isWantedByAuthorities,
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
} from './faction-karma-conditions.js';

/**
 * Wei Chen Dialogue Tree - Dock Worker at Barnard's Star
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * Dialogue Flow:
 * - greeting → small_talk → (boring_response | honest_work) → greeting
 * - greeting → backstory (FRIENDLY_MIN tier) → backstory_2 → greeting
 */
export const WEI_CHEN_DIALOGUE = {
  greeting: {
    text: (rep, gameStateManager, npcId) => {
      let baseText;
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        baseText = 'Hey there, friend! Good to see you again. Ship treating you well?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        baseText = "Oh, it's you. How's business? Ship holding together?";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        baseText = 'Another trader. Docking fees paid? Good. What you need?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        baseText = 'You again. Keep your business quick. Got work to do.';
      } else {
        baseText = "Don't want trouble. State your business and move along.";
      }

      // Add karma-based first impression for new or low-reputation encounters
      if (gameStateManager && rep < REPUTATION_BOUNDS.WARM_MIN) {
        const karma = gameStateManager.getKarma();
        const karmaModifier = getKarmaFirstImpression(karma, 'neutral');
        baseText += karmaModifier;
      }

      // Add faction attitude modifier if player has strong civilian reputation
      if (gameStateManager && hasFactionRep('civilians', 50, gameStateManager)) {
        baseText += getFactionAttitudeModifier('civilians', gameStateManager);
      }

      return baseText;
    },
    choices: [
      {
        text: "Just making conversation. How's work?",
        next: 'small_talk',
      },
      {
        text: 'Any dock worker tips for me?',
        next: 'ask_tip',
        condition: (rep, gameStateManager, npcId) => {
          // Check both reputation requirement and tip availability
          if (rep < REPUTATION_BOUNDS.WARM_MIN) return false;
          const tipAvailability = gameStateManager.canGetTip(npcId);
          return tipAvailability.available;
        },
      },
      {
        text: 'Tell me about yourself.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.FRIENDLY_MIN,
      },
      {
        text: 'I understand the risks of bad deals.',
        next: 'bad_deal_sympathy',
        condition: (rep, gameStateManager, npcId) => {
          // Only available if player has bad karma (suggesting they've made questionable choices)
          // and at least neutral reputation with Wei Chen
          return rep >= REPUTATION_BOUNDS.NEUTRAL_MIN && 
                 gameStateManager && hasBadKarma(gameStateManager);
        },
      },
      {
        text: 'Any advice for staying out of trouble with authorities?',
        next: 'authority_advice',
        condition: (rep, gameStateManager, npcId) => {
          // Only available if player is wanted by authorities and has warm+ reputation
          return rep >= REPUTATION_BOUNDS.WARM_MIN && 
                 gameStateManager && isWantedByAuthorities(gameStateManager);
        },
      },
      {
        text: 'I try to help people when I can.',
        next: 'good_karma_response',
        condition: (rep, gameStateManager, npcId) => {
          // Only available if player has good karma and neutral+ reputation
          return rep >= REPUTATION_BOUNDS.NEUTRAL_MIN && 
                 gameStateManager && hasGoodKarma(gameStateManager);
        },
      },
      {
        text: 'Nothing right now. Take care.',
        next: null,
      },
    ],
  },

  small_talk: {
    text: "Work's work. Docks don't run themselves. Ships come, ships go. Some captains know what they're doing, others... well, you learn to spot the difference.",
    choices: [
      {
        text: 'Sounds boring.',
        next: 'boring_response',
        repGain: -2,
      },
      {
        text: 'Honest work is good work.',
        next: 'honest_work',
        repGain: 3,
      },
      {
        text: 'I should let you get back to it.',
        next: 'greeting',
      },
    ],
  },

  boring_response: {
    text: "Boring? Maybe to you. But every ship that docks safe, every cargo load that gets where it's going... that matters. Not everything has to be exciting to be important.",
    choices: [
      {
        text: "You're right. I didn't mean to sound dismissive.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'If you say so.',
        next: 'greeting',
      },
    ],
  },

  honest_work: {
    text: "Exactly. Used to think excitement was everything. Adventure, risk, big scores... learned better. Steady work, steady pay, steady ground under your feet. That's worth something.",
    choices: [
      {
        text: "Sounds like there's a story there.",
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Wise words. Thanks for the chat.',
        next: 'greeting',
      },
    ],
  },

  backstory: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.TRUSTED_MIN) {
        return "Since you asked... used to captain my own ship. The 'Lucky Strike.' Thought I was smart, taking risks others wouldn't. One bad deal with the wrong people, and... well, now I work the docks. Ship's gone, crew scattered. But I'm still here.";
      } else {
        return "Had my own ship once. Made some bad choices, trusted wrong people. Lost everything. But that's ancient history now. Docks are good to me.";
      }
    },
    flags: ['chen_backstory_1'],
    choices: [
      {
        text: "I'm sorry that happened to you.",
        next: 'backstory_2',
        repGain: 3,
      },
      {
        text: 'What kind of bad deal?',
        next: 'backstory_2',
        repGain: 1,
      },
      {
        text: 'We all make mistakes.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  backstory_2: {
    text: "Appreciate that. Point is, learned my lesson. These days I help other captains avoid the same mistakes. See a lot of young hotshots come through here, think they know everything. Try to give them good advice when they'll listen.",
    flags: ['chen_backstory_2'],
    choices: [
      {
        text: 'Any advice for me?',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thanks for sharing that with me.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  ask_tip: {
    text: "Dock worker tip? Sure. Been working these docks for years - learned a few things about keeping cargo and ships safe. Here's something that might help you out there...",
    flags: ['chen_tip_requested'],
    choices: [
      {
        text: "That's really helpful. Thanks!",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good to know. I appreciate it.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  bad_deal_sympathy: {
    text: "Yeah... I can see it in your eyes. You've made some hard choices, haven't you? The sector doesn't always give you clean options. Sometimes you do what you have to do to survive. I get that.",
    flags: ['chen_bad_deal_sympathy'],
    choices: [
      {
        text: 'Exactly. Sometimes there are no good choices.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'I try to do better when I can.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Survival comes first.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  authority_advice: {
    text: "Authorities giving you trouble? Look, I've seen plenty of captains get sideways with the law. Best advice? Keep your head down, pay your fines, and don't give them more reasons to notice you. Time heals most grudges if you let it.",
    flags: ['chen_authority_advice'],
    choices: [
      {
        text: 'Good advice. I appreciate the warning.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Sometimes they make it hard to stay clean.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  good_karma_response: {
    text: "That's good to hear. Sector needs more people like that. Too many captains only look out for themselves. When you help others, word gets around. Makes a difference in how people see you.",
    flags: ['chen_good_karma_response'],
    choices: [
      {
        text: 'We all need to look out for each other.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: 'It feels like the right thing to do.',
        next: 'greeting',
        repGain: 2,
      },
    ],
  },
};
