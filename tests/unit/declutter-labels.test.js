import { describe, it, expect } from 'vitest';
import { declutterLabels } from '../../src/game/engine/starmap-math.js';

function box(x0, y0, w, h, depth, pinned = false) {
  return { x0, y0, x1: x0 + w, y1: y0 + h, depth, pinned, visible: true };
}

describe('declutterLabels', () => {
  it('hides the farther of two overlapping labels', () => {
    const near = box(0, 0, 100, 20, 300);
    const far = box(50, 10, 100, 20, 600);
    declutterLabels([far, near]);
    expect(near.visible).toBe(true);
    expect(far.visible).toBe(false);
  });

  it('a pinned label beats a nearer one it overlaps', () => {
    const near = box(0, 0, 100, 20, 300);
    const pinned = box(50, 10, 100, 20, 600, true);
    declutterLabels([near, pinned]);
    expect(pinned.visible).toBe(true);
    expect(near.visible).toBe(false);
  });

  it('labels that only touch edges both show', () => {
    const a = box(0, 0, 100, 20, 300);
    const b = box(100, 0, 100, 20, 600);
    declutterLabels([a, b]);
    expect(a.visible && b.visible).toBe(true);
  });
});
