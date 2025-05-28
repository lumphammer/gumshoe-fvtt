import { ChangeEvent, useCallback } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertEquipmentItem } from "../../module/items/equipment";
import { settings } from "../../settings/settings";
import { absoluteCover } from "../absoluteCover";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { NotesEditorWithControls } from "../inputs/NotesEditorWithControls";
import { TextInput } from "../inputs/TextInput";
import { EquipmentField } from "./EquipmentField";

interface EquipmentMainProps {
  name: string;
  onChangeName: (name: string) => void;
}

export const EquipmentMain = ({ name, onChangeName }: EquipmentMainProps) => {
  const { item } = useItemSheetContext();

  assertEquipmentItem(item);

  const categories = settings.equipmentCategories.get();
  const categoryMetadata = categories[item.system.categoryId];
  const isRealCategory = categoryMetadata !== undefined;

  const onChangeCategory = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      void item.system.setCategoryId(e.currentTarget.value);
    },
    [item],
  );

  const selectedCat = isRealCategory ? item.system.categoryId : "";

  const fieldsLength = Object.keys(categoryMetadata?.fields ?? {}).length + 2;

  return (
    <InputGrid
      css={{
        gridTemplateRows: `repeat(${fieldsLength}, auto) 1fr`,
        ...absoluteCover,
      }}
    >
      <GridField label="Item Name">
        <TextInput value={name} onChange={onChangeName} />
      </GridField>

      <GridField label="Category">
        <div
          css={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div>
            <select
              value={selectedCat}
              onChange={onChangeCategory}
              css={{
                lineHeight: "inherit",
                height: "inherit",
              }}
            >
              {Object.entries(categories).map(([id, cat]) => (
                <option key={id} value={id}>
                  {cat.name}
                </option>
              ))}
              <option value="">{getTranslated("Uncategorized")}</option>
            </select>
          </div>
        </div>
      </GridField>

      {Object.entries(categoryMetadata?.fields ?? {}).map(
        ([fieldId, fieldMetadata]) => {
          return (
            <EquipmentField
              key={fieldId}
              fieldId={fieldId}
              fieldMetadata={fieldMetadata}
              value={item.system.fields?.[fieldId]}
              equipment={item}
            />
          );
        },
      )}

      <NotesEditorWithControls
        allowChangeFormat
        format={item.system.notes.format}
        html={item.system.notes.html}
        source={item.system.notes.source}
        onSave={item.system.setNotes}
      />
    </InputGrid>
  );
};

EquipmentMain.displayName = "EquipmentMain";
