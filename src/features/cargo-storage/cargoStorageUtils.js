/**
 * Pure helpers for the cargo storage picker. Quantities are kept as
 * { [stackIndex]: qty }, which is UI selection state, not game state.
 */

export function totalUnits(stacks) {
  return stacks.reduce((total, stack) => total + stack.qty, 0);
}

/** Older saves can hold more than the cap, and passengers can overfill a hold */
export function remainingLimit(cap, used) {
  return Math.max(0, cap - used);
}

export function selectedTotal(quantities) {
  return Object.values(quantities).reduce((total, qty) => total + qty, 0);
}

/** Shared by + and Max, so the total can never pass the limit */
export function rowMax(stack, rowIndex, quantities, limit) {
  const otherRows = selectedTotal(quantities) - (quantities[rowIndex] ?? 0);
  return Math.max(0, Math.min(stack.qty, limit - otherRows));
}

export function setRowQty(quantities, rowIndex, qty, max) {
  return { ...quantities, [rowIndex]: Math.min(Math.max(0, qty), max) };
}

/** The manager rejects any qty that isn't a positive integer */
export function buildSelections(quantities) {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([stackIndex, qty]) => ({ stackIndex: Number(stackIndex), qty }));
}
