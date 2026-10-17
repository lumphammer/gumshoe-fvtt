import { getTranslated } from "../../functions/getTranslated";
import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { brokenBondPoints, maxBondPoints } from "../../module/bonds/rules";
import { isPCActor } from "../../module/actors/pc";
import { assertBondItem } from "../../module/items/bond";
import { absoluteCover } from "../absoluteCover";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Toggle } from "../inputs/Toggle";
import { BondBadges } from "./BondBadges";
import { BurnBondButton } from "./BurnBondButton";

export const BondMain = () => {
  const { item } = useItemSheetContext();
  assertBondItem(item);
  // whether it can be burned depends on Stability, another item
  useRefreshOnActorItemChanges(item.actor);
  const hasBadges = item.system.isDeltaGreen || item.system.isBroken;
  // only Bonds on a PC can be burned
  const canHaveBurn = isPCActor(item.actor);
  const autoRows = 3 + (hasBadges ? 1 : 0) + (canHaveBurn ? 1 : 0);

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        // name, points, DELTA GREEN toggle, (Burn,) (badges,) then notes fill
        // the rest
        gridTemplateRows: `repeat(${autoRows}, auto) 1fr`,
      }}
    >
      <GridField label="Bond">
        <AsyncTextInput value={item.name ?? ""} onChange={item.setName} />
      </GridField>
      <GridField label="Points">
        <AsyncNumberInput
          value={item.system.points}
          onChange={item.system.setPoints}
          min={brokenBondPoints}
          max={maxBondPoints}
        />
      </GridField>
      {/* "DELTA GREEN" shares the badge's translation; the "?" goes outside it */}
      <GridField label={`${getTranslated("Delta Green")}?`} noTranslate>
        <Toggle
          checked={item.system.isDeltaGreen}
          onChange={item.system.setIsDeltaGreen}
        />
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
