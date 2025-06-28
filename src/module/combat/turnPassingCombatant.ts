import {
  ArrayField,
  NumberField,
  SchemaField,
  TypeDataModel,
} from "../../fvtt-exports";
import { isActiveCharacterActor } from "../actors/exports";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

export const turnPassingCombatantSchema = {
  turnInfo: new ArrayField(
    new SchemaField(
      {
        turnsRemaining: new NumberField({
          nullable: false,
          required: true,
          initial: 0,
        }),
      },
      { initial: { turnsRemaining: 0 }, nullable: true, required: false },
    ),
    { initial: [], nullable: false, required: true },
  ),
};

export class TurnPassingCombatantModel extends TypeDataModel<
  typeof turnPassingCombatantSchema,
  InvestigatorCombatant<"classic">
> {
  static defineSchema(): typeof turnPassingCombatantSchema {
    return turnPassingCombatantSchema;
  }

  private get combat(): InvestigatorCombat {
    if (!this.parent.parent) {
      throw new Error(
        `Tried to use combatant ${this.parent.name} (${this.parent.id}) outside a combat`,
      );
    }
    return this.parent.parent;
  }

  get passingTurnsRemaining(): number {
    const roundIndex = this.combat.round - 1;
    if (roundIndex < 0) {
      return 0;
    }
    return this.turnInfo[roundIndex]?.turnsRemaining ?? 0;
  }

  async resetPassingTurns() {
    const roundIndex = this.combat.round - 1;
    if (roundIndex < 0) {
      return;
    }
    const turnsRemaining =
      this.parent.actor && isActiveCharacterActor(this.parent.actor)
        ? (this.parent.actor.system.initiativePassingTurns ?? 1)
        : 1;
    const turnInfo = [...this.turnInfo];
    turnInfo[roundIndex] = {
      ...turnInfo[roundIndex],
      turnsRemaining,
    };

    await this.parent.update({
      system: {
        turnInfo,
      },
    });
  }

  async addPassingTurn() {
    const roundIndex = this.combat.round - 1;
    if (roundIndex < 0) {
      return;
    }
    const turnsRemaining = (this.turnInfo[roundIndex]?.turnsRemaining ?? 0) + 1;
    const turnInfo = [...this.turnInfo];
    turnInfo[roundIndex] = {
      ...turnInfo[roundIndex],
      turnsRemaining,
    };

    await this.parent.update({
      system: {
        turnInfo,
      },
    });
  }

  async removePassingTurn() {
    const roundIndex = this.combat.round - 1;
    if (roundIndex < 0) {
      return;
    }
    const turnsRemaining = Math.max(
      0,
      (this.turnInfo[roundIndex]?.turnsRemaining ?? 0) - 1,
    );
    const turnInfo = [...this.turnInfo];
    turnInfo[roundIndex] = {
      ...turnInfo[roundIndex],
      turnsRemaining,
    };

    await this.parent.update({
      system: {
        turnInfo,
      },
    });
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
