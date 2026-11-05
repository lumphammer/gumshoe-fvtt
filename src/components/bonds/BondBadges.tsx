import { css, cx } from "../../styled-system/css";
import { badge } from "../../styled-system/recipes";
import { Translate } from "../Translate";

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
  return (
    <span
      // never wrapped, so a column of badges is always wide enough for both
      className={cx(
        css({ display: "inline-flex", flexWrap: "nowrap", gap: "0.25em" }),
        className,
      )}
    >
      {isDeltaGreen && (
        <span className={badge({ tone: "outline" })}>
          <Translate>Delta Green</Translate>
        </span>
      )}
      {isBroken && (
        <span className={badge({ tone: "danger" })}>
          <Translate>Broken</Translate>
        </span>
      )}
    </span>
  );
};

BondBadges.displayName = "BondBadges";
