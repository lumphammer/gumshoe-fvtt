import {
  ArrayField,
  BooleanField,
  NumberField,
  SchemaField,
  StringField,
} from "../../fvtt-exports";
import { createNotesWithFormatField } from "../schemaFields";

export const createAbilitySchema = () => ({
  allowPoolToExceedRating: new BooleanField({
    nullable: false,
    required: true,
  }),
  boost: new BooleanField({
    nullable: false,
    required: true,
  }),
  categoryId: new StringField({
    nullable: false,
    required: true,
  }),
  excludeFromGeneralRefresh: new BooleanField({
    nullable: false,
    required: true,
  }),
  hasSpecialities: new BooleanField({
    nullable: false,
    required: true,
  }),
  max: new NumberField({
    nullable: false,
    required: true,
    initial: 8,
  }),
  min: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  notes: createNotesWithFormatField(),
  occupational: new BooleanField({
    nullable: false,
    required: true,
  }),
  pool: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  rating: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  refreshesDaily: new BooleanField({
    nullable: false,
    required: true,
  }),
  showTracker: new BooleanField({
    nullable: false,
    required: true,
  }),
  situationalModifiers: new ArrayField(
    new SchemaField({
      id: new StringField({
        nullable: false,
        required: true,
      }),
      situation: new StringField({
        nullable: false,
        required: true,
      }),
      modifier: new NumberField({
        nullable: false,
        required: true,
      }),
    }),
    {
      nullable: false,
      required: true,
      initial: [],
    },
  ),
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
  specialitiesMode: new StringField({
    nullable: false,
    required: true,
    choices: ["one", "twoThreeFour"],
    initial: "one",
  }),
  unlocks: new ArrayField(
    new SchemaField(
      {
        id: new StringField({
          nullable: false,
          required: true,
        }),
        rating: new NumberField({
          nullable: false,
          required: true,
        }),
        description: new StringField({
          nullable: false,
          required: true,
        }),
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
});

export type AbilitySchema = ReturnType<typeof createAbilitySchema>;
