import * as c from "../../constants";
import { settings } from "../../settings/settings";
import { NoteWithFormat, Resource } from "../../types";
import { InvestigatorActor } from "../InvestigatorActor";
import { notesWithFormatField, recordField } from "./shared";

import NumberField = foundry.data.fields.NumberField;
import StringField = foundry.data.fields.StringField;
import BooleanField = foundry.data.fields.BooleanField;
import { ActiveCharacterModel } from "./activeCharacterActor";

export const npcSchema = {
  // notes: NoteWithFormat;
  notes: notesWithFormatField(),
  // gmNotes: NoteWithFormat;
  gmNotes: notesWithFormatField(),
  // initiativeAbility: string;
  initiativeAbility: new StringField({ nullable: false, required: true }),
  // hideZeroRated: boolean;
  hideZeroRated: new BooleanField({ nullable: false, required: true }),
  // sheetTheme: string | null;
  sheetTheme: new StringField({ nullable: true }),
  // mwInjuryStatus: MwInjuryStatus;
  mwInjuryStatus: new StringField({
    nullable: false,
    required: true,
    choices: ["uninjured", "hurt", "down", "unconscious", "dead"],
  }),
  // resources: Record<string, Resource>;
  resources: recordField<Record<string, Resource>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  // stats: Record<string, number>;
  stats: recordField<Record<string, number>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  // combatBonus: number;
  combatBonus: new NumberField({ nullable: false, required: true }),
  // damageBonus: number;
  damageBonus: new NumberField({ nullable: false, required: true }),
  // initiativePassingTurns: number;
  initiativePassingTurns: new NumberField({
    nullable: false,
    required: true,
    min: 0,
  }),
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

function _f(x: NPCModel) {
  console.log(x.resources[0].value);
}
