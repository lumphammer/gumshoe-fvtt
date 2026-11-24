import { DefaultContext } from "react-icons";

/**
 * Hide react-icons' icons from screen readers by default. Nearly all of ours
 * sit beside text which says the same (a menu item's, a settings page's
 * link), and an unnamed `<svg>` is otherwise announced as an unlabelled
 * graphic. An icon which means something on its own passes `aria-hidden={false}`
 * and a `title` or `aria-label`; one which is a control's only content leaves
 * naming to the control.
 *
 * Done on the context's default, which every icon outside an `IconContext`
 * provider reads, so it reaches every React root (sheets, chat cards, the
 * combat tracker) without a provider in each.
 */
export function hideDecorativeIcons() {
  DefaultContext.attr = { ...DefaultContext.attr, "aria-hidden": "true" };
}
