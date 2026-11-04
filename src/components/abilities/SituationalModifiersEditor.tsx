import { memo } from "react";

import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { AbilityItem } from "../../module/items/exports";
import type { SituationalModifier } from "../../types";
import { AbilityListEditor, NumberTextEditorRow } from "./AbilityListEditor";

export const SituationalModifiersEditor = memo(
  function SituationalModifiersEditor({
    item,
    situationalModifiers,
  }: {
    /** Only to write through */
    item: AbilityItem;
    situationalModifiers: readonly Readonly<SituationalModifier>[];
  }) {
    const methods = useSystemMethods(item);
    return (
      <AbilityListEditor
        entries={situationalModifiers}
        onAdd={methods.addSituationalModifier}
      >
        {(entry, index) => (
          <NumberTextEditorRow
            index={index}
            number={entry.modifier}
            text={entry.situation}
            onChangeNumber={methods.setSituationalModifierModifier}
            onChangeText={methods.setSituationalModifierSituation}
            onDelete={methods.deleteSituationalModifier}
          />
        )}
      </AbilityListEditor>
    );
  },
);
