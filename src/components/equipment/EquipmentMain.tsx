import type { ChangeEvent } from "react";
import { memo, useCallback } from "react";

import { getTranslated } from "../../functions/getTranslated";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { DeepReadonly } from "../../module/snapshots/createSnapshotStore";
import type {
  EquipmentCategoriesSnapshot,
  EquipmentItem,
  EquipmentSystemData,
} from "../../module/items/equipment";
import { isVisibleToLimited } from "../../module/items/equipment";
import { absoluteCover } from "../absoluteCover";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Select } from "../inputs/Select";
import { TextInput } from "../inputs/TextInput";
import { EquipmentField } from "./EquipmentField";

interface EquipmentMainProps {
  /** Only to write through: read from `system`. */
  item: EquipmentItem;
  system: DeepReadonly<EquipmentSystemData>;
  categories: EquipmentCategoriesSnapshot;
  isLimited: boolean;
  name: string;
  onChangeName: (name: string) => void;
}

export const EquipmentMain = memo(function EquipmentMain({
  item,
  system,
  categories,
  isLimited,
  name,
  onChangeName,
}: EquipmentMainProps) {
  const { setCategoryId, setNotes } = useSystemMethods(item);
  const categoryMetadata = categories[system.categoryId];
  const isRealCategory = categoryMetadata !== undefined;

  const onChangeCategory = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      void setCategoryId(e.currentTarget.value);
    },
    [setCategoryId],
  );

  const selectedCat = isRealCategory ? system.categoryId : "";

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
            value={system.fields[fieldId]}
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
        <RichTextEditor name="notes" html={system.notes} onSave={setNotes} />
      </div>
    </InputGrid>
  );
});
