'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sanitizeShipName } from '../../js/game-state.js';
import { SHIP_CONFIG } from '../../js/game-constants.js';

const DEFAULT_SHIP_NAME = SHIP_CONFIG.DEFAULT_NAME;

/**
 * Property-Based Tests for Ship Name Sanitization
 *
 * Feature: ship-personality, Property 10: Ship Name Sanitization
 * Validates: Requirements 4.2, 4.3, 10.3, 10.5
 */

describe('Property: Ship Name Sanitization', () => {
  it('Property 10: For any ship name input, sanitized result should have HTML tags removed and be limited to 50 characters, with empty inputs defaulting to "Serendipity"', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Empty strings and whitespace-only strings
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\n'),
          // Normal strings
          fc.string(),
          // Strings with HTML tags
          fc.string().map((s) => `<div>${s}</div>`),
          fc.string().map((s) => `<script>${s}</script>`),
          fc.string().map((s) => `${s}<br/>`),
          // Very long strings
          fc.string({ minLength: 51, maxLength: 200 }),
          // Strings with mixed content
          fc
            .tuple(fc.string(), fc.string(), fc.string())
            .map(([a, b, c]) => `${a}<tag>${b}</tag>${c}`)
        ),
        (input) => {
          const result = sanitizeShipName(input);

          // Property 1: Empty or whitespace-only inputs return default name
          if (!input || input.trim().length === 0) {
            expect(result).toBe(DEFAULT_SHIP_NAME);
            return true;
          }

          // Property 2: Result should not contain HTML tags
          expect(result).not.toMatch(/<[^>]*>/);

          // Property 3: Result should be trimmed (no leading/trailing whitespace)
          expect(result).toBe(result.trim());

          // Property 4: Result should be at most 50 characters
          expect(result.length).toBeLessThanOrEqual(50);

          // Property 5: If sanitization results in empty string, return default
          const sanitizedWithoutTags = input.replace(/<[^>]*>/g, '').trim();
          if (sanitizedWithoutTags.length === 0) {
            expect(result).toBe(DEFAULT_SHIP_NAME);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle specific edge cases correctly', () => {
    // Empty string
    expect(sanitizeShipName('')).toBe(DEFAULT_SHIP_NAME);

    // Whitespace only
    expect(sanitizeShipName('   ')).toBe(DEFAULT_SHIP_NAME);
    expect(sanitizeShipName('\t\n')).toBe(DEFAULT_SHIP_NAME);

    // HTML tags only (empty after removal)
    expect(sanitizeShipName('<div></div>')).toBe(DEFAULT_SHIP_NAME);

    // HTML tags with content (content remains after tag removal)
    expect(sanitizeShipName('<script>alert("xss")</script>')).toBe(
      'alert("xss")'
    );

    // Normal name
    expect(sanitizeShipName('Millennium Falcon')).toBe('Millennium Falcon');

    // Name with HTML tags
    expect(sanitizeShipName('<b>Serenity</b>')).toBe('Serenity');
    expect(sanitizeShipName('Enterprise<script>bad()</script>')).toBe(
      'Enterprisebad()'
    );

    // Name with leading/trailing whitespace
    expect(sanitizeShipName('  Rocinante  ')).toBe('Rocinante');

    // Name exactly 50 characters
    const fiftyChars = 'a'.repeat(50);
    expect(sanitizeShipName(fiftyChars)).toBe(fiftyChars);

    // Name over 50 characters
    const sixtyChars = 'a'.repeat(60);
    expect(sanitizeShipName(sixtyChars)).toBe('a'.repeat(50));

    // Name with HTML and over 50 characters
    const longWithHtml = '<div>' + 'a'.repeat(60) + '</div>';
    expect(sanitizeShipName(longWithHtml)).toBe('a'.repeat(50));
  });
});
