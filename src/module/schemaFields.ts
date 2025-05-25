import { AnyObject } from "fvtt-types/utils";

import SchemaField = foundry.data.fields.SchemaField;
import StringField = foundry.data.fields.StringField;
import TypedObjectField = foundry.data.fields.TypedObjectField;
import NumberField = foundry.data.fields.NumberField;
import ObjectField = foundry.data.fields.ObjectField;
import DataField = foundry.data.fields.DataField;

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
      initial: {},
      validateKey: (key: unknown): key is string => {
        return typeof key === "string";
      },
    },
  );

export const createRecordField = <T extends AnyObject>(
  options: DataField.Options<T>,
) => new ObjectField<DataField.Options<T>, T, T, T>(options);
