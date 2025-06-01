import * as constants from "../../constants";
import { AbilityModel } from "./AbilityModel";
import { InvestigativeAbilityItem } from "./investigativeAbility";
import { InvestigatorItem } from "./InvestigatorItem";

import BooleanField = foundry.data.fields.BooleanField;
import StringField = foundry.data.fields.StringField;
import NumberField = foundry.data.fields.NumberField;
import { MwRefreshGroup } from "../../types";
import { createAbilitySchema } from "./createAbilitySchema";

export const generalAbilitySchema = {
  ...createAbilitySchema(),
  canBeInvestigative: new BooleanField({ nullable: false, required: true }),
  goesFirstInCombat: new BooleanField({ nullable: false, required: true }),
  mwTrumps: new StringField({ nullable: false, required: true }),
  mwTrumpedBy: new StringField({ nullable: false, required: true }),
  mwRefreshGroup: new NumberField({
    nullable: false,
    required: true,
    choices: [2, 4, 8],
    initial: 2,
  }),
  combatBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  damageBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  isPushPool: new BooleanField({ nullable: false, required: true }),
  linkToResource: new BooleanField({ nullable: false, required: true }),
  resourceId: new StringField({ nullable: false, required: true }),
  hideIfZeroRated: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
};

export class GeneralAbilityModel extends AbilityModel<
  typeof generalAbilitySchema,
  GeneralAbilityItem
> {
  static defineSchema(): typeof generalAbilitySchema {
    return generalAbilitySchema;
  }

  async push(): Promise<void> {
    await this.pushPool();
  }

  async pushPool(from?: InvestigativeAbilityItem): Promise<void> {
    if (!this.isPushPool) {
      throw new Error(`This ability ${this.parent.name} is not a push pool`);
    }
    if (this.parent?.actor === null) {
      return;
    }
    if (this.pool === 0) {
      return;
    }
    const roll = new Roll("1");
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.parent.actor,
      }),
      content: `
        <div
          class="${constants.abilityChatMessageClassName}"
          ${constants.htmlDataItemId}="${from?.id ?? this.parent.id}"
          ${constants.htmlDataActorId}="${this.parent?.id ?? ""}"
          ${constants.htmlDataMode}="${constants.htmlDataModePush}"
          ${constants.htmlDataName}="${from?.name ?? this.parent.name}"
          ${constants.htmlDataImageUrl}="${this.parent.img}"
          ${constants.htmlDataTokenId}="${this.parent?.actor.token?.id ?? ""}"
        />
      `,
    });
    const pool = this.pool - 1;
    await this.parent.update({ system: { pool } });
  }

  setMwTrumps = (mwTrumps: string) => {
    return this.parent.update({ system: { mwTrumps } });
  };

  setMwTrumpedBy = (mwTrumpedBy: string) => {
    return this.parent.update({ system: { mwTrumpedBy } });
  };

  setMwRefreshGroup = async (mwRefreshGroup: MwRefreshGroup): Promise<void> => {
    await this.parent.update({ system: { mwRefreshGroup } });
  };

  setCombatBonus = async (combatBonus: number): Promise<void> => {
    await this.parent.update({ system: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number): Promise<void> => {
    await this.parent.update({ system: { damageBonus } });
  };

  setIsPushPool = async (isPushPool: boolean): Promise<void> => {
    await this.parent.update({ system: { isPushPool } });
  };

  setResourceId = async (resourceId: string | null): Promise<void> => {
    await this.parent.update({ system: { resourceId } });
  };

  setLinkToResource = async (linkToResource: boolean): Promise<void> => {
    await this.parent.update({ system: { linkToResource } });
  };

  setCanBeInvestigative = async (
    canBeInvestigative: boolean,
  ): Promise<void> => {
    await this.parent.update({ system: { canBeInvestigative } });
  };

  setGoesFirstInCombat = async (goesFirstInCombat: boolean): Promise<void> => {
    await this.parent.update({ system: { goesFirstInCombat } });
  };
}

export type GeneralAbilityItem = InvestigatorItem<"generalAbility">;

export function isGeneralAbilityItem(x: unknown): x is GeneralAbilityItem {
  return x instanceof InvestigatorItem && x.type === "generalAbility";
}

export function assertGeneralAbilityItem(
  x: unknown,
): asserts x is GeneralAbilityItem {
  if (!isGeneralAbilityItem(x)) {
    throw new Error("Not a general ability item");
  }
}
