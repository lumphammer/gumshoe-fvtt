import { getTranslated } from "../../functions/getTranslated";
import { isPCActor } from "../../module/actors/pc";
import type { BondItem } from "../../module/items/bond";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";

type BurnBondButtonProps = {
  /** only to burn */
  bond: BondItem;
  /** whether it can be burned now (`PCModel#canBurnBond`) */
  canBurn: boolean;
  /** the PC's Stability ability's name */
  stabilityName: string;
  className?: string;
};

/**
 * Burn a Bond: 2 of its points for 1 Stability (Fall of DELTA GREEN, p. 120).
 * Only for Bonds on a PC.
 */
export const BurnBondButton = ({
  bond,
  canBurn,
  stabilityName,
  className,
}: BurnBondButtonProps) => {
  const tooltip = getTranslated("BurnBondTooltip", {
    AbilityName: stabilityName,
  });
  return (
    <Button
      className={cx(className, css({ whiteSpace: "nowrap" }))}
      disabled={!canBurn}
      onClick={() => {
        const actor = bond.actor;
        if (isPCActor(actor)) void actor.system.confirmBurnBond(bond);
      }}
      title={tooltip}
    >
      <i className="fa fa-fire" />
      <Translate>Burn</Translate>
    </Button>
  );
};

BurnBondButton.displayName = "BurnBondButton";
