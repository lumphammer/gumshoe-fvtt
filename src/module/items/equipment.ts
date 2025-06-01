import { settings } from "../../settings/settings";
import { NoteWithFormat } from "../../types";
import { createNotesWithFormatField, createRecordField } from "../schemaFields";
import { InvestigatorItem } from "./InvestigatorItem";

import StringField = foundry.data.fields.StringField;
import TypeDataModel = foundry.abstract.TypeDataModel;
import SourceData = foundry.data.fields.SchemaField.SourceData;
// import TypedObjectField = foundry.data.fields.TypedObjectField;
// import AnyField = foundry.data.fields.AnyField;

const equipmentSchema = {
  notes: createNotesWithFormatField(),
  categoryId: new StringField({ nullable: false, required: true }),
  // Currently there's no good way of expressing a union in a DatatModel
  // fields: new TypedObjectField(
  //   new AnyField({
  //     nullable: false,
  //     required: true,
  //     initial: {},
  //     validate: (value: unknown): value is string | number | boolean => {
  //       return (
  //         typeof value === "string" ||
  //         typeof value === "number" ||
  //         typeof value === "boolean"
  //       );
  //     },
  //   }),
  //   {
  //     nullable: false,
  //     required: true,
  //     initial: {},
  //     validateKey: (key: unknown): key is string => {
  //       return typeof key === "string";
  //     },
  //   },
  // ),
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
      fields: {} as Record<string, any>,
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

  setNotes = async (notes: NoteWithFormat) => {
    await this.parent.update({ system: { notes } });
  };
}

/**
 * System data for an equipment item
 */
export type EquipmentSystemData = SourceData<typeof equipmentSchema>;

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
