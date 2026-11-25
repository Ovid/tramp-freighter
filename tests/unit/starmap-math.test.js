import { describe, it, expect } from 'vitest';
import {
  isDrag,
  minPickRadiusFor,
} from '../../src/game/engine/starmap-math.js';
import { STARMAP_CONFIG } from '../../src/game/constants.js';

describe('isDrag', () => {
  const T = STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX;

  it('is false when the pointer did not move', () => {
    expect(isDrag({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(false);
  });

  it('is false at exactly the threshold', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: T, y: 0 })).toBe(false);
  });

  it('is true just past the threshold, diagonally', () => {
    expect(isDrag({ x: 0, y: 0 }, { x: T, y: 1 })).toBe(true);
  });

  it('is false when there was no pointerdown', () => {
    expect(isDrag(null, { x: 100, y: 100 })).toBe(false);
  });

  it('uses the larger touch threshold for a touch pointerdown', () => {
    const TT = STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_TOUCH_PX;
    const down = { x: 0, y: 0, pointerType: 'touch' };
    expect(isDrag(down, { x: TT, y: 0 })).toBe(false);
    expect(isDrag(down, { x: TT + 1, y: 0 })).toBe(true);
  });
});

describe('minPickRadiusFor', () => {
  it('gives touch the larger radius and everything else the mouse radius', () => {
    expect(minPickRadiusFor('touch')).toBe(
      STARMAP_CONFIG.MIN_PICK_RADIUS_TOUCH_PX
    );
    for (const type of ['mouse', 'pen', undefined]) {
      expect(minPickRadiusFor(type)).toBe(STARMAP_CONFIG.MIN_PICK_RADIUS_PX);
    }
  });
});
