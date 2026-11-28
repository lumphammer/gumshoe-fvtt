import type { ComponentProps, ReactNode } from "react";
import { useId, useState } from "react";

import { css, cx } from "../../styled-system/css";
import { keyboardFocus } from "../clickable";
import { floating } from "../../styled-system/recipes";

export interface RollPopoverProps {
  /** what the trigger shows */
  trigger: ReactNode;
  /** the trigger's own props: its class, title, drag and context menu */
  triggerProps: Omit<ComponentProps<"button">, "children">;
  /** the popover's accessible name */
  label: string;
  /** the popover's content, while it's open, given a way to close it */
  children: (close: () => void) => ReactNode;
}

/**
 * A button that opens a popover under it: the browser's own popover (in the
 * top layer, so Foundry's window can't clip it, but still inside the themed
 * root), anchored with CSS anchor positioning. The browser handles opening
 * and closing (Esc, a click outside, another popover), moving focus in and
 * back. Its content is only mounted while it's open, so it starts fresh.
 */
export function RollPopover({
  trigger,
  triggerProps,
  label,
  children,
}: RollPopoverProps) {
  const id = useId();
  // a dashed ident, unique to this trigger
  const anchorName = `--roll-${id.replace(/[^\w-]/g, "")}`;
  // the element, in state rather than a ref, as `close` is made in render
  const [popover, setPopover] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const close = () => popover?.hidePopover();

  return (
    <>
      <button
        type="button"
        {...triggerProps}
        {...keyboardFocus}
        popoverTarget={id}
        style={{ anchorName }}
        data-highlighted={open || undefined}
      >
        {trigger}
      </button>
      <div
        ref={setPopover}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        // it takes focus: or Foundry takes Tab (cycling tokens) and Space
        // (pausing) from it
        {...keyboardFocus}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          // into the dialog (the browser puts it back on the trigger when
          // it closes)
          if (isOpen) e.currentTarget.focus();
        }}
        className={cx(
          floating({ kind: "popover" }),
          css({
            inset: "auto",
            margin: "0",
            marginBlockStart: "0.25em",
            padding: "0.5em",
            width: "22em",
            maxWidth: "calc(100vw - 1em)",
            positionArea: "block-end span-inline-start",
            positionTryFallbacks: "flip-block, flip-inline",
          }),
        )}
        style={{ positionAnchor: anchorName }}
      >
        {open && children(close)}
      </div>
    </>
  );
}
