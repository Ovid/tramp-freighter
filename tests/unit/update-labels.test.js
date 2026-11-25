// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { updateLabels } from '../../src/game/engine/stars.js';
import { LABEL_CONFIG, STARMAP_CONFIG } from '../../src/game/constants.js';

function labelledStar(z) {
  return {
    position: new THREE.Vector3(0, 0, z),
    label: {
      visible: true,
      scale: new THREE.Vector3(),
      material: { opacity: 0, map: { image: { width: 200, height: 40 } } },
    },
  };
}

describe('updateLabels', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000);
  camera.position.set(0, 0, 0);
  const unitsPerPx = 0.002;
  const viewport = { width: 500, height: 500 };

  it('hides labels closer than hideDistance', () => {
    const s = labelledStar(-(LABEL_CONFIG.hideDistance - 1));
    updateLabels([s], camera, unitsPerPx, viewport);
    expect(s.label.visible).toBe(false);
  });

  it('shows farther labels at a fixed screen height, keeping aspect', () => {
    const s = labelledStar(-LABEL_CONFIG.farDistance * 2);
    updateLabels([s], camera, unitsPerPx, viewport);
    const h = STARMAP_CONFIG.LABEL_HEIGHT_PX * unitsPerPx;
    expect(s.label.visible).toBe(true);
    expect(s.label.scale.y).toBeCloseTo(h);
    expect(s.label.scale.x).toBeCloseTo(h * 5);
    expect(s.label.material.opacity).toBeCloseTo(LABEL_CONFIG.minOpacity);
  });

  it('label size does not depend on distance', () => {
    const near = labelledStar(-LABEL_CONFIG.nearDistance);
    const far = labelledStar(-LABEL_CONFIG.farDistance);
    updateLabels([near, far], camera, unitsPerPx, viewport);
    expect(near.label.scale.y).toBe(far.label.scale.y);
  });

  it('a label hidden up close shows again when the camera moves away', () => {
    const s = labelledStar(-(LABEL_CONFIG.hideDistance - 1));
    updateLabels([s], camera, unitsPerPx, viewport);
    s.position.z = -LABEL_CONFIG.farDistance;
    updateLabels([s], camera, unitsPerPx, viewport);
    expect(s.label.visible).toBe(true);
  });

  it('hides a farther label that overlaps a nearer one on screen', () => {
    const near = labelledStar(-LABEL_CONFIG.nearDistance);
    const far = labelledStar(-LABEL_CONFIG.farDistance);
    updateLabels([far, near], camera, unitsPerPx, viewport);
    expect(near.label.visible).toBe(true);
    expect(far.label.visible).toBe(false);
  });

  it('a pinned label shows even behind a nearer overlapping one', () => {
    const near = labelledStar(-LABEL_CONFIG.nearDistance);
    const far = labelledStar(-LABEL_CONFIG.farDistance);
    updateLabels([near, far], camera, unitsPerPx, viewport, [null, far]);
    expect(far.label.visible).toBe(true);
    expect(near.label.visible).toBe(false);
  });
});
