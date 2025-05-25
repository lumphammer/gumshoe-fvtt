import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback } from "react";

import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { Toggle } from "../inputs/Toggle";

interface EquipmentFieldProps {
  fieldId: string;
  fieldMetadata: EquipmentFieldMetadata;
  value: string | number | boolean;
  equipment: InvestigatorItem;
}

export const EquipmentField = ({
  fieldId,
  fieldMetadata,
  value,
  equipment,
}: EquipmentFieldProps) => {
  const onChange = useCallback(
    (newValue: string | number | boolean) => {
      void equipment.setField(fieldId, newValue);
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
};

EquipmentField.displayName = "EquipmentField";
