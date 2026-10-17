import {
  BooleanField,
  NumberField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import {
  brokenBondPoints,
  clampBondPoints,
  isBondBroken,
  maxBondPoints,
} from "../bonds/rules";
import { InvestigatorItem } from "./InvestigatorItem";

/**
 * A Fall of DELTA GREEN Bond (p. 045): someone the Agent cares about. One
 * number, which the book variously calls the Bond's rating, strength or
 * points; there's no separate pool, and it never refreshes.
 */
export const bondSchema = {
  points: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: brokenBondPoints,
    max: maxBondPoints,
    initial: 1,
  }),
  /** formed with a teammate (p. 046), rather than someone back home */
  isDeltaGreen: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  /** for recording the damage each use does to the relationship (p. 120) */
  notes: new StringField({ nullable: false, required: true, initial: "" }),
};

export class BondModel extends TypeDataModel<typeof bondSchema, BondItem> {
  static defineSchema(): typeof bondSchema {
    return bondSchema;
  }

  get isBroken(): boolean {
    return isBondBroken(this.points);
  }

  setPoints = async (points: number): Promise<void> => {
    await this.parent.update({
      system: { points: clampBondPoints(points) },
    });
  };

  setIsDeltaGreen = async (isDeltaGreen: boolean): Promise<void> => {
    await this.parent.update({ system: { isDeltaGreen } });
  };

  setNotes = async (notes: string): Promise<void> => {
    await this.parent.update({ system: { notes } });
  };
}

export type BondItem = InvestigatorItem<"bond">;

export function isBondItem(x: unknown): x is BondItem {
  return x instanceof InvestigatorItem && x.type === "bond";
}

export function assertBondItem(x: unknown): asserts x is BondItem {
  if (!isBondItem(x)) {
    throw new Error("Item is not a bond");
  }
}
