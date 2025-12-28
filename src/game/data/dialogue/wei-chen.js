/**
 * @fileoverview Wei Chen Dialogue Tree
 *
 * A former ship captain who lost her ship in a bad deal. Cautiously optimistic
 * but slow to trust. Uses casual speech with simple vocabulary and drops articles.
 *
 * @module dialogue/wei-chen
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

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
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'Hey there, friend! Good to see you again. Ship treating you well?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Oh, it's you. How's business? Ship holding together?";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Another trader. Docking fees paid? Good. What you need?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'You again. Keep your business quick. Got work to do.';
      } else {
        return "Don't want trouble. State your business and move along.";
      }
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
};
