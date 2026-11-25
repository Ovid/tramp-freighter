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
