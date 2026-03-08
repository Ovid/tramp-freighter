import { ALL_NPCS } from '../../game/data/npc-data.js';

export function buildCastList() {
  return ALL_NPCS.map((npc) => ({
    id: npc.id,
    name: npc.name,
    role: npc.role,
  }));
}

export const CREDITS_SECTIONS = [
  {
    type: 'title',
    lines: ['TRAMP FREIGHTER BLUES'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'role',
    lines: ['Directed by', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Screenplay by', 'Claude'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['CAST', '(All NPCs played by themselves)'],
  },
  // NPC cast list is built dynamically by the component via buildCastList()
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['PRODUCTION'],
  },
  {
    type: 'role',
    lines: ['Produced by', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Executive Producer', 'Claude'],
  },
  {
    type: 'role',
    lines: ['Art Direction', 'Curtis "Ovid" Poe'],
  },
  {
    type: 'role',
    lines: ['Sound Design', 'The Void of Space'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['ENGINEERING'],
  },
  {
    type: 'credit-pair',
    lines: [],
    pairs: [
      ['Game Engine', 'React 18'],
      ['3D Starmap', 'Three.js'],
      ['Build System', 'Vite'],
      ['Test Framework', 'Vitest'],
      ['Property Testing', 'fast-check'],
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['NAVIGATION'],
  },
  {
    type: 'credit-pair',
    lines: [],
    pairs: [
      ['Star Catalogue', 'HYG Stellar Database'],
      ['Wormhole Cartography', 'Purely Fictional'],
      ['Stars Featured', '117 of 131 known (so far)'],
      ['Nearest Star to Sol', 'Proxima Centauri \u2014 4.25 ly'],
      ['Longest Route', 'Sol to Delta Pavonis \u2014 19.89 ly'],
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['FILMED ON LOCATION'],
  },
  {
    type: 'location',
    lines: [
      "Sol \u00b7 Alpha Centauri \u00b7 Barnard's Star",
      'Sirius \u00b7 Wolf 359 \u00b7 Tau Ceti',
      'Epsilon Eridani \u00b7 Procyon \u00b7 Ross 154',
      "Luyten's Star",
      'and 107 other star systems',
      'that were kind enough not to move',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'heading',
    lines: ['SPECIAL THANKS'],
  },
  {
    type: 'thanks',
    lines: [
      'The real stars within 20 light-years of Sol,',
      'for existing in convenient locations.',
      '(Apologies to the 14 we left out. Budget constraints.)',
    ],
  },
  {
    type: 'thanks',
    lines: [
      'Every freighter captain who kept flying',
      'when the numbers said to quit.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'humor',
    lines: [
      'No NPCs were harmed during the making of this game.',
      '(Except by pirates. And customs officers. And occasionally you.)',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'disclaimer',
    lines: [
      'All characters appearing in this work are fictitious.',
      'Any resemblance to real persons, living or dead,',
      'is purely coincidental.',
    ],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'thankyou',
    lines: ['THANK YOU FOR PLAYING'],
  },
  {
    type: 'separator',
    lines: [],
  },
  {
    type: 'quote',
    lines: [
      '\u201cThe stars don\u2019t remember you. The people between them might.\u201d',
    ],
  },
];
