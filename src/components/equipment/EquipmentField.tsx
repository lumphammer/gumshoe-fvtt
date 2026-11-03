import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { memo, useCallback } from "react";

import type { EquipmentItem } from "../../module/items/equipment";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { Toggle } from "../inputs/Toggle";

interface EquipmentFieldProps {
  fieldId: string;
  fieldMetadata: DeepReadonly<EquipmentFieldMetadata>;
  value: string | number | boolean | undefined;
  /** Only to write through. */
  equipment: EquipmentItem;
}

export const EquipmentField = memo(function EquipmentField({
  fieldId,
  fieldMetadata,
  value,
  equipment,
}: EquipmentFieldProps) {
  const onChange = useCallback(
    (newValue: string | number | boolean) => {
      void equipment.system.setField(fieldId, newValue);
    },
    [equipment, fieldId],
  );

  return (
    <GridField
      noTranslate
      key={fieldId}
      label={fieldMetadata.name}
      labelTitle={fieldMetadata.name}
    >
      {fieldMetadata.type === "string" && (
        <AsyncTextInput value={value as string} onChange={onChange} />
      )}
      {fieldMetadata.type === "number" && (
        <AsyncNumberInput value={value as number} onChange={onChange} />
      )}
      {fieldMetadata.type === "checkbox" && (
        <Toggle checked={value as boolean} onChange={onChange} />
      )}
    </GridField>
  );
});
