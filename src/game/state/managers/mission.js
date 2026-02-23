import { BaseManager } from './base-manager.js';
import {
  COLE_DEBT_CONFIG,
  MISSION_CONFIG,
  PASSENGER_CONFIG,
} from '../../constants.js';
import { generateMissionBoard } from '../../mission-generator.js';

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
      return {
        success: false,
        reason: 'You already have this mission active.',
      };
    }

    if (
      mission.type === 'passenger' &&
      mission.requirements.cargoSpace >
        this.gameStateManager.getCargoRemaining()
    ) {
      return {
        success: false,
        reason: 'Not enough cargo space for this passenger.',
      };
    }

    // Check cargo space for cargo run missions
    if (mission.missionCargo) {
      if (
        mission.missionCargo.quantity >
        this.gameStateManager.getCargoRemaining()
      ) {
        return {
          success: false,
          reason: 'Not enough cargo space for mission cargo.',
        };
      }
    }

    const activeMission = {
      ...mission,
      acceptedDay: state.player.daysElapsed,
      deadlineDay: state.player.daysElapsed + mission.requirements.deadline,
    };

    state.missions.active.push(activeMission);
    state.missions.board = state.missions.board.filter(
      (m) => m.id !== mission.id
    );

    // Place mission cargo in hold for cargo run missions
    if (mission.missionCargo) {
      state.ship.cargo.push({
        good: mission.missionCargo.good,
        qty: mission.missionCargo.quantity,
        buyPrice: 0,
        missionId: mission.id,
      });
      this.emit('cargoChanged', state.ship.cargo);
    }

    this.emit('missionsChanged', { ...state.missions });
    this.gameStateManager.markDirty();

    return { success: true };
  }

  completeMission(missionId) {
    this.validateState();
    const state = this.getState();

    const missionIndex = state.missions.active.findIndex(
      (m) => m.id === missionId
    );
    if (missionIndex === -1) {
      return {
        success: false,
        reason: 'Mission not found in active missions.',
      };
    }

    const mission = state.missions.active[missionIndex];

    if (mission.type === 'delivery') {
      if (mission.requirements.destination !== state.player.currentSystem) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      // New-style cargo runs: check missionId-tagged cargo
      if (mission.missionCargo) {
        const hasMissionCargo = state.ship.cargo.some(
          (c) => c.missionId === mission.id
        );
        if (!hasMissionCargo) {
          return {
            success: false,
            reason: 'Mission cargo is no longer in your hold.',
          };
        }
      } else if (mission.requirements.cargo) {
        // Legacy: old-style cargo runs (backwards compat for existing saves)
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        if (totalCargo < mission.requirements.quantity) {
          return {
            success: false,
            reason: `Not enough ${mission.requirements.cargo} in cargo.`,
          };
        }
      }
    }

    if (mission.type === 'fetch') {
      if (
        mission.giverSystem !== undefined &&
        mission.giverSystem !== state.player.currentSystem
      ) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      if (mission.requirements.cargo) {
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        if (totalCargo < mission.requirements.quantity) {
          return {
            success: false,
            reason: `Not enough ${mission.requirements.cargo} in cargo.`,
          };
        }
      }
    }

    if (mission.type === 'intel') {
      if (
        mission.giverSystem !== undefined &&
        mission.giverSystem !== state.player.currentSystem
      ) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      if (mission.requirements.targets) {
        const unvisited = mission.requirements.targets.filter(
          (t) => !state.world.visitedSystems.includes(t)
        );
        if (unvisited.length > 0) {
          return {
            success: false,
            reason: 'Not all target systems have been visited.',
          };
        }
      }
    }

    if (mission.type === 'passenger') {
      if (mission.requirements.destination !== state.player.currentSystem) {
        return {
          success: false,
          reason: 'You are not at the passenger destination.',
        };
      }
    }

    state.missions.active.splice(missionIndex, 1);
    state.missions.completed.push(missionId);

    // Record completion for route saturation
    if (
      mission.requirements &&
      mission.requirements.destination !== undefined
    ) {
      if (!state.missions.completionHistory) {
        state.missions.completionHistory = [];
      }
      state.missions.completionHistory.push({
        from: mission.giverSystem,
        to: mission.requirements.destination,
        day: state.player.daysElapsed,
      });
    }

    if (mission.type === 'passenger') {
      const payment = this.calculatePassengerPayment(mission);
      state.player.credits += payment;
      this.emit('creditsChanged', state.player.credits);
    } else if (mission.rewards.credits) {
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

    // Cole favor missions: apply direct rep bypassing trust modifier
    if (mission.source === 'cole' && mission.coleRepReward) {
      this.gameStateManager.modifyColeRep(mission.coleRepReward);
    }

    if (mission.rewards.karma) {
      this.gameStateManager.modifyKarma(mission.rewards.karma, 'mission');
    }

    // Remove delivered cargo for delivery/fetch missions
    if (mission.type === 'delivery' && mission.missionCargo) {
      // New-style: remove by missionId
      state.ship.cargo = state.ship.cargo.filter(
        (c) => c.missionId !== mission.id
      );
      this.emit('cargoChanged', state.ship.cargo);
    } else if (
      (mission.type === 'delivery' || mission.type === 'fetch') &&
      mission.requirements.cargo
    ) {
      // Legacy: remove by good type and quantity
      this.gameStateManager.removeCargoForMission(
        mission.requirements.cargo,
        mission.requirements.quantity
      );
    }

    this.emit('missionsChanged', { ...state.missions });
    this.gameStateManager.markDirty();

    return { success: true, rewards: mission.rewards };
  }

  updatePassengerSatisfaction(missionId, event) {
    const state = this.getState();
    const mission = state.missions.active.find((m) => m.id === missionId);
    if (!mission || mission.type !== 'passenger') return;

    const weights = mission.passenger.satisfactionWeights;
    const impacts = PASSENGER_CONFIG.SATISFACTION_IMPACTS;

    let drop = 0;
    if (event === 'delay') {
      drop = Math.round(impacts.DELAY * (weights.speed || 0));
    } else if (event === 'combat') {
      drop = Math.round(impacts.COMBAT * (weights.safety || 0));
    } else if (event === 'low_life_support') {
      drop = Math.round(impacts.LOW_LIFE_SUPPORT * (weights.comfort || 0));
    }

    mission.passenger.satisfaction = Math.max(
      0,
      Math.min(100, mission.passenger.satisfaction - drop)
    );
    this.emit('missionsChanged', { ...state.missions });
  }

  calculatePassengerPayment(mission) {
    const base = mission.rewards.credits;
    const satisfaction = mission.passenger.satisfaction;
    const thresholds = PASSENGER_CONFIG.SATISFACTION_THRESHOLDS;
    const multipliers = PASSENGER_CONFIG.PAYMENT_MULTIPLIERS;

    let multiplier;
    if (satisfaction >= thresholds.VERY_SATISFIED)
      multiplier = multipliers.VERY_SATISFIED;
    else if (satisfaction >= thresholds.SATISFIED)
      multiplier = multipliers.SATISFIED;
    else if (satisfaction >= thresholds.NEUTRAL)
      multiplier = multipliers.NEUTRAL;
    else if (satisfaction >= thresholds.DISSATISFIED)
      multiplier = multipliers.DISSATISFIED;
    else multiplier = multipliers.VERY_DISSATISFIED;

    const state = this.getState();
    if (state.player.daysElapsed <= mission.deadlineDay) {
      multiplier += multipliers.ON_TIME_BONUS;
    }

    return Math.round(base * multiplier);
  }

  abandonMission(missionId) {
    this.validateState();
    const state = this.getState();

    const missionIndex = state.missions.active.findIndex(
      (m) => m.id === missionId
    );
    if (missionIndex === -1) {
      return {
        success: false,
        reason: 'Mission not found in active missions.',
      };
    }

    const mission = state.missions.active[missionIndex];

    if (mission.abandonable === false) {
      return { success: false, reason: 'This mission cannot be abandoned.' };
    }

    state.missions.active.splice(missionIndex, 1);
    state.missions.failed.push(missionId);

    // Remove mission cargo from hold
    if (mission.missionCargo) {
      state.ship.cargo = state.ship.cargo.filter(
        (c) => c.missionId !== mission.id
      );
      this.emit('cargoChanged', state.ship.cargo);
    }

    if (mission.penalties && mission.penalties.failure) {
      if (mission.penalties.failure.rep) {
        for (const [npcId, amount] of Object.entries(
          mission.penalties.failure.rep
        )) {
          this.gameStateManager.modifyRep(npcId, amount, 'mission_abandon');
        }
      }
      if (mission.penalties.failure.karma) {
        this.gameStateManager.modifyKarma(
          mission.penalties.failure.karma,
          'mission_abandon'
        );
      }
    }

    this.emit('missionsChanged', { ...state.missions });
    this.gameStateManager.markDirty();

    return { success: true };
  }

  checkMissionDeadlines() {
    this.validateState();
    const state = this.getState();
    const currentDay = state.player.daysElapsed;

    const expired = [];
    const remaining = [];

    for (const mission of state.missions.active) {
      if (
        mission.deadlineDay !== undefined &&
        currentDay > mission.deadlineDay
      ) {
        expired.push(mission);
      } else {
        remaining.push(mission);
      }
    }

    if (expired.length === 0) return;

    state.missions.active = remaining;

    let cargoChanged = false;

    for (const mission of expired) {
      state.missions.failed.push(mission.id);

      // Remove mission cargo from hold
      if (mission.missionCargo) {
        state.ship.cargo = state.ship.cargo.filter(
          (c) => c.missionId !== mission.id
        );
        cargoChanged = true;
      }

      if (mission.penalties && mission.penalties.failure) {
        if (mission.penalties.failure.rep) {
          for (const [npcId, amount] of Object.entries(
            mission.penalties.failure.rep
          )) {
            this.gameStateManager.modifyRep(npcId, amount, 'mission_fail');
          }
        }
        if (mission.penalties.failure.karma) {
          this.gameStateManager.modifyKarma(
            mission.penalties.failure.karma,
            'mission_fail'
          );
        }
        if (mission.penalties.failure.faction) {
          for (const [faction, amount] of Object.entries(
            mission.penalties.failure.faction
          )) {
            this.gameStateManager.modifyFactionRep(
              faction,
              amount,
              'mission_fail'
            );
          }
        }
      }

      // Cole favor mission failure: direct rep penalty
      if (mission.source === 'cole') {
        this.gameStateManager.modifyColeRep(COLE_DEBT_CONFIG.REP_FAVOR_FAIL);
      }
    }

    if (cargoChanged) {
      this.emit('cargoChanged', state.ship.cargo);
    }

    this.emit('missionsChanged', { ...state.missions });
  }

  refreshMissionBoard() {
    this.validateState();
    const state = this.getState();
    const currentDay = Math.floor(state.player.daysElapsed);

    if (
      state.missions.board.length > 0 &&
      state.missions.boardLastRefresh === currentDay
    ) {
      return state.missions.board;
    }

    // Prune stale completion history
    if (!state.missions.completionHistory) {
      state.missions.completionHistory = [];
    }
    const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
    state.missions.completionHistory = state.missions.completionHistory
      .filter((entry) => entry.day > windowStart)
      .slice(-MISSION_CONFIG.SATURATION_MAX_HISTORY);

    const dangerZone =
      typeof this.gameStateManager.getDangerZone === 'function'
        ? this.gameStateManager.getDangerZone(state.player.currentSystem)
        : 'safe';

    const destinationDangerZoneFn =
      typeof this.gameStateManager.getDangerZone === 'function'
        ? (systemId) => this.gameStateManager.getDangerZone(systemId)
        : null;

    const board = generateMissionBoard(
      state.player.currentSystem,
      this.gameStateManager.starData,
      this.gameStateManager.wormholeData,
      dangerZone,
      undefined,
      destinationDangerZoneFn,
      state.missions.completionHistory,
      currentDay
    );

    state.missions.board = board;
    state.missions.boardLastRefresh = currentDay;
    this.emit('missionsChanged', { ...state.missions });

    return board;
  }

  getCompletableMissions() {
    this.validateState();
    const state = this.getState();

    return state.missions.active.filter((mission) => {
      if (mission.type === 'delivery') {
        if (mission.requirements.destination !== state.player.currentSystem)
          return false;
        if (mission.missionCargo) {
          return state.ship.cargo.some((c) => c.missionId === mission.id);
        }
        if (mission.requirements.cargo) {
          const totalCargo = state.ship.cargo
            .filter((c) => c.good === mission.requirements.cargo)
            .reduce((sum, c) => sum + c.qty, 0);
          return totalCargo >= mission.requirements.quantity;
        }
        return true;
      }
      if (mission.type === 'fetch') {
        if (mission.giverSystem !== state.player.currentSystem) return false;
        if (mission.requirements.cargo) {
          const totalCargo = state.ship.cargo
            .filter((c) => c.good === mission.requirements.cargo)
            .reduce((sum, c) => sum + c.qty, 0);
          return totalCargo >= mission.requirements.quantity;
        }
        return true;
      }
      if (mission.type === 'intel') {
        if (mission.giverSystem !== state.player.currentSystem) return false;
        return mission.requirements.targets.every((t) =>
          state.world.visitedSystems.includes(t)
        );
      }
      if (mission.type === 'passenger') {
        return mission.requirements.destination === state.player.currentSystem;
      }
      return false;
    });
  }

  failMissionsDueToCargoLoss() {
    this.validateState();
    const state = this.getState();

    const toFail = [];
    const toKeep = [];

    for (const mission of state.missions.active) {
      if (mission.missionCargo) {
        // Check if this mission's cargo is still in the hold
        const hasCargo = state.ship.cargo.some(
          (c) => c.missionId === mission.id
        );
        if (!hasCargo) {
          toFail.push(mission);
        } else {
          toKeep.push(mission);
        }
      } else {
        toKeep.push(mission);
      }
    }

    if (toFail.length === 0) return;

    state.missions.active = toKeep;

    for (const mission of toFail) {
      state.missions.failed.push(mission.id);

      if (mission.penalties && mission.penalties.failure) {
        if (mission.penalties.failure.faction) {
          for (const [faction, amount] of Object.entries(
            mission.penalties.failure.faction
          )) {
            this.gameStateManager.modifyFactionRep(
              faction,
              amount,
              'mission_cargo_confiscated'
            );
          }
        }
      }
    }

    this.emit('missionsChanged', { ...state.missions });
  }

  getActiveMissions() {
    this.validateState();
    return this.getState().missions.active;
  }
}
