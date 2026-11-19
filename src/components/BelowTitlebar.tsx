import type { PropsWithChildren } from "react";

import { css } from "../styled-system/css";

/**
 * An area covering a sheet's root from just below the full-frame layout's
 * see-through titlebar (`--inv-titlebar-clearance`, `CSSReset`), for a
 * drawer which slides in over the whole sheet (`SlideInNestedPanelRoute`),
 * so its top (a back link) isn't under the strip, which would take its
 * clicks. Clicks elsewhere pass through it.
 */
export const BelowTitlebar = ({ children }: PropsWithChildren) => (
  <div
    className={css({
      position: "absolute",
      inset: "0",
      top: "[var(--inv-titlebar-clearance, 0px)]",
      pointerEvents: "none",
    })}
  >
    {children}
  </div>
);
