import { createNotesWithFormatField } from "../schemaFields";
import { InvestigatorItem } from "./InvestigatorItem";

import StringField = foundry.data.fields.StringField;
import NumberField = foundry.data.fields.NumberField;
import TypeDataModel = foundry.abstract.TypeDataModel;
import { NoteWithFormat } from "../../types";

export const personalDetailSchema = {
  // notes: NoteWithFormat;
  notes: createNotesWithFormatField(),
  // slotIndex: number;
  slotIndex: new NumberField({ nullable: false, required: true }),
  // compendiumPackId: string | null;
  compendiumPackId: new StringField({ nullable: true, required: true }),
};

export class PersonalDetailModel extends TypeDataModel<
  typeof personalDetailSchema,
  PersonalDetailItem
> {
  static defineSchema(): typeof personalDetailSchema {
    return personalDetailSchema;
  }

  setNotes = async (newNotes: NoteWithFormat): Promise<void> => {
    await this.parent.update({ system: { notes: newNotes } });
  };

  setSlotIndex = async (slotIndex: number): Promise<void> => {
    await this.parent.update({
      system: {
        slotIndex,
      },
    });
  };

  setCompendiumPack = async (id: string | null): Promise<void> => {
    await this.parent.update({
      system: {
        compendiumPackId: id,
      },
    });
  };
}

export type PersonalDetailItem = Item<"personalDetail">;

export function isPersonalDetailItem(x: unknown): x is PersonalDetailItem {
  return x instanceof InvestigatorItem && x.type === "personalDetail";
}

export function assertPersonalDetailItem(
  x: unknown,
): asserts x is PersonalDetailItem {
  if (!isPersonalDetailItem(x)) {
    throw new Error("Item is not a personalDetail");
  }
}
