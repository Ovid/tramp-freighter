import { useState } from 'react';

/**
 * Character portrait. Decorative (alt=""), because the character's name is the
 * adjacent heading. Missing art renders nothing rather than a broken icon;
 * tests/unit/portrait-assets.test.js is what catches missing files.
 */
export function Portrait({ src, className = 'portrait' }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (failedSrc === src) return null;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
