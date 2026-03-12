import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Safari WebGL premultiplied alpha compatibility test.
 *
 * Canvas 2D stores pixel data in premultiplied alpha format. When used with
 * THREE.AdditiveBlending (which applies SRC_ALPHA internally), alpha < 1.0
 * causes double-alpha multiplication: the glow fades faster than intended,
 * making the center pixel (alpha=1.0) appear as a visible bright dot.
 *
 * Chrome compensates internally; Safari does not.
 *
 * Fix: encode glow brightness in RGB channels with alpha=1.0 everywhere.
 */
describe('Star glow texture Safari compatibility', () => {
  let capturedStops;
  let originalGetContext;

  beforeEach(() => {
    capturedStops = [];
    originalGetContext = HTMLCanvasElement.prototype.getContext;

    // Override the global canvas mock to capture gradient color stops
    HTMLCanvasElement.prototype.getContext = function (type) {
      if (type === '2d') {
        return {
          fillStyle: '',
          strokeStyle: '',
          shadowColor: '',
          shadowBlur: 0,
          lineWidth: 1,
          lineCap: 'butt',
          font: '',
          textAlign: 'start',
          textBaseline: 'alphabetic',
          createRadialGradient: () => ({
            addColorStop: (position, color) => {
              capturedStops.push({ position, color });
            },
          }),
          fillRect: () => {},
          clearRect: () => {},
          fillText: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          stroke: () => {},
          fill: () => {},
          measureText: (text) => ({ width: text.length * 10 }),
        };
      }
      return null;
    };
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('should use alpha=1.0 in all gradient stops to avoid premultiply artifacts', async () => {
    // Dynamic import so the module picks up our canvas mock
    const { createStarTexture } =
      await import('../../src/game/engine/stars.js');

    capturedStops = [];
    createStarTexture();

    expect(capturedStops.length).toBeGreaterThan(0);

    // Parse each rgba color stop and verify alpha is 1.0
    for (const stop of capturedStops) {
      const match = stop.color.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
      );
      expect(match).not.toBeNull();

      const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1.0;
      expect(alpha).toBe(1.0);
    }
  });
});
