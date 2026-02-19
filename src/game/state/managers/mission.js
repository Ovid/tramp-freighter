import { BaseManager } from './base-manager.js';
import { MISSION_CONFIG } from '../../constants.js';

export class MissionManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  acceptMission(mission) {
    this.validateState();
    const state = this.getState();

    if (state.missions.active.length >= MISSION_CONFIG.MAX_ACTIVE) {
      return {
        success: false,
        reason: 'You have the maximum number of active missions.',
      };
    }

    if (state.missions.active.some((m) => m.id === mission.id)) {
      return { success: false, reason: 'You already have this mission active.' };
    }

    const activeMission = {
      ...mission,
      acceptedDay: state.player.daysElapsed,
      deadlineDay: state.player.daysElapsed + mission.requirements.deadline,
    };

    state.missions.active.push(activeMission);
    this.emit('missionsChanged', state.missions);
    this.gameStateManager.saveGame();

    return { success: true };
  }

  getActiveMissions() {
    this.validateState();
    return this.getState().missions.active;
  }
}
