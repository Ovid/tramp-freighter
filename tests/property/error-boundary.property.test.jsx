import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ErrorBoundary } from '../../src/components/ErrorBoundary.jsx';

// Suppress console.error during error boundary tests
// These errors are expected when testing error handling
let originalConsoleError;

beforeAll(() => {
  originalConsoleError = console.error;
  console.error = () => {}; // Suppress all console.error during tests
});

afterAll(() => {
  console.error = originalConsoleError;
});

/**
 * Component that throws an error when rendered.
 */
function ThrowError({ message }) {
  throw new Error(message);
}

/**
 * Component that renders successfully.
 */
function SuccessComponent({ text }) {
  return <div data-testid="success">{text}</div>;
}

/**
 * React Migration Spec, Property 38: Error boundaries catch component errors
 * Validates: Requirements 36.1, 36.2, 36.3
 *
 * For any React component throwing an error, an Error Boundary should catch it
 * and display a fallback UI instead of crashing the entire application.
 */
describe('Property: Error boundaries catch component errors', () => {
  it('should catch errors and display fallback UI', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          cleanup(); // Clean up DOM before each test run

          // Render component that throws error inside ErrorBoundary
          const { container } = render(
            <ErrorBoundary>
              <ThrowError message={errorMessage} />
            </ErrorBoundary>
          );

          // Verify fallback UI is displayed
          expect(screen.getByText('Something went wrong')).toBeInTheDocument();
          expect(screen.getByText('Reload Application')).toBeInTheDocument();

          // Verify error message is displayed
          const errorText = container.textContent;
          expect(errorText).toContain('Error:');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render children when no error occurs', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 2, maxLength: 100 })
          .filter((s) => s.trim().length >= 2), // Exclude whitespace-only and single-char strings
        (successText) => {
          cleanup(); // Clean up DOM before each test run

          // Render successful component inside ErrorBoundary
          render(
            <ErrorBoundary>
              <SuccessComponent text={successText} />
            </ErrorBoundary>
          );

          // Verify children are rendered normally
          const successElement = screen.getByTestId('success');
          expect(successElement).toBeInTheDocument();
          expect(successElement.textContent).toBe(successText);

          // Verify fallback UI is NOT displayed
          expect(
            screen.queryByText('Something went wrong')
          ).not.toBeInTheDocument();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should log error details when catching errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          cleanup(); // Clean up DOM before each test run

          // Track console.error calls
          const errorLogs = [];
          console.error = (...args) => {
            errorLogs.push(args);
          };

          try {
            // Render component that throws error
            render(
              <ErrorBoundary>
                <ThrowError message={errorMessage} />
              </ErrorBoundary>
            );

            // Verify error was logged (at least one log entry)
            expect(errorLogs.length).toBeGreaterThan(0);

            // Verify log contains error information
            // The ErrorBoundary logs with console.error('Error caught by ErrorBoundary:', error, errorInfo)
            const allLogs = errorLogs.flat().join(' ');
            expect(allLogs).toContain('Error caught by ErrorBoundary');

            return true;
          } finally {
            console.error = () => {}; // Reset to suppress errors
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should isolate errors to the boundary scope', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc
            .string({ minLength: 2, maxLength: 50 })
            .filter((s) => s.trim().length >= 2) // Exclude whitespace-only and single-char strings
        ),
        ([errorMessage, successText]) => {
          cleanup(); // Clean up DOM before each test run

          // Render multiple boundaries - one with error, one without
          const { container } = render(
            <div>
              <ErrorBoundary>
                <ThrowError message={errorMessage} />
              </ErrorBoundary>
              <ErrorBoundary>
                <SuccessComponent text={successText} />
              </ErrorBoundary>
            </div>
          );

          // Verify first boundary shows error UI
          const errorBoundaries = screen.getAllByText('Something went wrong');
          expect(errorBoundaries.length).toBe(1);

          // Verify second boundary renders children normally
          const successElement = screen.getByTestId('success');
          expect(successElement).toBeInTheDocument();
          expect(successElement.textContent).toBe(successText);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
