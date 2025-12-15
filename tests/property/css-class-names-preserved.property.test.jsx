import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button } from '../../src/components/Button.jsx';
import { Modal } from '../../src/components/Modal.jsx';
import { Card } from '../../src/components/Card.jsx';

/**
 * Property-based tests for CSS class name preservation.
 *
 * React Migration Spec, Property 30: CSS class names preserved
 * Validates: Requirements 10.1
 *
 * For any component rendering, the component should use the same CSS class names
 * as the vanilla version.
 */

/**
 * Property: Button component uses correct CSS class names
 *
 * For any button variant, it should use the expected CSS class names.
 */
describe('Property: Button CSS class names preserved', () => {
  it('should use btn base class for all buttons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'danger'),
        (variant) => {
          cleanup();

          render(<Button variant={variant}>Test</Button>);

          const button = screen.getByRole('button');

          // Verify base class
          expect(button.classList.contains('btn')).toBe(true);

          // Verify variant class
          expect(button.classList.contains(`btn-${variant}`)).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Modal component uses correct CSS class names
 *
 * For any modal, it should use the expected CSS class names.
 */
describe('Property: Modal CSS class names preserved', () => {
  it('should use correct class names for modal structure', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        cleanup();

        const { container } = render(
          <Modal isOpen={true} onClose={() => {}} title="Test Modal">
            {content}
          </Modal>
        );

        // Verify modal overlay class
        const overlay = document.body.querySelector('.modal-overlay');
        expect(overlay).not.toBeNull();

        // Verify modal dialog class
        const dialog = document.body.querySelector('.modal-dialog');
        expect(dialog).not.toBeNull();

        // Verify modal content class
        const modalContent = document.body.querySelector('.modal-content');
        expect(modalContent).not.toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });
});

/**
 * Property: Card component uses correct CSS class names
 *
 * For any card, it should use the expected CSS class names.
 */
describe('Property: Card CSS class names preserved', () => {
  it('should use card base class', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (content) => {
        cleanup();

        const { container } = render(<Card>{content}</Card>);

        // Verify card class
        const card = container.querySelector('.card');
        expect(card).not.toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should use card-header class when title provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (title, content) => {
          cleanup();

          const { container } = render(<Card title={title}>{content}</Card>);

          // Verify card-header class
          const header = container.querySelector('.card-header');
          expect(header).not.toBeNull();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
