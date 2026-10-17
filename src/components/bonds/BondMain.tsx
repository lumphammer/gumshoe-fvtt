import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { brokenBondPoints, maxBondPoints } from "../../module/bonds/rules";
import { assertBondItem } from "../../module/items/bond";
import { absoluteCover } from "../absoluteCover";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Toggle } from "../inputs/Toggle";
import { BondBadges } from "./BondBadges";

export const BondMain = () => {
  const { item } = useItemSheetContext();
  assertBondItem(item);

  return (
    <InputGrid
      css={{
        ...absoluteCover,
        gridTemplateRows: "auto auto auto 1fr",
      }}
    >
      <GridField label="Bond">
        <AsyncTextInput value={item.name ?? ""} onChange={item.setName} />
      </GridField>
      <GridField label="Points">
        <div css={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
          <AsyncNumberInput
            value={item.system.points}
            onChange={item.system.setPoints}
            min={brokenBondPoints}
            max={maxBondPoints}
          />
          <BondBadges bond={item} />
        </div>
      </GridField>
      <GridField label="Delta Green Bond?">
        <Toggle
          checked={item.system.isDeltaGreen}
          onChange={item.system.setIsDeltaGreen}
        />
      </GridField>
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
