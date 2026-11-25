import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { declutterLabels } from '../../src/game/engine/starmap-math.js';

// Feature: navigation sphere (#55) — label decluttering
const boxArb = fc
  .record({
    x0: fc.integer({ min: 0, max: 400 }),
    y0: fc.integer({ min: 0, max: 400 }),
    w: fc.integer({ min: 1, max: 120 }),
    h: fc.integer({ min: 1, max: 30 }),
    depth: fc.integer({ min: 1, max: 1000 }),
    pinned: fc.boolean(),
  })
  .map(({ x0, y0, w, h, depth, pinned }) => ({
    x0,
    y0,
    x1: x0 + w,
    y1: y0 + h,
    depth,
    pinned,
    visible: false,
  }));

const overlaps = (a, b) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

describe('declutterLabels - Property Tests', () => {
  it('shown labels never overlap, and every hidden label overlaps a shown one', () => {
    fc.assert(
      fc.property(fc.array(boxArb, { maxLength: 40 }), (boxes) => {
        declutterLabels(boxes);
        const shown = boxes.filter((b) => b.visible);

        for (let i = 0; i < shown.length; i++) {
          for (let j = i + 1; j < shown.length; j++) {
            expect(overlaps(shown[i], shown[j])).toBe(false);
          }
        }
        for (const b of boxes.filter((b) => !b.visible)) {
          expect(shown.some((s) => overlaps(s, b))).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });
});
