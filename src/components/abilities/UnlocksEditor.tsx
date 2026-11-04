import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { Unlock } from "../../types";
import { AbilityListEditor, NumberTextEditorRow } from "./AbilityListEditor";

export const UnlocksEditor = memo(function UnlocksEditor({
  item,
  unlocks,
}: {
  /** Only to write through */
  item: AbilityItem;
  unlocks: readonly Readonly<Unlock>[];
}) {
  const methods = useSystemMethods(item);
  return (
    <AbilityListEditor entries={unlocks} onAdd={methods.addUnlock}>
      {(entry, index) => (
        <NumberTextEditorRow
          index={index}
          number={entry.rating}
          text={entry.description}
          onChangeNumber={methods.setUnlockRating}
          onChangeText={methods.setUnlockDescription}
          onDelete={methods.deleteUnlock}
        />
      )}
    </AbilityListEditor>
  );
});
