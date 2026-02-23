import {
  PIRATE_CREDIT_DEMAND_CONFIG,
  EVENT_NAMES,
} from '../../game/constants.js';

/**
 * Apply encounter outcome costs and rewards to game state.
 *
 * State mutation function: reads current state from gameStateManager,
 * applies costs (fuel, hull, engine, lifeSupport, credits, cargo, days,
 * passengerSatisfaction, kidnappedPassengerId) and rewards (credits, karma,
 * factionRep, cargo, passengerSatisfaction), then saves.
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
      const newCredits = Math.max(
        0,
        state.player.credits - outcome.costs.credits
      );
      gameStateManager.updateCredits(newCredits);
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

    // Fail missions whose cargo was lost or confiscated
    if (
      outcome.costs.cargoLoss ||
      outcome.costs.cargoPercent ||
      outcome.costs.restrictedGoodsConfiscated
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
      const newCredits = state.player.credits + outcome.rewards.credits;
      gameStateManager.updateCredits(newCredits);
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
      outcome.rewards.cargo.forEach((rewardItem) => {
        const existingStack = currentCargo.find(
          (item) =>
            item.good === rewardItem.good &&
            item.buyPrice === rewardItem.buyPrice
        );

        if (existingStack) {
          existingStack.qty += rewardItem.qty;
        } else {
          currentCargo.push({
            good: rewardItem.good,
            qty: rewardItem.qty,
            buyPrice: rewardItem.buyPrice,
            buySystemName: rewardItem.buySystemName,
          });
        }
      });

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
