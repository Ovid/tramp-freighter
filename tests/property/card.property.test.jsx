import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Card } from '../../src/components/Card.jsx';

/**
 * Property-based tests for Card component.
 *
 * Verifies universal properties that should hold for all card configurations.
 */

/**
 * Property: Title renders in header when provided
 *
 * For any title string, it should be rendered in the card header.
 */
describe('Property: Card title rendering', () => {
  it('should render title in header when provided', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (title, bodyContent) => {
          cleanup();

          render(<Card title={title}>{bodyContent}</Card>);

          // Title should be in the document
          // Use function matcher to handle whitespace normalization
          const titleElement = screen.getByText((content, element) => {
            return element.tagName === 'H3' && element.textContent === title;
          });
          expect(titleElement).toBeInTheDocument();

          // Title should be in an h3 with card-title class
          expect(titleElement.tagName).toBe('H3');
          expect(titleElement.className).toContain('card-title');

          // Header should exist
          const header = titleElement.closest('.card-header');
          expect(header).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not render header when title is not provided', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (bodyContent) => {
        cleanup();

        const { container } = render(<Card>{bodyContent}</Card>);

        // Header should not exist
        const header = container.querySelector('.card-header');
        expect(header).not.toBeInTheDocument();

        return true;
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: Custom header content renders when provided
 *
 * For any custom header content, it should be rendered in the card header.
 */
describe('Property: Card custom header rendering', () => {
  it('should render custom header content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (headerText, bodyContent) => {
          cleanup();

          render(
            <Card header={<div data-testid="custom-header">{headerText}</div>}>
              {bodyContent}
            </Card>
          );

          // Custom header should be in the document
          const customHeader = screen.getByTestId('custom-header');
          expect(customHeader).toBeInTheDocument();
          expect(customHeader.textContent).toBe(headerText);

          // Header container should exist
          const header = customHeader.closest('.card-header');
          expect(header).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render both title and custom header when both provided', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (title, headerText, bodyContent) => {
          cleanup();

          render(
            <Card
              title={title}
              header={<div data-testid="custom-header">{headerText}</div>}
            >
              {bodyContent}
            </Card>
          );

          // Both title and custom header should be present
          // Use function matcher to handle whitespace normalization
          const titleElement = screen.getByText((content, element) => {
            return element.tagName === 'H3' && element.textContent === title;
          });
          expect(titleElement).toBeInTheDocument();
          expect(screen.getByTestId('custom-header')).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Footer renders when provided
 *
 * For any footer content, it should be rendered in the card footer.
 */
describe('Property: Card footer rendering', () => {
  it('should render footer content when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (footerText, bodyContent) => {
          cleanup();

          render(
            <Card footer={<div data-testid="custom-footer">{footerText}</div>}>
              {bodyContent}
            </Card>
          );

          // Footer should be in the document
          const footer = screen.getByTestId('custom-footer');
          expect(footer).toBeInTheDocument();
          expect(footer.textContent).toBe(footerText);

          // Footer container should exist
          const footerContainer = footer.closest('.card-footer');
          expect(footerContainer).toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not render footer when not provided', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (bodyContent) => {
        cleanup();

        const { container } = render(<Card>{bodyContent}</Card>);

        // Footer should not exist
        const footer = container.querySelector('.card-footer');
        expect(footer).not.toBeInTheDocument();

        return true;
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: Body always contains children
 *
 * For any children content, it should always be rendered in the card body.
 */
describe('Property: Card body rendering', () => {
  it('should always render children in card body', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (bodyContent) => {
          cleanup();

          const { container } = render(<Card>{bodyContent}</Card>);

          // Body should exist
          const body = container.querySelector('.card-body');
          expect(body).toBeInTheDocument();

          // Body should contain children
          expect(body.textContent).toBe(bodyContent);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render complex children in card body', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (text1, text2) => {
          cleanup();

          const { container } = render(
            <Card>
              <div data-testid="child1">{text1}</div>
              <div data-testid="child2">{text2}</div>
            </Card>
          );

          // Body should exist
          const body = container.querySelector('.card-body');
          expect(body).toBeInTheDocument();

          // Both children should be in body
          expect(screen.getByTestId('child1')).toBeInTheDocument();
          expect(screen.getByTestId('child2')).toBeInTheDocument();

          // Body should contain both texts
          expect(body.textContent).toBe(text1 + text2);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Custom className is merged with base class
 *
 * For any custom className, it should be added to the card without
 * removing the base class.
 */
describe('Property: Card className merging', () => {
  it('should merge custom className with base class', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !s.includes(' ')),
        fc.string({ minLength: 1, maxLength: 50 }),
        (customClass, bodyContent) => {
          cleanup();

          const { container } = render(
            <Card className={customClass}>{bodyContent}</Card>
          );

          const card = container.querySelector('.card');

          // Should have base class
          expect(card.className).toContain('card');

          // Should have custom class
          expect(card.className).toContain(customClass);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty className gracefully', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (bodyContent) => {
        cleanup();

        const { container } = render(<Card className="">{bodyContent}</Card>);

        const card = container.querySelector('.card');

        // Should still have base class
        expect(card.className).toContain('card');

        // Should not have extra spaces
        expect(card.className.trim()).not.toMatch(/\s{2,}/);

        return true;
      }),
      { numRuns: 30 }
    );
  });
});

/**
 * Property: Rest props are spread correctly
 *
 * For any additional props, they should be passed through to the card element.
 */
describe('Property: Card rest props spreading', () => {
  it('should spread additional props to card element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (dataTestId, ariaLabel, bodyContent) => {
          cleanup();

          const { container } = render(
            <Card data-testid={dataTestId} aria-label={ariaLabel}>
              {bodyContent}
            </Card>
          );

          const card = container.querySelector('.card');

          // Verify data-testid is set
          expect(card.getAttribute('data-testid')).toBe(dataTestId);

          // Verify aria-label is set
          expect(card.getAttribute('aria-label')).toBe(ariaLabel);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Card structure is consistent
 *
 * For any card configuration, the structure should follow the expected pattern:
 * card > [header] > body > [footer]
 */
describe('Property: Card structure consistency', () => {
  it('should maintain consistent structure with all sections', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (title, bodyContent, footerText) => {
          cleanup();

          const { container } = render(
            <Card title={title} footer={<div>{footerText}</div>}>
              {bodyContent}
            </Card>
          );

          const card = container.querySelector('.card');
          const header = card.querySelector('.card-header');
          const body = card.querySelector('.card-body');
          const footer = card.querySelector('.card-footer');

          // All sections should exist
          expect(header).toBeInTheDocument();
          expect(body).toBeInTheDocument();
          expect(footer).toBeInTheDocument();

          // Verify order: header comes before body, body comes before footer
          const headerIndex = Array.from(card.children).indexOf(header);
          const bodyIndex = Array.from(card.children).indexOf(body);
          const footerIndex = Array.from(card.children).indexOf(footer);

          expect(headerIndex).toBeLessThan(bodyIndex);
          expect(bodyIndex).toBeLessThan(footerIndex);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain consistent structure with minimal sections', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (bodyContent) => {
        cleanup();

        const { container } = render(<Card>{bodyContent}</Card>);

        const card = container.querySelector('.card');
        const body = card.querySelector('.card-body');

        // Card and body should exist
        expect(card).toBeInTheDocument();
        expect(body).toBeInTheDocument();

        // Header and footer should not exist
        expect(card.querySelector('.card-header')).not.toBeInTheDocument();
        expect(card.querySelector('.card-footer')).not.toBeInTheDocument();

        return true;
      }),
      { numRuns: 30 }
    );
  });
});
