import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('Starting Cargo in Briefing (#7)', () => {
  it('InstructionsModal should mention starting grain cargo', () => {
    const source = readFileSync(
      'src/features/instructions/InstructionsModal.jsx',
      'utf-8'
    );
    expect(source).toContain('grain');
    expect(source).toContain('Cargo Manifest');
  });
});
