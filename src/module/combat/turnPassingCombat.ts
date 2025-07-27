import { TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";

export const TurnPassingCombatSchema = {};

export class TurnPassingCombatModel extends TypeDataModel<
  typeof TurnPassingCombatSchema,
  InvestigatorCombat<"turnPassing">
> {
  static defineSchema(): typeof TurnPassingCombatSchema {
    return TurnPassingCombatSchema;
  }
}

export type TurnPassingCombat = InvestigatorCombat<"turnPassing">;

export function isTurnPassingCombat(x: unknown): x is TurnPassingCombat {
  return x instanceof InvestigatorCombat && x.type === "turnPassing";
}

export function assertTurnPassingCombat(
  x: unknown,
): asserts x is TurnPassingCombat {
  if (!isTurnPassingCombat(x)) {
    throw new Error("Expected combat to be a TurnPassingCombat");
  }
}
