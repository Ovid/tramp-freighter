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

  completeMission(missionId) {
    this.validateState();
    const state = this.getState();

    const missionIndex = state.missions.active.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      return { success: false, reason: 'Mission not found in active missions.' };
    }

    const mission = state.missions.active[missionIndex];

    if (mission.type === 'delivery') {
      if (mission.requirements.destination !== state.player.currentSystem) {
        return { success: false, reason: 'You are not at the mission destination.' };
      }
      if (mission.requirements.cargo) {
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        if (totalCargo < mission.requirements.quantity) {
          return { success: false, reason: `Not enough ${mission.requirements.cargo} in cargo.` };
        }
      }
    }

    if (mission.type === 'fetch') {
      if (mission.giverSystem !== undefined && mission.giverSystem !== state.player.currentSystem) {
        return { success: false, reason: 'You are not at the mission destination.' };
      }
      if (mission.requirements.cargo) {
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        if (totalCargo < mission.requirements.quantity) {
          return { success: false, reason: `Not enough ${mission.requirements.cargo} in cargo.` };
        }
      }
    }

    if (mission.type === 'intel') {
      if (mission.giverSystem !== undefined && mission.giverSystem !== state.player.currentSystem) {
        return { success: false, reason: 'You are not at the mission destination.' };
      }
      if (mission.requirements.targets) {
        const unvisited = mission.requirements.targets.filter(
          (t) => !state.world.visitedSystems.includes(t)
        );
        if (unvisited.length > 0) {
          return { success: false, reason: 'Not all target systems have been visited.' };
        }
      }
    }

    if (mission.type === 'passenger') {
      if (mission.requirements.destination !== state.player.currentSystem) {
        return { success: false, reason: 'You are not at the passenger destination.' };
      }
    }

    state.missions.active.splice(missionIndex, 1);
    state.missions.completed.push(missionId);

    if (mission.rewards.credits) {
      state.player.credits += mission.rewards.credits;
      this.emit('creditsChanged', state.player.credits);
    }

    if (mission.rewards.faction) {
      for (const [faction, amount] of Object.entries(mission.rewards.faction)) {
        this.gameStateManager.modifyFactionRep(faction, amount, 'mission');
      }
    }

    if (mission.rewards.rep) {
      for (const [npcId, amount] of Object.entries(mission.rewards.rep)) {
        this.gameStateManager.modifyRep(npcId, amount, 'mission');
      }
    }

    if (mission.rewards.karma) {
      this.gameStateManager.modifyKarma(mission.rewards.karma, 'mission');
    }

    this.emit('missionsChanged', state.missions);
    this.gameStateManager.saveGame();

    return { success: true, rewards: mission.rewards };
  }

  checkMissionDeadlines() {
    this.validateState();
    const state = this.getState();
    const currentDay = state.player.daysElapsed;

    const expired = [];
    const remaining = [];

    for (const mission of state.missions.active) {
      if (mission.deadlineDay !== undefined && currentDay > mission.deadlineDay) {
        expired.push(mission);
      } else {
        remaining.push(mission);
      }
    }

    if (expired.length === 0) return;

    state.missions.active = remaining;

    for (const mission of expired) {
      state.missions.failed.push(mission.id);

      if (mission.penalties && mission.penalties.failure) {
        if (mission.penalties.failure.rep) {
          for (const [npcId, amount] of Object.entries(mission.penalties.failure.rep)) {
            this.gameStateManager.modifyRep(npcId, amount, 'mission_fail');
          }
        }
        if (mission.penalties.failure.karma) {
          this.gameStateManager.modifyKarma(mission.penalties.failure.karma, 'mission_fail');
        }
      }
    }

    this.emit('missionsChanged', state.missions);
  }

  getActiveMissions() {
    this.validateState();
    return this.getState().missions.active;
  }
}
