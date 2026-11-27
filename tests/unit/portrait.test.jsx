import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Portrait } from '../../src/features/portraits/Portrait.jsx';

describe('Portrait', () => {
  it('renders a decorative lazy image', () => {
    const { container } = render(
      <Portrait src="/portraits/npc/cole_sol.webp" />
    );
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/portraits/npc/cole_sol.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.className).toBe('portrait');
  });

  it('renders nothing once the image fails to load', () => {
    const { container } = render(<Portrait src="/portraits/npc/nobody.webp" />);
    fireEvent.error(container.querySelector('img'));
    expect(container.firstChild).toBeNull();
  });
});
