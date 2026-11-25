// @vitest-environment jsdom
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { pickStar } from '../../src/game/engine/starmap-math.js';

const W = 1000;
const H = 1000;
const MIN_RADIUS_PX = 12;

function star(id, x, y, z, size = 0.001) {
  return {
    data: { id },
    position: new THREE.Vector3(x, y, z),
    sprite: { scale: new THREE.Vector3(size, size, 1) },
  };
}

describe('Property: pickStar', () => {
  // Feature: navigation sphere (#55). Property: pickStar never returns a star
  // outside the pick radius.
  it('never returns a star outside the pick radius', () => {
    const coord = fc.double({ min: -300, max: 300, noNaN: true });
    fc.assert(
      fc.property(
        fc.array(fc.tuple(coord, coord, coord), {
          minLength: 1,
          maxLength: 20,
        }),
        fc.integer({ min: 0, max: W }),
        fc.integer({ min: 0, max: H }),
        (positions, px, py) => {
          const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
          camera.position.set(0, 0, 700);
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          const stars = positions.map(([x, y, z], i) => star(i, x, y, z));
          const hit = pickStar({
            x: px,
            y: py,
            width: W,
            height: H,
            camera,
            stars,
            minRadiusPx: MIN_RADIUS_PX,
          });
          if (hit === null) return true;
          // Independent check: tiny sprites, so the radius is the minimum
          const p = hit.position.clone().project(camera);
          const sx = ((p.x + 1) / 2) * W;
          const sy = ((1 - p.y) / 2) * H;
          return (
            Math.hypot(px - sx, py - sy) <= MIN_RADIUS_PX &&
            hit.position.z < 700
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});
