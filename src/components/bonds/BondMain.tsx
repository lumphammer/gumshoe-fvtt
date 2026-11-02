import { useNavigationContext } from "@lumphammer/minirouter";

import { getTranslated } from "../../functions/getTranslated";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import {
  brokenBondPoints,
  canBurnBond,
  getMaxBondPoints,
  isBondBroken,
  isBondRebuildable,
} from "../../module/bonds/rules";
import type { BondItem, BondSystemData } from "../../module/items/bond";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Toggle } from "../inputs/Toggle";
import { Translate } from "../Translate";
import { BondBadges } from "./BondBadges";
import { BondActor } from "./BondActor";
import { BurnBondButton } from "./BurnBondButton";
import { rebuild } from "./directions";

/** What a Bond's sheet needs from the PC it's on */
export type BondOwner = {
  /** their Stability ability, which Bonds are burned for and rebuilt with */
  stability: { name: string; pool: number; rating: number } | null;
  /** the most a Bond can have (2 when Adapted to Violence) */
  bondCap: number;
};

type BondMainProps = {
  /** only to write through */
  item: BondItem;
  name: string;
  system: BondSystemData;
  /** the PC it's on, or null if it isn't on one */
  owner: BondOwner | null;
};

export const BondMain = ({ item, name, system, owner }: BondMainProps) => {
  "use memo";

  const { navigate } = useNavigationContext();
  const methods = useSystemMethods(item);
  const isBroken = isBondBroken(system.points);
  const hasBadges = system.isDeltaGreen || isBroken;
  // only Bonds on a PC can be burned
  const canHaveBurn = owner !== null;
  // a Bond is burned for, and rebuilt with, the PC's Stability
  const stability = owner?.stability ?? null;
  const canBurn =
    stability !== null &&
    canBurnBond({
      bondPoints: system.points,
      stabilityPool: stability.pool,
      stabilityRating: stability.rating,
    });
  const canRebuild = stability !== null && isBondRebuildable(system);
  const maxPoints = getMaxBondPoints(system.points, owner?.bondCap);
  const autoRows =
    4 + (hasBadges ? 1 : 0) + (canHaveBurn ? 1 : 0) + (canRebuild ? 1 : 0);

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        // name, points, DELTA GREEN toggle, actor, (Burn,) (badges,)
        // (Rebuild,)
        // then notes fill the rest
        gridTemplateRows: `repeat(${autoRows}, auto) 1fr`,
      }}
    >
      <GridField label="Person Name">
        <AsyncTextInput value={name} onChange={item.setName} />
      </GridField>
      <GridField label="Points">
        <AsyncNumberInput
          value={system.points}
          onChange={methods.setPoints}
          min={brokenBondPoints}
          max={maxPoints}
        />
      </GridField>
      {/* "DELTA GREEN" shares the badge's translation; the "?" goes outside it */}
      <GridField label={`${getTranslated("Delta Green")}?`} noTranslate>
        <Toggle
          checked={system.isDeltaGreen}
          onChange={methods.setIsDeltaGreen}
        />
      </GridField>
      <GridField label="Actor">
        <BondActor bond={item} actorUuid={system.actorUuid ?? null} />
      </GridField>
      {/* on its own row, so the points above don't read as "how many to burn" */}
      {canHaveBurn && (
        <GridFieldStacked>
          <BurnBondButton
            bond={item}
            canBurn={canBurn}
            stabilityName={stability?.name ?? ""}
          />
        </GridFieldStacked>
      )}
      {hasBadges && (
        <GridField noLabel>
          <BondBadges isDeltaGreen={system.isDeltaGreen} isBroken={isBroken} />
        </GridField>
      )}
      {canRebuild && (
        <GridFieldStacked>
          <Button
            data-testid="open-rebuild-bond"
            onClick={() => navigate("here", rebuild())}
          >
            <Translate>Rebuild Bond</Translate>{" "}
            <i className="fa fa-arrow-right" />
          </Button>
        </GridFieldStacked>
      )}
      <div
        css={{
          position: "relative",
          gridColumn: "1/-1",
        }}
      >
        <RichTextEditor
          html={system.notes}
          onSave={methods.setNotes}
          name="notes"
        />
      </div>
    </InputGrid>
  );
};

BondMain.displayName = "BondMain";
