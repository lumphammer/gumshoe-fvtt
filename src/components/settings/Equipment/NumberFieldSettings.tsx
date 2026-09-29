import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { useCallback, useContext } from "react";

import { useRefStash } from "../../../hooks/useRefStash";
import { AsyncNumberInput } from "../../inputs/AsyncNumberInput";
import { Toggle } from "../../inputs/Toggle";
import { Translate } from "../../Translate";
import { DispatchContext } from "../contexts";
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
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gridGap: "0.5rem",
        gridTemplateAreas: `
            "defaultLbl minLbl maxLbl"
            "default    min    max"
          `,
      }}
    >
      <div css={{ gridArea: "defaultLbl" }}>
        <Translate>Default</Translate>
      </div>
      <AsyncNumberInput
        css={{ gridArea: "default" }}
        value={field.default}
        onChange={handleChangeDefault}
      />
      <div css={{ gridArea: "minLbl" }}>
        <label>
          <Translate>Min</Translate>{" "}
          <Toggle
            checked={field.min !== undefined}
            onChange={handleToggleMin}
          />
        </label>
      </div>
      {field.min !== undefined && (
        <AsyncNumberInput
          css={{ gridArea: "min" }}
          value={field.min}
          onChange={handleChangeMin}
        />
      )}
      <div css={{ gridArea: "maxLbl" }}>
        <label>
          <Translate>Max</Translate>{" "}
          <Toggle
            checked={field.max !== undefined}
            onChange={handleToggleMax}
          />
        </label>
      </div>
      {field.max !== undefined && (
        <AsyncNumberInput
          css={{ gridArea: "max" }}
          value={field.max}
          onChange={handleChangeMax}
        />
      )}
    </div>
  );
};

NumberFieldSettings.displayName = "NumberFieldSettings";
