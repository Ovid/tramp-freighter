import { Modal } from '../../components/Modal';
import { StatsSection } from './StatsSection';
import { AchievementsList } from './AchievementsList';

export function AchievementsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Achievements & Stats">
      <div id="achievements-modal">
        <StatsSection />
        <hr
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '15px 0' }}
        />
        <AchievementsList />
      </div>
    </Modal>
  );
}
