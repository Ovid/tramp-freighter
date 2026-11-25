// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { JumpAnimationSystem } from '../../src/game/engine/game-animation';
import { STAR_DATA } from '../../src/game/data/star-data';

function makeSystem(prefersReducedMotion) {
  const controls = {
    enabled: true,
    target: new THREE.Vector3(),
    update: () => {},
  };
  const system = new JumpAnimationSystem(
    new THREE.Scene(),
    new THREE.PerspectiveCamera(),
    controls,
    STAR_DATA,
    () => prefersReducedMotion
  );
  vi.spyOn(system, 'animateCameraTransition').mockResolvedValue();
  vi.spyOn(system, 'animateShipTravel').mockResolvedValue();
  return system;
}

// The zoom/pan sequence is a vestibular trigger; the OS setting must skip it.
describe('JumpAnimationSystem with reduced motion', () => {
  it('skips the camera and travel animation but still fires the near-end callback', async () => {
    const system = makeSystem(true);
    const onNearEnd = vi.fn();
    await system.playJumpAnimation(0, 1, onNearEnd);
    expect(system.animateCameraTransition).not.toHaveBeenCalled();
    expect(system.animateShipTravel).not.toHaveBeenCalled();
    expect(onNearEnd).toHaveBeenCalledTimes(1);
    expect(system.isAnimating).toBe(false);
  });

  it('plays the full animation otherwise', async () => {
    const system = makeSystem(false);
    await system.playJumpAnimation(0, 1, vi.fn());
    expect(system.animateCameraTransition).toHaveBeenCalled();
    expect(system.animateShipTravel).toHaveBeenCalled();
  });
});
