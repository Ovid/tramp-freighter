import { BaseManager } from './base-manager.js';
import { PIRATE_CREDIT_DEMAND_CONFIG } from '../../constants.js';

/**
 * Applies the costs and rewards of a resolved encounter or narrative choice.
 *
 * The writes run in a fixed order that later writes depend on: hidden and
 * restricted cargo are removed before missions are failed for lost cargo,
 * and rewards are applied after the time cost, whose tick can remove expired
 * mission cargo in place. The writes are not atomic: one that throws leaves
 * the earlier ones applied, and several writers already mark the save dirty.
 */
export class OutcomeManager extends BaseManager {
  /**
   * Returns { salvageMessages }: player-facing notes on salvage that did not
   * fit in the hold.
   *
   * @param {Object} outcome - { costs?, rewards? } from a resolver or a
   *   narrative choice's effects
   * @returns {{ salvageMessages: string[] }}
   */
  apply(outcome) {
    const caps = this.capabilities;
    const state = caps.getState();
    const salvageMessages = [];

    if (outcome.costs) {
      this.applyCosts(outcome.costs, state);
    }

    if (outcome.rewards) {
      const { rewards } = outcome;

      if (rewards.credits) {
        caps.updateCredits(state.player.credits + rewards.credits);
      }

      if (rewards.fuelMinimum) {
        caps.updateFuel(Math.max(state.ship.fuel, rewards.fuelMinimum));
      }

      if (rewards.karma) {
        caps.modifyKarma(rewards.karma, 'encounter_resolution');
      }

      if (rewards.factionRep) {
        Object.entries(rewards.factionRep).forEach(([faction, change]) => {
          caps.modifyFactionRep(faction, change, 'encounter_resolution');
        });
      }

      if (rewards.cargo) {
        caps.updateCargo(
          this.mergeSalvage(state, rewards.cargo, salvageMessages)
        );
      }

      if (rewards.passengerSatisfaction) {
        caps.modifyAllPassengerSatisfaction(rewards.passengerSatisfaction);
      }
    }

    caps.markDirty();

    return { salvageMessages };
  }

  applyCosts(costs, state) {
    const caps = this.capabilities;

    if (costs.fuel) {
      caps.updateFuel(Math.max(0, state.ship.fuel - costs.fuel));
    }

    if (costs.hull || costs.engine || costs.lifeSupport) {
      const { hull, engine, lifeSupport } = state.ship;
      caps.updateShipCondition(
        Math.max(0, hull - (costs.hull ?? 0)),
        Math.max(0, engine - (costs.engine ?? 0)),
        Math.max(0, lifeSupport - (costs.lifeSupport ?? 0))
      );
    }

    if (costs.credits) {
      const currentCredits = state.player.credits;
      if (costs.isFine) {
        // Fines take what the player has; the rest is added to the debt.
        const paid = Math.min(currentCredits, costs.credits);
        const unpaid = costs.credits - paid;
        caps.updateCredits(currentCredits - paid);
        if (unpaid > 0) {
          caps.updateDebt(state.player.debt + unpaid);
        }
      } else {
        caps.updateCredits(Math.max(0, currentCredits - costs.credits));
      }
    }

    if (costs.cargoLoss === true) {
      caps.updateCargo([]);
    } else if (costs.cargoPercent) {
      const lossPercent = costs.cargoPercent / 100;
      caps.updateCargo(
        state.ship.cargo
          .map((item) => ({
            ...item,
            qty: Math.max(0, item.qty - Math.floor(item.qty * lossPercent)),
          }))
          .filter((item) => item.qty > 0)
      );
    }

    if (costs.hiddenCargoConfiscated) {
      caps.clearHiddenCargo();
    }

    if (costs.restrictedGoodsConfiscated) {
      caps.removeRestrictedCargo();
    }

    if (
      costs.cargoLoss ||
      costs.cargoPercent ||
      costs.restrictedGoodsConfiscated ||
      costs.hiddenCargoConfiscated
    ) {
      caps.failMissionsDueToCargoLoss();
    }

    if (costs.days) {
      caps.updateTime(state.player.daysElapsed + costs.days);
    }

    if (costs.kidnappedPassengerId) {
      caps.abandonMission(costs.kidnappedPassengerId);

      const { KIDNAP_FACTION_PENALTY, KIDNAP_KARMA_PENALTY } =
        PIRATE_CREDIT_DEMAND_CONFIG;
      Object.entries(KIDNAP_FACTION_PENALTY).forEach(([faction, change]) => {
        caps.modifyFactionRep(faction, change, 'passenger_kidnapped');
      });
      caps.modifyKarma(KIDNAP_KARMA_PENALTY, 'passenger_kidnapped');
    }

    if (costs.passengerSatisfaction) {
      caps.modifyAllPassengerSatisfaction(-costs.passengerSatisfaction);
    }
  }

  /**
   * Returns the hold's cargo with `rewardCargo` added, up to capacity, as new
   * stack objects. Pushes a message for each reward that did not fully fit.
   *
   * @param {Object} state - Live game state
   * @param {Object[]} rewardCargo - [{ good, qty, buyPrice, buySystemName? }]
   * @param {string[]} salvageMessages - Receives player-facing notes
   * @returns {Object[]}
   */
  mergeSalvage(state, rewardCargo, salvageMessages) {
    const cargo = [...state.ship.cargo];
    const capacity = state.ship.cargoCapacity;
    let total = cargo.reduce((sum, item) => sum + item.qty, 0);

    for (const reward of rewardCargo) {
      const availableSpace = capacity - total;
      if (availableSpace <= 0) {
        salvageMessages.push('Your hold is full — nothing salvaged.');
        break;
      }

      const qtyToAdd = Math.min(reward.qty, availableSpace);
      if (qtyToAdd < reward.qty) {
        const unitWord = reward.qty === 1 ? 'unit' : 'units';
        salvageMessages.push(
          `Could only fit ${qtyToAdd} of ${reward.qty} ${unitWord}.`
        );
      }

      const index = cargo.findIndex(
        (item) => item.good === reward.good && item.buyPrice === reward.buyPrice
      );
      if (index >= 0) {
        cargo[index] = { ...cargo[index], qty: cargo[index].qty + qtyToAdd };
      } else {
        cargo.push({
          good: reward.good,
          qty: qtyToAdd,
          buyPrice: reward.buyPrice,
          buySystem: state.player.currentSystem,
          buySystemName: reward.buySystemName || 'Salvaged',
          buyDate: state.player.daysElapsed,
        });
      }

      total += qtyToAdd;
    }

    return cargo;
  }
}
