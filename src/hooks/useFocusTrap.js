import { useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside a modal dialog. A backdrop only blocks the
 * pointer, so without this, Tab can reach (and Enter can press) controls
 * behind the dialog.
 *
 * On activation: remembers the focused element and focuses the dialog's
 * first focusable element. On deactivation or unmount: restores focus, or
 * moves it to #main-content when the original element is gone.
 */
export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const previous = document.activeElement;
    ref.current.querySelector(FOCUSABLE_SELECTOR)?.focus();

    // Document-level so it still catches Tab after focus escapes, e.g. a
    // chained narrative event re-renders away the focused button.
    // ponytail: assumes one trap at a time; nested traps would need a stack.
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || !ref.current) return;
      const focusable = ref.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = ref.current.contains(document.activeElement);

      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (!inside || document.activeElement === last)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // The opener is often unmounted by the dialog's own action (Proceed
      // closes the panel that held the Jump button); don't strand focus on body.
      if (previous && previous !== document.body && previous.isConnected) {
        previous.focus();
      } else {
        document.getElementById('main-content')?.focus();
      }
    };
  }, [ref, active]);
}
