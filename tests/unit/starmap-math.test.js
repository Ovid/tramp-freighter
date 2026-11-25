import { describe, it, expect } from 'vitest';
import {
  isDrag,
  minPickRadiusFor,
  rotationAngle,
  resolveAutoRotationSpeed,
  pxToSpriteScale,
} from '../../src/game/engine/starmap-math.js';
import { STARMAP_CONFIG, VISUAL_CONFIG } from '../../src/game/constants.js';

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

describe('rotationAngle', () => {
  it('scales degrees per second by frame time, in radians', () => {
    expect(rotationAngle(10, 0.05)).toBeCloseTo((0.5 * Math.PI) / 180);
  });

  it('caps the frame time so a background tab does not jump', () => {
    expect(rotationAngle(10, 5)).toBeCloseTo(
      (10 * STARMAP_CONFIG.MAX_FRAME_DT_SEC * Math.PI) / 180
    );
  });

  it('treats negative frame time as zero', () => {
    expect(rotationAngle(10, -1)).toBe(0);
  });
});

describe('resolveAutoRotationSpeed', () => {
  it('uses the stored preference, including 0', () => {
    expect(resolveAutoRotationSpeed(6, false)).toBe(6);
    expect(resolveAutoRotationSpeed(0, false)).toBe(0);
    expect(resolveAutoRotationSpeed(6, true)).toBe(6);
  });

  it('defaults to the configured speed when unset', () => {
    expect(resolveAutoRotationSpeed(null, false)).toBe(
      VISUAL_CONFIG.autoRotationDefaultSpeed
    );
    expect(resolveAutoRotationSpeed(undefined, false)).toBe(
      VISUAL_CONFIG.autoRotationDefaultSpeed
    );
  });

  it('defaults to 0 under reduced motion', () => {
    expect(resolveAutoRotationSpeed(null, true)).toBe(0);
  });
});

describe('pxToSpriteScale', () => {
  it('converts CSS px to non-attenuated sprite scale', () => {
    // 60° FOV: on-screen px = scale / tan(30°) × H/2
    const scale = pxToSpriteScale(100, 60, 1000);
    expect(scale).toBeCloseTo((100 * 2 * Math.tan(Math.PI / 6)) / 1000);
    const backToPx = (scale / Math.tan(Math.PI / 6)) * (1000 / 2);
    expect(backToPx).toBeCloseTo(100);
  });
});
