import { VISUAL_CONFIG } from '../../game/constants';

export function RotationSpeedSlider({ value, onChange, className }) {
  return (
    <input
      type="range"
      className={className}
      min={0}
      max={VISUAL_CONFIG.autoRotationMaxSpeed}
      step={VISUAL_CONFIG.autoRotationStep}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Star Rotation"
      aria-valuetext={value === 0 ? 'Off' : `${value} degrees per second`}
    />
  );
}
