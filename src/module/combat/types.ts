import { isClassicCombat } from "./classicCombat";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { isTurnPassingCombat } from "./turnPassingCombat";

export function isValidCombat(
  combat: unknown,
): combat is InvestigatorCombat & { system: ValidCombatModel } {
  // Check if the combat instance is valid
  return isClassicCombat(combat) || isTurnPassingCombat(combat);
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

  swapCombatants(a: string, b: string): Promise<void>;
}
