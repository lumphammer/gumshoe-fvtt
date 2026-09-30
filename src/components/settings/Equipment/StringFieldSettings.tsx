import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { GridField } from "../../inputs/GridField";
import { DispatchContext } from "../contexts";
import { store } from "../store";

interface StringFieldSettingsProps {
  field: EquipmentFieldMetadata & { type: "string" };
  categoryId: string;
  fieldId: string;
}

export const StringFieldSettings = ({
  field,
  categoryId,
  fieldId,
}: StringFieldSettingsProps) => {
  const dispatch = useContext(DispatchContext);

  const handleChangeDefault = useCallback(
    (newDefault: string) => {
      dispatch(
        store.creators.setFieldDefault({
          categoryId,
          fieldId,
          newDefault,
        }),
      );
    },
    [categoryId, dispatch, fieldId],
  );

  return (
    <GridField label="Default">
      <AsyncTextInput value={field.default} onChange={handleChangeDefault} />
    </GridField>
  );
};

StringFieldSettings.displayName = "StringFieldSettings";
