import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Auto-clear viewingSystemId on mobile station entry', () => {
  const appCode = readFileSync(resolve('src/App.jsx'), 'utf-8');

  it('should clear viewingSystemId when docking on mobile', () => {
    // Verify the isMobile check exists in the dock handler
    expect(appCode).toContain('isMobile');
    expect(appCode).toMatch(
      /handleDock[\s\S]*?isMobile[\s\S]*?setViewingSystemId\(null\)/
    );
  });
});
