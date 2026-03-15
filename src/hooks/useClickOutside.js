import { useEffect, useRef } from 'react';

export function useClickOutside(ref, onClose, enabled = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e) => {
      // Click inside this panel — ignore
      if (ref.current?.contains(e.target)) return;

      // Click inside any other interactive zone — ignore
      if (e.target.closest('[data-panel]')) return;
      if (e.target.closest('#game-hud')) return;
      if (e.target.closest('#camera-controls')) return;
      if (e.target.closest('#dev-admin-btn')) return;
      if (e.target.closest('.modal-overlay')) return;

      onCloseRef.current();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.querySelector('.modal-overlay')) return;
        // Don't close if another panel is open (mirrors mousedown data-panel guard)
        const panels = document.querySelectorAll(
          '[data-panel]:not(#camera-controls)'
        );
        for (const panel of panels) {
          if (panel !== ref.current) return;
        }
        onCloseRef.current();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, enabled]);
}
