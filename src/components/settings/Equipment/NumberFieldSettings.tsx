import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { useRefStash } from "../../../hooks/useRefStash";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { GridField } from "../../inputs/GridField";
import { DispatchContext } from "../contexts";
import { OptionalNumberInput } from "../OptionalNumberInput";
import { store } from "../store";

interface NumberFieldSettingsProps {
  field: EquipmentFieldMetadata & { type: "number" };
  categoryId: string;
  fieldId: string;
}

export const NumberFieldSettings = ({
  field,
  categoryId,
  fieldId,
}: NumberFieldSettingsProps) => {
  const dispatch = useContext(DispatchContext);
  const fieldStash = useRefStash(field);

  const handleChangeDefault = useCallback(
    (newDefault: number) => {
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

  const handleChangeMin = useCallback(
    (newMin: number) => {
      dispatch(
        store.creators.setFieldMin({
          categoryId,
          fieldId,
          newMin,
        }),
      );
    },
    [categoryId, dispatch, fieldId],
  );

  const handleChangeMax = useCallback(
    (newMax: number) => {
      dispatch(
        store.creators.setFieldMax({
          categoryId,
          fieldId,
          newMax,
        }),
      );
    },
    [categoryId, dispatch, fieldId],
  );

  const handleToggleMin = useCallback(
    (checked: boolean) => {
      const newMin = checked
        ? Math.min(fieldStash.current.default, fieldStash.current.max ?? 0)
        : undefined;
      dispatch(
        store.creators.setFieldMin({
          categoryId,
          fieldId,
          newMin,
        }),
      );
    },
    [categoryId, dispatch, fieldId, fieldStash],
  );

  const handleToggleMax = useCallback(
    (checked: boolean) => {
      const newMax = checked
        ? Math.max(fieldStash.current.default, fieldStash.current.min ?? 0)
        : undefined;
      dispatch(
        store.creators.setFieldMax({
          categoryId,
          fieldId,
          newMax,
        }),
      );
    },
    [categoryId, dispatch, fieldId, fieldStash],
  );

  return (
    <>
      <GridField label="Default">
        <AsyncNumberInput
          value={field.default}
          onChange={handleChangeDefault}
          min={field.min}
          max={field.max}
        />
      </GridField>
      <GridField label="Min">
        <OptionalNumberInput
          value={field.min}
          onToggle={handleToggleMin}
          onChange={handleChangeMin}
          max={field.max}
        />
      </GridField>
      <GridField label="Max">
        <OptionalNumberInput
          value={field.max}
          onToggle={handleToggleMax}
          onChange={handleChangeMax}
          min={field.min}
        />
      </GridField>
    </>
  );
};

NumberFieldSettings.displayName = "NumberFieldSettings";
