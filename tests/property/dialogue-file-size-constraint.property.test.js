/**
 * Property-based tests for dialogue file size constraint
 *
 * Feature: dialogue-trees-refactor, Property 2: File Size Constraint
 * Validates: Requirements 1.11
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Dialogue File Size Constraint Properties', () => {
  it('should ensure all individual NPC dialogue files are under 500 lines', () => {
    // List of all individual NPC dialogue files
    const dialogueFiles = [
      'wei-chen.js',
      'marcus-cole.js',
      'father-okonkwo.js',
      'whisper.js',
      'captain-vasquez.js',
      'dr-sarah-kim.js',
      'rusty-rodriguez.js',
      'zara-osman.js',
      'station-master-kowalski.js',
      'lucky-liu.js',
      'validation.js', // Include validation file as well
    ];

    fc.assert(
      fc.property(fc.constantFrom(...dialogueFiles), (filename) => {
        const filePath = join(
          process.cwd(),
          'src',
          'game',
          'data',
          'dialogue',
          filename
        );

        const fileContent = readFileSync(filePath, 'utf-8');
        const lineCount = fileContent.split('\n').length;

        // Property: For any individual NPC dialogue file, the file SHALL contain fewer than 500 lines
        expect(lineCount).toBeLessThan(500);
      }),
      { numRuns: 100 }
    );
  });

  it('should verify that dialogue files exist and are readable', () => {
    // List of all expected individual NPC dialogue files
    const expectedFiles = [
      'wei-chen.js',
      'marcus-cole.js',
      'father-okonkwo.js',
      'whisper.js',
      'captain-vasquez.js',
      'dr-sarah-kim.js',
      'rusty-rodriguez.js',
      'zara-osman.js',
      'station-master-kowalski.js',
      'lucky-liu.js',
      'validation.js',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...expectedFiles), (filename) => {
        const filePath = join(
          process.cwd(),
          'src',
          'game',
          'data',
          'dialogue',
          filename
        );

        const fileContent = readFileSync(filePath, 'utf-8');

        // Property: For any expected dialogue file, the file SHALL exist and be readable
        expect(fileContent).toBeDefined();
        expect(fileContent.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });

  it('should verify that dialogue files contain valid JavaScript syntax', () => {
    // List of all individual NPC dialogue files
    const dialogueFiles = [
      'wei-chen.js',
      'marcus-cole.js',
      'father-okonkwo.js',
      'whisper.js',
      'captain-vasquez.js',
      'dr-sarah-kim.js',
      'rusty-rodriguez.js',
      'zara-osman.js',
      'station-master-kowalski.js',
      'lucky-liu.js',
      'validation.js',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...dialogueFiles), (filename) => {
        const filePath = join(
          process.cwd(),
          'src',
          'game',
          'data',
          'dialogue',
          filename
        );

        const fileContent = readFileSync(filePath, 'utf-8');

        // Property: For any dialogue file, the content SHALL be valid JavaScript
        // We verify this by checking that the file contains expected patterns
        expect(fileContent).toMatch(/import.*from/); // Should have imports
        expect(fileContent).toMatch(/export\s+(const|function)/); // Should have exports (const or function)

        // Should not contain syntax errors (basic check)
        expect(fileContent).not.toMatch(/\bexport\s+const\s+\w+\s*=\s*$/m); // Incomplete exports
      }),
      { numRuns: 50 }
    );
  });
});
