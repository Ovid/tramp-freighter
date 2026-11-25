import * as THREE from 'three';
import { STARMAP_CONFIG, VISUAL_CONFIG } from '../constants.js';

/**
 * OrbitControls still fires `click` after a drag. Comparing the click
 * position with the pointerdown position tells a drag from a click.
 * `down.pointerType` comes from pointerdown; Safari's click has none.
 */
export function isDrag(down, up) {
  if (!down) return false;
  const threshold =
    down.pointerType === 'touch'
      ? STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_TOUCH_PX
      : STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX;
  return Math.hypot(up.x - down.x, up.y - down.y) > threshold;
}

/** Fingertips need a bigger target than a mouse pointer. */
export function minPickRadiusFor(pointerType) {
  return pointerType === 'touch'
    ? STARMAP_CONFIG.MIN_PICK_RADIUS_TOUCH_PX
    : STARMAP_CONFIG.MIN_PICK_RADIUS_PX;
}

const DEG_TO_RAD = Math.PI / 180;

/** Rotation for one frame. Frame time is capped so rotation stays smooth. */
export function rotationAngle(speedDegPerSec, dtSec) {
  const dt = Math.min(Math.max(dtSec, 0), STARMAP_CONFIG.MAX_FRAME_DT_SEC);
  return speedDegPerSec * dt * DEG_TO_RAD;
}

/** null/undefined means "player never chose": default, or 0 for reduced motion. */
export function resolveAutoRotationSpeed(preference, reducedMotion) {
  if (preference !== null && preference !== undefined) return preference;
  return reducedMotion ? 0 : VISUAL_CONFIG.autoRotationDefaultSpeed;
}

/**
 * A sizeAttenuation:false sprite's scale is a fraction of viewport height,
 * so a fixed pixel size needs the viewport height and field of view.
 */
export function pxToSpriteScale(px, fovDeg, viewportHeightPx) {
  return (px * 2 * Math.tan((fovDeg * DEG_TO_RAD) / 2)) / viewportHeightPx;
}

// Reused so clicks don't allocate
const _view = new THREE.Vector3();
const _ndc = new THREE.Vector3();

/**
 * Screen-space star picking. A star is hit within max(minRadiusPx, its
 * apparent radius); the closest hit on screen wins, so a big near star
 * can't block a distant one beside it.
 *
 * x, y are CSS px relative to the canvas; width/height are the canvas CSS size.
 */
export function pickStar({
  x,
  y,
  width,
  height,
  camera,
  stars,
  minRadiusPx = STARMAP_CONFIG.MIN_PICK_RADIUS_PX,
}) {
  camera.updateMatrixWorld();
  const tanHalfFov = Math.tan((camera.fov * DEG_TO_RAD) / 2);
  let best = null;
  let bestDistance = Infinity;

  for (const s of stars) {
    _view.copy(s.position).applyMatrix4(camera.matrixWorldInverse);
    const depth = -_view.z;
    if (depth <= camera.near) continue;

    _ndc.copy(s.position).project(camera);
    const sx = ((_ndc.x + 1) / 2) * width;
    const sy = ((1 - _ndc.y) / 2) * height;
    const apparentRadius =
      (s.sprite.scale.y / 2 / (depth * tanHalfFov)) * (height / 2);
    const distance = Math.hypot(x - sx, y - sy);

    if (
      distance <= Math.max(minRadiusPx, apparentRadius) &&
      distance < bestDistance
    ) {
      best = s;
      bestDistance = distance;
    }
  }
  return best;
}
