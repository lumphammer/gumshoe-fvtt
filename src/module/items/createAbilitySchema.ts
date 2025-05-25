import { createNotesWithFormatField } from "../schemaFields";

import NumberField = foundry.data.fields.NumberField;
import BooleanField = foundry.data.fields.BooleanField;
import StringField = foundry.data.fields.StringField;
import ArrayField = foundry.data.fields.ArrayField;
import SchemaField = foundry.data.fields.SchemaField;

export const createAbilitySchema = () => ({
  // rating: number;
  rating: new NumberField({ nullable: false, required: true }),
  // pool: number;
  pool: new NumberField({ nullable: false, required: true }),
  // min: number;
  min: new NumberField({ nullable: false, required: true }),
  // max: number;
  max: new NumberField({ nullable: false, required: true }),
  // occupational: boolean;
  occupational: new BooleanField({ nullable: false, required: true }),
  // hasSpecialities: boolean;
  hasSpecialities: new BooleanField({ nullable: false, required: true }),
  // specialitiesMode: SpecialitiesMode;
  specialitiesMode: new StringField({
    nullable: false,
    required: true,
    choices: ["one", "twoThreeFour"],
  }),
  // specialities: string[];
  specialities: new ArrayField(
    new StringField({
      nullable: false,
      required: true,
    }),
    {
      nullable: false,
      required: true,
    },
  ),
  // showTracker: boolean;
  showTracker: new BooleanField({ nullable: false, required: true }),
  // boost: boolean;
  boost: new BooleanField({ nullable: false, required: true }),
  // categoryId: string;
  categoryId: new StringField({ nullable: false, required: true }),
  // excludeFromGeneralRefresh: boolean;
  excludeFromGeneralRefresh: new BooleanField({
    nullable: false,
    required: true,
  }),
  // refreshesDaily: boolean;
  refreshesDaily: new BooleanField({ nullable: false, required: true }),
  // notes: NoteWithFormat;
  notes: createNotesWithFormatField(),
  // // this is defined separately for gen/inv in template.json so they have
  // // different defaults but it's the same property
  // hideIfZeroRated: boolean;
  hideIfZeroRated: new BooleanField({ nullable: false, required: true }),
  // unlocks: Unlock[];
  unlocks: new ArrayField(
    new SchemaField(
      {
        // id: string;
        id: new StringField({ nullable: false, required: true }),
        // rating: number;
        rating: new NumberField({ nullable: false, required: true }),
        // description: string;
        description: new StringField({ nullable: false, required: true }),
      },
      {
        nullable: false,
        required: true,
      },
    ),
    {
      nullable: false,
      required: true,
    },
  ),
  // situationalModifiers: SituationalModifier[];
  situationalModifiers: new ArrayField(
    new SchemaField({
      // id: string;
      id: new StringField({ nullable: false, required: true }),
      // situation: string;
      situation: new StringField({ nullable: false, required: true }),
      // modifier: number;
      modifier: new NumberField({ nullable: false, required: true }),
    }),
    {
      nullable: false,
      required: true,
      initial: [],
    },
  ),
  // allowPoolToExceedRating: boolean;
  allowPoolToExceedRating: new BooleanField({
    nullable: false,
    required: true,
  }),
});

export type AbilitySchema = ReturnType<typeof createAbilitySchema>;
