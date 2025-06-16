import { ArrayField, StringField, TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";

export const classicCombatSchema = {
  turnOrders: new ArrayField(
    new ArrayField(
      new StringField({ nullable: false, required: true, initial: "" }),
    ),
    { nullable: false, required: true, initial: [] },
  ),
};

export class ClassicCombatModel extends TypeDataModel<
  typeof classicCombatSchema,
  InvestigatorCombat<"classic">
> {
  static defineSchema(): typeof classicCombatSchema {
    return classicCombatSchema;
  }

  getTurnOrders(): string[][] {
    return this.turnOrders;
  }
}

export type ClassicCombat = InvestigatorCombat<"classic">;

export function isClassicCombat(x: unknown): x is ClassicCombat {
  return x instanceof InvestigatorCombat && x.type === "classic";
}

export function assertClassicCombat(x: unknown): asserts x is ClassicCombat {
  if (!isClassicCombat(x)) {
    throw new Error("Expected combat to be a ClassicCombat");
  }
}
