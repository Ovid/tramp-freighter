import { useEffect, useRef } from 'react';

export function useClickOutside(ref, onClose, enabled = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
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
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, enabled]);
}
