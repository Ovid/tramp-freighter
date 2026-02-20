import { useState, useEffect, useRef } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { MISSION_CARGO_TYPES } from '@game/constants.js';

function hasIllegalCargo(cargo) {
  return (cargo || []).some(
    (item) => item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)
  );
}

export function RumorAlert() {
  const location = useGameEvent('locationChanged');
  const cargo = useGameEvent('cargoChanged');
  const [visible, setVisible] = useState(false);
  const prevLocationRef = useRef(null);

  useEffect(() => {
    if (location !== null && location !== prevLocationRef.current) {
      prevLocationRef.current = location;
      if (hasIllegalCargo(cargo)) {
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [location, cargo]);

  if (!visible) return null;

  return (
    <div className="rumor-alert">
      Word of your illicit cargo is spreading...
    </div>
  );
}
