import { cx } from "../../styled-system/css";
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
 * badges are wrappers because `Translate` sets its own inline background.
 */
export const BondBadges = ({
  isDeltaGreen,
  isBroken,
  className,
}: BondBadgesProps) => {
  return (
    <span
      className={cx(
        // never wrapped (componentDefaults.css)
        "inv-default-bond-badges",
        className,
      )}
    >
      {isDeltaGreen && (
        <span className={badge()}>
          <Translate>Delta Green</Translate>
        </span>
      )}
      {isBroken && (
        <span className={badge({ tone: "danger", weight: "strong" })}>
          <Translate>Broken</Translate>
        </span>
      )}
    </span>
  );
};

BondBadges.displayName = "BondBadges";
