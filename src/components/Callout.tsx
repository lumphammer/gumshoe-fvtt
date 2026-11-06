import type { ReactNode } from "react";

import { css, cx } from "../styled-system/css";
import { callout } from "../styled-system/recipes";
import type { Tone } from "../themes/catalogue/tones";

type CalloutProps = {
  /**
   * What it's saying, which picks the colour and the icon: "danger" for
   * something that stops an action, "warning" for advice.
   */
  tone: Tone;
  /** the message */
  children: ReactNode;
  /** an optional control on the right, e.g. a "Clear jam" button */
  action?: ReactNode;
  /** layout */
  className?: string;
};

const icons: Record<Tone, string> = {
  neutral: "fas fa-info-circle",
  info: "fas fa-info-circle",
  success: "fas fa-check-circle",
  danger: "fas fa-exclamation-circle",
  warning: "fas fa-exclamation-triangle",
};

/**
 * A boxed message about the content around it (the catalogue's `callout`).
 * Sheets show them in one place, just below the button they're about (e.g.
 * the weapon sheet's attack button), so it doesn't move as they come and go.
 */
export const Callout = ({
  tone,
  children,
  action,
  className,
}: CalloutProps) => (
  <div role="status" className={cx(callout({ tone }), className)}>
    <i className={icons[tone]} aria-hidden="true" />
    <span className={css({ flex: "1" })}>{children}</span>
    {action && (
      <div
        className={css({
          flex: "none",
          "& > button": { width: "auto", margin: 0 },
        })}
      >
        {action}
      </div>
    )}
  </div>
);

Callout.displayName = "Callout";
