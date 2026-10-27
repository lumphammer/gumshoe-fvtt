import { getTranslated } from "../../functions/getTranslated";
import { isPCActor } from "../../module/actors/pc";
import type { BondItem } from "../../module/items/bond";
import { Button } from "../inputs/Button";
import { Translate } from "../Translate";

type BurnBondButtonProps = {
  bond: BondItem;
  className?: string;
};

/**
 * Burn a Bond: 2 of its points for 1 Stability (Fall of DELTA GREEN, p. 120).
 * Only for Bonds on a PC.
 */
export const BurnBondButton = ({ bond, className }: BurnBondButtonProps) => {
  const actor = bond.actor;
  if (!isPCActor(actor)) {
    return null;
  }
  const tooltip = getTranslated("BurnBondTooltip", {
    AbilityName: actor.system.getStabilityAbility()?.name ?? "",
  });
  return (
    <Button
      className={className}
      css={{ whiteSpace: "nowrap" }}
      disabled={!actor.system.canBurnBond(bond)}
      onClick={() => actor.system.confirmBurnBond(bond)}
      title={tooltip}
    >
      <i className="fa fa-fire" />
      <Translate>Burn</Translate>
    </Button>
  );
};

BurnBondButton.displayName = "BurnBondButton";
