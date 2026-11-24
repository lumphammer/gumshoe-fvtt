import { useNavigationContext } from "@lumphammer/minirouter";
import type { PropsWithChildren } from "react";

import { css } from "../../styled-system/css";

/** Whether a nested panel is open over this route's content */
export const useCoveredByPanel = () => {
  const { currentStep } = useNavigationContext();
  return currentStep !== undefined;
};

/**
 * What a router's nested panels slide in over: inert while one is open, so
 * screen readers and the Tab key only find the panel on top. Adds no box of
 * its own (`display: contents`).
 */
export const UnderPanels = ({ children }: PropsWithChildren) => {
  const covered = useCoveredByPanel();
  return (
    <div className={css({ display: "contents" })} inert={covered}>
      {children}
    </div>
  );
};
