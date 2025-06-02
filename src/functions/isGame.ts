/**
 * Check that `game` has been initialised
 */
export function isGame(game: any): game is foundry.Game {
  // we can't use the re-exported version of this because it causes havoc with
  // tests
  return game instanceof foundry.Game;
}

/**
 * Throw if `game` has not been initialized. This is hyper unlikely at runtime
 * but technically possible during a calamitous upfuckage to TS keeps us honest
 * and requires a check.
 */
export function assertGame(game: any): asserts game is ReadyGame {
  if (!isGame(game)) {
    throw new Error("game used before init hook");
  }
}
