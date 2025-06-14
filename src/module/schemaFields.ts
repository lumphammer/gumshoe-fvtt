import { AnyObject } from "fvtt-types/utils";

import {
  DataField,
  NumberField,
  ObjectField,
  SchemaField,
  StringField,
  TypedObjectField,
} from "../fvtt-exports";

export const createNotesWithFormatField = () =>
  new SchemaField({
    format: new StringField({
      nullable: false,
      required: true,
      choices: ["plain", "richText", "markdown"],
      initial: "richText",
    }),
    source: new StringField({ nullable: false, required: true }),
    html: new StringField({ nullable: false, required: true }),
  });

export const createResourcesField = () =>
  new TypedObjectField(
    new SchemaField({
      // min?: number;
      min: new NumberField({
        nullable: true,
        required: false,
        initial: 0,
      }),
      // max: number;
      max: new NumberField({
        nullable: false,
        required: true,
        initial: 0,
      }),
      // value: number;
      value: new NumberField({
        nullable: false,
        required: true,
        initial: 0,
      }),
    }),
    {
      nullable: false,
      required: true,
      validateKey: (key: unknown): key is string => {
        return typeof key === "string";
      },
    },
  );

export const createStatsField = () =>
  new TypedObjectField(
    new NumberField({
      nullable: false,
      required: true,
      initial: 0,
    }),
    {
      nullable: false,
      required: true,
      initial: {
        hitThreshold: 3,
      },
      validateKey: (key: unknown): key is string => {
        return typeof key === "string";
      },
    },
  );

export const createRecordField = <T extends AnyObject>(
  options: DataField.Options<T>,
) => new ObjectField<DataField.Options<T>, T, T, T>(options);

export const createActiveCharacterSchema = () => {
  return {
    initiativeAbility: new StringField({
      nullable: false,
      required: true,
      initial: "",
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
    resources: createResourcesField(),
    stats: createStatsField(),
  };
};
