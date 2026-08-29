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

/**
 * Like `getTranslated`, but for results which become HTML rather than text -
 * chat message content, dialog content. The substituted values are escaped,
 * because they are usually document names, which users control.
 *
 * Do not use this for anything React renders: React escapes already, so a name
 * containing `&` or `'` would come out double-escaped.
 */
export function getTranslatedHtml(
  text: string,
  values: Record<string, string> = {},
) {
  return getTranslated(
    text,
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        foundry.utils.escapeHTML(value),
      ]),
    ),
  );
}
