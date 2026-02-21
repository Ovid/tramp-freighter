import { REPUTATION_BOUNDS } from '../constants.js';

export const EPILOGUE_CONFIG = {
  sections: [
    {
      id: 'arrival',
      variants: [
        {
          condition: null,
          text: 'Delta Pavonis fills your viewport — an orange sun, warmer than Sol, somehow welcoming despite the impossible distance. The Range Extender sputters and dies, its single purpose spent. Twenty-seven light-years from everything you knew.',
        },
      ],
    },
    {
      id: 'tanaka',
      variants: [
        {
          condition: {
            npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.FAMILY_MIN],
          },
          text: 'Tanaka\'s voice comes through the comm, steady as ever. "We made it." A pause — the longest you\'ve ever heard from her. "Thank you. For everything." You can hear the smile she\'d never show.',
        },
        {
          condition: {
            npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.TRUSTED_MIN],
          },
          text: '"Successful jump confirmed," Tanaka reports from the engineering bay. Professional as always. But when you turn, she\'s staring out the viewport with tears in her eyes. "My sister is down there. Somewhere."',
        },
      ],
    },
    {
      id: 'reputation',
      variants: [
        {
          condition: { karmaAbove: 50, trustedNPCs: 3 },
          text: "Word spreads fast, even 27 light-years from Sol. They remember you in the network — the trader who kept their word, who helped when it mattered. You're not forgotten.",
        },
        {
          condition: { karmaBelow: -50 },
          text: "You made it. That's what matters. The network moves on without you. Ships dock and undock. Traders come and go. Your name fades. But you're here. You're free. That's enough.",
        },
        {
          condition: { smugglingRuns: 5 },
          text: "The authorities are probably glad you're gone. One less problem. But in the outer stations, in the dark corners, they remember. The trader who took the risks no one else would. There's respect in that.",
        },
        {
          condition: null,
          text: "The network continues without you. Some will remember your name, others won't. But you crossed the void. You made the impossible run. And that's something no one can take from you.",
        },
      ],
    },
    {
      id: 'reflection',
      variants: [
        {
          condition: { karmaAbove: 30 },
          text: 'You chose the harder path more often than not. Helped when you could have turned away. Gave when you could have taken. Delta Pavonis feels like something earned, not just reached.',
        },
        {
          condition: { karmaBelow: -30 },
          text: "You survived. In the void between stars, survival is its own morality. Every choice you made kept you flying. And now you've flown further than anyone thought possible.",
        },
        {
          condition: null,
          text: "Neither saint nor villain — just a freighter captain who did what needed doing. The stars don't judge. They just burn. And now there's a new one overhead.",
        },
      ],
    },
  ],
};

export function generateEpilogue(gameState) {
  const sections = [];

  for (const section of EPILOGUE_CONFIG.sections) {
    for (const variant of section.variants) {
      if (evaluateEpilogueCondition(variant.condition, gameState)) {
        sections.push({ id: section.id, text: variant.text });
        break;
      }
    }
  }

  return sections;
}

function evaluateEpilogueCondition(condition, gameState) {
  if (!condition) return true;

  if (condition.npcRep) {
    const [npcId, threshold] = condition.npcRep;
    if ((gameState.npcs[npcId]?.rep ?? 0) < threshold) return false;
  }

  if (condition.karmaAbove != null) {
    if (gameState.player.karma <= condition.karmaAbove) return false;
  }

  if (condition.karmaBelow != null) {
    if (gameState.player.karma >= condition.karmaBelow) return false;
  }

  if (condition.trustedNPCs != null) {
    const count = Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length;
    if (count < condition.trustedNPCs) return false;
  }

  if (condition.smugglingRuns != null) {
    if ((gameState.stats?.smugglingRuns ?? 0) < condition.smugglingRuns)
      return false;
  }

  return true;
}

export function generateStats(gameState) {
  return {
    daysElapsed: gameState.player.daysElapsed,
    systemsVisited: gameState.world.visitedSystems.length,
    creditsEarned: gameState.stats?.creditsEarned ?? 0,
    missionsCompleted: gameState.missions.completed.length,
    trustedNPCs: Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length,
    cargoHauled: gameState.stats?.cargoHauled ?? 0,
    jumpsCompleted: gameState.stats?.jumpsCompleted ?? 0,
  };
}
