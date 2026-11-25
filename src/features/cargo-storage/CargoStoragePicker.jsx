import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useGameEvent } from '../../hooks/useGameEvent.js';
import {
  formatCargoDisplayName,
  pluralizeUnit,
} from '../../game/utils/string-utils.js';
import {
  totalUnits,
  remainingLimit,
  selectedTotal,
  rowMax,
  setRowQty,
  buildSelections,
} from './cargoStorageUtils.js';
import { EVENT_NAMES, NPC_BENEFITS_CONFIG } from '../../game/constants.js';

/**
 * Lets the player choose which cargo to store with, or retrieve from, an NPC.
 * Only collects selections: DialoguePanel passes them to the dialogue engine,
 * which runs the store or retrieve.
 *
 * @param {Object} props
 * @param {'store'|'retrieve'} props.mode
 * @param {string} props.npcId
 * @param {string} props.npcName - Display name from npc-data
 * @param {Function} props.onConfirm - Called with [{ stackIndex, qty }]
 * @param {Function} props.onCancel
 */
export function CargoStoragePicker({
  mode,
  npcId,
  npcName,
  onConfirm,
  onCancel,
}) {
  const game = useGame();
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED) ?? [];
  const npcs = useGameEvent(EVENT_NAMES.NPCS_CHANGED) ?? {};
  const [quantities, setQuantities] = useState({});

  const isStore = mode === 'store';
  const verb = isStore ? 'Store' : 'Retrieve';
  const storedCargo = npcs[npcId]?.storedCargo ?? [];
  const storedUnits = totalUnits(storedCargo);
  const stacks = isStore ? cargo : storedCargo;
  const limit = isStore
    ? remainingLimit(NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT, storedUnits)
    : remainingLimit(game.getCargoRemaining(), 0);
  const selected = selectedTotal(quantities);
  const canMove = (stack) => !(isStore && stack.missionId);

  let emptyMessage = null;
  if (isStore && (limit === 0 || !stacks.some(canMove))) {
    emptyMessage = 'No cargo you can store';
  } else if (!isStore && limit === 0) {
    emptyMessage = 'No room in your hold';
  }

  const change = (index, stack, qty) =>
    setQuantities((current) =>
      setRowQty(current, index, qty, rowMax(stack, index, current, limit))
    );

  return (
    <div className="cargo-storage-picker">
      {emptyMessage ? (
        <p className="cargo-empty">{emptyMessage}</p>
      ) : (
        <div className="cargo-list">
          {stacks.map((stack, index) => {
            const name = formatCargoDisplayName(stack.good);
            const label = `${name} bought at ${stack.buyPrice} credits`;
            const qty = quantities[index] ?? 0;
            const max = rowMax(stack, index, quantities, limit);
            return (
              <div key={index} className="cargo-stack">
                <div className="stack-info">
                  <div className="stack-name">{name}</div>
                  <div className="stack-details">
                    {`Qty: ${stack.qty} | Bought at: ${stack.buyPrice} ₡/unit`}
                  </div>
                </div>
                {canMove(stack) ? (
                  <div className="stack-actions picker-controls">
                    <button
                      type="button"
                      aria-label={`${verb} one less ${label}`}
                      disabled={qty === 0}
                      onClick={() => change(index, stack, qty - 1)}
                    >
                      −
                    </button>
                    <span className="picker-qty">{qty}</span>
                    <button
                      type="button"
                      aria-label={`${verb} one more ${label}`}
                      disabled={qty >= max}
                      onClick={() => change(index, stack, qty + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label={`${verb} as many ${label} as fit`}
                      disabled={qty >= max}
                      onClick={() => change(index, stack, max)}
                    >
                      Max
                    </button>
                  </div>
                ) : (
                  <span className="mission-cargo-label">
                    Mission Cargo (cannot be stored)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="cargo-storage-footer">
        <p aria-live="polite">
          {isStore
            ? `Selected: ${selected} / ${limit} (${storedUnits} already stored)`
            : `Selected: ${selected} / ${limit} (hold space)`}
        </p>
        {isStore && (
          <p className="cargo-storage-warning">
            {`Storing uses ${npcName}'s favor: no more storage or loans from them for ${NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS} days.`}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-confirm"
            disabled={selected === 0}
            onClick={() => onConfirm(buildSelections(quantities))}
          >
            {`${verb} ${pluralizeUnit(selected)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
