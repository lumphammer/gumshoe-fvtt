import { assertPCActor } from "../actors/pc";
import { AbilityModel } from "./AbilityModel";
import { InvestigatorItem } from "./InvestigatorItem";

import BooleanField = foundry.data.fields.BooleanField;
import { createAbilitySchema } from "./createAbilitySchema";

export const investigativeAbilitySchema = {
  ...createAbilitySchema(),
  isQuickShock: new BooleanField({ nullable: false, required: true }),
  hideIfZeroRated: new BooleanField({
    nullable: false,
    required: true,
    initial: true,
  }),
};

export class InvestigativeAbilityModel extends AbilityModel<
  typeof investigativeAbilitySchema,
  InvestigativeAbilityItem
> {
  static defineSchema(): typeof investigativeAbilitySchema {
    return investigativeAbilitySchema;
  }

  async push(): Promise<void> {
    await this.pushInvestigative();
  }

  async pushInvestigative(): Promise<void> {
    const actor = this.parent.parent;
    assertPCActor(actor);
    if (!this.isQuickShock) {
      throw new Error(`The ability ${this.parent.name} is not a quick shock`);
    }
    if (this.parent.actor === null) {
      throw new Error(`The ability ${this.parent.name} is not owned`);
    }
    const poolAbility = actor.system.getPushPool();
    if (poolAbility === undefined) {
      throw new Error(`The actor ${this.parent.actor.name} has no push pool`);
    }
    await poolAbility.system.pushPool(this.parent);
  }

  setIsQuickShock = async (isQuickShock: boolean): Promise<void> => {
    await this.parent.update({ system: { isQuickShock } });
  };
}

export type InvestigativeAbilityItem = InvestigatorItem<"investigativeAbility">;

export function isInvestigativeAbilityItem(
  x: unknown,
): x is InvestigativeAbilityItem {
  return x instanceof InvestigatorItem && x.type === "investigativeAbility";
}

export function assertInvestigativeAbilityItem(
  x: unknown,
): asserts x is InvestigativeAbilityItem {
  if (!isInvestigativeAbilityItem(x)) {
    throw new Error("Not a investigative ability item");
  }
}
