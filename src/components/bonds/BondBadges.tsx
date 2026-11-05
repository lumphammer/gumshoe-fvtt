import * as stylex from "@stylexjs/stylex";

import { badge } from "../../catalogue/catalogue";
import { Translate } from "../Translate";

// never wrapped, so a column of badges is always wide enough for both
const layout = stylex.create({
  row: { display: "inline-flex", flexWrap: "nowrap", gap: "0.25em" },
});

type BondBadgesProps = {
  isDeltaGreen: boolean;
  isBroken: boolean;
  className?: string;
};

/**
 * "DELTA GREEN" and "Broken" badges for a Bond. Broken Bonds get a badge
 * rather than being crossed out, which would make them hard to read. The
 * styles go on a wrapper because `Translate` sets its own inline background.
 */
export const BondBadges = ({
  isDeltaGreen,
  isBroken,
  className,
}: BondBadgesProps) => {
  const rowProps = stylex.props(layout.row);
  return (
    <span
      {...rowProps}
      className={`${rowProps.className ?? ""} ${className ?? ""}`}
    >
      {isDeltaGreen && (
        <span {...badge("outline")}>
          <Translate>Delta Green</Translate>
        </span>
      )}
      {isBroken && (
        <span {...badge("danger")}>
          <Translate>Broken</Translate>
        </span>
      )}
    </span>
  );
};

BondBadges.displayName = "BondBadges";
