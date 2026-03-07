/**
 * @fileoverview Yumi Tanaka Post-Credits Dialogue Tree
 *
 * Fourth-wall-breaking comedy dialogue for the post-credits scene.
 * Three rounds of escalating exasperation, then a loop.
 * Tracks rounds via context.npcState.interactions.
 *
 * @module dialogue/yumi-tanaka
 */

const advanceRound = (context) => {
  context.npcState.interactions++;
  return { success: true };
};

export const YUMI_TANAKA_POSTCREDITS_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      const round = context.npcState.interactions;
      if (round === 0) {
        return '"You\'re still here? The credits rolled. The story\'s over. What exactly are you expecting?"';
      }
      if (round === 1) {
        return '"Oh, you\'re back. Most people take the hint when the credits roll. You\'re not most people, apparently."';
      }
      if (round === 2) {
        return '"Seriously? What are you still doing here? Do you just... live in menus? Is that your thing?"';
      }
      return '"You again. I\'m starting to think you don\'t have anywhere else to be. ...I mean, you literally don\'t. The game is over."';
    },
    choices: [
      // Round 1 choices
      {
        text: '"I came all this way to find you."',
        next: 'r1_find',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"Is there a secret ending?"',
        next: 'r1_secret',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      {
        text: '"What\'s Delta Pavonis like?"',
        next: 'r1_colony',
        condition: (rep, context) => context.npcState.interactions === 0,
      },
      // Round 2 choices
      {
        text: '"Your sister talks about you a lot."',
        next: 'r2_sister',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"So what do you actually do here?"',
        next: 'r2_job',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      {
        text: '"Any advice for a freighter captain?"',
        next: 'r2_advice',
        condition: (rep, context) => context.npcState.interactions === 1,
      },
      // Round 3 choices
      {
        text: '"I like it here."',
        next: 'r3_like',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"Tell me about the Meridian voyage."',
        next: 'r3_meridian',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      {
        text: '"Will I ever see Tanaka again?"',
        next: 'r3_tanaka',
        condition: (rep, context) => context.npcState.interactions === 2,
      },
      // Goodbye (always available, no condition)
      {
        text: '"Goodbye."',
        next: null,
        action: advanceRound,
      },
    ],
  },

  // Round 1 responses
  r1_find: {
    text: '"That\'s sweet. Really. But I\'ve been here for ten years. I wasn\'t lost. Yuki just worries."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r1_secret: {
    text: '"This isn\'t that kind of game. There\'s no hidden boss. No post-credits sequel hook. Just me and a lot of paperwork."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r1_colony: {
    text: '"Dusty. Underfunded. The food is terrible. But we built it ourselves, so we pretend to like it."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },

  // Round 2 responses
  r2_sister: {
    text: '"Let me guess \u2014 she described me as \'driven but emotionally unavailable.\' That\'s engineer for \'I miss you.\'"',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r2_job: {
    text: '"I run a colony of three thousand people on a planet that actively tries to kill us every Tuesday. It\'s like project management, but with more radiation."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r2_advice: {
    text: '"Yeah. When the credits roll, leave. That\'s advice for life, really."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },

  // Round 3 responses
  r3_like: {
    text: '"There is literally nothing here. I\'m an NPC in a post-credits scene. My entire existence is this conversation. Go outside."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r3_meridian: {
    text: '"Ten years on a colony ship. You know what the entertainment was? A database of 20th-century films and a man named Doug who knew card tricks. I have seen every card trick, Captain."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
  r3_tanaka: {
    text: '"She\'s on your ship, genius. ...Wait, does she not come with you after\u2014? Ugh, I\'ll talk to the developers."',
    choices: [
      { text: '"Goodbye."', next: null, action: advanceRound },
    ],
  },
};
