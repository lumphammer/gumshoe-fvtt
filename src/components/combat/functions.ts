import { assertGame } from "../../functions/isGame";

export const localize = (stringId: string) => {
  assertGame(game);
  return game.i18n?.localize(stringId) ?? "";
};

export const format = (stringId: string, data?: Record<string, string>) => {
  assertGame(game);
  return game.i18n?.format(stringId, data) ?? "";
};
