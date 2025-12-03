import {
  ArrayField,
  NumberField,
  SchemaField,
  TypeDataModel,
} from "../../fvtt-exports";
import { isActiveCharacterActor } from "../actors/types";
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

  get defaultPassingTurns() {
    return this.parent.actor && isActiveCharacterActor(this.parent.actor)
      ? (this.parent.actor.system.initiativePassingTurns ?? 1)
      : 1;
  }

  get passingTurnsRemaining(): number {
    const roundIndex = Math.max(0, this.combat.round - 1);
    if (this.turnInfo[roundIndex] === undefined) {
      void this.resetPassingTurns();
      return this.defaultPassingTurns;
    }
    return this.turnInfo[roundIndex]?.turnsRemaining ?? 0;
  }

  // passingTurnsRemaining: isTurnPassingCombatant(combatant)
  //   ? combatant.system.passingTurnsRemaining
  //   : 0,
  // totalPassingTurns: isActiveCharacterActor(combatant.actor)
  //   ? (combatant.actor?.system.initiativePassingTurns ?? 1)
  //   : 1,

  async resetPassingTurns() {
    const roundIndex = Math.max(0, this.combat.round - 1);
    const turnInfo = [...this.turnInfo];
    turnInfo[roundIndex] = {
      ...turnInfo[roundIndex],
      turnsRemaining: this.defaultPassingTurns,
    };

    await this.parent.update({
      system: {
        turnInfo,
      },
    });
  }

  async addPassingTurn() {
    const roundIndex = Math.max(0, this.combat.round - 1);
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
    const roundIndex = Math.max(0, this.combat.round - 1);
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
