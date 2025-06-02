import {
  ArrayField,
  NumberField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { MwType, NoteWithFormat, RangeTuple } from "../../types";
import { createNotesWithFormatField } from "../schemaFields";
import { InvestigatorItem } from "./InvestigatorItem";

export const mwItemSchema = {
  charges: new NumberField({ nullable: false, required: true, initial: 0 }),
  mwType: new StringField({
    nullable: false,
    required: true,
    choices: [
      "tweak",
      "spell",
      "cantrap",
      "enchantedItem",
      "meleeWeapon",
      "missileWeapon",
      "manse",
      "sandestin",
      "retainer",
    ],
    initial: "tweak",
  }),
  notes: createNotesWithFormatField(),
  ranges: new ArrayField(new NumberField({ nullable: false, required: true }), {
    nullable: false,
    required: true,
    initial: [0, 0, 0, 0],
  }),
};

export class MwItemModel extends TypeDataModel<typeof mwItemSchema, MwItem> {
  static defineSchema(): typeof mwItemSchema {
    return mwItemSchema;
  }

  setNotes = async (newNotes: NoteWithFormat): Promise<void> => {
    await this.parent.update({ system: { notes: newNotes } });
  };

  setMwType = async (mwType: MwType): Promise<void> => {
    await this.parent.update({ system: { mwType } });
  };

  setCharges = async (charges: number): Promise<void> => {
    await this.parent.update({ system: { charges } });
  };

  getRange = (range: 0 | 1 | 2 | 3): number => {
    return this.ranges[range];
  };

  setRanges = async (
    ranges: [number, number, number, number],
  ): Promise<void> => {
    await this.parent.update({ system: { ranges } });
  };

  setRange =
    (range: 0 | 1 | 2 | 3) =>
    async (value: number): Promise<void> => {
      const ranges = [...this.ranges] as RangeTuple;
      ranges[range] = value;
      await this.parent.update({ system: { ranges } });
    };
}

export type MwItem = InvestigatorItem<"mwItem">;

export function isMwItem(x: unknown): x is MwItem {
  return x instanceof InvestigatorItem && x.type === "mwItem";
}

export function assertMwItem(x: unknown): asserts x is MwItem {
  if (!isMwItem(x)) {
    throw new Error("Item is not a mwItem");
  }
}
