import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
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
    <div
      css={{
        display: "flex",
      }}
    >
      <div css={{ flex: 0, paddingRight: "1em" }}>
        <Translate>Default</Translate>
      </div>
      <Toggle
        // css={{ flex: 1 }}
        checked={field.default}
        onChange={handleChangeDefault}
      />
    </div>
  );
};

CheckboxFieldSettings.displayName = "CheckboxFieldSettings";
