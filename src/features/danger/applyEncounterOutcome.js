import {
  PIRATE_CREDIT_DEMAND_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';

/**
 * Apply encounter outcome costs and rewards to game state.
 *
 * State mutation function: reads current state from gameStateManager,
 * applies costs (fuel, hull, engine, lifeSupport, credits, cargo, days,
 * passengerSatisfaction, kidnappedPassengerId, hiddenCargoConfiscated, restrictedGoodsConfiscated) and rewards (credits, fuelMinimum,
 * karma, factionRep, cargo, passengerSatisfaction), then saves.
 *
 * @param {Object} gameStateManager - The GameStateManager instance
 * @param {Object} outcome - Encounter outcome with costs and rewards
 */
export function applyEncounterOutcome(gameStateManager, outcome) {
  const state = gameStateManager.getState();

  // Apply costs
  if (outcome.costs) {
    if (outcome.costs.fuel) {
      const newFuel = Math.max(0, state.ship.fuel - outcome.costs.fuel);
      gameStateManager.updateFuel(newFuel);
    }

    if (outcome.costs.hull) {
      const newHull = Math.max(0, state.ship.hull - outcome.costs.hull);
      gameStateManager.updateShipCondition(
        newHull,
        state.ship.engine,
        state.ship.lifeSupport
      );
    }

    if (outcome.costs.engine) {
      const newEngine = Math.max(0, state.ship.engine - outcome.costs.engine);
      gameStateManager.updateShipCondition(
        state.ship.hull,
        newEngine,
        state.ship.lifeSupport
      );
    }

    if (outcome.costs.lifeSupport) {
      const newLifeSupport = Math.max(
        0,
        state.ship.lifeSupport - outcome.costs.lifeSupport
      );
      gameStateManager.updateShipCondition(
        state.ship.hull,
        state.ship.engine,
        newLifeSupport
      );
    }

    if (outcome.costs.credits) {
      const fine = outcome.costs.credits;
      const currentCredits = state.player.credits;
      const paid = Math.min(currentCredits, fine);
      const unpaid = fine - paid;
      gameStateManager.updateCredits(currentCredits - paid);
      if (unpaid > 0) {
        gameStateManager.updateDebt(state.player.debt + unpaid);
      }
    }

    if (outcome.costs.cargoLoss === true) {
      gameStateManager.updateCargo([]);
    } else if (outcome.costs.cargoPercent) {
      const lossPercent = outcome.costs.cargoPercent / 100;
      const filteredCargo = state.ship.cargo
        .map((item) => ({
          ...item,
          qty: Math.max(0, item.qty - Math.floor(item.qty * lossPercent)),
        }))
        .filter((item) => item.qty > 0);
      gameStateManager.updateCargo(filteredCargo);
    }

    if (outcome.costs.hiddenCargoConfiscated) {
      state.ship.hiddenCargo = [];
      gameStateManager.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, []);
    }

    // Remove restricted goods from cargo before checking mission failures
    if (outcome.costs.restrictedGoodsConfiscated) {
      gameStateManager.removeRestrictedCargo();
    }

    // Fail missions whose cargo was lost or confiscated
    if (
      outcome.costs.cargoLoss ||
      outcome.costs.cargoPercent ||
      outcome.costs.restrictedGoodsConfiscated ||
      outcome.costs.hiddenCargoConfiscated
    ) {
      if (typeof gameStateManager.failMissionsDueToCargoLoss === 'function') {
        gameStateManager.failMissionsDueToCargoLoss();
      }
    }

    if (outcome.costs.days) {
      const newDays = state.player.daysElapsed + outcome.costs.days;
      gameStateManager.updateTime(newDays);
    }

    if (outcome.costs.kidnappedPassengerId) {
      gameStateManager.abandonMission(outcome.costs.kidnappedPassengerId);

      const { KIDNAP_FACTION_PENALTY, KIDNAP_KARMA_PENALTY } =
        PIRATE_CREDIT_DEMAND_CONFIG;
      Object.entries(KIDNAP_FACTION_PENALTY).forEach(([faction, change]) => {
        gameStateManager.modifyFactionRep(
          faction,
          change,
          'passenger_kidnapped'
        );
      });
      gameStateManager.modifyKarma(KIDNAP_KARMA_PENALTY, 'passenger_kidnapped');
    }

    if (outcome.costs.passengerSatisfaction) {
      const activeMissions = state.missions.active;
      for (const mission of activeMissions) {
        if (mission.type === 'passenger' && mission.passenger) {
          mission.passenger.satisfaction = Math.max(
            0,
            mission.passenger.satisfaction - outcome.costs.passengerSatisfaction
          );
        }
      }
      gameStateManager.emit(EVENT_NAMES.MISSIONS_CHANGED, {
        ...state.missions,
      });
    }
  }

  // Apply rewards
  if (outcome.rewards) {
    if (outcome.rewards.credits) {
      const currentCredits = gameStateManager.getState().player.credits;
      const newCredits = currentCredits + outcome.rewards.credits;
      gameStateManager.updateCredits(newCredits);
    }

    if (outcome.rewards.fuelMinimum) {
      const currentFuel = gameStateManager.getState().ship.fuel;
      const newFuel = Math.max(currentFuel, outcome.rewards.fuelMinimum);
      gameStateManager.updateFuel(newFuel);
    }

    if (outcome.rewards.karma) {
      gameStateManager.modifyKarma(
        outcome.rewards.karma,
        'encounter_resolution'
      );
    }

    if (outcome.rewards.factionRep) {
      Object.entries(outcome.rewards.factionRep).forEach(
        ([faction, change]) => {
          gameStateManager.modifyFactionRep(
            faction,
            change,
            'encounter_resolution'
          );
        }
      );
    }

    if (outcome.rewards.cargo) {
      const currentCargo = [...state.ship.cargo];
      const cargoCapacity = state.ship.cargoCapacity;
      let currentTotal = currentCargo.reduce((sum, item) => sum + item.qty, 0);
      const salvageMessages = [];

      for (const rewardItem of outcome.rewards.cargo) {
        const availableSpace = cargoCapacity - currentTotal;

        if (availableSpace <= 0) {
          salvageMessages.push('Your hold is full — nothing salvaged.');
          break;
        }

        const qtyToAdd = Math.min(rewardItem.qty, availableSpace);

        if (qtyToAdd < rewardItem.qty) {
          const unitWord = rewardItem.qty === 1 ? 'unit' : 'units';
          salvageMessages.push(
            `Could only fit ${qtyToAdd} of ${rewardItem.qty} ${unitWord}.`
          );
        }

        const existingStack = currentCargo.find(
          (item) =>
            item.good === rewardItem.good &&
            item.buyPrice === rewardItem.buyPrice
        );

        if (existingStack) {
          existingStack.qty += qtyToAdd;
        } else {
          currentCargo.push({
            good: rewardItem.good,
            qty: qtyToAdd,
            buyPrice: rewardItem.buyPrice,
            buySystem: state.player.currentSystem,
            buySystemName: rewardItem.buySystemName || 'Salvaged',
            buyDate: state.player.daysElapsed,
          });
        }

        currentTotal += qtyToAdd;
      }

      if (salvageMessages.length > 0) {
        outcome.description =
          outcome.description + ' ' + salvageMessages.join(' ');
      }

      gameStateManager.updateCargo(currentCargo);
    }

    if (outcome.rewards.passengerSatisfaction) {
      const activeMissions = state.missions.active;
      for (const mission of activeMissions) {
        if (mission.type === 'passenger' && mission.passenger) {
          mission.passenger.satisfaction = Math.min(
            100,
            mission.passenger.satisfaction +
              outcome.rewards.passengerSatisfaction
          );
        }
      }
      gameStateManager.emit(EVENT_NAMES.MISSIONS_CHANGED, {
        ...state.missions,
      });
    }
  }

  gameStateManager.markDirty();
}
