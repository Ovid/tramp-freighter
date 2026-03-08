import { PIRATE_CREDIT_DEMAND_CONFIG } from '../../game/constants.js';

/**
 * Apply encounter outcome costs and rewards to game state.
 *
 * State mutation function: reads current state from game,
 * applies costs (fuel, hull, engine, lifeSupport, credits, cargo, days,
 * passengerSatisfaction, kidnappedPassengerId, hiddenCargoConfiscated, restrictedGoodsConfiscated) and rewards (credits, fuelMinimum,
 * karma, factionRep, cargo, passengerSatisfaction), then saves.
 *
 * @param {Object} game - The GameStateManager instance
 * @param {Object} outcome - Encounter outcome with costs and rewards
 * @returns {Object} result - { salvageMessages: string[] }
 */
export function applyEncounterOutcome(game, outcome) {
  const state = game.getState();
  const salvageMessages = [];

  // Apply costs
  if (outcome.costs) {
    if (outcome.costs.fuel) {
      const newFuel = Math.max(0, state.ship.fuel - outcome.costs.fuel);
      game.updateFuel(newFuel);
    }

    if (outcome.costs.hull) {
      const newHull = Math.max(0, state.ship.hull - outcome.costs.hull);
      game.updateShipCondition(
        newHull,
        state.ship.engine,
        state.ship.lifeSupport
      );
    }

    if (outcome.costs.engine) {
      const newEngine = Math.max(0, state.ship.engine - outcome.costs.engine);
      game.updateShipCondition(
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
      game.updateShipCondition(
        state.ship.hull,
        state.ship.engine,
        newLifeSupport
      );
    }

    if (outcome.costs.credits) {
      const amount = outcome.costs.credits;
      const currentCredits = state.player.credits;

      if (outcome.costs.isFine) {
        // Fines: pay what you can, roll remainder into Cole's debt
        const paid = Math.min(currentCredits, amount);
        const unpaid = amount - paid;
        game.updateCredits(currentCredits - paid);
        if (unpaid > 0) {
          game.updateDebt(state.player.debt + unpaid);
        }
      } else {
        // Voluntary costs: deduct up to zero, no debt
        const newCredits = Math.max(0, currentCredits - amount);
        game.updateCredits(newCredits);
      }
    }

    if (outcome.costs.cargoLoss === true) {
      game.updateCargo([]);
    } else if (outcome.costs.cargoPercent) {
      const lossPercent = outcome.costs.cargoPercent / 100;
      const filteredCargo = state.ship.cargo
        .map((item) => ({
          ...item,
          qty: Math.max(0, item.qty - Math.floor(item.qty * lossPercent)),
        }))
        .filter((item) => item.qty > 0);
      game.updateCargo(filteredCargo);
    }

    if (outcome.costs.hiddenCargoConfiscated) {
      game.clearHiddenCargo();
    }

    // Remove restricted goods from cargo before checking mission failures
    if (outcome.costs.restrictedGoodsConfiscated) {
      game.removeRestrictedCargo();
    }

    // Fail missions whose cargo was lost or confiscated
    if (
      outcome.costs.cargoLoss ||
      outcome.costs.cargoPercent ||
      outcome.costs.restrictedGoodsConfiscated ||
      outcome.costs.hiddenCargoConfiscated
    ) {
      if (typeof game.failMissionsDueToCargoLoss === 'function') {
        game.failMissionsDueToCargoLoss();
      }
    }

    if (outcome.costs.days) {
      const newDays = state.player.daysElapsed + outcome.costs.days;
      game.updateTime(newDays);
    }

    if (outcome.costs.kidnappedPassengerId) {
      game.abandonMission(outcome.costs.kidnappedPassengerId);

      const { KIDNAP_FACTION_PENALTY, KIDNAP_KARMA_PENALTY } =
        PIRATE_CREDIT_DEMAND_CONFIG;
      Object.entries(KIDNAP_FACTION_PENALTY).forEach(([faction, change]) => {
        game.modifyFactionRep(
          faction,
          change,
          'passenger_kidnapped'
        );
      });
      game.modifyKarma(KIDNAP_KARMA_PENALTY, 'passenger_kidnapped');
    }

    if (outcome.costs.passengerSatisfaction) {
      game.modifyAllPassengerSatisfaction(
        -outcome.costs.passengerSatisfaction
      );
    }
  }

  // Apply rewards
  if (outcome.rewards) {
    if (outcome.rewards.credits) {
      const currentCredits = game.getState().player.credits;
      const newCredits = currentCredits + outcome.rewards.credits;
      game.updateCredits(newCredits);
    }

    if (outcome.rewards.fuelMinimum) {
      const currentFuel = game.getState().ship.fuel;
      const newFuel = Math.max(currentFuel, outcome.rewards.fuelMinimum);
      game.updateFuel(newFuel);
    }

    if (outcome.rewards.karma) {
      game.modifyKarma(
        outcome.rewards.karma,
        'encounter_resolution'
      );
    }

    if (outcome.rewards.factionRep) {
      Object.entries(outcome.rewards.factionRep).forEach(
        ([faction, change]) => {
          game.modifyFactionRep(
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

      game.updateCargo(currentCargo);
    }

    if (outcome.rewards.passengerSatisfaction) {
      game.modifyAllPassengerSatisfaction(
        outcome.rewards.passengerSatisfaction
      );
    }
  }

  game.markDirty();

  return { salvageMessages };
}
