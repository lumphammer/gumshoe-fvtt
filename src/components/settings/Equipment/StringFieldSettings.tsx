import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Translate } from "../../Translate";
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
    <div
      css={{
        display: "flex",
      }}
    >
      <div css={{ flex: 0, paddingRight: "1em" }}>
        <Translate>Default</Translate>
      </div>
      <AsyncTextInput
        css={{ flex: 1 }}
        value={field.default}
        onChange={handleChangeDefault}
      />
    </div>
  );
};

StringFieldSettings.displayName = "StringFieldSettings";
