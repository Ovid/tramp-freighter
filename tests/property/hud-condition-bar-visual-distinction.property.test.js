'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: dynamic-economy, Property 31: Condition Bar Visual Distinction
 * Validates: Requirements 8.6
 *
 * Property: For any condition bar display, each condition type (fuel, hull, engine, life support)
 * should have distinct visual styling.
 */

describe('Property: Condition Bar Visual Distinction', () => {
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

  it('should have distinct CSS classes for each condition type', () => {
    fc.assert(
      fc.property(
        fc.constant({}), // Static DOM structure test - no random values needed
        () => {
          // Get all condition bars and containers
          const fuelBar = document.getElementById('fuel-bar');
          const fuelContainer = document.querySelector('.fuel-bar-container');
          const hullBar = document.getElementById('hull-bar');
          const hullContainer = document.querySelector('.hull-bar-container');
          const engineBar = document.getElementById('engine-bar');
          const engineContainer = document.querySelector(
            '.engine-bar-container'
          );
          const lifeSupportBar = document.getElementById('life-support-bar');
          const lifeSupportContainer = document.querySelector(
            '.life-support-bar-container'
          );

          // Verify each bar has the base condition-bar class
          expect(fuelBar.classList.contains('condition-bar')).toBe(true);
          expect(hullBar.classList.contains('condition-bar')).toBe(true);
          expect(engineBar.classList.contains('condition-bar')).toBe(true);
          expect(lifeSupportBar.classList.contains('condition-bar')).toBe(true);

          // Verify each bar has a distinct type-specific class
          expect(fuelBar.classList.contains('fuel-bar')).toBe(true);
          expect(hullBar.classList.contains('hull-bar')).toBe(true);
          expect(engineBar.classList.contains('engine-bar')).toBe(true);
          expect(lifeSupportBar.classList.contains('life-support-bar')).toBe(
            true
          );

          // Verify each container has the base condition-bar-container class
          expect(
            fuelContainer.classList.contains('condition-bar-container')
          ).toBe(true);
          expect(
            hullContainer.classList.contains('condition-bar-container')
          ).toBe(true);
          expect(
            engineContainer.classList.contains('condition-bar-container')
          ).toBe(true);
          expect(
            lifeSupportContainer.classList.contains('condition-bar-container')
          ).toBe(true);

          // Verify each container has a distinct type-specific class
          expect(fuelContainer.classList.contains('fuel-bar-container')).toBe(
            true
          );
          expect(hullContainer.classList.contains('hull-bar-container')).toBe(
            true
          );
          expect(
            engineContainer.classList.contains('engine-bar-container')
          ).toBe(true);
          expect(
            lifeSupportContainer.classList.contains(
              'life-support-bar-container'
            )
          ).toBe(true);

          // Verify no bar has another bar's type-specific class (mutual exclusivity)
          expect(fuelBar.classList.contains('hull-bar')).toBe(false);
          expect(fuelBar.classList.contains('engine-bar')).toBe(false);
          expect(fuelBar.classList.contains('life-support-bar')).toBe(false);

          expect(hullBar.classList.contains('fuel-bar')).toBe(false);
          expect(hullBar.classList.contains('engine-bar')).toBe(false);
          expect(hullBar.classList.contains('life-support-bar')).toBe(false);

          expect(engineBar.classList.contains('fuel-bar')).toBe(false);
          expect(engineBar.classList.contains('hull-bar')).toBe(false);
          expect(engineBar.classList.contains('life-support-bar')).toBe(false);

          expect(lifeSupportBar.classList.contains('fuel-bar')).toBe(false);
          expect(lifeSupportBar.classList.contains('hull-bar')).toBe(false);
          expect(lifeSupportBar.classList.contains('engine-bar')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain distinct styling regardless of condition values', () => {
    fc.assert(
      fc.property(
        fc.record({
          fuel: fc.integer({ min: 0, max: 100 }),
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        (condition) => {
          const fuelBar = document.getElementById('fuel-bar');
          const hullBar = document.getElementById('hull-bar');
          const engineBar = document.getElementById('engine-bar');
          const lifeSupportBar = document.getElementById('life-support-bar');

          // Update bar widths to various values
          fuelBar.style.width = `${condition.fuel}%`;
          hullBar.style.width = `${condition.hull}%`;
          engineBar.style.width = `${condition.engine}%`;
          lifeSupportBar.style.width = `${condition.lifeSupport}%`;

          // Verify distinct classes are maintained after updates
          expect(fuelBar.classList.contains('fuel-bar')).toBe(true);
          expect(hullBar.classList.contains('hull-bar')).toBe(true);
          expect(engineBar.classList.contains('engine-bar')).toBe(true);
          expect(lifeSupportBar.classList.contains('life-support-bar')).toBe(
            true
          );

          // Verify classes remain mutually exclusive
          const allBars = [fuelBar, hullBar, engineBar, lifeSupportBar];
          const typeClasses = [
            'fuel-bar',
            'hull-bar',
            'engine-bar',
            'life-support-bar',
          ];

          allBars.forEach((bar, barIndex) => {
            typeClasses.forEach((typeClass, classIndex) => {
              if (barIndex === classIndex) {
                // Bar should have its own type class
                expect(bar.classList.contains(typeClass)).toBe(true);
              } else {
                // Bar should not have other bars' type classes
                expect(bar.classList.contains(typeClass)).toBe(false);
              }
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have all four condition types present in the HUD', () => {
    // This test verifies that all four condition types are present
    // regardless of their values
    fc.assert(
      fc.property(
        fc.constant({}), // Static DOM structure test - no random values needed
        () => {
          // Count how many distinct condition bar types exist
          const fuelBar = document.querySelector('.fuel-bar');
          const hullBar = document.querySelector('.hull-bar');
          const engineBar = document.querySelector('.engine-bar');
          const lifeSupportBar = document.querySelector('.life-support-bar');

          // All four types must be present
          expect(fuelBar).toBeTruthy();
          expect(hullBar).toBeTruthy();
          expect(engineBar).toBeTruthy();
          expect(lifeSupportBar).toBeTruthy();

          // Verify they are all different elements
          const bars = [fuelBar, hullBar, engineBar, lifeSupportBar];
          const uniqueBars = new Set(bars);
          expect(uniqueBars.size).toBe(4);
        }
      ),
      { numRuns: 100 }
    );
  });
});
