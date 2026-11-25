// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { pickStar } from '../../src/game/engine/starmap-math.js';

const W = 1000;
const H = 1000;

function makeCamera() {
  const camera = new THREE.PerspectiveCamera(60, W / H, 1, 10000);
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}

function star(id, x, y, z, size = 0.001) {
  return {
    data: { id },
    position: new THREE.Vector3(x, y, z),
    sprite: { scale: new THREE.Vector3(size, size, 1) },
  };
}

const pick = (x, y, stars, minRadiusPx = 20) =>
  pickStar({
    x,
    y,
    width: W,
    height: H,
    camera: makeCamera(),
    stars,
    minRadiusPx,
  });

describe('pickStar', () => {
  it('hits a star under the pointer', () => {
    const a = star(1, 0, 0, 0);
    expect(pick(500, 500, [a])).toBe(a);
  });

  it('returns null when nothing is within the pick radius', () => {
    expect(pick(900, 900, [star(1, 0, 0, 0)])).toBeNull();
  });

  it('picks the star closest on screen when several are in range', () => {
    // 2 world units at depth 100 is about 17px
    const a = star(1, 0, 0, 0);
    const b = star(2, 2, 0, 0);
    // Both orders, so "last hit wins" can't pass by accident
    expect(pick(515, 500, [a, b])).toBe(b);
    expect(pick(515, 500, [b, a])).toBe(b);
  });

  it('uses the minimum radius so a distant star is clickable', () => {
    const far = star(1, 0, 0, -5000);
    expect(pick(508, 500, [far], 12)).toBe(far);
    expect(pick(520, 500, [far], 12)).toBeNull();
  });

  it('ignores stars behind the camera', () => {
    expect(pick(500, 500, [star(1, 0, 0, 200)])).toBeNull();
  });

  it('a large near star does not hide a distant star beside it', () => {
    const near = star(1, 0, 0, 50, 20); // ~170px apparent radius
    const far = star(2, 40, 0, -900); // ~35px right of centre
    expect(pick(535, 500, [near, far])).toBe(far);
    expect(pick(535, 500, [far, near])).toBe(far);
  });
});
