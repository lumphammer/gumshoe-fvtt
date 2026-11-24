import { useNavigationContext } from "@lumphammer/minirouter";
import type { FocusEvent, PropsWithChildren } from "react";
import { useEffect, useRef } from "react";

import { css } from "../../styled-system/css";

/** Whether a nested panel is open over this route's content */
export const useCoveredByPanel = () => {
  const { currentStep } = useNavigationContext();
  return currentStep !== undefined;
};

/**
 * Remember what was last focused in some content (with the returned
 * `onFocus`), and return focus there when a panel over it closes: it's
 * usually what opened the panel. Returns whether that happened, for content
 * which would otherwise focus something of its own.
 */
export const useReturnFocus = (covered: boolean) => {
  const lastFocused = useRef<HTMLElement | null>(null);
  const wasCovered = useRef(covered);
  const returned = useRef(false);
  useEffect(() => {
    returned.current = false;
    if (wasCovered.current && !covered) {
      const element = lastFocused.current;
      if (element?.isConnected) {
        element.focus({ preventScroll: true });
        returned.current = document.activeElement === element;
      }
    }
    wasCovered.current = covered;
  }, [covered]);
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    lastFocused.current = event.target;
  };
  return { onFocus, returned };
};

/**
 * What a router's nested panels slide in over: inert while one is open, so
 * screen readers and the Tab key only find the panel on top, and focus goes
 * back to what opened it when it closes. Adds no box of its own
 * (`display: contents`).
 */
export const UnderPanels = ({ children }: PropsWithChildren) => {
  const covered = useCoveredByPanel();
  const { onFocus } = useReturnFocus(covered);
  return (
    <div
      className={css({ display: "contents" })}
      inert={covered}
      onFocus={onFocus}
    >
      {children}
    </div>
  );
};
