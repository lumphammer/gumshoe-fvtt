import { TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

export const classicCombatantSchema = {};

export class ClassicCombatantModel extends TypeDataModel<
  typeof classicCombatantSchema,
  InvestigatorCombatant<"classic">
> {
  static defineSchema(): typeof classicCombatantSchema {
    return classicCombatantSchema;
  }
}

export type ClassicCombatant = InvestigatorCombatant<"classic">;

export function isClassicCombatant(x: unknown): x is ClassicCombatant {
  return x instanceof InvestigatorCombatant && x.type === "classic";
}

export function assertClassicCombat(x: unknown): asserts x is ClassicCombatant {
  if (!isClassicCombatant(x)) {
    throw new Error("Expected combatant to be a ClassicCombatant");
  }
}
