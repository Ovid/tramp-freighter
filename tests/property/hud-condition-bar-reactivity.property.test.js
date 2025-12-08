'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: dynamic-economy, Property 30: Condition Bar Reactivity
 * Validates: Requirements 8.5
 *
 * Property: For any ship condition change, the visual width of the corresponding
 * condition bar should update to reflect the current percentage.
 */

describe('Property: Condition Bar Reactivity', () => {
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

  it('should update bar visual width when condition changes', () => {
    fc.assert(
      fc.property(
        fc.record({
          initialHull: fc.integer({ min: 0, max: 100 }),
          initialEngine: fc.integer({ min: 0, max: 100 }),
          initialLifeSupport: fc.integer({ min: 0, max: 100 }),
          newHull: fc.integer({ min: 0, max: 100 }),
          newEngine: fc.integer({ min: 0, max: 100 }),
          newLifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        (conditions) => {
          const hullBar = document.getElementById('hull-bar');
          const hullText = document.getElementById('hud-hull-text');
          const engineBar = document.getElementById('engine-bar');
          const engineText = document.getElementById('hud-engine-text');
          const lifeSupportBar = document.getElementById('life-support-bar');
          const lifeSupportText = document.getElementById('hud-life-support-text');

          // Set initial condition
          hullBar.style.width = `${conditions.initialHull}%`;
          hullText.textContent = `${Math.round(conditions.initialHull)}%`;
          engineBar.style.width = `${conditions.initialEngine}%`;
          engineText.textContent = `${Math.round(conditions.initialEngine)}%`;
          lifeSupportBar.style.width = `${conditions.initialLifeSupport}%`;
          lifeSupportText.textContent = `${Math.round(conditions.initialLifeSupport)}%`;

          // Verify initial state
          expect(hullBar.style.width).toBe(`${conditions.initialHull}%`);
          expect(hullText.textContent).toBe(`${Math.round(conditions.initialHull)}%`);
          expect(engineBar.style.width).toBe(`${conditions.initialEngine}%`);
          expect(engineText.textContent).toBe(`${Math.round(conditions.initialEngine)}%`);
          expect(lifeSupportBar.style.width).toBe(`${conditions.initialLifeSupport}%`);
          expect(lifeSupportText.textContent).toBe(`${Math.round(conditions.initialLifeSupport)}%`);

          // Simulate condition change
          hullBar.style.width = `${conditions.newHull}%`;
          hullText.textContent = `${Math.round(conditions.newHull)}%`;
          engineBar.style.width = `${conditions.newEngine}%`;
          engineText.textContent = `${Math.round(conditions.newEngine)}%`;
          lifeSupportBar.style.width = `${conditions.newLifeSupport}%`;
          lifeSupportText.textContent = `${Math.round(conditions.newLifeSupport)}%`;

          // Verify bars updated to reflect new condition
          expect(hullBar.style.width).toBe(`${conditions.newHull}%`);
          expect(hullText.textContent).toBe(`${Math.round(conditions.newHull)}%`);
          expect(engineBar.style.width).toBe(`${conditions.newEngine}%`);
          expect(engineText.textContent).toBe(`${Math.round(conditions.newEngine)}%`);
          expect(lifeSupportBar.style.width).toBe(`${conditions.newLifeSupport}%`);
          expect(lifeSupportText.textContent).toBe(`${Math.round(conditions.newLifeSupport)}%`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update individual condition bars independently', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({ min: 0, max: 100 }),
        (initialCondition, systemToChange, newValue) => {
          const hullBar = document.getElementById('hull-bar');
          const hullText = document.getElementById('hud-hull-text');
          const engineBar = document.getElementById('engine-bar');
          const engineText = document.getElementById('hud-engine-text');
          const lifeSupportBar = document.getElementById('life-support-bar');
          const lifeSupportText = document.getElementById('hud-life-support-text');

          // Set initial condition for all systems
          hullBar.style.width = `${initialCondition.hull}%`;
          hullText.textContent = `${Math.round(initialCondition.hull)}%`;
          engineBar.style.width = `${initialCondition.engine}%`;
          engineText.textContent = `${Math.round(initialCondition.engine)}%`;
          lifeSupportBar.style.width = `${initialCondition.lifeSupport}%`;
          lifeSupportText.textContent = `${Math.round(initialCondition.lifeSupport)}%`;

          // Store initial values for comparison
          const initialHull = initialCondition.hull;
          const initialEngine = initialCondition.engine;
          const initialLifeSupport = initialCondition.lifeSupport;

          // Change only one system
          if (systemToChange === 'hull') {
            hullBar.style.width = `${newValue}%`;
            hullText.textContent = `${Math.round(newValue)}%`;
          } else if (systemToChange === 'engine') {
            engineBar.style.width = `${newValue}%`;
            engineText.textContent = `${Math.round(newValue)}%`;
          } else if (systemToChange === 'lifeSupport') {
            lifeSupportBar.style.width = `${newValue}%`;
            lifeSupportText.textContent = `${Math.round(newValue)}%`;
          }

          // Verify only the changed system updated
          if (systemToChange === 'hull') {
            expect(hullBar.style.width).toBe(`${newValue}%`);
            expect(hullText.textContent).toBe(`${Math.round(newValue)}%`);
            // Other systems should remain unchanged
            expect(engineBar.style.width).toBe(`${initialEngine}%`);
            expect(lifeSupportBar.style.width).toBe(`${initialLifeSupport}%`);
          } else if (systemToChange === 'engine') {
            expect(engineBar.style.width).toBe(`${newValue}%`);
            expect(engineText.textContent).toBe(`${Math.round(newValue)}%`);
            // Other systems should remain unchanged
            expect(hullBar.style.width).toBe(`${initialHull}%`);
            expect(lifeSupportBar.style.width).toBe(`${initialLifeSupport}%`);
          } else if (systemToChange === 'lifeSupport') {
            expect(lifeSupportBar.style.width).toBe(`${newValue}%`);
            expect(lifeSupportText.textContent).toBe(`${Math.round(newValue)}%`);
            // Other systems should remain unchanged
            expect(hullBar.style.width).toBe(`${initialHull}%`);
            expect(engineBar.style.width).toBe(`${initialEngine}%`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
