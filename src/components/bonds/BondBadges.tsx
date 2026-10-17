import { useContext } from "react";

import type { BondItem } from "../../module/items/bond";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";

type BondBadgesProps = {
  bond: BondItem;
  className?: string;
};

/**
 * "DELTA GREEN" and "Broken" badges for a Bond. Broken Bonds get a badge
 * rather than being crossed out, which would make them hard to read. The
 * styles go on a wrapper because `Translate` sets its own inline background.
 */
export const BondBadges = ({ bond, className }: BondBadgesProps) => {
  const theme = useContext(ThemeContext);
  const badge = {
    fontSize: "0.9em",
    lineHeight: "1",
    borderRadius: "0.5em",
    padding: "0.1em 0.5em",
    whiteSpace: "nowrap",
  } as const;

  return (
    <span
      className={className}
      css={{ display: "inline-flex", flexWrap: "wrap", gap: "0.25em" }}
    >
      {bond.system.isDeltaGreen && (
        <span
          css={{
            ...badge,
            background: theme.colors.accentContrast,
            color: theme.colors.accent,
            outline: `1px solid ${theme.colors.accent}`,
          }}
        >
          <Translate>Delta Green</Translate>
        </span>
      )}
      {bond.system.isBroken && (
        <span
          css={{
            ...badge,
            background: theme.colors.danger,
            color: theme.colors.accentContrast,
          }}
        >
          <Translate>Broken</Translate>
        </span>
      )}
    </span>
  );
};

BondBadges.displayName = "BondBadges";
