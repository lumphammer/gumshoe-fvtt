import type { ChangeEvent } from "react";
import { useCallback } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { useItemSheetContext } from "../../hooks/useSheetContexts";
import {
  assertEquipmentItem,
  isVisibleToLimited,
} from "../../module/items/equipment";
import { settings } from "../../settings/settings";
import { absoluteCover } from "../absoluteCover";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { EquipmentField } from "./EquipmentField";

interface EquipmentMainProps {
  name: string;
  onChangeName: (name: string) => void;
}

export const EquipmentMain = ({ name, onChangeName }: EquipmentMainProps) => {
  const { item } = useItemSheetContext();
  const isLimited = useIsDocumentLimited();

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

  // people with Limited permission only see the fields marked for them
  const fields = Object.entries(categoryMetadata?.fields ?? {}).filter(
    ([, fieldMetadata]) => !isLimited || isVisibleToLimited(fieldMetadata),
  );

  const fieldsLength = fields.length + 2;

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
            <Select
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
            </Select>
          </div>
        </div>
      </GridField>

      {fields.map(([fieldId, fieldMetadata]) => {
        return (
          <EquipmentField
            key={fieldId}
            fieldId={fieldId}
            fieldMetadata={fieldMetadata}
            value={item.system.fields?.[fieldId]}
            equipment={item}
          />
        );
      })}

      <div
        css={{
          flex: 1,
          position: "relative",
          gridColumn: "1/-1",
        }}
      >
        <RichTextEditor
          name="notes"
          html={item.system.notes}
          onSave={item.system.setNotes}
        />
      </div>
    </InputGrid>
  );
};

EquipmentMain.displayName = "EquipmentMain";
