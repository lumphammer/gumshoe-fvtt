import { isClassicCombat } from "./classicCombat";
import { isTurnPassingCombat } from "./turnPassingCombat";

export function isKnownCombat(combat: unknown): combat is Combat.Known {
  // Check if the combat instance is valid
  return isClassicCombat(combat) || isTurnPassingCombat(combat);
}

export function assertKnownCombat(
  combat: unknown,
): asserts combat is Combat.Known {
  if (!isKnownCombat(combat)) {
    throw new Error("Combat is not a known combat type");
  }
}

/**
 * interface for Combat model classes which implement our additional lifecycle
 * methods
 */
export interface ValidCombatModel {
  getTurns(): string[];

  startCombat(): Promise<void>;

  nextRound(): Promise<void>;

  previousRound(): Promise<void>;

  nextTurn(): Promise<void>;

  previousTurn(): Promise<void>;

  onCreateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      data,
      options,
      userId,
    ]: Combat.OnCreateDescendantDocumentsArgs
  ): Promise<void>;

  onUpdateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      changes,
      options,
      userId,
    ]: Combat.OnUpdateDescendantDocumentsArgs
  ): Promise<void>;

  onDeleteDescendantDocuments(
    ...args: Combat.OnDeleteDescendantDocumentsArgs
  ): Promise<void>;
}
