import type { KeyboardEvent } from "react";

/**
 * Tells Foundry's keyboard manager that the focused element takes keys of its
 * own. Without it, Foundry only leaves keys alone on text inputs and buttons
 * in forms: on anything else, Tab cycles tokens (so focus can't move on) and
 * Space pauses the game.
 */
export const keyboardFocus = { "data-keyboard-focus": "" } as const;

/**
 * Marks an element that works as a button, for the pointer cursor
 * (componentDefaults.css). Browsers only give one to links with an `href`.
 */
const clickableMarker = { "data-inv-clickable": "" } as const;

/** Whether a key press should activate a button: Enter or Space */
export const isActivationKey = (event: KeyboardEvent) =>
  event.key === "Enter" || event.key === " ";

/**
 * Enter or Space on the element itself, not bubbling up from something inside
 * it (a link in a card's text, say, which handles its own keys)
 */
const isOwnActivation = (event: KeyboardEvent) =>
  isActivationKey(event) &&
  !event.repeat &&
  event.target === event.currentTarget;

/**
 * The keyboard half of `clickable`: focusable, announced as a button, and
 * activated by Enter and Space. For an element whose clicks do something
 * else, or need the event.
 */
export const buttonKeys = (onActivate: () => void) => ({
  role: "button",
  tabIndex: 0,
  ...keyboardFocus,
  ...clickableMarker,
  onKeyDown: (event: KeyboardEvent) => {
    if (isOwnActivation(event)) {
      event.preventDefault();
      onActivate();
    }
  },
});

/**
 * Props which make an element that isn't a `<button>` (an `<a>` with no
 * `href`, a `<div>`) work as one: focusable, announced as a button, and
 * activated by Enter and Space as well as clicks. With no `onClick`, it's
 * left alone.
 */
export const clickable = (onClick: (() => void) | undefined) =>
  onClick === undefined ? {} : { ...buttonKeys(onClick), onClick };

/**
 * Props which make an element that isn't a `<button>` work as one with the
 * `onClick` it already has: focusable, announced as a button, and clicked
 * by Enter and Space. For a click handler which wants the event.
 */
export const clickedByKeys = {
  role: "button",
  tabIndex: 0,
  ...keyboardFocus,
  ...clickableMarker,
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
    if (isOwnActivation(event)) {
      event.preventDefault();
      event.currentTarget.click();
    }
  },
} as const;
