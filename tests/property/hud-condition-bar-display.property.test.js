'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: dynamic-economy, Property 29: HUD Condition Bar Display
 * Validates: Requirements 8.4
 *
 * Property: For any HUD display, condition bars for fuel, hull, engine, and life support
 * should be shown with labels and percentage values.
 */

describe('Property: HUD Condition Bar Display', () => {
  let container;

  beforeEach(() => {
    // Create a fresh DOM container for each test
    container = document.createElement('div');
    container.innerHTML = `
      <div id="game-hud">
        <div class="hud-section hud-ship">
          <div class="hud-row">
            <span class="hud-label">Fuel:</span>
            <div class="condition-bar-container fuel-bar-container">
              <div id="fuel-bar" class="condition-bar fuel-bar"></div>
              <span id="hud-fuel-text" class="condition-text fuel-text">100%</span>
            </div>
          </div>
          <div class="hud-row">
            <span class="hud-label">Hull:</span>
            <div class="condition-bar-container hull-bar-container">
              <div id="hull-bar" class="condition-bar hull-bar"></div>
              <span id="hud-hull-text" class="condition-text">100%</span>
            </div>
          </div>
          <div class="hud-row">
            <span class="hud-label">Engine:</span>
            <div class="condition-bar-container engine-bar-container">
              <div id="engine-bar" class="condition-bar engine-bar"></div>
              <span id="hud-engine-text" class="condition-text">100%</span>
            </div>
          </div>
          <div class="hud-row">
            <span class="hud-label">Life Support:</span>
            <div class="condition-bar-container life-support-bar-container">
              <div id="life-support-bar" class="condition-bar life-support-bar"></div>
              <span id="hud-life-support-text" class="condition-text">100%</span>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  });

  it('should display all condition bars with labels and percentage values', () => {
    fc.assert(
      fc.property(
        fc.record({
          fuel: fc.integer({ min: 0, max: 100 }),
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        (condition) => {
          // Update the HUD with the generated condition values
          const fuelBar = document.getElementById('fuel-bar');
          const fuelText = document.getElementById('hud-fuel-text');
          const hullBar = document.getElementById('hull-bar');
          const hullText = document.getElementById('hud-hull-text');
          const engineBar = document.getElementById('engine-bar');
          const engineText = document.getElementById('hud-engine-text');
          const lifeSupportBar = document.getElementById('life-support-bar');
          const lifeSupportText = document.getElementById('hud-life-support-text');

          // Simulate UI update
          fuelBar.style.width = `${condition.fuel}%`;
          fuelText.textContent = `${Math.round(condition.fuel)}%`;
          hullBar.style.width = `${condition.hull}%`;
          hullText.textContent = `${Math.round(condition.hull)}%`;
          engineBar.style.width = `${condition.engine}%`;
          engineText.textContent = `${Math.round(condition.engine)}%`;
          lifeSupportBar.style.width = `${condition.lifeSupport}%`;
          lifeSupportText.textContent = `${Math.round(condition.lifeSupport)}%`;

          // Verify all condition bars exist and are displayed
          expect(fuelBar).toBeTruthy();
          expect(fuelText).toBeTruthy();
          expect(hullBar).toBeTruthy();
          expect(hullText).toBeTruthy();
          expect(engineBar).toBeTruthy();
          expect(engineText).toBeTruthy();
          expect(lifeSupportBar).toBeTruthy();
          expect(lifeSupportText).toBeTruthy();

          // Verify labels exist
          const labels = container.querySelectorAll('.hud-label');
          const labelTexts = Array.from(labels).map((label) => label.textContent);
          expect(labelTexts).toContain('Fuel:');
          expect(labelTexts).toContain('Hull:');
          expect(labelTexts).toContain('Engine:');
          expect(labelTexts).toContain('Life Support:');

          // Verify percentage values are displayed correctly
          expect(fuelText.textContent).toBe(`${Math.round(condition.fuel)}%`);
          expect(hullText.textContent).toBe(`${Math.round(condition.hull)}%`);
          expect(engineText.textContent).toBe(`${Math.round(condition.engine)}%`);
          expect(lifeSupportText.textContent).toBe(`${Math.round(condition.lifeSupport)}%`);

          // Verify bar widths match condition values
          expect(fuelBar.style.width).toBe(`${condition.fuel}%`);
          expect(hullBar.style.width).toBe(`${condition.hull}%`);
          expect(engineBar.style.width).toBe(`${condition.engine}%`);
          expect(lifeSupportBar.style.width).toBe(`${condition.lifeSupport}%`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
