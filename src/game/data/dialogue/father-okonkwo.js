/**
 * @fileoverview Father Okonkwo Dialogue Tree
 *
 * Station chaplain and medic who serves travelers' spiritual and physical needs.
 * Uses warm speech with educated vocabulary and religious metaphors.
 *
 * @module dialogue/father-okonkwo
 */

import { REPUTATION_BOUNDS } from '../../constants.js';

/**
 * Father Okonkwo Dialogue Tree - Chaplain at Ross 154
 *
 * Station chaplain and medic who serves travelers' spiritual and physical needs.
 * Uses warm speech with educated vocabulary and religious metaphors.
 *
 * Dialogue Flow:
 * - greeting → faith_talk → (agree | skeptical) → greeting
 * - greeting → help (WARM_MIN tier) → help_details → greeting
 */
export const FATHER_OKONKWO_DIALOGUE = {
  greeting: {
    text: (rep) => {
      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return 'My dear friend! Your presence brings light to this station. How may I serve you today? Are you well in body and spirit?';
      } else if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return "Welcome back, child. It does my heart good to see you safe. The void between stars can be lonely - you're always welcome here.";
      } else if (rep >= REPUTATION_BOUNDS.NEUTRAL_MIN) {
        return 'Peace be with you, traveler. You look weary from your journey. Please, rest a moment. How can I help you?';
      } else if (rep >= REPUTATION_BOUNDS.COLD_MIN) {
        return 'Even the lost are welcome in this place. Whatever burdens you carry, there is always hope for redemption.';
      } else {
        return 'I see pain in your eyes, child. This is a place of healing. Whatever darkness follows you, it cannot enter here.';
      }
    },
    choices: [
      {
        text: 'Tell me about your faith.',
        next: 'faith_talk',
      },
      {
        text: 'I could use some help.',
        next: 'help',
        condition: (rep) => rep >= REPUTATION_BOUNDS.WARM_MIN,
      },
      {
        text: 'Just passing through. Thank you.',
        next: null,
      },
    ],
  },

  faith_talk: {
    text: "Faith is like navigation, child. When you're lost in the dark between stars, you need something to guide you home. For some, it's instruments and charts. For others, it's the light within. Both can lead you safely to port.",
    choices: [
      {
        text: "That's a beautiful way to put it.",
        next: 'agree',
        repGain: 3,
      },
      {
        text: 'I prefer to rely on instruments.',
        next: 'skeptical',
        repGain: -1,
      },
      {
        text: "I'll think about that.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  agree: {
    text: 'You have wisdom, my friend. The universe is vast and full of wonders. Whether we find meaning in the dance of planets or the kindness of strangers, what matters is that we find it. Connection. Purpose. Love.',
    choices: [
      {
        text: 'Thank you for that perspective.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'You have a gift for words, Father.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  skeptical: {
    text: "And there's wisdom in that too, child. Good instruments save lives. But even the best navigation computer can't tell you why the journey matters. That's something each soul must discover for themselves.",
    choices: [
      {
        text: "Maybe you're right about that.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'I suppose we all find our own way.',
        next: 'greeting',
      },
    ],
  },

  help: {
    text: 'Of course, dear one. This station serves all who travel the void. Medical supplies, spiritual counsel, a safe harbor in the storm. What weighs on your heart?',
    choices: [
      {
        text: 'What kind of help do you offer?',
        next: 'help_details',
        repGain: 1,
      },
      {
        text: "Just knowing you're here helps.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },

  help_details: {
    text: 'Medical care for the body, guidance for the spirit, and sometimes just a listening ear. The void between stars is cold, but human kindness can warm even the darkest journey. You need never face your troubles alone.',
    flags: ['okonkwo_help_offered'],
    choices: [
      {
        text: 'That means more than you know.',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: "Thank you, Father. I'll remember that.",
        next: 'greeting',
        repGain: 2,
      },
    ],
  },
};
