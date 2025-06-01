import * as c from "../../constants";
import { settings } from "../../settings/settings";
import { NoteWithFormat } from "../../types";
import {
  createNotesWithFormatField,
  createResourcesField,
  createStatsField,
} from "../schemaFields";
import { InvestigatorActor } from "./InvestigatorActor";

import NumberField = foundry.data.fields.NumberField;
import StringField = foundry.data.fields.StringField;
import BooleanField = foundry.data.fields.BooleanField;
import { ActiveCharacterModel } from "./ActiveCharacterModel";

export const npcSchema = {
  combatBonus: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  damageBonus: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  gmNotes: createNotesWithFormatField(),
  hideZeroRated: new BooleanField({
    nullable: false,
    required: true,
  }),
  initiativeAbility: new StringField({
    nullable: false,
    required: true,
  }),
  initiativePassingTurns: new NumberField({
    nullable: false,
    required: true,
    initial: 1,
    min: 0,
  }),
  mwInjuryStatus: new StringField({
    nullable: false,
    required: true,
    choices: ["uninjured", "hurt", "down", "unconscious", "dead"],
    initial: "uninjured",
  }),
  notes: createNotesWithFormatField(),
  resources: createResourcesField(),
  sheetTheme: new StringField({
    nullable: true,
  }),
  stats: createStatsField(),
};

export class NPCModel extends ActiveCharacterModel<typeof npcSchema, NPCActor> {
  static defineSchema(): typeof npcSchema {
    return npcSchema;
  }

  getSheetThemeName(): string | null {
    return this.sheetTheme || settings.defaultThemeName.get();
  }

  setNotes = (notes: NoteWithFormat) => {
    return this.parent.update({ system: { notes } });
  };

  setGMNotes = (gmNotes: NoteWithFormat) => {
    return this.parent.update({ system: { gmNotes } });
  };

  setCombatBonus = async (combatBonus: number) => {
    await this.parent.update({ system: { combatBonus } });
  };

  setDamageBonus = async (damageBonus: number) => {
    await this.parent.update({ system: { damageBonus } });
  };
}

export type NPCActor = InvestigatorActor<typeof c.npc>;

export function isNPCActor(x: unknown): x is NPCActor {
  return x instanceof InvestigatorActor && x.type === c.npc;
}

export function assertNPCActor(x: unknown): asserts x is NPCActor {
  if (!isNPCActor(x)) {
    throw new Error("Expected an NPC actor");
  }
}
