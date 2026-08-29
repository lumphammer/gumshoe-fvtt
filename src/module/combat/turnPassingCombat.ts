import { TypeDataModel } from "../../fvtt-exports";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { isTurnPassingCombatant } from "./turnPassingCombatant";
import { ValidCombatModel } from "./types";

export const TurnPassingCombatSchema = {};

/**
 * Give every turn-passing combatant in `combatants` its starting turn count for
 * the current round, if it doesn't have one already.
 */
async function initializePassingTurns(
  combatants: Iterable<Combatant.Implementation>,
) {
  await Promise.all(
    [...combatants]
      .filter(isTurnPassingCombatant)
      .map((combatant) => combatant.system.initializePassingTurns()),
  );
}

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
      _parent,
      _collection,
      _changes,
      _options,
      _userId,
    ]: Combat.PreUpdateDescendantDocumentsArgs
  ) {
    //
  }

  async onCreateDescendantDocuments(
    ...[
      _parent,
      collection,
      documents,
      _data,
      _options,
      _userId,
    ]: Combat.OnCreateDescendantDocumentsArgs
  ) {
    if (collection !== "combatants") {
      return;
    }
    await initializePassingTurns(documents);
  }

  async onUpdateDescendantDocuments(
    ...[
      _parent,
      _collection,
      _documents,
      _changes,
      _options,
      _userId,
    ]: Combat.OnUpdateDescendantDocumentsArgs
  ) {
    return Promise.resolve();
  }

  onDeleteDescendantDocuments(
    ..._args: Combat.OnDeleteDescendantDocumentsArgs
  ) {
    return Promise.resolve();
  }

  getTurns(): string[] {
    return this.parent.combatants.contents
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map((c) => c.id ?? "");
  }

  async startCombat() {
    await this.parent.update({ round: 1 });
    await initializePassingTurns(this.parent.combatants.contents);
  }

  async nextRound() {
    await this.parent.update({ round: this.parent.round + 1, turn: null });
    await initializePassingTurns(this.parent.combatants.contents);
  }

  async previousRound() {
    await this.parent.update({ round: this.parent.round - 1 });
    await initializePassingTurns(this.parent.combatants.contents);
  }

  async nextTurn() {
    await this.parent.update({
      turn: this.parent.turn === null ? 0 : this.parent.turn + 1,
    });
  }

  async previousTurn() {
    await this.parent.update({
      turn:
        this.parent.turn === null
          ? 0
          : this.parent.turn <= 0
            ? 0
            : this.parent.turn - 1,
    });
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
