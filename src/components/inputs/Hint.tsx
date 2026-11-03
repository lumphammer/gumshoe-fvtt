import { useContext, type ReactNode } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import type { ThemeV1 } from "../../themes/types";

export type HintSeverity = "danger" | "warning";

type HintProps = {
  /**
   * How serious the problem is, which picks the colour and the icon:
   * "danger" for things which stop an action, "warning" for advice.
   */
  severity: HintSeverity;
  /** the message */
  children: ReactNode;
  /** an optional control on the right, e.g. a "Clear jam" button */
  action?: ReactNode;
};

const icons: Record<HintSeverity, string> = {
  danger: "fas fa-exclamation-circle",
  warning: "fas fa-exclamation-triangle",
};

/**
 * The colours of a hint, for anything else which flags a problem (e.g. the
 * "Not found!" tag on a weapon's missing ability).
 */
export const getHintColors = (theme: ThemeV1, severity: HintSeverity) => ({
  color: theme.colors.text,
  backgroundColor: `color-mix(in srgb, ${theme.colors[severity]} 30%, ${theme.colors.bgOpaquePrimary})`,
});

/**
 * A problem or piece of advice: normal text on a solid backdrop tinted with
 * the theme's danger or warning colour, with a matching bar on the left.
 * Sheets show them in one place, just below the button they're about (e.g.
 * the weapon sheet's attack button), so it doesn't move as hints come and go.
 */
export const Hint = ({ severity, children, action }: HintProps) => {
  const theme = useContext(ThemeContext);
  return (
    <div
      role="status"
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.5em",
        ...getHintColors(theme, severity),
        borderLeft: `0.25em solid ${theme.colors[severity]}`,
        padding: "0.2em 0.5em",
        borderRadius: "0.2em",
      }}
    >
      <i className={icons[severity]} aria-hidden="true" />
      <span css={{ flex: 1 }}>{children}</span>
      {action && (
        <div
          css={{
            flex: "0 0 auto",
            "& > button": { width: "auto", margin: 0 },
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
};

Hint.displayName = "Hint";
