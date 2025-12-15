import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '../../src/components/Button.jsx';

/**
 * Property-based tests for Button component.
 *
 * Verifies universal properties that should hold for all button configurations.
 */

/**
 * Property: All variant classes are applied correctly
 *
 * For any valid variant, the button should have the correct CSS class.
 */
describe('Property: Button variant classes', () => {
  it('should apply correct variant class for all variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'danger'),
        (variant) => {
          cleanup();

          render(<Button variant={variant}>Test</Button>);

          const button = screen.getByRole('button');
          expect(button.className).toContain(`btn-${variant}`);
          expect(button.className).toContain('btn');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should default to primary variant when not specified', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (buttonText) => {
        cleanup();

        render(<Button>{buttonText}</Button>);

        const button = screen.getByRole('button');
        expect(button.className).toContain('btn-primary');

        return true;
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: Disabled state prevents onClick from firing
 *
 * For any button with disabled=true, clicking should not trigger onClick handler.
 */
describe('Property: Button disabled state', () => {
  it('should prevent onClick when disabled', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (buttonText) => {
        cleanup();

        let clickCount = 0;
        const handleClick = () => {
          clickCount++;
        };

        render(
          <Button onClick={handleClick} disabled={true}>
            {buttonText}
          </Button>
        );

        const button = screen.getByRole('button');

        // Verify disabled attribute is set
        expect(button.disabled).toBe(true);

        // Verify disabled class is applied
        expect(button.className).toContain('btn-disabled');

        // Try to click - should not fire
        fireEvent.click(button);

        // onClick should not have been called
        expect(clickCount).toBe(0);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should allow onClick when not disabled', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (buttonText) => {
        cleanup();

        let clickCount = 0;
        const handleClick = () => {
          clickCount++;
        };

        render(
          <Button onClick={handleClick} disabled={false}>
            {buttonText}
          </Button>
        );

        const button = screen.getByRole('button');

        // Verify disabled attribute is not set
        expect(button.disabled).toBe(false);

        // Verify disabled class is not applied
        expect(button.className).not.toContain('btn-disabled');

        // Click should fire
        fireEvent.click(button);

        // onClick should have been called
        expect(clickCount).toBe(1);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Custom className is merged with base classes
 *
 * For any custom className, it should be added to the button without
 * removing base classes.
 */
describe('Property: Button className merging', () => {
  it('should merge custom className with base classes', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !s.includes(' ')),
        fc.constantFrom('primary', 'secondary', 'danger'),
        (customClass, variant) => {
          cleanup();

          render(
            <Button variant={variant} className={customClass}>
              Test
            </Button>
          );

          const button = screen.getByRole('button');

          // Should have base class
          expect(button.className).toContain('btn');

          // Should have variant class
          expect(button.className).toContain(`btn-${variant}`);

          // Should have custom class
          expect(button.className).toContain(customClass);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty className gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'danger'),
        (variant) => {
          cleanup();

          render(
            <Button variant={variant} className="">
              Test
            </Button>
          );

          const button = screen.getByRole('button');

          // Should still have base classes
          expect(button.className).toContain('btn');
          expect(button.className).toContain(`btn-${variant}`);

          // Should not have extra spaces
          expect(button.className.trim()).not.toMatch(/\s{2,}/);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: All button types render correctly
 *
 * For any valid button type, the type attribute should be set correctly.
 */
describe('Property: Button type attribute', () => {
  it('should set correct type attribute for all types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('button', 'submit', 'reset'),
        (buttonType) => {
          cleanup();

          render(<Button type={buttonType}>Test</Button>);

          const button = screen.getByRole('button');
          expect(button.type).toBe(buttonType);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should default to button type when not specified', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (buttonText) => {
        cleanup();

        render(<Button>{buttonText}</Button>);

        const button = screen.getByRole('button');
        expect(button.type).toBe('button');

        return true;
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: Rest props are spread correctly
 *
 * For any additional props, they should be passed through to the button element.
 */
describe('Property: Button rest props spreading', () => {
  it('should spread additional props to button element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (ariaLabel, dataTestId) => {
          cleanup();

          render(
            <Button aria-label={ariaLabel} data-testid={dataTestId}>
              Test
            </Button>
          );

          const button = screen.getByRole('button');

          // Verify aria-label is set
          expect(button.getAttribute('aria-label')).toBe(ariaLabel);

          // Verify data-testid is set
          expect(button.getAttribute('data-testid')).toBe(dataTestId);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Button children render correctly
 *
 * For any children content, it should be rendered inside the button.
 */
describe('Property: Button children rendering', () => {
  it('should render text children correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (buttonText) => {
        cleanup();

        render(<Button>{buttonText}</Button>);

        const button = screen.getByRole('button');
        expect(button.textContent).toBe(buttonText);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should render complex children correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (text1, text2) => {
          cleanup();

          render(
            <Button>
              <span>{text1}</span>
              <span>{text2}</span>
            </Button>
          );

          const button = screen.getByRole('button');
          expect(button.textContent).toBe(text1 + text2);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: onClick handler is called with correct event
 *
 * For any button click, the onClick handler should receive a valid event object.
 */
describe('Property: Button onClick event', () => {
  it('should call onClick with valid event object', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (buttonText) => {
        cleanup();

        let receivedEvent = null;
        const handleClick = (event) => {
          receivedEvent = event;
        };

        render(<Button onClick={handleClick}>{buttonText}</Button>);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Verify event was received
        expect(receivedEvent).not.toBeNull();

        // Verify event has expected properties
        expect(receivedEvent.type).toBe('click');
        expect(receivedEvent.target).toBe(button);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
