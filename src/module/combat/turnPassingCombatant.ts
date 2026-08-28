import {
  ArrayField,
  NumberField,
  SchemaField,
  TypeDataModel,
} from "../../fvtt-exports";
import { isActiveCharacterActor } from "../actors/types";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { InvestigatorCombatant } from "./InvestigatorCombatant";
import {
  createSerializedPassingTurnUpdater,
  getPassingTurnsRemaining,
  updatePassingTurnInfo,
} from "./passingTurnState";

const serializePassingTurnUpdate =
  createSerializedPassingTurnUpdater<InvestigatorCombatant>();

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
  InvestigatorCombatant<"turnPassing">
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
    return getPassingTurnsRemaining(
      this.turnInfo,
      roundIndex,
      this.defaultPassingTurns,
    );
  }

  // passingTurnsRemaining: isTurnPassingCombatant(combatant)
  //   ? combatant.system.passingTurnsRemaining
  //   : 0,
  // totalPassingTurns: isActiveCharacterActor(combatant.actor)
  //   ? (combatant.actor?.system.initiativePassingTurns ?? 1)
  //   : 1,

  private updatePassingTurns(
    getNextValue: (currentValue: number) => number,
    onlyIfMissing = false,
  ): Promise<void> {
    const roundIndex = Math.max(0, this.combat.round - 1);
    const defaultPassingTurns = this.defaultPassingTurns;

    return serializePassingTurnUpdate(this.parent, async () => {
      const currentSystem = this.parent.system;
      const storedValue = currentSystem.turnInfo[roundIndex]?.turnsRemaining;
      if (onlyIfMissing && storedValue !== undefined) return;

      const currentValue = storedValue ?? defaultPassingTurns;
      const turnInfo = updatePassingTurnInfo(
        currentSystem.turnInfo,
        roundIndex,
        getNextValue(currentValue),
      );
      await this.parent.update({
        system: {
          turnInfo,
        },
      });
    });
  }

  initializePassingTurns(): Promise<void> {
    return this.updatePassingTurns((turnsRemaining) => turnsRemaining, true);
  }

  resetPassingTurns(): Promise<void> {
    const defaultPassingTurns = this.defaultPassingTurns;
    return this.updatePassingTurns(() => defaultPassingTurns);
  }

  addPassingTurn(): Promise<void> {
    return this.updatePassingTurns((turnsRemaining) => turnsRemaining + 1);
  }

  removePassingTurn(): Promise<void> {
    return this.updatePassingTurns((turnsRemaining) =>
      Math.max(0, turnsRemaining - 1),
    );
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
