import * as constants from "../constants";

/**
 * Build the marker div which we stash in ability chat message content, and
 * which `installAbilityCardChatWrangler` later picks apart.
 *
 * Attributes are set through the DOM rather than interpolated into a template
 * string, because some of the values (item names, image urls) are user-supplied
 * and would otherwise be able to break out of the attribute and inject markup.
 *
 * `null` and `undefined` values become empty attributes, which is what the
 * wrangler expects for "not applicable".
 */
export function buildAbilityCardContent(
  attributes: Record<string, string | number | null | undefined>,
): string {
  const el = document.createElement("div");
  el.className = constants.abilityChatMessageClassName;
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value == null ? "" : String(value));
  }
  return el.outerHTML;
}
