import { NumberField, StringField, TypeDataModel } from "../../fvtt-exports";
import { InvestigatorItem } from "./InvestigatorItem";

/**
 * A Network contact (Fall of DELTA GREEN, p. 068): someone who owes the PC
 * favours, with a pool of points taken from the Network ability. The pool
 * never refreshes.
 */
export const networkContactSchema = {
  /** the city, firebase or the like where the contact is */
  location: new StringField({ nullable: false, required: true, initial: "" }),
  pool: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: 0,
    initial: 0,
  }),
  notes: new StringField({ nullable: false, required: true, initial: "" }),
};

export class NetworkContactModel extends TypeDataModel<
  typeof networkContactSchema,
  NetworkContactItem
> {
  static defineSchema(): typeof networkContactSchema {
    return networkContactSchema;
  }

  setLocation = async (location: string): Promise<void> => {
    await this.parent.update({ system: { location } });
  };

  setPool = async (pool: number): Promise<void> => {
    await this.parent.update({ system: { pool: Math.max(0, pool) } });
  };

  setNotes = async (notes: string): Promise<void> => {
    await this.parent.update({ system: { notes } });
  };
}

export type NetworkContactItem = InvestigatorItem<"networkContact">;

export function isNetworkContactItem(x: unknown): x is NetworkContactItem {
  return x instanceof InvestigatorItem && x.type === "networkContact";
}

export function assertNetworkContactItem(
  x: unknown,
): asserts x is NetworkContactItem {
  if (!isNetworkContactItem(x)) {
    throw new Error("Item is not a Network contact");
  }
}
