import * as c from "../../constants";
import { NumberField, StringField } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import { NoteWithFormat } from "../../types";
import {
  createActiveCharacterSchema,
  createNotesWithFormatField,
} from "../schemaFields";
import { ActiveCharacterModel } from "./ActiveCharacterModel";
import { InvestigatorActor } from "./InvestigatorActor";

export const npcSchema = {
  ...createActiveCharacterSchema(),
  combatBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  damageBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  gmNotes: createNotesWithFormatField(),
  notes: createNotesWithFormatField(),
  sheetTheme: new StringField({
    nullable: true,
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
