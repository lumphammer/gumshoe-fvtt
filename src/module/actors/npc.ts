import * as c from "../../constants";
import { maybeNotesObjectToString } from "../../functions/maybeNotesObjectToString";
import { migrateValue } from "../../functions/migrateValue";
import { NumberField, StringField } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import { createActiveCharacterSchema } from "../schemaFields";
import { ActiveCharacterModel } from "./ActiveCharacterModel";
import { InvestigatorActor } from "./InvestigatorActor";

export const npcSchema = {
  ...createActiveCharacterSchema(),
  combatBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  damageBonus: new NumberField({ nullable: false, required: true, initial: 0 }),
  gmNotes: new StringField({ nullable: false, required: true }),
  notes: new StringField({ nullable: false, required: true }),
  sheetTheme: new StringField({
    nullable: true,
  }),
};

export class NPCModel extends ActiveCharacterModel<typeof npcSchema, NPCActor> {
  static defineSchema(): typeof npcSchema {
    return npcSchema;
  }

  static migrateData(source) {
    // migrate notes to plain strings
    migrateValue(source, "notes", maybeNotesObjectToString);
    migrateValue(source, "gmNotes", maybeNotesObjectToString);
    return super.migrateData(source);
  }

  getSheetThemeName(): string | null {
    return this.sheetTheme || settings.defaultThemeName.get();
  }

  setNotes = (notes: string) => {
    return this.parent.update({ system: { notes } });
  };

  setGMNotes = (gmNotes: string) => {
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
