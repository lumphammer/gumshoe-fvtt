import { memo } from "react";

import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertPersonalDetailItem } from "../../module/items/personalDetail";
import { ModeSelect } from "../ItemSheetFramework/ModeSelect";
import { ItemSheetFramework } from "../ItemSheetFramework/SheetFramework";
import { ItemSheetMode } from "../ItemSheetFramework/types";
import { PersonalDetailConfig } from "./PersonalDetailConfig";
import { PersonalDetailMain } from "./PersonalDetailMain";

/**
 * Reads the item and settings through snapshots, passed down as props (the
 * item itself only to write through). Memoised (it has no props).
 */
export const PersonalDetailSheet = memo(function PersonalDetailSheet() {
  "use memo";

  const { item } = useItemSheetContext();
  assertPersonalDetailItem(item);
  const view = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    system: snapshot.system,
  }));
  const detailNames = useSettings((s) =>
    s.personalDetails.map((detail) => detail.name),
  );
  const occupationLabel = useSettings((s) => s.occupationLabel);

  return (
    <ItemSheetFramework>
      <ModeSelect mode={ItemSheetMode.Main}>
        <PersonalDetailMain
          item={item}
          name={view.name}
          system={view.system}
          detailNames={detailNames}
          occupationLabel={occupationLabel}
        />
      </ModeSelect>
      <ModeSelect mode={ItemSheetMode.Config}>
        <PersonalDetailConfig item={item} />
      </ModeSelect>
    </ItemSheetFramework>
  );
});
