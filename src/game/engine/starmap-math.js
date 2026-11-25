import { STARMAP_CONFIG } from '../constants.js';

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
