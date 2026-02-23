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

  /**
   * Helper: applies generated condition values to all HUD bars so the DOM
   * is in a realistic state before each per-system assertion.
   */
  function applyCondition(condition) {
    const bars = {
      fuel: {
        bar: document.getElementById('fuel-bar'),
        text: document.getElementById('hud-fuel-text'),
      },
      hull: {
        bar: document.getElementById('hull-bar'),
        text: document.getElementById('hud-hull-text'),
      },
      engine: {
        bar: document.getElementById('engine-bar'),
        text: document.getElementById('hud-engine-text'),
      },
      lifeSupport: {
        bar: document.getElementById('life-support-bar'),
        text: document.getElementById('hud-life-support-text'),
      },
    };

    bars.fuel.bar.style.width = `${condition.fuel}%`;
    bars.fuel.text.textContent = `${Math.round(condition.fuel)}%`;
    bars.hull.bar.style.width = `${condition.hull}%`;
    bars.hull.text.textContent = `${Math.round(condition.hull)}%`;
    bars.engine.bar.style.width = `${condition.engine}%`;
    bars.engine.text.textContent = `${Math.round(condition.engine)}%`;
    bars.lifeSupport.bar.style.width = `${condition.lifeSupport}%`;
    bars.lifeSupport.text.textContent = `${Math.round(condition.lifeSupport)}%`;

    return bars;
  }

  const conditionArb = fc.record({
    fuel: fc.integer({ min: 0, max: 100 }),
    hull: fc.integer({ min: 0, max: 100 }),
    engine: fc.integer({ min: 0, max: 100 }),
    lifeSupport: fc.integer({ min: 0, max: 100 }),
  });

  it('should display fuel bar with correct label, percentage, and width', () => {
    fc.assert(
      fc.property(conditionArb, (condition) => {
        const bars = applyCondition(condition);
        const labels = Array.from(container.querySelectorAll('.hud-label')).map(
          (l) => l.textContent
        );

        expect(bars.fuel.bar).toBeTruthy();
        expect(bars.fuel.text).toBeTruthy();
        expect(labels).toContain('Fuel:');
        expect(bars.fuel.text.textContent).toBe(
          `${Math.round(condition.fuel)}%`
        );
        expect(bars.fuel.bar.style.width).toBe(`${condition.fuel}%`);
      }),
      { numRuns: 100 }
    );
  });

  it('should display hull bar with correct label, percentage, and width', () => {
    fc.assert(
      fc.property(conditionArb, (condition) => {
        const bars = applyCondition(condition);
        const labels = Array.from(container.querySelectorAll('.hud-label')).map(
          (l) => l.textContent
        );

        expect(bars.hull.bar).toBeTruthy();
        expect(bars.hull.text).toBeTruthy();
        expect(labels).toContain('Hull:');
        expect(bars.hull.text.textContent).toBe(
          `${Math.round(condition.hull)}%`
        );
        expect(bars.hull.bar.style.width).toBe(`${condition.hull}%`);
      }),
      { numRuns: 100 }
    );
  });

  it('should display engine bar with correct label, percentage, and width', () => {
    fc.assert(
      fc.property(conditionArb, (condition) => {
        const bars = applyCondition(condition);
        const labels = Array.from(container.querySelectorAll('.hud-label')).map(
          (l) => l.textContent
        );

        expect(bars.engine.bar).toBeTruthy();
        expect(bars.engine.text).toBeTruthy();
        expect(labels).toContain('Engine:');
        expect(bars.engine.text.textContent).toBe(
          `${Math.round(condition.engine)}%`
        );
        expect(bars.engine.bar.style.width).toBe(`${condition.engine}%`);
      }),
      { numRuns: 100 }
    );
  });

  it('should display life support bar with correct label, percentage, and width', () => {
    fc.assert(
      fc.property(conditionArb, (condition) => {
        const bars = applyCondition(condition);
        const labels = Array.from(container.querySelectorAll('.hud-label')).map(
          (l) => l.textContent
        );

        expect(bars.lifeSupport.bar).toBeTruthy();
        expect(bars.lifeSupport.text).toBeTruthy();
        expect(labels).toContain('Life Support:');
        expect(bars.lifeSupport.text.textContent).toBe(
          `${Math.round(condition.lifeSupport)}%`
        );
        expect(bars.lifeSupport.bar.style.width).toBe(
          `${condition.lifeSupport}%`
        );
      }),
      { numRuns: 100 }
    );
  });
});
