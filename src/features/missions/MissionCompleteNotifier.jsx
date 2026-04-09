import { useState, useEffect, useRef } from 'react';
import { useGameAction } from '../../hooks/useGameAction';
import { useGameEvent } from '../../hooks/useGameEvent';
import { Modal } from '../../components/Modal';
import { EVENT_NAMES } from '../../game/constants.js';

function getSatisfactionLabel(satisfaction) {
  if (satisfaction >= 80) return 'Very Satisfied';
  if (satisfaction >= 60) return 'Satisfied';
  if (satisfaction >= 40) return 'Neutral';
  if (satisfaction >= 20) return 'Dissatisfied';
  return 'Very Dissatisfied';
}

export function MissionCompleteNotifier() {
  const { completeMission, getCompletableMissions, calculateTradeWithholding } =
    useGameAction();
  // Re-render trigger only — getCompletableMissions() returns the derived view
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const [completable, setCompletable] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevIdsRef = useRef(null);

  useEffect(() => {
    const found = getCompletableMissions();
    const newIds = found.map((m) => m.id).join(',');
    setCompletable(found);
    // Only reset index when the set of completable missions actually changes,
    // not on every MISSIONS_CHANGED event (which fires from our own completeMission call)
    if (newIds !== prevIdsRef.current) {
      prevIdsRef.current = newIds;
      setCurrentIndex(0);
    }
  }, [missions, getCompletableMissions]);

  const current = completable[currentIndex];
  if (!current) return null;

  const handleComplete = () => {
    completeMission(current.id);
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  const handleDismiss = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleDismiss}
      title="Mission Complete!"
      showCloseButton={false}
    >
      <div className="mission-complete-body">
        <p className="mission-complete-title">{current.title}</p>
        {current.type === 'passenger' && current.passenger && (
          <div className="passenger-delivery-info">
            <p>{current.passenger.name} disembarks.</p>
            <div className="passenger-satisfaction">
              Satisfaction: {current.passenger.satisfaction}% (
              {getSatisfactionLabel(current.passenger.satisfaction)})
            </div>
          </div>
        )}
        {current.grossCredits > 0 &&
          (() => {
            const gross = current.grossCredits;
            const { withheld, playerReceives } =
              calculateTradeWithholding(gross);
            return (
              <div className="mission-complete-rewards">
                <h4>Rewards:</h4>
                <div>₡{gross}</div>
                {withheld > 0 && (
                  <>
                    <div className="withholding-line">
                      Cole&apos;s cut: -₡{withheld} (does not reduce your debt)
                    </div>
                    <div>You receive: ₡{playerReceives}</div>
                  </>
                )}
              </div>
            );
          })()}
      </div>
      <div className="modal-actions">
        <button className="modal-cancel" onClick={handleDismiss}>
          Later
        </button>
        <button className="modal-confirm" onClick={handleComplete}>
          Claim Reward
        </button>
      </div>
    </Modal>
  );
}
