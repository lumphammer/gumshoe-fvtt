import { useContext, type ReactNode } from "react";

import { ThemeContext } from "../../themes/ThemeContext";
import type { ThemeV1 } from "../../themes/types";

export type WeaponHintSeverity = "danger" | "warning";

type WeaponHintProps = {
  /**
   * How serious the problem is, which picks the colour and the icon:
   * "danger" for things which stop the attack, "warning" for advice.
   */
  severity: WeaponHintSeverity;
  /** the message */
  children: ReactNode;
  /** an optional control on the right, e.g. a "Clear jam" button */
  action?: ReactNode;
};

const icons: Record<WeaponHintSeverity, string> = {
  danger: "fas fa-exclamation-circle",
  warning: "fas fa-exclamation-triangle",
};

/**
 * The colours of a weapon hint, for anything else on the weapon sheet which
 * flags a problem (e.g. the "Not found!" tag on a missing ability).
 */
export const getWeaponHintColors = (
  theme: ThemeV1,
  severity: WeaponHintSeverity,
) => ({
  color: theme.colors.text,
  backgroundColor: `color-mix(in srgb, ${theme.colors[severity]} 30%, ${theme.colors.bgOpaquePrimary})`,
});

/**
 * The weapon sheet's one way of showing a problem: normal text on a solid
 * backdrop tinted with the theme's danger or warning colour, with a matching
 * bar on the left. Hints always appear in the same place in the sheet, just
 * below the range buttons, so the buttons don't move as hints come and go.
 */
export const WeaponHint = ({ severity, children, action }: WeaponHintProps) => {
  const theme = useContext(ThemeContext);
  return (
    <div
      role="status"
      css={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "0.5em",
        ...getWeaponHintColors(theme, severity),
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

WeaponHint.displayName = "WeaponHint";
