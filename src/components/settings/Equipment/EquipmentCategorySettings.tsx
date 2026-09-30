import { useNavigationContext, useParams } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { AsyncTextInput } from "../../inputs/AsyncTextInput";
import { Button } from "../../inputs/Button";
import { GridField } from "../../inputs/GridField";
import { InputGrid } from "../../inputs/InputGrid";
import { Translate } from "../../Translate";
import { DispatchContext } from "../contexts";
import { useStateSelector } from "../hooks";
import { SettingsIdField } from "../SettingsIdField";
import { SettingsSortableList } from "../SettingsSortableList";
import { store } from "../store";
import { equipmentCategory, equipmentField } from "./directions";

export const EquipmentCategorySettings = () => {
  const index = useParams(equipmentCategory);
  const dispatch = useContext(DispatchContext);
  const { navigate } = useNavigationContext();
  // select the id and the category separately so each is a stable value
  const { value: categoryId, freeze: freezeId } = useStateSelector(
    (s) =>
      Object.keys(s.settings.equipmentCategories)[index] as string | undefined,
  );
  const { value: category, freeze: freezeCategory } = useStateSelector((s) =>
    categoryId === undefined
      ? undefined
      : s.settings.equipmentCategories[categoryId],
  );

  const handleChangeName = useCallback(
    (newName: string) => {
      if (categoryId === undefined) return;
      dispatch(store.creators.renameCategory({ id: categoryId, newName }));
    },
    [categoryId, dispatch],
  );

  const handleChangeId = useCallback(
    (newCategoryId: string) => {
      if (categoryId === undefined) return;
      dispatch(
        store.creators.changeCategoryId({
          oldCategoryId: categoryId,
          newCategoryId,
        }),
      );
    },
    [categoryId, dispatch],
  );

  const handleAddField = useCallback(() => {
    if (categoryId === undefined || category === undefined) return;
    // new fields go on the end
    const fieldIndex = Object.keys(category.fields).length;
    dispatch(store.creators.addField({ categoryId }));
    navigate("here", equipmentField(fieldIndex));
  }, [category, categoryId, dispatch, navigate]);

  const handleReorderFields = useCallback(
    (newOrder: number[]) => {
      if (categoryId === undefined || category === undefined) return;
      const fieldIds = Object.keys(category.fields);
      dispatch(
        store.creators.setFieldOrder({
          categoryId,
          newOrder: newOrder.map((i) => fieldIds[i]),
        }),
      );
    },
    [category, categoryId, dispatch],
  );

  const handleClickDelete = useCallback(async () => {
    if (categoryId === undefined) return;
    const aye = await confirmADoodleDo({
      message: "DeleteEquipmentCategoryName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: { Name: category?.name || categoryId },
    });
    if (aye) {
      // keep showing this category while the panel animates out, rather than
      // whatever slides into its index
      freezeId();
      freezeCategory();
      navigate("here", "up");
      dispatch(store.creators.deleteCategory({ id: categoryId }));
    }
  }, [
    category?.name,
    categoryId,
    dispatch,
    freezeCategory,
    freezeId,
    navigate,
  ]);

  if (categoryId === undefined || category === undefined) {
    return null;
  }

  return (
    <div css={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <InputGrid>
        <GridField label="Category Name">
          <AsyncTextInput value={category.name} onChange={handleChangeName} />
        </GridField>
        <SettingsIdField
          id={categoryId}
          name={category.name}
          warning="This will remove category information from any equipment using the current ID."
          onChange={handleChangeId}
        />
        <GridField label="Delete">
          <Button css={{ width: "auto" }} onClick={handleClickDelete}>
            <i className="fas fa-trash" /> <Translate>Delete</Translate>
          </Button>
        </GridField>
      </InputGrid>
      <h3>
        <Translate>Fields</Translate>
      </h3>
      <SettingsSortableList
        css={{ flex: 1, minHeight: "10em" }}
        rows={Object.values(category.fields).map((field) => ({
          name: field.name,
          detail: (
            <Translate>
              {field.type === "number"
                ? "Number"
                : field.type === "checkbox"
                  ? "Toggle"
                  : "Text"}
            </Translate>
          ),
        }))}
        linkTo={equipmentField}
        onReorder={handleReorderFields}
        onAdd={handleAddField}
        addLabel="Add Field"
        detailHeader="Type"
      />
    </div>
  );
};

EquipmentCategorySettings.displayName = "EquipmentCategorySettings";
