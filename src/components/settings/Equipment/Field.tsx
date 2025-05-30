import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { ChangeEventHandler, useCallback, useContext } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCode,
  FaEllipsisH,
  FaTrash,
} from "react-icons/fa";

import { getTranslated } from "../../../functions/getTranslated";
import { ThemeContext } from "../../../themes/ThemeContext";
import { assertIsEquipmentFieldType } from "../../../typeAssertions";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Dropdown } from "../../inputs/Dropdown";
import { Menu, MenuItem } from "../../inputs/Menu";
import { Translate } from "../../Translate";
import { DispatchContext, StateContext } from "../contexts";
import { store } from "../store";
import { CheckboxFieldSettings } from "./CheckboxFieldSettings";
import { NumberFieldSettings } from "./NumberFieldSettings";
import { StringFieldSettings } from "./StringFieldSettings";

interface FieldProps {
  field: EquipmentFieldMetadata;
  categoryId: string;
  fieldId: string;
  idx: number;
}

export const Field = ({ field, categoryId, fieldId, idx }: FieldProps) => {
  const theme = useContext(ThemeContext);
  const dispatch = useContext(DispatchContext);
  const {
    settings: { equipmentCategories },
  } = useContext(StateContext);
  const fieldsLength = Object.keys(
    equipmentCategories[categoryId].fields,
  ).length;

  const handleNameChange = useCallback(
    (newName: string) => {
      dispatch(store.creators.renameField({ categoryId, fieldId, newName }));
    },
    [dispatch, categoryId, fieldId],
  );

  const handleTypeChange: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => {
      e.preventDefault();
      const newType = e.currentTarget.value;
      assertIsEquipmentFieldType(newType);
      dispatch(store.creators.setFieldType({ categoryId, fieldId, newType }));
    },
    [dispatch, categoryId, fieldId],
  );

  const handleUp = useCallback(() => {
    dispatch(store.creators.moveFieldUp({ categoryId, fieldId }));
  }, [dispatch, categoryId, fieldId]);

  const handleDown = useCallback(() => {
    dispatch(store.creators.moveFieldDown({ categoryId, fieldId }));
  }, [dispatch, categoryId, fieldId]);

  const handleDelete = useCallback(() => {
    const aye = getTranslated("Delete Field");
    if (aye) {
      dispatch(store.creators.deleteField({ categoryId, fieldId }));
    }
  }, [dispatch, categoryId, fieldId]);

  const handleClickEditId = useCallback(() => {
    const newFieldId = prompt(
      `Change ID string for "${field.name}"\n\n` +
        "⚠️ Careful! This will remove field information from any equipment using the current ID.",
      fieldId,
    );
    if (newFieldId) {
      dispatch(
        store.creators.changeFieldId({ categoryId, fieldId, newFieldId }),
      );
    }
  }, [categoryId, dispatch, field.name, fieldId]);

  return (
    <div
      css={{
        padding: "0.5em",
        borderWidth: "1px",
        margin: "0.5em 0 0.5em 0",
        borderStyle: "solid",
        borderColor: theme.colors.controlBorder,
        backgroundColor: theme.colors.backgroundPrimary,
        // display: "grid"
      }}
    >
      <div
        css={{
          display: "flex",
          gap: "1em",
          marginBottom: "0.5em",
        }}
      >
        <AsyncTextInput
          placeholder="Enter field name"
          value={field.name}
          css={{
            flex: 1,
          }}
          onChange={handleNameChange}
        />
        <select
          value={field.type}
          css={{
            flex: 1,
          }}
          onChange={handleTypeChange}
        >
          <option value="string">{getTranslated("Text")}</option>
          <option value="number">{getTranslated("Number")}</option>
          <option value="checkbox">{getTranslated("Toggle")}</option>
        </select>
        <Dropdown
          showArrow={false}
          label={<FaEllipsisH />}
          css={{
            flex: 0,
            paddingRight: "1em",
            paddingLeft: "1em",
          }}
        >
          {
            <Menu>
              {idx > 0 && (
                <MenuItem icon={<FaArrowUp />} onClick={handleUp}>
                  {getTranslated("Move up")}
                </MenuItem>
              )}
              {idx < fieldsLength - 1 && (
                <MenuItem icon={<FaArrowDown />} onClick={handleDown}>
                  {getTranslated("Move down")}
                </MenuItem>
              )}
              <MenuItem icon={<FaCode />} onClick={handleClickEditId}>
                <Translate>View/change ID</Translate>
              </MenuItem>
              <MenuItem icon={<FaTrash />} onClick={handleDelete}>
                {getTranslated("Delete")}
              </MenuItem>
            </Menu>
          }
        </Dropdown>
      </div>
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
    </div>
  );
};

Field.displayName = "Field";
