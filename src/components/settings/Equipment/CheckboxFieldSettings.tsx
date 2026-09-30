import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { GridField } from "../../inputs/GridField";
import { Toggle } from "../../inputs/Toggle";
import { DispatchContext } from "../contexts";
import { store } from "../store";

interface CheckboxFieldSettingsProps {
  field: EquipmentFieldMetadata & { type: "checkbox" };
  categoryId: string;
  fieldId: string;
}

export const CheckboxFieldSettings = ({
  field,
  categoryId,
  fieldId,
}: CheckboxFieldSettingsProps) => {
  const dispatch = useContext(DispatchContext);

  const handleChangeDefault = useCallback(
    (newDefault: boolean) => {
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
      <Toggle checked={field.default} onChange={handleChangeDefault} />
    </GridField>
  );
};

CheckboxFieldSettings.displayName = "CheckboxFieldSettings";
