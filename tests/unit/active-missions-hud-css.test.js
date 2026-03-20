import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * ActiveMissions HUD CSS validation.
 *
 * The abandon button and mission items must be styled to match
 * the game's sci-fi aesthetic rather than using default browser styles.
 */
describe('ActiveMissions HUD CSS', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');
  const jsx = readFileSync(
    resolve('src/features/hud/ActiveMissions.jsx'),
    'utf-8'
  );

  it('should use h2 heading for proper hierarchy within nav landmark', () => {
    expect(jsx).toContain('<h2>');
    expect(jsx).not.toMatch(/<h[3-6]>/);
  });

  it('should style the mission-abandon-btn with game fonts and colors', () => {
    expect(css).toMatch(/\.mission-abandon-btn/);
    expect(css).toMatch(/\.mission-abandon-btn[\s\S]*?font-family/);
    expect(css).toMatch(/\.mission-abandon-btn[\s\S]*?cursor:\s*pointer/);
  });

  it('should use danger color styling for the abandon button', () => {
    expect(css).toMatch(/\.mission-abandon-btn[\s\S]*?border/);
    expect(css).toMatch(/\.mission-abandon-btn[\s\S]*?background/);
  });
});
