import { TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

export const turnPassingCombatantSchema = {};

export class TurnPassingCombatantModel extends TypeDataModel<
  typeof turnPassingCombatantSchema,
  InvestigatorCombatant<"classic">
> {
  static defineSchema(): typeof turnPassingCombatantSchema {
    return turnPassingCombatantSchema;
  }
}

export type TurnPassingCombatant = InvestigatorCombatant<"turnPassing">;

export function isTurnPassingCombatant(x: unknown): x is TurnPassingCombatant {
  return x instanceof InvestigatorCombatant && x.type === "turnPassing";
}

export function assertTurnPassingCombatant(
  x: unknown,
): asserts x is TurnPassingCombatant {
  if (!isTurnPassingCombatant(x)) {
    throw new Error("Expected combatant to be a TurnPassingCombatant");
  }
}
