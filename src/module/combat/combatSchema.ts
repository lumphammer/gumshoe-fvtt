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
  InvestigatorCombat<"investigator">
> {
  static defineSchema(): typeof classicCombatSchema {
    return classicCombatSchema;
  }
}
