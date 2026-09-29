import type { ComponentProps, PropsWithChildren } from "react";
import React, { forwardRef, useCallback } from "react";

import type { AnyStep, DirectionType } from "../types";
import { useNavigationContext } from "../useNavigationContext";

type LinkProps = ComponentProps<"a"> &
  PropsWithChildren<{
    from?: DirectionType;
    to?: AnyStep | AnyStep[] | "up";
  }>;

// thanks to TS 5.5 this is a type guard even without the `: x is y` syntax
function isDirection(x: DirectionType) {
  return typeof x !== "string";
}

/**
 * Create a link
 *
 * @param from The direction to link from. This can be a "here", "root", or a
 * Direction.
 * @param to The step or steps to link to, or "up" to go up a level.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, from = "here", to = [], ...otherProps }, ref) => {
    const { navigate, parentSteps, currentStep } = useNavigationContext();
    if (isDirection(from)) {
      if (
        currentStep?.direction !== from &&
        !parentSteps.some((s) => s.direction === from)
      ) {
        throw new Error(
          `Link has "from" set to ${from.description} but the current step is not a descendant of that step`,
        );
      }
    }

    const followLink = useCallback(
      () => navigate(from, to),
      [from, navigate, to],
    );

    const onKeyDown = useCallback<
      React.KeyboardEventHandler<HTMLAnchorElement>
    >(
      (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          followLink();
        }
      },
      [followLink],
    );

    const onClick = useCallback<React.MouseEventHandler<HTMLAnchorElement>>(
      (e) => {
        e.preventDefault();
        followLink();
      },
      [followLink],
    );

    return (
      <a
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        ref={ref}
        {...otherProps}
      >
        {children}
      </a>
    );
  },
);

Link.displayName = "Link";
