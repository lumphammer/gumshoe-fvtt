import { systemLogger } from "../../functions/utilities";
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

  _preParentUpdate() {
    systemLogger.debug("TurnPassingCombatModel#_preParentUpdate called");

    // No specific pre-update logic for ClassicCombat
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
