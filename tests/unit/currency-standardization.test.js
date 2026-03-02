import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import glob from 'glob';

describe('Currency Standardization (#15)', () => {
  const componentFiles = glob.sync('src/features/**/*.jsx');

  it('ResourceBar should display ₡ prefix for credits', () => {
    const source = readFileSync('src/features/hud/ResourceBar.jsx', 'utf-8');
    expect(source).toContain('₡{credits');
  });

  it('ResourceBar should display ₡ prefix for debt', () => {
    const source = readFileSync('src/features/hud/ResourceBar.jsx', 'utf-8');
    expect(source).toContain('₡{debt');
  });

  it('Epilogue should display ₡ prefix for credits earned', () => {
    const source = readFileSync('src/features/endgame/Epilogue.jsx', 'utf-8');
    expect(source).toContain('₡{stats.creditsEarned');
  });

  it('no component file should use ¢ as currency symbol', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      expect(source, `Found ¢ in ${file}`).not.toMatch(/¢\d/);
      expect(source, `Found ¢{ in ${file}`).not.toMatch(/¢\{/);
    }
  });

  it('no component file should use cr{ as a currency prefix', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      // Catch patterns like "cr}" used as a currency prefix (e.g., cr{amount})
      expect(source, `Found cr{ currency prefix in ${file}`).not.toMatch(
        /\bcr\{/
      );
    }
  });

  it('no component file should use cr/unit as a currency rate', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      expect(source, `Found cr/unit in ${file}`).not.toMatch(/cr\/unit/);
    }
  });

  it('no component file should use cr as a currency suffix in JSX', () => {
    for (const file of componentFiles) {
      const source = readFileSync(file, 'utf-8');
      // Catch patterns like "} cr<" used as a currency suffix in JSX spans
      expect(source, `Found " cr<" currency suffix in ${file}`).not.toMatch(
        /\} cr</
      );
    }
  });
});
