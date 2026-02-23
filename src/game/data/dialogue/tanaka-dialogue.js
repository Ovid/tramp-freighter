import { REPUTATION_BOUNDS, ENDGAME_CONFIG } from '../../constants.js';

export const YUKI_TANAKA_DIALOGUE = {
  greeting: {
    text: (rep, context) => {
      if (!context) {
        return 'Tanaka nods in your direction.';
      }

      const stage = context.getQuestStage('tanaka');

      if (stage >= 5) {
        return '"Everything is in place. The Range Extender is calibrated. Your ship is ready." She meets your eyes. "Are you?"';
      }
      if (stage === 4) {
        const delivered =
          context.getQuestState('tanaka')?.data?.messageDelivered;
        if (delivered) {
          return '"You delivered the message. Thank you." Her voice is steady, but her eyes say more. "When you are ready for the final preparations, we should talk."';
        }
        return '"There is something personal I need to ask of you. A message that needs delivering."';
      }
      if (stage === 3) {
        return '"The prototype integration is complete. Your ship performed admirably." She pauses. "I have one more request. A personal one."';
      }
      if (stage === 2) {
        const exotics =
          context.getQuestState('tanaka')?.data?.exoticMaterials || 0;
        if (exotics >= ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED) {
          return `"You found all ${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED} samples. Excellent work." She examines them carefully. "The isotope ratios are perfect. We can proceed."`;
        }
        return `"The exotic materials search continues. You have ${exotics} of ${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED} samples so far." She checks her instruments. "Keep searching stations beyond ${ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE} light-years from Sol."`;
      }
      if (stage === 1) {
        const jumps =
          context.getQuestState('tanaka')?.data?.jumpsCompleted || 0;
        if (jumps >= ENDGAME_CONFIG.STAGE_1_JUMPS) {
          return '"The field test data looks excellent. The drive modifications are performing within expected parameters." She actually smiles. "I have another task for you."';
        }
        return `"The field test is in progress. ${ENDGAME_CONFIG.STAGE_1_JUMPS - jumps} more jumps needed to calibrate the drive harmonics." She studies her readouts intently.`;
      }

      if (rep >= REPUTATION_BOUNDS.FRIENDLY_MIN) {
        return '"Captain." A brief nod. "I appreciate your continued visits. There is much work to be done."';
      }
      if (rep >= REPUTATION_BOUNDS.WARM_MIN) {
        return '"Your ship interests me. The Tanaka Mark III drive is one of my better designs." She studies you. "Perhaps we can help each other."';
      }
      return '"Tanaka. Engineer." She extends a hand, then withdraws it. "I have work to do. Unless you have business?"';
    },

    choices: [
      {
        text: '"I\'m ready for the Pavonis Run."',
        next: 'pavonis_ready',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 5 &&
          context.canStartQuestStage('tanaka', 5),
      },
      {
        text: '"Tell me about the final preparations."',
        next: 'mission_5_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 4 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 5),
      },
      {
        text: '"I delivered the message to Vasquez."',
        next: 'mission_4_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 4 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"About that personal request..."',
        next: 'mission_4_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 3 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 4),
      },
      {
        text: '"The prototype test went well."',
        next: 'mission_3_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 3 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"I\'m ready for the prototype installation."',
        next: 'mission_3_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 2 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 3),
      },
      {
        text: '"I have all five exotic material samples."',
        next: 'mission_2_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 2 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"I can help you find those rare materials."',
        next: 'mission_2_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 1 &&
          context.hasClaimedStageRewards('tanaka') &&
          context.canStartQuestStage('tanaka', 2),
      },
      {
        text: '"The field test is complete."',
        next: 'mission_1_complete',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 1 &&
          context.checkQuestObjectives('tanaka') &&
          !context.hasClaimedStageRewards('tanaka'),
      },
      {
        text: '"You mentioned needing a field test?"',
        next: 'mission_1_offer',
        condition: (_rep, context) =>
          context &&
          context.getQuestStage('tanaka') === 0 &&
          context.canStartQuestStage('tanaka', 1),
      },
      {
        text: '"I brought supplies for your research."',
        next: 'research_supply',
        condition: (_rep, context) =>
          context && typeof context.canContributeSupply === 'function' && context.canContributeSupply(),
      },
      {
        text: 'Tell me about your work.',
        next: 'about_work',
      },
      {
        text: 'Tell me about yourself.',
        next: 'backstory',
        condition: (rep) => rep >= REPUTATION_BOUNDS.TRUSTED_MIN,
      },
      {
        text: 'Good to see you. Take care.',
        next: null,
      },
    ],
  },

  about_work: {
    text: '"I design drive systems. My father created the original Tanaka Drive — the one in your ship. I\'ve been working on improvements. Specifically, a Range Extender that could push a ship beyond the wormhole network." She pauses. "Much further."',
    choices: [
      {
        text: '"How much further?"',
        next: 'range_extender',
        repGain: 1,
      },
      {
        text: '"Sounds ambitious."',
        next: 'greeting',
      },
    ],
  },

  range_extender: {
    text: '"Delta Pavonis. Twenty-seven point eight-eight light-years from Sol. No wormhole connection. No one has ever made the jump." Her eyes light up — the only sign of emotion you\'ve seen from her. "One jump. One way. The Range Extender makes it possible."',
    choices: [
      {
        text: '"Why Delta Pavonis?"',
        next: 'why_pavonis',
        repGain: 2,
      },
      {
        text: '"One way? That\'s a big commitment."',
        next: 'one_way',
      },
      {
        text: '"Interesting. I should get going."',
        next: null,
      },
    ],
  },

  why_pavonis: {
    text: '"Data suggests habitable conditions. But more than that — my sister went there. On the colony ship Meridian, ten years ago. One-way trip." She looks away. "I want to find her."',
    choices: [
      {
        text: '"I hope you find her."',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '"That\'s a long time. She might not—"',
        next: 'might_not',
        repGain: -1,
      },
    ],
  },

  might_not: {
    text: '"I am aware of the probabilities." Her voice is ice. "I have calculated them extensively. Do not presume to lecture me on what I already know."',
    choices: [
      {
        text: '"I\'m sorry. I didn\'t mean to—"',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: '"Fair enough."',
        next: null,
      },
    ],
  },

  one_way: {
    text: '"Yes. The Range Extender is single-use. The energy requirements for a 27-light-year jump are... considerable. There is no return unless Delta Pavonis has wormhole infrastructure." She shrugs. "It probably does not."',
    choices: [
      {
        text: '"And you\'d make that jump?"',
        next: 'why_pavonis',
        repGain: 1,
      },
      {
        text: '"Good luck with that."',
        next: null,
      },
    ],
  },

  backstory: {
    text: '"My father was Kenji Tanaka. He invented the drive that bears our name. Died in a test flight when I was twelve." She speaks without sentiment. "I continued his work. Improved the efficiency by thirty-two percent. But the Range Extender is my own design."',
    flags: ['tanaka_backstory'],
    choices: [
      {
        text: '"He\'d be proud of you."',
        next: 'proud',
        repGain: 3,
      },
      {
        text: '"What happened to your sister?"',
        next: 'sister',
        repGain: 2,
      },
      {
        text: '"I see. Thank you for telling me."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  proud: {
    text: 'She is quiet for a long moment. "Perhaps. He valued results over sentiment. I do the same." But there is something in her expression that suggests otherwise.',
    choices: [
      {
        text: '"Results matter. But so do people."',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: '"I understand."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  sister: {
    text: '"Yumi. Three years older. Brilliant biologist. She signed up for the Meridian colony mission without telling anyone. Left a note." Tanaka\'s jaw tightens. "I have not spoken to her in ten years. The Meridian has no communication relay back to Sol."',
    choices: [
      {
        text: '"That\'s why you want to reach Delta Pavonis."',
        next: 'greeting',
        repGain: 3,
      },
      {
        text: '"I\'m sorry."',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  mission_1_offer: {
    text: '"I need someone to field-test my latest drive calibration. Three jumps with the modified firmware. Your ship, your route. I just need the telemetry data." She holds up a data chip. "Compensation: one thousand credits and a full engine restoration."',
    choices: [
      {
        text: '"I\'ll do it. Three jumps, telemetry data."',
        next: 'mission_1_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"Not right now. Maybe later."',
        next: 'greeting',
      },
    ],
  },

  mission_1_accepted: {
    text: '"Good. The firmware is already uploading. Just fly your normal routes — the chip will record everything automatically." She turns back to her workstation. "Three jumps. Then come back."',
    choices: [
      {
        text: '"Consider it done."',
        next: null,
      },
    ],
  },

  mission_1_complete: {
    text: '"Excellent data. The harmonic oscillations are within two percent of predicted values." She downloads the telemetry and transfers your payment. "Your engine has been fully restored as promised."',
    choices: [
      {
        text: '"What\'s next?"',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"Pleasure doing business."',
        next: null,
        repGain: 1,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_2_offer: {
    text: '"The Range Extender requires exotic matter — specific isotopes found only at stations beyond fifteen light-years from Sol. I need five samples." She hands you a scanner module. "The materials appear randomly in station markets. This scanner will identify them."',
    choices: [
      {
        text: '"I\'ll keep my eyes open on my travels."',
        next: 'mission_2_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"That sounds like a lot of searching."',
        next: 'greeting',
      },
    ],
  },

  mission_2_accepted: {
    text: '"The scanner integrates with your ship\'s sensors. When you dock at distant stations, it will alert you to any viable samples." She pauses. "Payment upon completion: three thousand credits and an advanced sensor upgrade."',
    choices: [
      {
        text: '"I\'ll find them."',
        next: null,
      },
    ],
  },

  mission_2_complete: {
    text: '"All five samples. The isotope signatures are..." She checks each one carefully. "Perfect. These will form the core of the Range Extender\'s reaction mass." She installs the sensor upgrade on your ship. "You have earned this."',
    choices: [
      {
        text: '"What comes next?"',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_3_offer: {
    text: '"The prototype Range Extender is ready for installation. Your ship needs to be in good condition — hull at seventy percent minimum, engine at eighty." She looks at your ship appraisingly. "I will install it myself. Then we test."',
    choices: [
      {
        text: '"Install it. Let\'s see what this drive can do."',
        next: 'mission_3_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"I need to get my ship in better shape first."',
        next: 'greeting',
      },
    ],
  },

  mission_3_accepted: {
    text: '"Installation complete. The Range Extender sits dormant until activation — it will not interfere with normal operations." She wipes her hands. "Take a test flight. Come back and we will verify the readings."',
    choices: [
      {
        text: '"Thank you, Tanaka."',
        next: null,
        repGain: 2,
      },
    ],
  },

  mission_3_complete: {
    text: '"All readings nominal. The prototype is stable." She transfers your payment and looks at you differently now — with something approaching trust. "There is something else I need. Something personal."',
    choices: [
      {
        text: '"Name it."',
        next: 'greeting',
        repGain: 2,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"I\'ll hear you out."',
        next: 'greeting',
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_4_offer: {
    text: '"Captain Vasquez at Epsilon Eridani knew my sister. They served together, years ago." She hesitates — the first time you have seen her uncertain. "I wrote a message. For Yumi. In case... in case she is there when we arrive. Would you deliver it to Vasquez? They will know what to do with it."',
    choices: [
      {
        text: '"Of course. I\'ll deliver it personally."',
        next: 'mission_4_accepted',
        repGain: 5,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"I\'ll take care of it."',
        next: 'mission_4_accepted',
        repGain: 3,
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
    ],
  },

  mission_4_accepted: {
    text: 'She hands you a sealed data chip. Her hand trembles slightly. "It is... just a letter. Ten years of things I should have said." She straightens. "Vasquez is at Eridani Hub. Epsilon Eridani."',
    choices: [
      {
        text: '"I\'ll make sure it gets there."',
        next: null,
      },
    ],
  },

  mission_4_complete: {
    text: '"You delivered it." Her voice is quiet. "That message... it means everything." She composes herself. "When you are ready for the final preparations, we should talk."',
    choices: [
      {
        text: '"She would want to hear from you."',
        next: 'greeting',
        repGain: 3,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
      {
        text: '"Glad I could help."',
        next: null,
        repGain: 1,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  mission_5_offer: {
    text: '"This is it. The final stage." She stands before your ship, tools in hand. "To make the Pavonis jump, you need: zero debt, twenty-five thousand credits for fuel and supplies, hull at eighty percent, engine at ninety." She meets your eyes. "And my trust. Completely."',
    choices: [
      {
        text: '"I\'m ready. Let\'s do this."',
        next: 'mission_5_accepted',
        repGain: 5,
        condition: (_rep, context) =>
          context && context.canStartQuestStage('tanaka', 5),
        action: (context) => {
          return context.advanceQuest('tanaka');
        },
      },
      {
        text: '"I need more time to prepare."',
        next: 'greeting',
      },
    ],
  },

  mission_5_accepted: {
    text: '"The Range Extender is fully calibrated. I have installed the final components." She steps back to admire her work. "This is my father\'s legacy. And mine. And now yours." She hands you the activation key. "When you are ready, we fly to Delta Pavonis. Together."',
    choices: [
      {
        text: '"Together."',
        next: null,
        repGain: 5,
        action: (context) => {
          return context.claimStageRewards('tanaka');
        },
      },
    ],
  },

  research_supply: {
    text: (_rep, _context) => {
      const lines = [
        '"Electronics. Good quality. These will work for the coupling array."',
        '"Medical-grade sealant compounds. Useful for the containment housing. Thank you."',
        '"I can use these. The drive prototype consumes components faster than I projected."',
        '"You didn\'t have to do this. But I won\'t pretend it doesn\'t help."',
        '"Every delivery gets me closer. I won\'t forget that."',
        '"This saves me weeks of requisition paperwork. Appreciated."',
      ];
      return lines[Math.floor(Math.random() * lines.length)];
    },
    choices: [
      {
        text: '"Glad to help."',
        next: 'greeting',
        action: (context) => {
          return context.contributeSupply();
        },
      },
    ],
  },

  pavonis_ready: {
    text: '"The coordinates are locked. Delta Pavonis. Twenty-seven point eight-eight light-years." She stands at the airlock. "Once we activate the Range Extender, there is no coming back. The jump is one-way." Her voice is perfectly steady. "Are you certain?"',
    choices: [
      {
        text: '"Let\'s fly."',
        next: null,
        action: (context) => {
          context.startPavonisRun();
          return { success: true };
        },
      },
      {
        text: '"Not yet. I need more time."',
        next: null,
      },
    ],
  },
};
