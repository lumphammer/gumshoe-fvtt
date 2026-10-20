import { useNavigationContext } from "@lumphammer/minirouter";

import { getTranslated } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { brokenBondPoints } from "../../module/bonds/rules";
import { isPCActor } from "../../module/actors/pc";
import { assertBondItem } from "../../module/items/bond";
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

export const BondMain = () => {
  const { item } = useItemSheetContext();
  assertBondItem(item);
  const { navigate } = useNavigationContext();
  // whether it can be burned depends on Stability, another item
  useRefreshOnActorItemChanges(item.actor);
  const hasBadges = item.system.isDeltaGreen || item.system.isBroken;
  // only Bonds on a PC can be burned
  const canHaveBurn = isPCActor(item.actor);
  const actor = item.actor;
  const canRebuild = isPCActor(actor) && actor.system.canRebuildBond(item);
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
        <AsyncTextInput value={item.name ?? ""} onChange={item.setName} />
      </GridField>
      <GridField label="Points">
        <AsyncNumberInput
          value={item.system.points}
          onChange={item.system.setPoints}
          min={brokenBondPoints}
          max={item.system.getMaxPoints()}
        />
      </GridField>
      {/* "DELTA GREEN" shares the badge's translation; the "?" goes outside it */}
      <GridField label={`${getTranslated("Delta Green")}?`} noTranslate>
        <Toggle
          checked={item.system.isDeltaGreen}
          onChange={item.system.setIsDeltaGreen}
        />
      </GridField>
      <GridField label="Actor">
        <BondActor bond={item} />
      </GridField>
      {/* on its own row, so the points above don't read as "how many to burn" */}
      {canHaveBurn && (
        <GridFieldStacked>
          <BurnBondButton bond={item} />
        </GridFieldStacked>
      )}
      {hasBadges && (
        <GridField noLabel>
          <BondBadges bond={item} />
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
          html={item.system.notes}
          onSave={item.system.setNotes}
          name="notes"
        />
      </div>
    </InputGrid>
  );
};

BondMain.displayName = "BondMain";
