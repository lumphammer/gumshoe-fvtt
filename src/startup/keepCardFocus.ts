import { focusableSelector } from "../components/nestedPanels/focusableSelector";

/** A control's name, to find it again in a new copy of its card */
const nameOf = (element: Element) =>
  element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "";

/**
 * Which of a card's new controls should take focus, given the name and
 * position of the one which had it in the old card: the one with the same
 * name (the nearest, if several have it), or else the one now in its place,
 * or the last, for a control which went (a removed target). Null if the card
 * has none.
 */
export function chooseFocusTarget(
  name: string,
  index: number,
  names: readonly string[],
): number | null {
  if (names.length === 0) {
    return null;
  }
  let best: number | null = null;
  names.forEach((candidate, i) => {
    if (
      candidate === name &&
      (best === null || Math.abs(i - index) < Math.abs(best - index))
    ) {
      best = i;
    }
  });
  return best ?? Math.min(index, names.length - 1);
}

/**
 * Foundry replaces a chat message's element whenever the message changes (a
 * target's cover, a removed target), which takes keyboard focus away. Call
 * this as a message renders again, while the old element is still in the
 * page: if focus is in its card (`cardSelector`), it returns a function to
 * give the new card, once it's in the page, which focuses the same control.
 */
export function rememberCardFocus(
  messageId: string | null,
  cardSelector: string,
) {
  const active = document.activeElement;
  if (messageId === null || !(active instanceof HTMLElement)) {
    return undefined;
  }
  const card = active.closest(cardSelector);
  const message = active.closest("[data-message-id]");
  if (!card || message?.getAttribute("data-message-id") !== messageId) {
    return undefined;
  }
  const index = Array.from(card.querySelectorAll(focusableSelector)).indexOf(
    active,
  );
  if (index < 0) {
    return undefined;
  }
  const name = nameOf(active);
  return (newCard: HTMLElement) => {
    const doc = newCard.ownerDocument;
    // only if focus is still lost: not if the user has gone on elsewhere
    if (
      !newCard.isConnected ||
      (doc.activeElement !== null && doc.activeElement !== doc.body)
    ) {
      return;
    }
    const controls = Array.from(
      newCard.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const target = chooseFocusTarget(name, index, controls.map(nameOf));
    if (target !== null) {
      controls[target]?.focus({ preventScroll: true });
    }
  };
}
