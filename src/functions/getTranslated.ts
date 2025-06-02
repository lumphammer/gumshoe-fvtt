import Case from "case";

import * as constants from "../constants";
import { settings } from "../settings/settings";
import { assertGame } from "./isGame";
import { getDevMode } from "./utilities";

/**
 * convenience method to grab a translated string
 */

export function getTranslated(
  text: string,
  values: Record<string, string> = {},
) {
  assertGame(game);
  const debug = settings.debugTranslations.get() && getDevMode();
  const pascal = Case.pascal(text);
  const prefixed = `${constants.systemId}.${pascal}`;
  const local = game.i18n.format(prefixed, values);
  const has = game.i18n.has(prefixed, false);
  return `${debug ? (has ? "✔ " : "❌ ") : ""}${local}`;
}
