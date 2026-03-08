/**
 * @fileoverview Coverage tests for dialogue validation, faction-karma conditions,
 * Marcus Cole dialogue, and dialogue-trees aggregator.
 *
 * Targets specific uncovered lines:
 * - validation.js: lines 36-39, 43-46, 48-51, 67-70, 75-78
 * - faction-karma-conditions.js: lines 177,179,187,189,197,199,223,227-233
 * - marcus-cole.js: lines 50,53-56,59-64,158-159,161-165,167-168,219-220
 * - dialogue-trees.js: lines 106-109
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Direct imports for validation.js
import {
  validateRequiredConstants,
  validateDialogueTree,
} from '../../src/game/data/dialogue/validation.js';

// Direct imports for faction-karma-conditions.js
import {
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
} from '../../src/game/data/dialogue/faction-karma-conditions.js';

// Direct import for marcus-cole.js
import { MARCUS_COLE_DIALOGUE } from '../../src/game/data/dialogue/marcus-cole.js';

// Import for dialogue-trees.js aggregator
import { validateAllDialogueTrees } from '../../src/game/data/dialogue-trees.js';

import { REPUTATION_BOUNDS, KARMA_CONFIG, FACTION_CONFIG } from '../../src/game/constants.js';

describe('validation.js uncovered error paths', () => {
  let originalBounds;

  beforeEach(() => {
    // Save original values so we can restore after mocking
    originalBounds = { ...REPUTATION_BOUNDS };
  });

  afterEach(() => {
    // Restore original values
    Object.keys(REPUTATION_BOUNDS).forEach((k) => delete REPUTATION_BOUNDS[k]);
    Object.assign(REPUTATION_BOUNDS, originalBounds);
  });

  // Lines 36-39: REPUTATION_BOUNDS is not an object
  // We cannot make the import itself null, but we can test by temporarily
  // emptying the object and making it falsy-like. Since the import is a
  // live binding, we need a different approach: test through the module's
  // validation of tier ordering and MAX bound instead.

  // Lines 43-46: Missing required bound
  it('throws when a required reputation bound is missing', () => {
    delete REPUTATION_BOUNDS.FAMILY_MIN;
    expect(() => validateRequiredConstants()).toThrow(
      'Missing required reputation bound: REPUTATION_BOUNDS.FAMILY_MIN'
    );
  });

  // Lines 48-51: Bound is not a number
  it('throws when a reputation bound is not a number', () => {
    REPUTATION_BOUNDS.TRUSTED_MAX = 'not_a_number';
    expect(() => validateRequiredConstants()).toThrow(
      'REPUTATION_BOUNDS.TRUSTED_MAX must be a number, got string'
    );
  });

  // Lines 67-70: Tier minimums not in ascending order
  it('throws when tier minimums are not in ascending order', () => {
    // Make WARM_MIN less than NEUTRAL_MIN to break ascending order
    REPUTATION_BOUNDS.WARM_MIN = REPUTATION_BOUNDS.NEUTRAL_MIN - 1;
    expect(() => validateRequiredConstants()).toThrow(
      'Reputation tier minimums must be in ascending order'
    );
  });

  // Lines 75-78: MAX not greater than FAMILY_MIN
  it('throws when MAX is not greater than FAMILY_MIN', () => {
    REPUTATION_BOUNDS.MAX = REPUTATION_BOUNDS.FAMILY_MIN;
    expect(() => validateRequiredConstants()).toThrow(
      'REPUTATION_BOUNDS.MAX'
    );
  });
});

describe('faction-karma-conditions.js uncovered lines', () => {
  // Lines 177,179: getKarmaFirstImpression with GOOD karma + lawful/chaotic
  describe('getKarmaFirstImpression good karma tier', () => {
    const goodKarma = KARMA_CONFIG.THRESHOLDS.GOOD; // 25

    it('returns lawful impression for good karma', () => {
      // Line 177
      const result = getKarmaFirstImpression(goodKarma, 'lawful');
      expect(result).toBe(' You seem like a decent sort.');
    });

    it('returns chaotic impression for good karma', () => {
      // Line 179
      const result = getKarmaFirstImpression(goodKarma, 'chaotic');
      expect(result).toBe(' You look like you follow the rules.');
    });
  });

  // Lines 187,189: getKarmaFirstImpression with VERY_BAD karma + lawful/chaotic
  describe('getKarmaFirstImpression very bad karma tier', () => {
    const veryBadKarma = KARMA_CONFIG.THRESHOLDS.VERY_BAD; // -50

    it('returns lawful impression for very bad karma', () => {
      // Line 187
      const result = getKarmaFirstImpression(veryBadKarma, 'lawful');
      expect(result).toBe(' I can see trouble in your eyes.');
    });

    it('returns chaotic impression for very bad karma', () => {
      // Line 189
      const result = getKarmaFirstImpression(veryBadKarma, 'chaotic');
      expect(result).toBe(
        " Now here's someone who knows how the sector really works."
      );
    });
  });

  // Lines 197,199: getKarmaFirstImpression with BAD karma + lawful/chaotic
  describe('getKarmaFirstImpression bad karma tier', () => {
    const badKarma = KARMA_CONFIG.THRESHOLDS.BAD; // -25

    it('returns lawful impression for bad karma', () => {
      // Line 197
      const result = getKarmaFirstImpression(badKarma, 'lawful');
      expect(result).toBe(
        ' You look like someone I should be careful around.'
      );
    });

    it('returns chaotic impression for bad karma', () => {
      // Line 199
      const result = getKarmaFirstImpression(badKarma, 'chaotic');
      expect(result).toBe(
        ' You look like you know how to bend the rules.'
      );
    });
  });

  // Line 223: getFactionAttitudeModifier with VERY_HIGH rep
  describe('getFactionAttitudeModifier', () => {
    it('returns very high attitude for very high faction rep', () => {
      // Line 223
      const context = {
        factionReps: {
          authorities: FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_HIGH,
        },
      };
      const result = getFactionAttitudeModifier('authorities', context);
      expect(result).toBe(" You're a true friend to our cause.");
    });

    // Lines 227-230: EXTREME_LOW rep
    it('returns extreme low attitude for extreme low faction rep', () => {
      const context = {
        factionReps: {
          traders: FACTION_CONFIG.REPUTATION_THRESHOLDS.EXTREME_LOW,
        },
      };
      const result = getFactionAttitudeModifier('traders', context);
      expect(result).toBe(
        " Your reputation precedes you, and it's not good."
      );
    });

    // Lines 228-230: VERY_LOW rep (not extreme)
    it('returns very low attitude for very low faction rep', () => {
      const context = {
        factionReps: {
          outlaws: FACTION_CONFIG.REPUTATION_THRESHOLDS.VERY_LOW,
        },
      };
      const result = getFactionAttitudeModifier('outlaws', context);
      expect(result).toBe(' We have... concerns about your activities.');
    });

    // Lines 232-233: Neutral rep returns empty string
    it('returns empty string for moderate faction rep', () => {
      const context = {
        factionReps: { civilians: 0 },
      };
      const result = getFactionAttitudeModifier('civilians', context);
      expect(result).toBe('');
    });
  });
});

describe('marcus-cole.js uncovered greeting and debt_talk lines', () => {
  const greetingTextFn = MARCUS_COLE_DIALOGUE.greeting.text;
  const debtTalkTextFn = MARCUS_COLE_DIALOGUE.debt_talk.text;
  const defiantTextFn = MARCUS_COLE_DIALOGUE.defiant_response.text;

  // Line 50: critical heat greeting
  it('returns critical heat greeting', () => {
    const result = greetingTextFn(0, { heat: 'critical' });
    expect(result).toContain('No more games');
  });

  // Lines 53-54: high heat with rep >= NEUTRAL_MIN
  it('returns high heat greeting with neutral or better rep', () => {
    const result = greetingTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN, {
      heat: 'high',
    });
    expect(result).toContain("You're running out of time");
  });

  // Lines 55-56: high heat with rep < NEUTRAL_MIN (fallback)
  it('returns high heat greeting with low rep', () => {
    const result = greetingTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN - 1, {
      heat: 'high',
    });
    expect(result).toContain('I warned you');
  });

  // Lines 59-60: medium heat with rep >= WARM_MIN
  it('returns medium heat greeting with warm rep', () => {
    const result = greetingTextFn(REPUTATION_BOUNDS.WARM_MIN, {
      heat: 'medium',
    });
    expect(result).toContain('debt trajectory concerns me');
  });

  // Lines 61-62: medium heat with rep >= NEUTRAL_MIN but < WARM_MIN
  it('returns medium heat greeting with neutral rep', () => {
    const result = greetingTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN, {
      heat: 'medium',
    });
    expect(result).toContain('pattern forming');
  });

  // Lines 63-64: medium heat fallback (rep < NEUTRAL_MIN)
  it('returns medium heat greeting with low rep', () => {
    const result = greetingTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN - 1, {
      heat: 'medium',
    });
    expect(result).toContain('trending in the wrong direction');
  });

  // Lines 158-159: debt_talk critical heat
  it('returns debt_talk text for critical heat', () => {
    const result = debtTalkTextFn(0, { heat: 'critical' });
    expect(result).toContain('no longer a topic of negotiation');
  });

  // Lines 161-162: debt_talk high heat with rep >= NEUTRAL_MIN
  it('returns debt_talk text for high heat with neutral rep', () => {
    const result = debtTalkTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN, {
      heat: 'high',
    });
    expect(result).toContain('Your balance grows while your payments stagnate');
  });

  // Lines 163-164: debt_talk high heat fallback
  it('returns debt_talk text for high heat with low rep', () => {
    const result = debtTalkTextFn(REPUTATION_BOUNDS.NEUTRAL_MIN - 1, {
      heat: 'high',
    });
    expect(result).toContain('Your balance grows. Your payments do not');
  });

  // Lines 167-168: debt_talk medium heat
  it('returns debt_talk text for medium heat', () => {
    const result = debtTalkTextFn(0, { heat: 'medium' });
    expect(result).toContain('The terms were clear when you signed');
  });

  // Lines 219-220: defiant_response high/critical heat
  it('returns defiant_response text for high heat', () => {
    const result = defiantTextFn(0, { heat: 'high' });
    expect(result).toContain('Defiance. How refreshing');
  });

  it('returns defiant_response text for critical heat', () => {
    const result = defiantTextFn(0, { heat: 'critical' });
    expect(result).toContain('Defiance. How refreshing');
  });
});

describe('dialogue-trees.js validateAllDialogueTrees error wrapping', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // Lines 106-109: The catch block that wraps validation errors with NPC ID
  it('wraps dialogue tree validation errors with NPC identifier', () => {
    // We need to cause validateDialogueTree to throw for one of the trees.
    // We can do this by temporarily corrupting a dialogue tree.
    const originalGreeting = MARCUS_COLE_DIALOGUE.greeting;
    delete MARCUS_COLE_DIALOGUE.greeting;

    try {
      expect(() => validateAllDialogueTrees()).toThrow(
        "Invalid dialogue tree for NPC 'cole_sol'"
      );
    } finally {
      MARCUS_COLE_DIALOGUE.greeting = originalGreeting;
    }
  });
});
