import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RotationSpeedSlider } from '../../src/features/navigation/RotationSpeedSlider';
import { VISUAL_CONFIG } from '../../src/game/constants';

describe('RotationSpeedSlider', () => {
  afterEach(cleanup);

  it('is a labelled range with the configured bounds', () => {
    render(<RotationSpeedSlider value={3} onChange={() => {}} />);
    const input = screen.getByLabelText('Star Rotation');
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe(String(VISUAL_CONFIG.autoRotationMaxSpeed));
    expect(input.step).toBe(String(VISUAL_CONFIG.autoRotationStep));
    expect(input.getAttribute('aria-valuetext')).toBe('3 degrees per second');
  });

  it('announces Off at 0', () => {
    render(<RotationSpeedSlider value={0} onChange={() => {}} />);
    expect(
      screen.getByLabelText('Star Rotation').getAttribute('aria-valuetext')
    ).toBe('Off');
  });

  it('reports the new value as a number', () => {
    const onChange = vi.fn();
    render(<RotationSpeedSlider value={3} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Star Rotation'), {
      target: { value: '6.5' },
    });
    expect(onChange).toHaveBeenCalledWith(6.5);
  });
});
