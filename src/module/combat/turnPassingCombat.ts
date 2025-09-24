import { TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { ValidCombatModel } from "./types";

export const TurnPassingCombatSchema = {};

export class TurnPassingCombatModel
  extends TypeDataModel<
    typeof TurnPassingCombatSchema,
    InvestigatorCombat<"turnPassing">
  >
  implements ValidCombatModel
{
  static defineSchema(): typeof TurnPassingCombatSchema {
    return TurnPassingCombatSchema;
  }

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
    //
  }

  async onCreateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      data,
      options,
      userId,
    ]: Combat.OnCreateDescendantDocumentsArgs
  ) {
    if (collection !== "combatants") {
      return;
    }
    return Promise.resolve();
  }

  async onUpdateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      changes,
      options,
      userId,
    ]: Combat.OnUpdateDescendantDocumentsArgs
  ) {
    return Promise.resolve();
  }

  onDeleteDescendantDocuments(...args: Combat.OnDeleteDescendantDocumentsArgs) {
    return Promise.resolve();
  }

  getTurns(): string[] {
    return this.parent.combatants.contents
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((c) => c.id ?? "");
  }

  async startCombat() {
    await this.parent.update({ round: 1 });
  }

  async nextRound() {
    await this.parent.update({ round: this.parent.round + 1 });
  }

  async previousRound() {
    await this.parent.update({ round: this.parent.round - 1 });
  }

  async nextTurn() {
    await this.parent.update({ turn: this.parent.turn ?? 0 + 1 });
  }

  async previousTurn() {
    await this.parent.update({ turn: this.parent.turn ?? 0 - 1 });
  }

  async moveCombatant(active: string, over: string, direction: "up" | "down") {
    return Promise.resolve();
  }

  sortCombatants(): Promise<void> {
    return Promise.resolve();
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
