import { BaseManager } from './base-manager.js';
import { SeededRandom } from '../../utils/seeded-random.js';
import {
  COLE_DEBT_CONFIG,
  MISSION_CONFIG,
  PASSENGER_CONFIG,
  EVENT_NAMES,
} from '../../constants.js';
import { generateMissionBoard } from '../../mission-generator.js';
import { partitionExpiredMissions } from '../../utils/calculators.js';

export class MissionManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
  }

  acceptMission(mission) {
    const missions = this.capabilities.getOwnState();

    const tanakaSlot = this.capabilities.isTanakaQuestActive?.() ? 1 : 0;
    const effectiveCount = missions.active.length + tanakaSlot;
    if (effectiveCount >= MISSION_CONFIG.MAX_ACTIVE) {
      return {
        success: false,
        reason: 'You have the maximum number of active missions.',
      };
    }

    if (missions.active.some((m) => m.id === mission.id)) {
      return {
        success: false,
        reason: 'You already have this mission active.',
      };
    }

    if (
      mission.type === 'passenger' &&
      mission.requirements.cargoSpace > this.capabilities.getCargoRemaining()
    ) {
      return {
        success: false,
        reason: 'Not enough cargo space for this passenger.',
      };
    }

    // Check cargo space for cargo run missions
    if (mission.missionCargo) {
      if (
        mission.missionCargo.quantity > this.capabilities.getCargoRemaining()
      ) {
        return {
          success: false,
          reason: 'Not enough cargo space for mission cargo.',
        };
      }
    }

    const activeMission = {
      ...mission,
      acceptedDay: this.capabilities.getDaysElapsed(),
      deadlineDay:
        this.capabilities.getDaysElapsed() + mission.requirements.deadline,
    };

    missions.active.push(activeMission);
    missions.board = missions.board.filter((m) => m.id !== mission.id);

    // Place mission cargo in hold for cargo run missions
    if (mission.missionCargo) {
      this.capabilities.updateCargo([
        ...this.capabilities.getShipCargo(),
        {
          good: mission.missionCargo.good,
          qty: mission.missionCargo.quantity,
          buyPrice: 0,
          missionId: mission.id,
        },
      ]);
    }

    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
    this.capabilities.markDirty();

    return { success: true };
  }

  completeMission(missionId) {
    const missions = this.capabilities.getOwnState();
    const currentSystem = this.capabilities.getCurrentSystem();
    const cargo = this.capabilities.getShipCargo();

    const missionIndex = missions.active.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      return {
        success: false,
        reason: 'Mission not found in active missions.',
      };
    }

    const mission = missions.active[missionIndex];

    if (mission.type === 'delivery') {
      if (mission.requirements.destination !== currentSystem) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      // New-style cargo runs: check missionId-tagged cargo
      if (mission.missionCargo) {
        if (!this.hasMissionCargo(mission.id)) {
          return {
            success: false,
            reason: 'Mission cargo is no longer in your hold.',
          };
        }
      } else if (mission.requirements.cargo) {
        // Legacy: old-style cargo runs (backwards compat for existing saves)
        const totalCargo = cargo
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
        mission.giverSystem !== currentSystem
      ) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      if (mission.requirements.cargo) {
        const totalCargo = cargo
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
        mission.giverSystem !== currentSystem
      ) {
        return {
          success: false,
          reason: 'You are not at the mission destination.',
        };
      }
      if (mission.requirements.targets) {
        const visitedSystems = this.capabilities.getVisitedSystems();
        const unvisited = mission.requirements.targets.filter(
          (t) => !visitedSystems.includes(t)
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
      if (mission.requirements.destination !== currentSystem) {
        return {
          success: false,
          reason: 'You are not at the passenger destination.',
        };
      }
    }

    missions.active.splice(missionIndex, 1);
    missions.completed.push(missionId);

    // Record completion for route saturation
    if (
      mission.requirements &&
      mission.requirements.destination !== undefined
    ) {
      missions.completionHistory.push({
        from: mission.giverSystem,
        to: mission.requirements.destination,
        day: this.capabilities.getDaysElapsed(),
      });
    }

    let grossCredits = 0;
    if (mission.type === 'passenger') {
      grossCredits = this.calculatePassengerPayment(mission);
    } else if (mission.rewards.credits) {
      grossCredits = mission.rewards.credits;
    }

    let withheld = 0;
    if (grossCredits > 0) {
      const result = this.capabilities.applyTradeWithholding(grossCredits);
      withheld = result.withheld;
      const playerReceives = grossCredits - withheld;
      this.capabilities.updateCredits(
        this.capabilities.getCredits() + playerReceives
      );
      this.capabilities.updateStats('creditsEarned', grossCredits);
      this.capabilities.emit(
        EVENT_NAMES.CREDITS_CHANGED,
        this.capabilities.getCredits()
      );
    }

    if (mission.rewards.faction) {
      for (const [faction, amount] of Object.entries(mission.rewards.faction)) {
        this.capabilities.modifyFactionRep(faction, amount, 'mission');
      }
    }

    if (mission.rewards.rep) {
      for (const [npcId, amount] of Object.entries(mission.rewards.rep)) {
        this.capabilities.modifyRep(npcId, amount, 'mission');
      }
    }

    // Cole favor missions: apply direct rep bypassing trust modifier
    if (mission.source === 'cole' && mission.coleRepReward) {
      this.capabilities.modifyColeRep(mission.coleRepReward);
    }

    if (mission.rewards.karma) {
      this.capabilities.modifyKarma(mission.rewards.karma, 'mission');
    }

    // Remove delivered cargo for delivery/fetch missions
    if (mission.type === 'delivery' && mission.missionCargo) {
      this.removeMissionCargo(mission.id);
    } else if (
      (mission.type === 'delivery' || mission.type === 'fetch') &&
      mission.requirements.cargo
    ) {
      // Legacy: remove by good type and quantity
      this.capabilities.removeCargoForMission(
        mission.requirements.cargo,
        mission.requirements.quantity
      );
    }

    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
    this.capabilities.markDirty();

    return { success: true, rewards: mission.rewards, withheld };
  }

  updatePassengerSatisfaction(missionId, event) {
    const missions = this.capabilities.getOwnState();
    const mission = missions.active.find((m) => m.id === missionId);
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
    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
  }

  modifyAllPassengerSatisfaction(delta) {
    const missions = this.capabilities.getOwnState();
    for (const mission of missions.active) {
      if (mission.type === 'passenger' && mission.passenger) {
        mission.passenger.satisfaction = Math.max(
          0,
          Math.min(100, mission.passenger.satisfaction + delta)
        );
      }
    }
    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
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

    if (this.capabilities.getDaysElapsed() <= mission.deadlineDay) {
      multiplier += multipliers.ON_TIME_BONUS;
    }

    return Math.round(base * multiplier);
  }

  abandonMission(missionId) {
    const missions = this.capabilities.getOwnState();

    const missionIndex = missions.active.findIndex((m) => m.id === missionId);
    if (missionIndex === -1) {
      return {
        success: false,
        reason: 'Mission not found in active missions.',
      };
    }

    const mission = missions.active[missionIndex];

    if (mission.abandonable === false) {
      return { success: false, reason: 'This mission cannot be abandoned.' };
    }

    missions.active.splice(missionIndex, 1);
    missions.active = [...missions.active];
    missions.failed.push(missionId);

    if (mission.missionCargo) {
      this.removeMissionCargo(mission.id);
    }

    if (mission.penalties && mission.penalties.failure) {
      if (mission.penalties.failure.rep) {
        for (const [npcId, amount] of Object.entries(
          mission.penalties.failure.rep
        )) {
          this.capabilities.modifyRep(npcId, amount, 'mission_abandon');
        }
      }
      if (mission.penalties.failure.karma) {
        this.capabilities.modifyKarma(
          mission.penalties.failure.karma,
          'mission_abandon'
        );
      }
    }

    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
    this.capabilities.markDirty();

    return { success: true };
  }

  checkMissionDeadlines() {
    const missions = this.capabilities.getOwnState();
    const currentDay = this.capabilities.getDaysElapsed();

    const { expired, remaining } = partitionExpiredMissions(
      missions.active,
      currentDay
    );
    if (expired.length === 0) return;

    missions.active = remaining;

    for (const mission of expired) {
      missions.failed.push(mission.id);

      // Queue a notice for display on next station dock
      missions.pendingFailureNotices.push({
        id: mission.id,
        title: mission.title,
        destination: mission.destination ? mission.destination.name : null,
      });

      if (mission.missionCargo) {
        this.removeMissionCargo(mission.id);
      }

      if (mission.penalties && mission.penalties.failure) {
        if (mission.penalties.failure.rep) {
          for (const [npcId, amount] of Object.entries(
            mission.penalties.failure.rep
          )) {
            this.capabilities.modifyRep(npcId, amount, 'mission_fail');
          }
        }
        if (mission.penalties.failure.karma) {
          this.capabilities.modifyKarma(
            mission.penalties.failure.karma,
            'mission_fail'
          );
        }
        if (mission.penalties.failure.faction) {
          for (const [faction, amount] of Object.entries(
            mission.penalties.failure.faction
          )) {
            this.capabilities.modifyFactionRep(faction, amount, 'mission_fail');
          }
        }
      }

      // Cole favor mission failure: direct rep penalty
      if (mission.source === 'cole') {
        this.capabilities.modifyColeRep(COLE_DEBT_CONFIG.REP_FAVOR_FAIL);
      }
    }

    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
    this.capabilities.markDirty();
  }

  refreshMissionBoard() {
    const missions = this.capabilities.getOwnState();
    const currentDay = Math.floor(this.capabilities.getDaysElapsed());
    const currentSystem = this.capabilities.getCurrentSystem();

    if (missions.board.length > 0 && missions.boardLastRefresh === currentDay) {
      return missions.board;
    }

    // Prune stale completion history
    const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
    missions.completionHistory = missions.completionHistory
      .filter((entry) => entry.day > windowStart)
      .slice(-MISSION_CONFIG.SATURATION_MAX_HISTORY);

    const dangerZone = this.capabilities.getDangerZone(currentSystem);

    const destinationDangerZoneFn = (systemId) =>
      this.capabilities.getDangerZone(systemId);

    const rng = new SeededRandom(
      `mission-board-${currentDay}-${currentSystem}`
    );
    const factionReps = {
      traders: this.capabilities.getFactionRep('traders'),
      civilians: this.capabilities.getFactionRep('civilians'),
    };

    const board = generateMissionBoard(
      currentSystem,
      this.capabilities.starData,
      this.capabilities.wormholeData,
      dangerZone,
      () => rng.next(),
      destinationDangerZoneFn,
      missions.completionHistory,
      currentDay,
      factionReps
    );

    missions.board = board;
    missions.boardLastRefresh = currentDay;
    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });

    return board;
  }

  // Smuggled mission cargo in the hidden compartment still counts
  hasMissionCargo(missionId) {
    return [
      ...this.capabilities.getShipCargo(),
      ...this.capabilities.getShipHiddenCargo(),
    ].some((c) => c.missionId === missionId);
  }

  removeMissionCargo(missionId) {
    for (const [hold, update] of [
      [this.capabilities.getShipCargo(), this.capabilities.updateCargo],
      [
        this.capabilities.getShipHiddenCargo(),
        this.capabilities.updateHiddenCargo,
      ],
    ]) {
      const kept = hold.filter((c) => c.missionId !== missionId);
      if (kept.length !== hold.length) update(kept);
    }
  }

  getCompletableMissions() {
    const missions = this.capabilities.getOwnState();
    const currentSystem = this.capabilities.getCurrentSystem();
    const cargo = this.capabilities.getShipCargo();
    const visitedSystems = this.capabilities.getVisitedSystems();

    return missions.active
      .filter((mission) => {
        if (mission.type === 'delivery') {
          if (mission.requirements.destination !== currentSystem) return false;
          if (mission.missionCargo) {
            return this.hasMissionCargo(mission.id);
          }
          if (mission.requirements.cargo) {
            const totalCargo = cargo
              .filter((c) => c.good === mission.requirements.cargo)
              .reduce((sum, c) => sum + c.qty, 0);
            return totalCargo >= mission.requirements.quantity;
          }
          return true;
        }
        if (mission.type === 'fetch') {
          if (mission.giverSystem !== currentSystem) return false;
          if (mission.requirements.cargo) {
            const totalCargo = cargo
              .filter((c) => c.good === mission.requirements.cargo)
              .reduce((sum, c) => sum + c.qty, 0);
            return totalCargo >= mission.requirements.quantity;
          }
          return true;
        }
        if (mission.type === 'intel') {
          if (mission.giverSystem !== currentSystem) return false;
          return mission.requirements.targets.every((t) =>
            visitedSystems.includes(t)
          );
        }
        if (mission.type === 'passenger') {
          return mission.requirements.destination === currentSystem;
        }
        return false;
      })
      .map((mission) => ({
        ...mission,
        grossCredits:
          mission.type === 'passenger'
            ? this.calculatePassengerPayment(mission)
            : mission.rewards?.credits || 0,
      }));
  }

  failMissionsDueToCargoLoss() {
    const missions = this.capabilities.getOwnState();

    const toFail = [];
    const toKeep = [];

    for (const mission of missions.active) {
      if (mission.missionCargo) {
        if (!this.hasMissionCargo(mission.id)) {
          toFail.push(mission);
        } else {
          toKeep.push(mission);
        }
      } else {
        toKeep.push(mission);
      }
    }

    if (toFail.length === 0) return;

    missions.active = toKeep;

    for (const mission of toFail) {
      missions.failed.push(mission.id);

      if (mission.penalties && mission.penalties.failure) {
        if (mission.penalties.failure.faction) {
          for (const [faction, amount] of Object.entries(
            mission.penalties.failure.faction
          )) {
            this.capabilities.modifyFactionRep(
              faction,
              amount,
              'mission_cargo_confiscated'
            );
          }
        }
      }
    }

    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
  }

  getActiveMissions() {
    return this.capabilities.getOwnState().active;
  }

  dismissMissionFailureNotice(missionId) {
    const missions = this.capabilities.getOwnState();
    const notices = missions.pendingFailureNotices;
    if (!notices.some((n) => n.id === missionId)) return;
    missions.pendingFailureNotices = notices.filter((n) => n.id !== missionId);
    this.capabilities.emit(EVENT_NAMES.MISSIONS_CHANGED, { ...missions });
    this.capabilities.markDirty();
  }
}
