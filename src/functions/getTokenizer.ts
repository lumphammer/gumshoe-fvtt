import { assertGame } from "./isGame";

/**
 * The Tokenizer API.
 * This is an incomplete type definition, enough for the calls we're making.
 */
interface TokenizerApi {
  tokenizeActor: (subject: Actor) => void;
}

/**
 * Get information about the tokenizer module. The tokenizer API is only available
 * if the tokenizer module is active.
 *
 * The Tokenizer API is only partially typed.
 *
 * @returns {Object} An object with the following properties:
 * - `tokenizerIsActive` (boolean): Whether the tokenizer module is active.
 * - `tokenizerApi` (TokenizerApi): The tokenizer API, if available.
 */
export function getTokenizer() {
  assertGame(game);
  const tokenizerModule = game.modules.get("vtta-tokenizer");
  const tokenizerIsActive = tokenizerModule?.active ?? false;
  // @ts-expect-error the types don't know about `.api`
  const tokenizerApi = tokenizerModule?.api as TokenizerApi | undefined;
  return {
    tokenizerIsActive,
    tokenizerApi,
  };
}
