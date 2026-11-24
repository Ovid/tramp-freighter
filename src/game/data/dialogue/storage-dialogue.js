/**
 * @fileoverview Shared cargo storage dialogue
 *
 * Every NPC that offers storage uses the same mechanics. NPC files supply
 * only their own lines and flag names; the choices, conditions, picker
 * markers and repGain are written once here.
 *
 * The tier check lives in canRequestFavor, not here, so it can't drift.
 *
 * @module dialogue/storage-dialogue
 */

// Retrieval opens a picker with nothing selected, so the line can't promise
// an automatic transfer
const RETRIEVE_CONFIRM_TEXT = 'Let me choose what to take.';

/**
 * @param {Object} lines
 * @param {string} lines.requestText - request_storage node text; states the limit via CARGO_STORAGE_LIMIT
 * @param {string} lines.requestFlag - Flag set when request_storage is shown
 * @param {string} lines.storeConfirmText
 * @param {string} lines.storeDeclineText
 * @param {string} lines.retrieveText - retrieve_cargo node text
 * @param {string} lines.retrieveFlag - Flag set when retrieve_cargo is shown
 * @param {string} lines.retrieveDeclineText
 * @returns {{ storeGreetingChoice: Object, retrieveGreetingChoice: Object, nodes: Object }}
 */
export function buildStorageDialogue({
  requestText,
  requestFlag,
  storeConfirmText,
  storeDeclineText,
  retrieveText,
  retrieveFlag,
  retrieveDeclineText,
}) {
  return {
    storeGreetingChoice: {
      text: 'Can you store some cargo for me?',
      next: 'request_storage',
      condition: (_rep, context) => context.canRequestStorage.available,
    },
    retrieveGreetingChoice: {
      text: 'I want to retrieve my stored cargo.',
      next: 'retrieve_cargo',
      condition: (_rep, context) =>
        (context.npcState.storedCargo?.length ?? 0) > 0,
    },
    nodes: {
      request_storage: {
        text: requestText,
        flags: [requestFlag],
        choices: [
          {
            text: storeConfirmText,
            next: 'greeting',
            repGain: 2,
            picker: 'store',
          },
          { text: storeDeclineText, next: 'greeting', repGain: 1 },
        ],
      },
      retrieve_cargo: {
        text: retrieveText,
        flags: [retrieveFlag],
        choices: [
          { text: RETRIEVE_CONFIRM_TEXT, next: 'greeting', picker: 'retrieve' },
          { text: retrieveDeclineText, next: 'greeting' },
        ],
      },
    },
  };
}
