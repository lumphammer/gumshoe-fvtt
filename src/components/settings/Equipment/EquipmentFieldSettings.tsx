import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import type { ChangeEventHandler } from "react";
import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { assertIsEquipmentFieldType } from "../../../typeAssertions";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { Select } from "../../inputs/Select";
import { SettingsGridField } from "../SettingsGridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Translate } from "../../Translate";
import { DispatchContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { SettingsIdField } from "../SettingsIdField";
import { store } from "../store";
import { CheckboxFieldSettings } from "./CheckboxFieldSettings";
import { equipmentCategory, equipmentField } from "./directions";
import { NumberFieldSettings } from "./NumberFieldSettings";
import { StringFieldSettings } from "./StringFieldSettings";

export const EquipmentFieldSettings = () => {
  const categoryIndex = useParams(equipmentCategory);
  const index = useParams(equipmentField);
  const dispatch = useContext(DispatchContext);
  const { navigate } = useNavigationContext();
  const { value: categoryId } = useStateSelector(
    (s) =>
      Object.keys(s.settings.equipmentCategories)[categoryIndex] as
        string | undefined,
  );
  // select the id and the field separately so each is a stable value
  const { value: fieldId, freeze: freezeId } = useStateSelector((s) =>
    categoryId === undefined
      ? undefined
      : (Object.keys(s.settings.equipmentCategories[categoryId].fields)[
          index
        ] as string | undefined),
  );
  const { value: field, freeze: freezeField } = useStateSelector((s) =>
    categoryId === undefined || fieldId === undefined
      ? undefined
      : s.settings.equipmentCategories[categoryId].fields[fieldId],
  );

  const handleChangeName = useCallback(
    (newName: string) => {
      if (categoryId === undefined || fieldId === undefined) return;
      dispatch(store.creators.renameField({ categoryId, fieldId, newName }));
    },
    [categoryId, dispatch, fieldId],
  );

  const handleChangeId = useCallback(
    (newFieldId: string) => {
      if (categoryId === undefined || fieldId === undefined) return;
      dispatch(
        store.creators.changeFieldId({ categoryId, fieldId, newFieldId }),
      );
    },
    [categoryId, dispatch, fieldId],
  );

  const handleChangeType: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => {
      if (categoryId === undefined || fieldId === undefined) return;
      const newType = e.currentTarget.value;
      assertIsEquipmentFieldType(newType);
      dispatch(store.creators.setFieldType({ categoryId, fieldId, newType }));
    },
    [categoryId, dispatch, fieldId],
  );

  const handleClickDelete = useCallback(async () => {
    if (categoryId === undefined || fieldId === undefined) return;
    const aye = await confirmADoodleDo({
      message: "DeleteFieldName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: field?.name || fieldId },
    });
    if (aye) {
      // keep showing this field while the panel animates out, rather than
      // whatever slides into its index
      freezeId();
      freezeField();
      navigate("here", "up");
      dispatch(store.creators.deleteField({ categoryId, fieldId }));
    }
  }, [
    categoryId,
    dispatch,
    field?.name,
    fieldId,
    freezeField,
    freezeId,
    navigate,
  ]);

  if (
    categoryId === undefined ||
    fieldId === undefined ||
    field === undefined
  ) {
    return null;
  }

  return (
    <InputGrid>
      <SettingsGridField label="Name">
        <AsyncTextInput value={field.name} onChange={handleChangeName} />
      </SettingsGridField>
      <SettingsIdField
        id={fieldId}
        name={field.name}
        warning="This will remove field information from any equipment using the current ID."
        onChange={handleChangeId}
      />
      <SettingsGridField label="Type">
        <Select value={field.type} onChange={handleChangeType}>
          <option value="string">
            <Translate>Text</Translate>
          </option>
          <option value="number">
            <Translate>Number</Translate>
          </option>
          <option value="checkbox">
            <Translate>Toggle</Translate>
          </option>
        </Select>
      </SettingsGridField>
      {field.type === "number" && (
        <NumberFieldSettings
          field={field}
          categoryId={categoryId}
          fieldId={fieldId}
        />
      )}
      {field.type === "string" && (
        <StringFieldSettings
          field={field}
          categoryId={categoryId}
          fieldId={fieldId}
        />
      )}
      {field.type === "checkbox" && (
        <CheckboxFieldSettings
          field={field}
          categoryId={categoryId}
          fieldId={fieldId}
        />
      )}
      <SettingsGridField label="Delete">
        <Button css={{ width: "auto" }} onClick={handleClickDelete}>
          <i className="fas fa-trash" /> <Translate>Delete</Translate>
        </Button>
      </SettingsGridField>
    </InputGrid>
  );
};

EquipmentFieldSettings.displayName = "EquipmentFieldSettings";
