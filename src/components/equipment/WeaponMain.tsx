import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertWeaponItem } from "../../module/items/weapon";
import { absoluteCover } from "../absoluteCover";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { WeaponAttackPanel } from "./WeaponAttackPanel";

export const WeaponMain = () => {
  const { item } = useItemSheetContext();
  assertWeaponItem(item);

  return (
    <div css={{ ...absoluteCover, display: "flex", flexDirection: "column" }}>
      <WeaponAttackPanel weapon={item} />
      <div css={{ flex: 1, position: "relative", marginTop: "0.3em" }}>
        <RichTextEditor
          name="notes"
          html={item.system.notes}
          onSave={item.system.setNotes}
        />
      </div>
    </div>
  );
};
