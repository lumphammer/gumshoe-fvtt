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

  // _preParentUpdate() {
  //   systemLogger.debug("TurnPassingCombatModel#_preParentUpdate called");
  // }

  /**
   * Called by parent
   */
  _preUpdateDescendantDocuments(
    ...[
      parent,
      collection,
      changes,
      options,
      userId,
    ]: Combat.PreUpdateDescendantDocumentsArgs
  ) {
    systemLogger.log(
      `TurnPassingCombatModel#_preUpdateDescendantDocuments called with changes: ${JSON.stringify(changes, null, 2)}`,
    );
  }

  _onUpdateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      changes,
      options,
      userId,
    ]: Combat.OnUpdateDescendantDocumentsArgs
  ) {
    systemLogger.log(
      "TurnPassingCombatModel#_onUpdateDescendantDocuments called",
    );
  }

  getTurns(): string[] {
    return this.parent.combatants.contents
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((c) => c.id ?? "");
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
