import * as c from "../../constants";
import { settings } from "../../settings/settings";
import { Resource } from "../../types";
import { InvestigatorActor } from "../InvestigatorActor";

import NumberField = foundry.data.fields.NumberField;
import StringField = foundry.data.fields.StringField;
import ArrayField = foundry.data.fields.ArrayField;
import BooleanField = foundry.data.fields.BooleanField;
import SchemaField = foundry.data.fields.SchemaField;
import { recordField } from "./shared";

export const pcSchema = {
  buildPoints: new NumberField({ nullable: false, required: true, min: 0 }),
  /* @deprecated occupation is now a personalDetail item */
  occupation: new StringField({ nullable: false, required: true }),
  longNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  longNotesFormat: new StringField({ nullable: false, required: true }),
  shortNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  hiddenShortNotes: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  initiativeAbility: new StringField({ nullable: false, required: true }),
  hideZeroRated: new BooleanField({ nullable: false, required: true }),
  sheetTheme: new StringField({ nullable: false, required: true }),
  /* @deprecated */
  hitThreshold: new NumberField({ nullable: false, required: true, min: 0 }),
  mwInjuryStatus: new StringField({
    nullable: false,
    required: true,
    choices: ["uninjured", "hurt", "down", "unconscious", "dead"],
  }),
  resources: recordField<Record<string, Resource>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  stats: recordField<Record<string, number>>({
    nullable: false,
    required: true,
    initial: {},
  }),
  initiativePassingTurns: new NumberField({ nullable: false, min: 0 }),
  cardsAreaSettings: new SchemaField({
    category: new StringField({
      nullable: false,
      required: true,
      choices: ["all", "categorized"],
    }),
    sortOrder: new StringField({
      nullable: false,
      required: true,
      choices: ["atoz", "ztoa", "newest", "oldest"],
    }),
    viewMode: new StringField({
      nullable: false,
      required: true,
      choices: ["short", "full"],
    }),
    columnWidth: new StringField({
      nullable: false,
      required: true,
      choices: ["narrow", "wide", "full"],
    }),
  }),
};

export class PCModel extends foundry.abstract.TypeDataModel<
  typeof pcSchema,
  Actor
> {
  static defineSchema(): typeof pcSchema {
    return pcSchema;
  }

  getSheetThemeName(): string | null {
    return this.sheetTheme || settings.defaultThemeName.get();
  }
}

export type PCActor = InvestigatorActor<typeof c.pc>;

export const isPCActor = (x: unknown): x is PCActor =>
  x instanceof InvestigatorActor && x.type === c.pc;

function _f(x: PCModel) {
  console.log(x.resources[0].value);
  x.cardsAreaSettings.category = "categorized";
  x.occupation = "foo";
  // @ts-expect-error this should be wrong
  x.cardsAreaSettings.category = "foo";
}
