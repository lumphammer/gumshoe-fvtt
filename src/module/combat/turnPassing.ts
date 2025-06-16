import { TypeDataModel } from "../../fvtt-exports";
import { createRecordField } from "../schemaFields";
import { InvestigatorCombat } from "./InvestigatorCombat";

export const TurnPassingCombatSchema = {
  // turnStates: new TypedObjectField(
  //   new NumberField(
  //     { nullable: false, required: true, initial: 0 },
  //   ),
  //   { nullable: false, required: true, initial: {} },
  // ),
  turnStates: createRecordField<Record<string, number>>({
    nullable: false,
    required: true,
    initial: {},
  }),
};

export class TurnPassingCombatModel extends TypeDataModel<
  typeof TurnPassingCombatSchema,
  InvestigatorCombat<"turnPassing">
> {
  static defineSchema(): typeof TurnPassingCombatSchema {
    return TurnPassingCombatSchema;
  }

  getTurnsForId(id: string, round: number): number {
    const turns = this.turnStates[id];
    if (turns === undefined) {
      return 0;
    }
    return turns;
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
