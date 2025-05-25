import { createNotesWithFormatField, createRecordField } from "../schemaFields";

import StringField = foundry.data.fields.StringField;
import TypeDataModel = foundry.abstract.TypeDataModel;
import { settings } from "../../settings/settings";
import { InvestigatorItem } from "./InvestigatorItem";

const equipmentSchema = {
  // notes: NoteWithFormat;
  notes: createNotesWithFormatField(),
  // categoryId: string;
  categoryId: new StringField({ nullable: false, required: true }),
  // fields: Record<string, string | number | boolean>;
  fields: createRecordField<Record<string, string | number | boolean>>({
    nullable: false,
    required: true,
    initial: {},
  }),
};

export class EquipmentModel extends TypeDataModel<
  typeof equipmentSchema,
  InvestigatorItem
> {
  static defineSchema(): typeof equipmentSchema {
    return equipmentSchema;
  }

  setCategoryId = async (categoryId: string): Promise<void> => {
    const updateData = {
      categoryId,
      fields: {} as Record<string, string | number | boolean>,
    };
    const fields = settings.equipmentCategories.get()[categoryId]?.fields ?? {};
    for (const field in fields) {
      updateData.fields[field] = this.fields[field] ?? fields[field].default;
    }
    await this.parent.update({ system: updateData });
  };

  setField = async (
    field: string,
    value: string | number | boolean,
  ): Promise<void> => {
    await this.parent.update({ system: { fields: { [field]: value } } });
  };

  deleteField = async (field: string) => {
    await this.parent.update({ [`system.fields.-=${field}`]: null });
  };
}

export type EquipmentItem = InvestigatorItem<"equipment">;

export function isEquipmentItem(x: unknown): x is EquipmentItem {
  return x instanceof InvestigatorItem && x.type === "equipment";
}

export function assertEquipmentItem(
  item: InvestigatorItem,
): asserts item is EquipmentItem {
  if (!isEquipmentItem(item)) {
    throw new Error("Expected an equipment item");
  }
}
